using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace grad_project.Server.Models;

[Table("users")]
public class User
{
    [Key]
    [Column("user_id")]
    public int UserId { get; set; }

    [Required]
    [Column("email")]
    [StringLength(100)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [Column("password")]
    [StringLength(255)]
    public string Password { get; set; } = string.Empty;

    [Column("role")]
    [StringLength(50)]
    public string? Role { get; set; }

    [Column("name")]
    [StringLength(100)]
    public string? Name { get; set; }

    [Column("phone")]
    [StringLength(20)]
    public string? Phone { get; set; }

    [Column("is_active")]
    public bool? IsActive { get; set; }

    [Column("email_verified")]
    public bool EmailVerified { get; set; } = false;

    [Column("verification_token")]
    [StringLength(255)]
    public string? VerificationToken { get; set; }

    [Column("verification_token_expires")]
    public DateTime? VerificationTokenExpires { get; set; }

    [Column("reset_token")]
    [StringLength(255)]
    public string? ResetToken { get; set; }

    [Column("reset_token_expires")]
    public DateTime? ResetTokenExpires { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public virtual StudentProfile? StudentProfile { get; set; }
    public virtual RecruiterProfile? RecruiterProfile { get; set; }
    public virtual AdminProfile? AdminProfile { get; set; }
}
