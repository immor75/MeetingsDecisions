using MeetingDecisions.Api.DTOs;
using MeetingDecisions.Api.Models;

namespace MeetingDecisions.Api.Services;

public interface IDocumentService
{
    Task<DocumentExtractionResponse> ExtractSectionsFromProposal(IFormFile file, string templateId);
    Task<byte[]> GenerateDecision(GenerateDecisionRequest request);
    Task<List<TemplateBookmark>> GetTemplateBookmarks(string templateId);
}