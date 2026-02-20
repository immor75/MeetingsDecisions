using MeetingDecisions.Api.DTOs;
using MeetingDecisions.Api.Models;
using Microsoft.Extensions.Caching.Memory;
using System.Text;
using System.Xml.Linq;

namespace MeetingDecisions.Api.Services;

public class CollaboraDiscoveryService : ICollaboraDiscoveryService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IMemoryCache _cache;
    private readonly string _collaboraUrl; // https://collabora.yourorg.gr

    public CollaboraDiscoveryService(IHttpClientFactory httpClientFactory, IMemoryCache cache, IConfiguration config)
    {
        _httpClientFactory = httpClientFactory;
        _cache = cache;
        _collaboraUrl = config["Wopi:CollaboraBaseUrl"]!;
    }

    public async Task<string> GetEditorUrlAsync(string extension, string action)
    {
        var cacheKey = $"collabora_discovery_{extension}_{action}";

        if (!_cache.TryGetValue(cacheKey, out string? editorUrl))
        {
            var client = _httpClientFactory.CreateClient();
            var xml = await client.GetStringAsync(
                $"{_collaboraUrl}/hosting/discovery"
            );

            editorUrl = ParseDiscoveryXml(xml, extension, action);

            // Cache για 1 ώρα
            _cache.Set(cacheKey, editorUrl, TimeSpan.FromHours(1));
        }

        return editorUrl!;
    }

    private string ParseDiscoveryXml(string xml, string extension, string action)
    {
        var doc = XDocument.Parse(xml);
        var url = doc.Descendants("action")
            .FirstOrDefault(a =>
                a.Attribute("ext")?.Value == extension &&
                a.Attribute("name")?.Value == action)
            ?.Attribute("urlsrc")?.Value;

        return url ?? throw new Exception($"No Collabora action for .{extension} ({action})");
    }
}