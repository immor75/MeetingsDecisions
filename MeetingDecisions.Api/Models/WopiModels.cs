namespace MeetingDecisions.Api.Models;

// WOPI CheckFileInfo Response
public class WopiCheckFileInfo
{
    public string BaseFileName { get; set; } = string.Empty;
    public string OwnerId { get; set; } = "admin";
    public long Size { get; set; }
    public string UserId { get; set; } = "user1";
    public string UserFriendlyName { get; set; } = "User";
    public string Version { get; set; } = "1.0";
    public bool SupportsUpdate { get; set; } = true;
    public bool SupportsLocks { get; set; } = true;
    public bool UserCanWrite { get; set; } = true;
    public bool UserCanNotWriteRelative { get; set; } = true;
    public bool SupportsGetLock { get; set; } = true;
    public bool SupportsExtendedLockLength { get; set; } = true;
    public string SHA256 { get; set; } = string.Empty;
}

// Document metadata for WOPI
public class WopiDocument
{
    public string FileId { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public long Size { get; set; }
    public DateTime LastModified { get; set; }
    public string AccessToken { get; set; } = string.Empty;
}

// Collabora session request
public class CollaboraSessionRequest
{
    public string DocumentId { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public bool ReadOnly { get; set; } = false;
}

// Collabora session response
public class CollaboraSessionResponse
{
    public string SessionId { get; set; } = string.Empty;
    public string WopiSrc { get; set; } = string.Empty;
    public string AccessToken { get; set; } = string.Empty;
    public string CollaboraUrl { get; set; } = string.Empty;
}