using Microsoft.AspNetCore.Mvc;
using MeetingDecisions.Api.Services;
using MeetingDecisions.Api.Models;

namespace MeetingDecisions.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CollaboraController : ControllerBase
{
    private readonly IWopiService _wopiService;
    private readonly ILogger<CollaboraController> _logger;

    public class UploadDocumentRequest
    {
        public IFormFile File { get; set; } = null!;
    }

    public CollaboraController(IWopiService wopiService, ILogger<CollaboraController> logger)
    {
        _wopiService = wopiService;
        _logger = logger;
    }

    [HttpPost("sessions")]
    public async Task<IActionResult> CreateSession([FromBody] CollaboraSessionRequest request)
    {
        try
        {
            var session = await _wopiService.CreateEditingSession(
                request.DocumentId,
                request.FileName ?? "Document", 
                request.UserId,
                request.Role,
                request.ReadOnly
            );

            return Ok(session);
        }
        catch (FileNotFoundException ex)
        {
            _logger.LogWarning(ex, "Document not found for session creation");
            return NotFound(new { error = "Document not found." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create Collabora session");
            return StatusCode(500, new { error = "Failed to create session." });
        }
    }

    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadDocument([FromForm] UploadDocumentRequest request, [FromServices] IConfiguration configuration)
    {
        try
        {
            if (request.File == null || request.File.Length == 0)
                return BadRequest(new { error = "No file uploaded" });

            if (!request.File.FileName.EndsWith(".docx", StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { error = "Only .docx files are supported" });

            var documentId = Guid.NewGuid().ToString();
            var fileName = $"{documentId}.docx";
            
            var tempPath = configuration["DocumentSettings:TempPath"] ?? "Documents/Temp";
            
            if (!Directory.Exists(tempPath))
            {
                Directory.CreateDirectory(tempPath);
            }
            
            var filePath = Path.Combine(tempPath, fileName);
            
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await request.File.CopyToAsync(stream);
            }

            _logger.LogInformation($"Uploaded file saved for Collabora editing as: {fileName}");

            return Ok(new { documentId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading document for Collabora");
            return StatusCode(500, new { error = "Failed to upload document" });
        }
    }
}
