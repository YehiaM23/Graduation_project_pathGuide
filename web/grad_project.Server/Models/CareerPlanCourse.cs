using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace grad_project.Server.Models;

[Table("career_plan_courses")]
public class CareerPlanCourse
{
    [Key]
    [Column("course_id")]
    public int CourseId { get; set; }

    [Column("saved_plan_id")]
    public int SavedPlanId { get; set; }

    [Column("step_number")]
    public int StepNumber { get; set; }

    [Required]
    [Column("skill_name")]
    [StringLength(255)]
    public string SkillName { get; set; } = string.Empty;

    [Required]
    [Column("course_title")]
    [StringLength(255)]
    public string CourseTitle { get; set; } = string.Empty;

    [Column("course_link")]
    [StringLength(500)]
    public string? CourseLink { get; set; }

    [Column("hours")]
    public int? Hours { get; set; }

    [Column("cumulative_hours")]
    public int? CumulativeHours { get; set; }

    [Column("prerequisites")]
    public string? Prerequisites { get; set; }

    [Column("is_completed")]
    public bool IsCompleted { get; set; } = false;

    [Column("completed_at")]
    public DateTime? CompletedAt { get; set; }

    [Column("certificate_url")]
    [StringLength(500)]
    public string? CertificateUrl { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    // Navigation properties
    [ForeignKey("SavedPlanId")]
    public virtual SavedCareerPlan SavedCareerPlan { get; set; } = null!;
}
