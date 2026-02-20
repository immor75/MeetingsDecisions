namespace MeetingDecisions.Api.Services;

public interface ICollaboraDiscoveryService
{
    Task<string> GetEditorUrlAsync(string extension, string action);
}