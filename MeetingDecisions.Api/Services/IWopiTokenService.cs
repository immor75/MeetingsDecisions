using MeetingDecisions.Api.DTOs;
using MeetingDecisions.Api.Models;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace MeetingDecisions.Api.Services;

public interface IWopiTokenService
{
    string Generate(string userId, string fileId, string role);
    bool Validate(string token, string fileId, out WopiClaims claims);
}

public class WopiClaims
{
    public string UserId      { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public string Role        { get; set; } = ""; // "secretary" | "member"
}

public class JwtWopiTokenService : IWopiTokenService
{
    private readonly string _secret; // Από appsettings / vault
    private readonly int _ttlMinutes = 30;

    public JwtWopiTokenService(IConfiguration config)
    {
        _secret = config["Collabora:AccessTokenSecret"]!;
    }

    public string Generate(string userId, string fileId, string role)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            claims: new[]
            {
                new Claim("uid",    userId),
                new Claim("fid",    fileId),
                new Claim("role",   role),
                new Claim("name",   GetDisplayName(userId))
            },
            expires: DateTime.UtcNow.AddMinutes(_ttlMinutes),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public bool Validate(string token, string fileId, out WopiClaims claims)
    {
        claims = new WopiClaims();
        try
        {
            var handler = new JwtSecurityTokenHandler();
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));

            var principal = handler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey         = key,
                ValidateIssuer           = false,
                ValidateAudience         = false,
                ClockSkew                = TimeSpan.Zero
            }, out _);

            // Επαλήθευση ότι το token αφορά αυτό το συγκεκριμένο αρχείο
            if (principal.FindFirst("fid")?.Value != fileId)
                return false;

            claims.UserId      = principal.FindFirst("uid")?.Value ?? "";
            claims.DisplayName = principal.FindFirst("name")?.Value ?? "";
            claims.Role        = principal.FindFirst("role")?.Value ?? "";

            return true;
        }
        catch { return false; }
    }

    private string GetDisplayName(string userId) => userId; // Σύνδεσε με users table
}