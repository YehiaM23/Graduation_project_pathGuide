using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using grad_project.Server.Data;
using grad_project.Server.DTOs;
using grad_project.Server.Models;
using grad_project.Server.Services;
using System.Security.Claims;

namespace grad_project.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "admin")]
public class AdminController : ControllerBase
{
    private readonly PathGuideContext _context;
    private readonly IAuthService _authService;
    private readonly ILogger<AdminController> _logger;

    public AdminController(
        PathGuideContext context,
        IAuthService authService,
        ILogger<AdminController> logger)
    {
        _context = context;
        _authService = authService;
        _logger = logger;
    }

    /// <summary>
    /// Get all admins - accessible by any admin
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<AdminListDto>>> GetAllAdmins()
    {
        try
        {
            var admins = await _context.AdminProfiles
                .Include(ap => ap.User)
                .Select(ap => new AdminListDto
                {
                    AdminProfileId = ap.AdminProfileId,
                    UserId = ap.UserId,
                    Email = ap.User.Email,
                    Name = ap.User.Name ?? "",
                    IsFullAdmin = ap.IsFullAdmin,
                    IsActive = ap.User.IsActive ?? false
                })
                .ToListAsync();

            return Ok(admins);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching admins");
            return StatusCode(500, new { message = "An error occurred while fetching admins" });
        }
    }

