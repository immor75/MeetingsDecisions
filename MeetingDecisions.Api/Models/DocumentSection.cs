namespace MeetingDecisions.Api.Models;

public class DocumentSection
{
    public string Id { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string HtmlContent { get; set; } = string.Empty;
    public SectionType Type { get; set; }  // <-- Αυτό είναι enum
    public int OrderIndex { get; set; }
    public bool HasFormatting { get; set; }
    public List<string> Styles { get; set; } = new();
}

public enum SectionType
{
    Paragraph,
    Table,
    List,
    Heading,
    Image
}

public class DecisionTemplate
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public byte[]? TemplateFile { get; set; }
    public List<TemplateBookmark> Bookmarks { get; set; } = new();
    public DateTime CreatedDate { get; set; }
}

public class TemplateBookmark
{
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsRequired { get; set; }
}