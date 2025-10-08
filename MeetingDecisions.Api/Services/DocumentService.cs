using Aspose.Words;
using Aspose.Words.Tables;
using Aspose.Words.Replacing;
using MeetingDecisions.Api.DTOs;
using MeetingDecisions.Api.Models;
using System.Text;

namespace MeetingDecisions.Api.Services;

public class DocumentService : IDocumentService
{
    private readonly ILogger<DocumentService> _logger;
    private readonly string _templatesPath;
    private readonly string _tempPath;

    public DocumentService(ILogger<DocumentService> logger, IConfiguration configuration)
    {
        _logger = logger;
        _templatesPath = configuration["DocumentSettings:TemplatesPath"] ?? "Documents/Templates";
        _tempPath = configuration["DocumentSettings:TempPath"] ?? "Documents/Temp";

        // Ensure directories exist
        Directory.CreateDirectory(_templatesPath);
        Directory.CreateDirectory(_tempPath);

        // Aspose License (optional - αν έχεις license)
        // var license = new License();
        // license.SetLicense("Aspose.Words.lic");
    }

    public async Task<DocumentExtractionResponse> ExtractSectionsFromProposal(
        IFormFile file, string templateId)
    {
        var sections = new List<DocumentSection>();
        var tempFilePath = Path.Combine(_tempPath, Guid.NewGuid().ToString() + ".docx");

        try
        {
            // Save uploaded file
            using (var stream = new FileStream(tempFilePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Load with Aspose
            var doc = new Document(tempFilePath);

            int sectionIndex = 0;

            // Extract paragraphs - iterate through all sections and paragraphs
            foreach (Section docSection in doc.Sections)
            {
                foreach (Paragraph para in docSection.Body.Paragraphs)
                {
                    // Get the text and trim it
                    var text = para.GetText();
                    
                    // Skip if empty or just whitespace
                    if (string.IsNullOrWhiteSpace(text))
                        continue;

                    // Skip page breaks and section breaks
                    if (text.Trim().Length < 2)
                        continue;

                    var section = new DocumentSection
                    {
                        Id = $"section_{sectionIndex}",
                        Content = text.Trim(),
                        HtmlContent = ConvertToHtml(para),
                        Type = DetermineSectionType(para),
                        OrderIndex = sectionIndex,
                        HasFormatting = HasFormatting(para),
                        Styles = ExtractStyles(para)
                    };

                    sections.Add(section);
                    sectionIndex++;

                    // Log for debugging
                    _logger.LogDebug($"Extracted section {sectionIndex}: {text.Substring(0, Math.Min(50, text.Length))}...");
                }

                // Extract tables from this section
                foreach (Table table in docSection.Body.Tables)
                {
                    var tableText = ExtractTableText(table);
                    
                    if (string.IsNullOrWhiteSpace(tableText))
                        continue;

                    sections.Add(new DocumentSection
                    {
                        Id = $"table_{sectionIndex}",
                        Content = tableText.Trim(),
                        HtmlContent = ConvertTableToHtml(table),
                        Type = SectionType.Table,
                        OrderIndex = sectionIndex,
                        HasFormatting = true
                    });

                    sectionIndex++;
                    _logger.LogDebug($"Extracted table {sectionIndex}");
                }
            }

            _logger.LogInformation($"Total sections extracted: {sections.Count}");

            // Get bookmarks from template
            var bookmarks = await GetTemplateBookmarks(templateId);

            return new DocumentExtractionResponse
            {
                DocumentId = Guid.NewGuid().ToString(),
                Sections = sections.OrderBy(s => s.OrderIndex).ToList(),
                AvailableBookmarks = bookmarks.Select(b => b.Name).ToList(),
                DocumentMetadata = ExtractMetadata(doc)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error extracting document sections");
            throw;
        }
        finally
        {
            if (File.Exists(tempFilePath))
                File.Delete(tempFilePath);
        }
    }

    public async Task<byte[]> GenerateDecision(GenerateDecisionRequest request)
    {
        var templatePath = Path.Combine(_templatesPath, $"{request.TemplateId}.docx");
        var outputPath = Path.Combine(_tempPath, Guid.NewGuid().ToString() + ".docx");

        try
        {
            // Load template
            var doc = new Document(templatePath);
            var builder = new DocumentBuilder(doc);

            // Replace metadata fields
            foreach (var meta in request.Metadata)
            {
                doc.Range.Replace($"{{{{{meta.Key}}}}}", meta.Value,
                    new FindReplaceOptions { MatchCase = false });
            }

            // Apply mappings
            foreach (var mapping in request.Mappings.OrderBy(m => m.OrderIndex))
            {
                try
                {
                    // Find bookmark
                    var bookmark = doc.Range.Bookmarks[mapping.TargetBookmark];
                    if (bookmark == null)
                    {
                        _logger.LogWarning($"Bookmark {mapping.TargetBookmark} not found");
                        continue;
                    }

                    builder.MoveToBookmark(mapping.TargetBookmark);

                    // Insert content
                    if (!string.IsNullOrEmpty(mapping.EditedContent))
                    {
                        builder.Write(mapping.EditedContent);
                    }
                    else
                    {
                        builder.Write($"[Content from {mapping.SourceSectionId}]");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error processing mapping for {mapping.TargetBookmark}");
                }
            }

            // Save
            doc.Save(outputPath, SaveFormat.Docx);
            var result = await File.ReadAllBytesAsync(outputPath);
            return result;
        }
        finally
        {
            if (File.Exists(outputPath))
                File.Delete(outputPath);
        }
    }

    public Task<List<TemplateBookmark>> GetTemplateBookmarks(string templateId)
    {
        var templatePath = Path.Combine(_templatesPath, $"{templateId}.docx");

        if (!File.Exists(templatePath))
        {
            _logger.LogWarning($"Template {templateId} not found at {templatePath}");
            return Task.FromResult(new List<TemplateBookmark>());
        }

        var doc = new Document(templatePath);
        var bookmarks = new List<TemplateBookmark>();

        foreach (Bookmark bookmark in doc.Range.Bookmarks)
        {
            if (bookmark.Name.StartsWith("_"))
                continue;

            bookmarks.Add(new TemplateBookmark
            {
                Name = bookmark.Name,
                DisplayName = FormatBookmarkName(bookmark.Name),
                Description = $"Placeholder για {bookmark.Name}",
                IsRequired = bookmark.Name.Contains("Required", StringComparison.OrdinalIgnoreCase)
            });
        }

        return Task.FromResult(bookmarks);
    }

    // Helper Methods
    private SectionType DetermineSectionType(Paragraph para)
    {
        var styleId = para.ParagraphFormat.StyleIdentifier.ToString();

        if (styleId.Contains("Heading"))
            return SectionType.Heading;

        if (para.ListFormat.IsListItem)
            return SectionType.List;

        return SectionType.Paragraph;
    }

    private bool HasFormatting(Paragraph para)
    {
        foreach (Run run in para.Runs)
        {
            if (run.Font.Bold || run.Font.Italic || run.Font.Underline != Underline.None)
                return true;
        }
        return false;
    }

    private List<string> ExtractStyles(Paragraph para)
    {
        var styles = new List<string>();
        foreach (Run run in para.Runs)
        {
            if (run.Font.Bold) styles.Add("bold");
            if (run.Font.Italic) styles.Add("italic");
            if (run.Font.Underline != Underline.None) styles.Add("underline");
        }
        return styles.Distinct().ToList();
    }

    private string ConvertToHtml(Paragraph para)
    {
        var sb = new StringBuilder();
        sb.Append("<p>");

        // Check if paragraph has any runs
        if (para.Runs.Count == 0)
        {
            // If no runs, just get the text directly
            var text = System.Net.WebUtility.HtmlEncode(para.GetText().Trim());
            sb.Append(text);
        }
        else
        {
            // Process each run
            foreach (Run run in para.Runs)
            {
                var text = run.Text;
                
                // Skip empty runs
                if (string.IsNullOrEmpty(text))
                    continue;

                // Encode HTML entities
                text = System.Net.WebUtility.HtmlEncode(text);

                // Apply formatting
                if (run.Font.Bold) 
                    text = $"<strong>{text}</strong>";
                if (run.Font.Italic) 
                    text = $"<em>{text}</em>";
                if (run.Font.Underline != Underline.None) 
                    text = $"<u>{text}</u>";
                
                sb.Append(text);
            }
        }

        sb.Append("</p>");
        return sb.ToString();
    }

    private string ExtractTableText(Table table)
    {
        var sb = new StringBuilder();
        foreach (Row row in table.Rows)
        {
            foreach (Cell cell in row.Cells)
            {
                sb.Append(cell.GetText().Trim() + " | ");
            }
            sb.AppendLine();
        }
        return sb.ToString();
    }

    private string ConvertTableToHtml(Table table)
    {
        var sb = new StringBuilder("<table border='1' style='border-collapse: collapse;'>");

        foreach (Row row in table.Rows)
        {
            sb.Append("<tr>");
            foreach (Cell cell in row.Cells)
            {
                sb.Append($"<td style='padding: 5px;'>{System.Net.WebUtility.HtmlEncode(cell.GetText().Trim())}</td>");
            }
            sb.Append("</tr>");
        }

        sb.Append("</table>");
        return sb.ToString();
    }

    private Dictionary<string, string> ExtractMetadata(Document doc)
    {
        return new Dictionary<string, string>
        {
            ["Title"] = doc.BuiltInDocumentProperties.Title,
            ["Author"] = doc.BuiltInDocumentProperties.Author,
            ["CreatedDate"] = doc.BuiltInDocumentProperties.CreatedTime.ToString("yyyy-MM-dd"),
            ["PageCount"] = doc.PageCount.ToString()
        };
    }

    private string FormatBookmarkName(string bookmarkName)
    {
        return bookmarkName
            .Replace("_", " ")
            .Replace("Bookmark", "")
            .Trim();
    }
}