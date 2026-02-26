using MeetingDecisions.Api.Models;
using System.Security.Cryptography;

namespace MeetingDecisions.Api.Services;

public interface IWopiService
{
    Task<CollaboraSessionResponse> CreateEditingSession(string documentId, string fileName, string userId, string role, bool readOnly = false);
    Task<WopiCheckFileInfo> GetFileInfo(string fileId, string accessToken);
    Task<byte[]> GetFileContent(string fileId, string accessToken);
    Task PutFileContent(string fileId, string accessToken, byte[] content);
}

public class WopiService : IWopiService
{
    private readonly ILogger<WopiService> _logger;
    private readonly IConfiguration _configuration;
    private readonly IWopiTokenService _tokenService;
    private readonly string _documentsPath;
    private readonly string _collaboraUrl;
    private readonly string _wopiHostUrl;

    // In-memory storage for demo (use database in production)
    private static readonly Dictionary<string, WopiDocument> _documents = new();

    public WopiService(ILogger<WopiService> logger, IConfiguration configuration, IWopiTokenService tokenService)
    {
        _logger = logger;
        _configuration = configuration;
        _tokenService = tokenService;
        _documentsPath = configuration["DocumentSettings:TempPath"] ?? "Documents/Temp";
        _collaboraUrl = configuration["Collabora:Url"] ?? "http://localhost:9980";
        _wopiHostUrl = configuration["Collabora:WopiHostUrl"] ?? "http://192.168.6.138:5000";

        Directory.CreateDirectory(_documentsPath);
        
        _logger.LogInformation("WopiService initialized successfully");
        _logger.LogInformation("Collabora URL: {Url}", _collaboraUrl);
        _logger.LogInformation("WOPI Host URL: {WopiUrl}", _wopiHostUrl);
    }

    public async Task<CollaboraSessionResponse> CreateEditingSession(string documentId, string fileName, string userId, string role, bool readOnly = false)
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

            // Generate JWT access token with user context
            var accessToken = _tokenService.Generate(userId, fileId, role);

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
            var collaboraUrl = $"{_collaboraUrl.TrimEnd('/')}/browser/dist/cool.html?" +
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
        if (!_tokenService.Validate(accessToken, fileId, out var claims))
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
        if (!_tokenService.Validate(accessToken, fileId, out var claims))
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
        if (!_tokenService.Validate(accessToken, fileId, out var claims))
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
}