namespace MeetingDecisions.Api.DTOs;

public class ContentMappingDto
{
    public string SourceSectionId { get; set; } = string.Empty;
    public string TargetBookmark { get; set; } = string.Empty;
    public bool PreserveFormatting { get; set; }
    public string? EditedContent { get; set; }
    public int OrderIndex { get; set; }
}

public class GenerateDecisionRequest
{
    public int MeetingId { get; set; }
    public string TemplateId { get; set; } = string.Empty;
    public List<ContentMappingDto> Mappings { get; set; } = new();
    public Dictionary<string, string> Metadata { get; set; } = new();
}

public class DocumentExtractionResponse
{
    public string DocumentId { get; set; } = string.Empty;
    public List<Models.DocumentSection> Sections { get; set; } = new();
    public List<string> AvailableBookmarks { get; set; } = new();
    public Dictionary<string, string> DocumentMetadata { get; set; } = new();
}