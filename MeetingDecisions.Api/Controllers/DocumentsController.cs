using Microsoft.AspNetCore.Mvc;
using MeetingDecisions.Api.Services;
using MeetingDecisions.Api.DTOs;
using MeetingDecisions.Api.Models;

namespace MeetingDecisions.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DocumentsController : ControllerBase
{
    private readonly IDocumentService _documentService;
    private readonly ILogger<DocumentsController> _logger;

    public DocumentsController(
        IDocumentService documentService,
        ILogger<DocumentsController> logger)
    {
        _documentService = documentService;
        _logger = logger;
    }

    [HttpPost("proposals/extract")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> ExtractProposal([FromForm] ProposalUploadRequest request)
    {
        try
        {
            if (request.File == null || request.File.Length == 0)
                return BadRequest(new { error = "No file uploaded" });

            if (!request.File.FileName.EndsWith(".docx", StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { error = "Only .docx files are supported" });

            _logger.LogInformation($"Extracting sections from {request.File.FileName}");

            var result = await _documentService.ExtractSectionsFromProposal(request.File, request.TemplateId);

            _logger.LogInformation($"Extracted {result.Sections.Count} sections");

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error extracting proposal document");
            return StatusCode(500, new { error = "Failed to extract document", details = ex.Message });
        }
    }

    [HttpPost("decisions/generate")]
    public async Task<IActionResult> GenerateDecision([FromBody] GenerateDecisionRequest request)
    {
        try
        {
            if (request.Mappings == null || !request.Mappings.Any())
                return BadRequest(new { error = "No content mappings provided" });

            _logger.LogInformation($"Generating decision for meeting {request.MeetingId}");

            var documentBytes = await _documentService.GenerateDecision(request);

            var fileName = $"Αποφαση_{request.MeetingId}_{DateTime.Now:yyyyMMdd_HHmmss}.docx";

            _logger.LogInformation($"Decision generated successfully: {fileName}");

            return File(
                documentBytes,
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating decision document");
            return StatusCode(500, new { error = "Failed to generate document", details = ex.Message });
        }
    }

    [HttpGet("templates/{templateId}/bookmarks")]
    public async Task<IActionResult> GetTemplateBookmarks(string templateId)
    {
        try
        {
            var bookmarks = await _documentService.GetTemplateBookmarks(templateId);

            if (!bookmarks.Any())
            {
                _logger.LogWarning($"No bookmarks found for template {templateId}");
            }

            return Ok(bookmarks);
        }
        catch (FileNotFoundException)
        {
            return NotFound(new { error = $"Template {templateId} not found" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving template bookmarks");
            return StatusCode(500, new { error = "Failed to retrieve bookmarks", details = ex.Message });
        }
    }

    [HttpPost("decisions/preview")]
    public async Task<IActionResult> PreviewDecision([FromBody] GenerateDecisionRequest request)
    {
        try
        {
            var documentBytes = await _documentService.GenerateDecision(request);

            using var ms = new MemoryStream(documentBytes);
            var doc = new Aspose.Words.Document(ms);

            var htmlOptions = new Aspose.Words.Saving.HtmlSaveOptions
            {
                ExportImagesAsBase64 = true,
                PrettyFormat = true
            };

            using var htmlStream = new MemoryStream();
            doc.Save(htmlStream, htmlOptions);
            htmlStream.Position = 0;

            var html = System.Text.Encoding.UTF8.GetString(htmlStream.ToArray());
            return Content(html, "text/html");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error previewing decision document");
            return StatusCode(500, new { error = "Failed to preview document", details = ex.Message });
        }
    }

    [HttpGet("templates")]
    public IActionResult GetTemplates()
    {
        try
        {
            var templates = new List<DecisionTemplate>
            {
                new DecisionTemplate
                {
                    Id = "default",
                    Name = "Πρότυπο Απόφασης Δ.Σ.",
                    Description = "Βασικό πρότυπο για αποφάσεις Διοικητικού Συμβουλίου",
                    CreatedDate = DateTime.Now
                }
            };

            return Ok(templates);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving templates");
            return StatusCode(500, new { error = "Failed to retrieve templates" });
        }
    }
}

// Helper class for file upload
public class ProposalUploadRequest
{
    public IFormFile File { get; set; } = null!;
    public string TemplateId { get; set; } = "default";
}