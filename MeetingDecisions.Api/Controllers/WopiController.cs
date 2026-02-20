using Microsoft.AspNetCore.Mvc;
using MeetingDecisions.Api.Services;
using MeetingDecisions.Api.DTOs;
using MeetingDecisions.Api.Models;
using System.Security.Claims;

namespace MeetingDecisions.Api.Controllers;

[ApiController]
[Route("wopi/files")]
public class WopiController : ControllerBase
{
    private readonly IDocumentService _documentService;
    private readonly IWopiTokenService _tokenService;

    public WopiController(IDocumentService documentService, IWopiTokenService tokenService)
    {
        _documentService = documentService;
        _tokenService = tokenService;
    }

    // ─── CheckFileInfo ───────────────────────────────────────────
    [HttpGet("{fileId}")]
    public async Task<IActionResult> CheckFileInfo(
        string fileId,
        [FromQuery] string access_token)
    {
        if (!_tokenService.Validate(access_token, fileId, out var claims))
            return Unauthorized();

        var doc = await _documentService.GetByIdAsync(fileId);
        if (doc == null) return NotFound();

        var canWrite = claims.Role == "secretary"; // Γραμματεία = edit, Μέλη = view

        return Ok(new CheckFileInfoResponse
        {
            BaseFileName      = doc.FileName,
            Size              = doc.SizeInBytes,
            OwnerId           = doc.OwnerId,
            UserId            = claims.UserId,
            UserFriendlyName  = claims.DisplayName,
            UserCanWrite      = canWrite,
            SupportsUpdate    = true,
            SupportsLocks     = true,
            SupportsGetLock   = true,
            UserCanNotWriteRelative = true, // Αποτρέπει "Save As" σε νέο αρχείο
            PostMessageOrigin = "https://yourapp.yourorg.gr"
        });
    }

    // ─── GetFile ──────────────────────────────────────────────────
    [HttpGet("{fileId}/contents")]
    public async Task<IActionResult> GetFile(
        string fileId,
        [FromQuery] string access_token)
    {
        if (!_tokenService.Validate(access_token, fileId, out _))
            return Unauthorized();

        var fileBytes = await _documentService.GetContentsAsync(fileId);
        if (fileBytes == null) return NotFound();

        return File(fileBytes, "application/octet-stream");
    }

    // ─── PutFile / Lock / Unlock ──────────────────────────────────
    [HttpPost("{fileId}/contents")]
    public async Task<IActionResult> PutFile(
        string fileId,
        [FromQuery] string access_token)
    {
        if (!_tokenService.Validate(access_token, fileId, out var claims))
            return Unauthorized();

        if (claims.Role != "secretary")
            return StatusCode(409); // Conflict — read-only user

        using var ms = new MemoryStream();
        await Request.Body.CopyToAsync(ms);
        var fileBytes = ms.ToArray();

        await _documentService.SaveContentsAsync(fileId, fileBytes, claims.UserId);

        return Ok();
    }

    // ─── WOPI Actions (Lock, Unlock, RefreshLock, GetLock) ────────
    [HttpPost("{fileId}")]
    public async Task<IActionResult> HandleWopiAction(
        string fileId,
        [FromQuery] string access_token)
    {
        if (!_tokenService.Validate(access_token, fileId, out _))
            return Unauthorized();

        var wopiOverride = Request.Headers["X-WOPI-Override"].ToString();

        return wopiOverride switch
        {
            "LOCK"          => await HandleLock(fileId),
            "UNLOCK"        => await HandleUnlock(fileId),
            "REFRESH_LOCK"  => await HandleRefreshLock(fileId),
            "GET_LOCK"      => await HandleGetLock(fileId),
            _               => Ok()
        };
    }

    private async Task<IActionResult> HandleLock(string fileId)
    {
        var newLockId = Request.Headers["X-WOPI-Lock"].ToString();
        var existingLock = await _documentService.GetLockAsync(fileId);

        if (existingLock == null)
        {
            await _documentService.SetLockAsync(fileId, newLockId, TimeSpan.FromMinutes(30));
            return Ok();
        }

        if (existingLock == newLockId)
        {
            // Refresh
            await _documentService.SetLockAsync(fileId, newLockId, TimeSpan.FromMinutes(30));
            return Ok();
        }

        // Conflict — κάποιος άλλος έχει lock
        Response.Headers["X-WOPI-Lock"] = existingLock;
        return StatusCode(409);
    }

    private async Task<IActionResult> HandleUnlock(string fileId)
    {
        var lockId = Request.Headers["X-WOPI-Lock"].ToString();
        var existingLock = await _documentService.GetLockAsync(fileId);

        if (existingLock != lockId)
        {
            Response.Headers["X-WOPI-Lock"] = existingLock ?? "";
            return StatusCode(409);
        }

        await _documentService.ClearLockAsync(fileId);
        return Ok();
    }

    private async Task<IActionResult> HandleRefreshLock(string fileId)
        => await HandleLock(fileId); // Ίδια λογική

    private async Task<IActionResult> HandleGetLock(string fileId)
    {
        var existingLock = await _documentService.GetLockAsync(fileId);
        Response.Headers["X-WOPI-Lock"] = existingLock ?? "";
        return Ok();
    }
}