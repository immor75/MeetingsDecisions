namespace MeetingDecisions.Api.Models;

public class CheckFileInfoResponse
{
    public string BaseFileName          { get; set; } = "";
    public long   Size                  { get; set; }
    public string OwnerId               { get; set; } = "";
    public string UserId                { get; set; } = "";
    public string UserFriendlyName      { get; set; } = "";
    public bool   UserCanWrite          { get; set; }
    public bool   SupportsUpdate        { get; set; }
    public bool   SupportsLocks         { get; set; }
    public bool   SupportsGetLock       { get; set; }
    public bool   UserCanNotWriteRelative { get; set; }
    public string PostMessageOrigin     { get; set; } = "";
    // Προαιρετικά για collaboration features:
    public bool   SupportsUserInfo      { get; set; }
    public bool   IsAnonymousUser       { get; set; }
}