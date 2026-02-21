using Microsoft.AspNetCore.Mvc;
using MeetingDecisions.Api.Services;
using MeetingDecisions.Api.Models;

namespace MeetingDecisions.Api.Controllers;

[ApiController]
[Route("wopi")]
public class WopiController : ControllerBase
{
    private readonly IWopiService _wopiService;
    private readonly ILogger<WopiController> _logger;

    public WopiController(IWopiService wopiService, ILogger<WopiController> logger)
    {
        _wopiService = wopiService;
        _logger = logger;
    }

    // WOPI CheckFileInfo endpoint
    [HttpGet("files/{fileId}")]
    public async Task<IActionResult> CheckFileInfo(string fileId, [FromQuery] string access_token)
    {
        try
        {
            var fileInfo = await _wopiService.GetFileInfo(fileId, access_token);
            return Ok(fileInfo);
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (FileNotFoundException)
        {
            return NotFound();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in CheckFileInfo");
            return StatusCode(500);
        }
    }

    // WOPI GetFile endpoint
    [HttpGet("files/{fileId}/contents")]
    public async Task<IActionResult> GetFile(string fileId, [FromQuery] string access_token)
    {
        try
        {
            var content = await _wopiService.GetFileContent(fileId, access_token);
            return File(content, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (FileNotFoundException)
        {
            return NotFound();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in GetFile");
            return StatusCode(500);
        }
    }

    // WOPI PutFile endpoint
    [HttpPost("files/{fileId}/contents")]
    public async Task<IActionResult> PutFile(string fileId, [FromQuery] string access_token)
    {
        try
        {
            using var ms = new MemoryStream();
            await Request.Body.CopyToAsync(ms);
            var content = ms.ToArray();

            await _wopiService.PutFileContent(fileId, access_token, content);
            
            return Ok(new { 
                Status = "success",
                Size = content.Length 
            });
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (FileNotFoundException)
        {
            return NotFound();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in PutFile");
            return StatusCode(500);
        }
    }

    // WOPI Lock endpoint (required by Collabora)
    [HttpPost("files/{fileId}")]
    public async Task<IActionResult> Lock(string fileId, [FromQuery] string access_token, [FromHeader(Name = "X-WOPI-Override")] string wopiOverride)
    {
        _logger.LogInformation($"WOPI Operation: {wopiOverride} for file {fileId}");

        // Basic lock implementation (for prototype)
        // In production, implement proper file locking
        
        return Ok(new { Status = "success" });
    }
}

// Collabora session controller
[ApiController]
[Route("api/[controller]")]
public class CollaboraController : ControllerBase
{
    private readonly IWopiService _wopiService;
    private readonly ILogger<CollaboraController> _logger;

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
                request.FileName,
                request.ReadOnly
            );

            return Ok(session);
        }
        catch (FileNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating Collabora session");
            return StatusCode(500, new { error = "Failed to create editing session" });
        }
    }

    public class UploadDocumentRequest
    {
        public IFormFile File { get; set; } = null!;
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