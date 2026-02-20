using MeetingDecisions.Api.DTOs;
using MeetingDecisions.Api.Models;

namespace MeetingDecisions.Api.Services;

public interface IDocumentService
{
    Task<DocumentExtractionResponse> ExtractSectionsFromProposal(IFormFile file, string templateId);
    Task<byte[]> GenerateDecision(GenerateDecisionRequest request);
    Task<List<TemplateBookmark>> GetTemplateBookmarks(string templateId);

    // WOPI-specific methods
    Task<DocumentInfo?> GetByIdAsync(string fileId);
    Task<byte[]?> GetContentsAsync(string fileId);
    Task SaveContentsAsync(string fileId, byte[] fileBytes, string userId);
    
    // Locking methods
    Task<string?> GetLockAsync(string fileId);
    Task SetLockAsync(string fileId, string lockId, TimeSpan duration);
    Task ClearLockAsync(string fileId);
}

public class DocumentInfo
{
    public string FileName { get; set; } = string.Empty;
    public long SizeInBytes { get; set; }
    public string OwnerId { get; set; } = string.Empty;
    public DateTime LastModified { get; set; }
}