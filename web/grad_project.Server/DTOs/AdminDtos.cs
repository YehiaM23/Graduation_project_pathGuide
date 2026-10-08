using System.ComponentModel.DataAnnotations;

namespace grad_project.Server.DTOs;

// DTO for creating a new admin
public class CreateAdminDto
{
    [Required]
    [EmailAddress]
    [StringLength(100)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(255, MinimumLength = 6)]
    public string Password { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [Phone]
    [StringLength(20)]
    public string? Phone { get; set; }

    public bool IsFullAdmin { get; set; } = false;
}

// DTO for updating an admin
public class UpdateAdminDto
{
    [StringLength(100)]
    public string? Name { get; set; }

    [Phone]
    [StringLength(20)]
    public string? Phone { get; set; }

    public bool? IsFullAdmin { get; set; }

    public bool? IsActive { get; set; }
}

// DTO for admin response
public class AdminResponseDto
{
    public int AdminProfileId { get; set; }
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public bool IsFullAdmin { get; set; }
    public bool IsActive { get; set; }
    public bool EmailVerified { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

// DTO for admin list (simplified)
public class AdminListDto
{
    public int AdminProfileId { get; set; }
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsFullAdmin { get; set; }
    public bool IsActive { get; set; }
}

// DTO for changing admin password (by full admin)
public class AdminChangePasswordDto
{
    [Required]
    [StringLength(255, MinimumLength = 6)]
    public string NewPassword { get; set; } = string.Empty;
}
