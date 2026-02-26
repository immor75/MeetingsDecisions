using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;


namespace WebApplication1.Controllers {
  [ApiController]
  [Route("[controller]")]
  public class FileController : Controller {
    private readonly string _documentsPath = "../../Documents";
    
    [HttpGet("/wopi/files/{fileId}")]
    // This endpoint gets the information of the file, which id value is being used in the endpoint and returns it
    //  to the host machine that is running the webpage from the collabora server. It responds to a GET request at
    //  http://<HOSTNAME>/wopi/files/<fileId>. The minimum amount of information needed to be returned is Name and
    //  Size of the file.
    public ActionResult<FileInfoTemplate> CheckFileInfo(string fileId) {
      try {
        var filePath = Path.Combine(_documentsPath, $"{fileId}.docx");
        if (!System.IO.File.Exists(filePath)) {
          // Create a simple test file if it doesn't exist
          var testContent = "Test Document Content for Collabora Integration";
          System.IO.File.WriteAllText(filePath, testContent);
        }
        
        var fileInfo = new FileInfo(filePath);
        return new FileInfoTemplate {
          BaseFileName = $"{fileId}.docx",
          Size = (int)fileInfo.Length,
          UserId = 1,
          UserCanWrite = true
        };
      } catch {
        // Fallback to default values if there's an error
        return new FileInfoTemplate {
          BaseFileName = "test.docx",
          Size = 1024,
          UserId = 1,
          UserCanWrite = true
        };
      }
    }

    [HttpGet("/wopi/files/{fileId}/contents")]
    // This endpoint gets the contents of the file, as this a SDK example the content loaded onto the file origionally
    //  is hardcoded into the system. This is what makes sure when a new page of the SDK is opened it always opens with
    //  the text 'Hello World'. It is called when the GET request is called at http://<HOSTNAME>/wopi/files/<fileId>/contents
    public IActionResult GetFile(string fileId) {
      try {
        var filePath = Path.Combine(_documentsPath, $"{fileId}.docx");
        if (!System.IO.File.Exists(filePath)) {
          // Create a simple test file if it doesn't exist
          var testContent = "Test Document Content for Collabora Integration\n\nThis is a sample document created for testing WOPI integration with Collabora Online.";
          System.IO.File.WriteAllText(filePath, testContent);
        }
        
        var fileBytes = System.IO.File.ReadAllBytes(filePath);
        return File(fileBytes, "application/octet-stream");
      } catch {
        // Fallback content
        var fallbackContent = "Hello World - Test Document";
        return Content(fallbackContent, "text/plain");
      }
    }

    [HttpPost("/wopi/files/{fileId}/contents")]
    // This endpoint allows for the files to save to the collabora space. This SDK example outputs in the console, or something
    //  {need to find this}, the body text put bellow then returns the status code 200; meaning it was a success but only if the
    //  body has something in, from being edited. Else it returns a failure code of 404.
    public async Task<IActionResult> PutFile(string fileId) {
      try {
        var filePath = Path.Combine(_documentsPath, $"{fileId}.docx");
        
        using (var memoryStream = new MemoryStream()) {
          await HttpContext.Request.Body.CopyToAsync(memoryStream);
          var fileBytes = memoryStream.ToArray();
          
          if (fileBytes.Length > 0) {
            await System.IO.File.WriteAllBytesAsync(filePath, fileBytes);
            System.Diagnostics.Debug.WriteLine($"File saved: {fileId}.docx, Size: {fileBytes.Length} bytes");
            return StatusCode(200);
          } else {
            return StatusCode(404);
          }
        }
      } catch (Exception ex) {
        System.Diagnostics.Debug.WriteLine($"Error saving file: {ex.Message}");
        return StatusCode(500);
      }
    }

    [HttpPost("/upload")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadFile(IFormFile file, string? documentId = null)
    {
      try
      {
        if (file == null || file.Length == 0)
          return BadRequest(new { error = "No file uploaded" });

        // Use provided documentId or generate one from filename
        var docId = !string.IsNullOrEmpty(documentId) ? documentId : Path.GetFileNameWithoutExtension(file.FileName);
        var fileName = $"{docId}.docx";
        var filePath = Path.Combine(_documentsPath, fileName);

        // Ensure directory exists
        Directory.CreateDirectory(_documentsPath);

        // Save uploaded file
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
          await file.CopyToAsync(stream);
        }

        return Ok(new { 
          documentId = docId,
          fileName = fileName,
          size = file.Length,
          message = "File uploaded successfully"
        });
      }
      catch (Exception ex)
      {
        return StatusCode(500, new { error = $"Upload failed: {ex.Message}" });
      }
    }
  }
}
