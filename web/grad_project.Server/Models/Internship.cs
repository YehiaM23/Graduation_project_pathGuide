using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace grad_project.Server.Models;

[Table("internships")]
public class Internship
{
    [Key]
    [Column("intership_id")] // Note: typo in database column name
    public int InternshipId { get; set; }

    [Column("recruiter_profile_id")]
    public int RecruiterProfileId { get; set; }

    [Required]
    [Column("title")]
    [StringLength(100)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [Column("description")]
    public string Description { get; set; } = string.Empty;

    [Column("location")]
    [StringLength(200)]
    public string? Location { get; set; }

    [Column("start_date")]
    public DateTime? StartDate { get; set; }

    [Column("period_in_weeks")]
    public int? PeriodInWeeks { get; set; }

    [Column("deadline")]
    public DateTime? Deadline { get; set; }

    [Column("skill_id")]
    public int? SkillId { get; set; }

    [Column("stipend", TypeName = "decimal(10, 2)")]
    public decimal? Stipend { get; set; }

    [Column("is_active")]
    public bool? IsActive { get; set; } = true;

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    [ForeignKey("RecruiterProfileId")]
    public virtual RecruiterProfile RecruiterProfile { get; set; } = null!;

    [ForeignKey("SkillId")]
    public virtual Skill? Skill { get; set; }

    public virtual ICollection<InternshipApplication> Applications { get; set; } = new List<InternshipApplication>();
}