    /// <summary>
    /// Get admin by ID - accessible by any admin
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<AdminResponseDto>> GetAdmin(int id)
    {
        try
        {
            var admin = await _context.AdminProfiles
                .Include(ap => ap.User)
                .FirstOrDefaultAsync(ap => ap.AdminProfileId == id);

            if (admin == null)
            {
                return NotFound(new { message = "Admin not found" });
            }

            return Ok(new AdminResponseDto
            {
                AdminProfileId = admin.AdminProfileId,
                UserId = admin.UserId,
                Email = admin.User.Email,
                Name = admin.User.Name ?? "",
                Phone = admin.User.Phone,
                IsFullAdmin = admin.IsFullAdmin,
                IsActive = admin.User.IsActive ?? false,
                EmailVerified = admin.User.EmailVerified,
                CreatedAt = admin.CreatedAt,
                UpdatedAt = admin.UpdatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching admin {AdminId}", id);
            return StatusCode(500, new { message = "An error occurred while fetching admin" });
        }
    }

    /// <summary>
    /// Create new admin - ONLY accessible by full admins
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<AdminResponseDto>> CreateAdmin([FromBody] CreateAdminDto dto)
    {
        // Check if current user is a full admin
        if (!await IsCurrentUserFullAdmin())
        {
            return Forbid();
        }

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // Check if email already exists
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
            {
                return BadRequest(new { message = "Email already registered" });
            }

            // Create user
            var user = new User
            {
                Email = dto.Email,
                Password = _authService.HashPassword(dto.Password),
                Name = dto.Name,
                Phone = dto.Phone,
                Role = "admin",
                IsActive = true,
                EmailVerified = true, // Admin accounts are pre-verified
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Create admin profile
            var adminProfile = new AdminProfile
            {
                UserId = user.UserId,
                IsFullAdmin = dto.IsFullAdmin,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.AdminProfiles.Add(adminProfile);
            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            _logger.LogInformation("Admin {Email} created by user {CreatorId}", dto.Email, GetCurrentUserId());

            return CreatedAtAction(nameof(GetAdmin), new { id = adminProfile.AdminProfileId }, new AdminResponseDto
            {
                AdminProfileId = adminProfile.AdminProfileId,
                UserId = user.UserId,
                Email = user.Email,
                Name = user.Name ?? "",
                Phone = user.Phone,
                IsFullAdmin = adminProfile.IsFullAdmin,
                IsActive = user.IsActive ?? false,
                EmailVerified = user.EmailVerified,
                CreatedAt = adminProfile.CreatedAt,
                UpdatedAt = adminProfile.UpdatedAt
            });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error creating admin");
            return StatusCode(500, new { message = "An error occurred while creating admin" });
        }
    }

    /// <summary>
    /// Update admin - ONLY accessible by full admins
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<AdminResponseDto>> UpdateAdmin(int id, [FromBody] UpdateAdminDto dto)
    {
        // Check if current user is a full admin
        if (!await IsCurrentUserFullAdmin())
        {
            return Forbid();
        }

        try
        {
            var admin = await _context.AdminProfiles
                .Include(ap => ap.User)
                .FirstOrDefaultAsync(ap => ap.AdminProfileId == id);

            if (admin == null)
            {
                return NotFound(new { message = "Admin not found" });
            }

            // Update user fields
            if (!string.IsNullOrEmpty(dto.Name))
                admin.User.Name = dto.Name;

            if (dto.Phone != null)
                admin.User.Phone = dto.Phone;

            if (dto.IsActive.HasValue)
                admin.User.IsActive = dto.IsActive.Value;

            admin.User.UpdatedAt = DateTime.UtcNow;

            // Update admin profile fields
            if (dto.IsFullAdmin.HasValue)
                admin.IsFullAdmin = dto.IsFullAdmin.Value;

            admin.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Admin {AdminId} updated by user {UpdaterId}", id, GetCurrentUserId());

            return Ok(new AdminResponseDto
            {
                AdminProfileId = admin.AdminProfileId,
                UserId = admin.UserId,
                Email = admin.User.Email,
                Name = admin.User.Name ?? "",
                Phone = admin.User.Phone,
                IsFullAdmin = admin.IsFullAdmin,
                IsActive = admin.User.IsActive ?? false,
                EmailVerified = admin.User.EmailVerified,
                CreatedAt = admin.CreatedAt,
                UpdatedAt = admin.UpdatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating admin {AdminId}", id);
            return StatusCode(500, new { message = "An error occurred while updating admin" });
        }
    }

    /// <summary>
    /// Delete admin - ONLY accessible by full admins
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteAdmin(int id)
    {
        // Check if current user is a full admin
        if (!await IsCurrentUserFullAdmin())
        {
            return Forbid();
        }

        try
        {
            var admin = await _context.AdminProfiles
                .Include(ap => ap.User)
                .FirstOrDefaultAsync(ap => ap.AdminProfileId == id);

            if (admin == null)
            {
                return NotFound(new { message = "Admin not found" });
            }

            // Prevent self-deletion
            var currentUserId = GetCurrentUserId();
            if (admin.UserId == currentUserId)
            {
                return BadRequest(new { message = "Cannot delete your own admin account" });
            }

            // Delete user (cascade will delete admin profile)
            _context.Users.Remove(admin.User);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Admin {AdminId} deleted by user {DeleterId}", id, currentUserId);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting admin {AdminId}", id);
            return StatusCode(500, new { message = "An error occurred while deleting admin" });
        }
    }

    /// <summary>
    /// Change admin password - ONLY accessible by full admins
    /// </summary>
    [HttpPut("{id}/password")]
    public async Task<ActionResult> ChangeAdminPassword(int id, [FromBody] AdminChangePasswordDto dto)
    {
        // Check if current user is a full admin
        if (!await IsCurrentUserFullAdmin())
        {
            return Forbid();
        }

        try
        {
            var admin = await _context.AdminProfiles
                .Include(ap => ap.User)
                .FirstOrDefaultAsync(ap => ap.AdminProfileId == id);

            if (admin == null)
            {
                return NotFound(new { message = "Admin not found" });
            }

            admin.User.Password = _authService.HashPassword(dto.NewPassword);
            admin.User.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Admin {AdminId} password changed by user {ChangerId}", id, GetCurrentUserId());

            return Ok(new { message = "Password updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error changing password for admin {AdminId}", id);
            return StatusCode(500, new { message = "An error occurred while changing password" });
        }
    }

    /// <summary>
    /// Get current admin's profile
    /// </summary>
    [HttpGet("me")]
    public async Task<ActionResult<AdminResponseDto>> GetCurrentAdmin()
    {
        try
        {
            var userId = GetCurrentUserId();
            var admin = await _context.AdminProfiles
                .Include(ap => ap.User)
                .FirstOrDefaultAsync(ap => ap.UserId == userId);

            if (admin == null)
            {
                return NotFound(new { message = "Admin profile not found" });
            }

            return Ok(new AdminResponseDto
            {
                AdminProfileId = admin.AdminProfileId,
                UserId = admin.UserId,
                Email = admin.User.Email,
                Name = admin.User.Name ?? "",
                Phone = admin.User.Phone,
                IsFullAdmin = admin.IsFullAdmin,
                IsActive = admin.User.IsActive ?? false,
                EmailVerified = admin.User.EmailVerified,
                CreatedAt = admin.CreatedAt,
                UpdatedAt = admin.UpdatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching current admin profile");
            return StatusCode(500, new { message = "An error occurred while fetching admin profile" });
        }
    }

    /// <summary>
    /// Check if current user is a full admin
    /// </summary>
    [HttpGet("is-full-admin")]
    public async Task<ActionResult<bool>> CheckIsFullAdmin()
    {
        var isFullAdmin = await IsCurrentUserFullAdmin();
        return Ok(new { isFullAdmin });
    }

    #region Helper Methods

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : 0;
    }

    private async Task<bool> IsCurrentUserFullAdmin()
    {
        var userId = GetCurrentUserId();
        if (userId == 0) return false;

        var admin = await _context.AdminProfiles
            .FirstOrDefaultAsync(ap => ap.UserId == userId);

        return admin?.IsFullAdmin ?? false;
    }

    #endregion
}
