using MeetingDecisions.Api.Models;
using System.Security.Cryptography;
using System.Text;

namespace MeetingDecisions.Api.Services;

public interface IWopiService
{
    Task<CollaboraSessionResponse> CreateEditingSession(string documentId, string fileName, bool readOnly = false);
    Task<WopiCheckFileInfo> GetFileInfo(string fileId, string accessToken);
    Task<byte[]> GetFileContent(string fileId, string accessToken);
    Task PutFileContent(string fileId, string accessToken, byte[] content);
    string GenerateAccessToken(string fileId);
    bool ValidateAccessToken(string fileId, string accessToken);
}

public class WopiService : IWopiService
{
    private readonly ILogger<WopiService> _logger;
    private readonly IConfiguration _configuration;
    private readonly string _documentsPath;
    private readonly string _collaboraUrl;
    private readonly string _wopiHostUrl;
    private readonly string _accessTokenSecret;

    // In-memory storage for demo (use database in production)
    private static readonly Dictionary<string, WopiDocument> _documents = new();

    public WopiService(ILogger<WopiService> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
        _documentsPath = configuration["DocumentSettings:TempPath"] ?? "Documents/Temp";
        _collaboraUrl = configuration["Collabora:Url"] ?? "http://localhost:9980";
        _wopiHostUrl = configuration["Collabora:WopiHostUrl"] ?? "http://localhost:5000";
        
        // Read secret - try environment variable first, then config
        _accessTokenSecret = Environment.GetEnvironmentVariable("COLLABORA_SECRET") 
                          ?? configuration["Collabora:AccessTokenSecret"];

        // Validate secret
        if (string.IsNullOrWhiteSpace(_accessTokenSecret))
        {
            _logger.LogError("AccessTokenSecret not configured!");
            throw new InvalidOperationException(
                "Collabora AccessTokenSecret is required. " +
                "Set it in appsettings.json under 'Collabora:AccessTokenSecret' " +
                "or as environment variable 'COLLABORA_SECRET'");
        }

        if (_accessTokenSecret.Length < 16)
        {
            _logger.LogWarning("AccessTokenSecret is too short! Minimum 16 characters recommended.");
        }

        Directory.CreateDirectory(_documentsPath);
        
        _logger.LogInformation("WopiService initialized successfully");
        _logger.LogInformation("Collabora URL: {Url}", _collaboraUrl);
        _logger.LogInformation("WOPI Host URL: {WopiUrl}", _wopiHostUrl);
        _logger.LogInformation("Secret configured: {HasSecret}", !string.IsNullOrEmpty(_accessTokenSecret));
        _logger.LogDebug("Secret length: {Length} characters", _accessTokenSecret.Length);
    }

