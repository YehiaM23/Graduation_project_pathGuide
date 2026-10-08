using System.ComponentModel.DataAnnotations;

namespace grad_project.Server.DTOs;

public class RegisterStudentDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;

    [Required]
    public string Name { get; set; } = string.Empty;

    public string? Phone { get; set; }

    // Student-specific fields (optional - can be filled later in profile)
    public int? UniversityId { get; set; }

    public int? MajorId { get; set; }

    [Range(2020, 2035)]
    public int? GraduationYear { get; set; }

    // Step 2 fields - Links & Documents
    [Url]
    public string? LinkedinUrl { get; set; }

    [Url]
    public string? GithubUrl { get; set; }

    // CV is uploaded after registration via POST /api/students/profile/cv, so it
    // is intentionally not accepted (as a free-text URL) here.

    public int? CareerPathId { get; set; }

    // Step 2 fields - Skills & Interests
    public List<int>? SkillIds { get; set; }
    public List<int>? InterestIds { get; set; }
}

public class RegisterRecruiterDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;

    [Required]
    public string Name { get; set; } = string.Empty;

    [Required]
    [Phone]
    public string Phone { get; set; } = string.Empty;

    // Recruiter-specific fields
    [Required]
    public string CompanyName { get; set; } = string.Empty;

    public string? CompanyDescription { get; set; }
    public string? Website { get; set; }
}

public class LoginDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}

public class VerifyEmailDto
{
    [Required]
    public string Token { get; set; } = string.Empty;
}

public class ChangePasswordDto
{
    [Required]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string NewPassword { get; set; } = string.Empty;
}

public class ForgotPasswordDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
}

public class ResetPasswordDto
{
    [Required]
    public string Token { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string NewPassword { get; set; } = string.Empty;
}

public class AuthResponseDto
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public string? Token { get; set; }
    public UserDto? User { get; set; }
}

public class UserDto
{
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Name { get; set; }
    public string? Phone { get; set; }
    public string? Role { get; set; }
    public bool EmailVerified { get; set; }
    public DateTime? CreatedAt { get; set; }
}
