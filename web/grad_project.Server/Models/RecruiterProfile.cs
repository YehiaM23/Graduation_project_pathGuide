using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace grad_project.Server.Models;

[Table("recruiter_profiles")]
public class RecruiterProfile
{
    [Key]
    [Column("recruiter_profile_id")]
    public int RecruiterProfileId { get; set; }

    [Column("user_id")]
    public int? UserId { get; set; }

    [Column("company_name")]
    [StringLength(100)]
    public string? CompanyName { get; set; }

    [Column("email")]
    [StringLength(100)]
    public string? Email { get; set; }

    [Column("company_description")]
    [StringLength(1000)]
    public string? CompanyDescription { get; set; }

    [Column("logo_url")]
    [StringLength(200)]
    public string? LogoUrl { get; set; }

    [Column("website")]
    [StringLength(100)]
    public string? Website { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    [ForeignKey("UserId")]
    public virtual User? User { get; set; }

    public virtual ICollection<Internship> Internships { get; set; } = new List<Internship>();
}