    public async Task<CollaboraSessionResponse> CreateEditingSession(string documentId, string fileName, bool readOnly = false)
    {
        try
        {
            // The document should already exist from GenerateDecision
            var sourcePath = Path.Combine(_documentsPath, $"{documentId}.docx");
            
            _logger.LogInformation($"Looking for document at: {sourcePath}");
            
            if (!File.Exists(sourcePath))
            {
                _logger.LogError($"Document not found at: {sourcePath}");
                throw new FileNotFoundException($"Document {documentId} not found at {sourcePath}");
            }

            // Generate unique file ID for WOPI
            var fileId = Guid.NewGuid().ToString();
            var filePath = Path.Combine(_documentsPath, $"{fileId}.docx");

            // Copy the document to WOPI working file
            File.Copy(sourcePath, filePath, overwrite: true);
            
            _logger.LogInformation($"Copied document to WOPI working file: {filePath}");

            var fileInfo = new FileInfo(filePath);

            // Generate access token
            var accessToken = GenerateAccessToken(fileId);

            // Store document metadata
            var wopiDoc = new WopiDocument
            {
                FileId = fileId,
                FileName = fileName,
                FilePath = filePath,
                Size = fileInfo.Length,
                LastModified = fileInfo.LastWriteTime,
                AccessToken = accessToken
            };

            _documents[fileId] = wopiDoc;

            // Build WOPI URL
            var wopiSrc = $"{_wopiHostUrl}/wopi/files/{fileId}";
            
            // Collabora URL - construct manually for non-SSL
            // Important: Use http:// not https:// for local development
            var collaboraUrl = $"{_collaboraUrl}/browser/dist/cool.html?" +
                             $"WOPISrc={Uri.EscapeDataString(wopiSrc)}&" +
                             $"access_token={Uri.EscapeDataString(accessToken)}&" +
                             $"permission=edit&" +
                             $"closebutton=1";

            _logger.LogInformation($"Created editing session for {fileName}, fileId: {fileId}");
            _logger.LogInformation($"WOPI Source: {wopiSrc}");
            _logger.LogInformation($"Collabora URL: {collaboraUrl}");

            return new CollaboraSessionResponse
            {
                SessionId = fileId,
                WopiSrc = wopiSrc,
                AccessToken = accessToken,
                CollaboraUrl = collaboraUrl
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating Collabora editing session");
            throw;
        }
    }

    public async Task<WopiCheckFileInfo> GetFileInfo(string fileId, string accessToken)
    {
        if (!ValidateAccessToken(fileId, accessToken))
        {
            throw new UnauthorizedAccessException("Invalid access token");
        }

        if (!_documents.TryGetValue(fileId, out var doc))
        {
            throw new FileNotFoundException($"File {fileId} not found");
        }

        var fileInfo = new FileInfo(doc.FilePath);

        // Calculate SHA256
        string sha256;
        using (var sha = SHA256.Create())
        {
            using var stream = File.OpenRead(doc.FilePath);
            var hash = await sha.ComputeHashAsync(stream);
            sha256 = Convert.ToBase64String(hash);
        }

        return new WopiCheckFileInfo
        {
            BaseFileName = doc.FileName,
            Size = fileInfo.Length,
            Version = doc.LastModified.Ticks.ToString(),
            SHA256 = sha256,
            OwnerId = "admin",
            UserId = "user1",
            UserFriendlyName = "User",
            UserCanWrite = true,
            SupportsUpdate = true,
            SupportsLocks = true
        };
    }

    public async Task<byte[]> GetFileContent(string fileId, string accessToken)
    {
        if (!ValidateAccessToken(fileId, accessToken))
        {
            throw new UnauthorizedAccessException("Invalid access token");
        }

        if (!_documents.TryGetValue(fileId, out var doc))
        {
            throw new FileNotFoundException($"File {fileId} not found");
        }

        _logger.LogInformation($"Serving file content for {fileId}");
        return await File.ReadAllBytesAsync(doc.FilePath);
    }

    public async Task PutFileContent(string fileId, string accessToken, byte[] content)
    {
        if (!ValidateAccessToken(fileId, accessToken))
        {
            throw new UnauthorizedAccessException("Invalid access token");
        }

        if (!_documents.TryGetValue(fileId, out var doc))
        {
            throw new FileNotFoundException($"File {fileId} not found");
        }

        await File.WriteAllBytesAsync(doc.FilePath, content);
        doc.LastModified = DateTime.UtcNow;
        doc.Size = content.Length;

        _logger.LogInformation($"Updated file content for {fileId}, size: {content.Length}");
    }

    public string GenerateAccessToken(string fileId)
    {
        var payload = $"{fileId}|{DateTime.UtcNow.Ticks}";
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_accessTokenSecret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        var token = $"{payload}|{Convert.ToBase64String(hash)}";
        return Convert.ToBase64String(Encoding.UTF8.GetBytes(token));
    }

    public bool ValidateAccessToken(string fileId, string accessToken)
    {
        try
        {
            var decoded = Encoding.UTF8.GetString(Convert.FromBase64String(accessToken));
            var parts = decoded.Split('|');
            
            if (parts.Length != 3)
                return false;

            var tokenFileId = parts[0];
            var timestamp = long.Parse(parts[1]);
            var providedHash = parts[2];

            // Check file ID matches
            if (tokenFileId != fileId)
                return false;

            // Regenerate hash
            var payload = $"{tokenFileId}|{timestamp}";
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_accessTokenSecret));
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
            var expectedHash = Convert.ToBase64String(hash);

            // Check token hasn't expired (24 hours)
            var tokenAge = DateTime.UtcNow.Ticks - timestamp;
            var maxAge = TimeSpan.FromHours(24).Ticks;

            return providedHash == expectedHash && tokenAge < maxAge;
        }
        catch
        {
            return false;
        }
    }
}