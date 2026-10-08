using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace grad_project.Server.Models;

[Table("saved_career_plans")]
public class SavedCareerPlan
{
    [Key]
    [Column("saved_plan_id")]
    public int SavedPlanId { get; set; }

    [Column("student_id")]
    public int StudentId { get; set; }

    [Required]
    [Column("target_role")]
    [StringLength(100)]
    public string TargetRole { get; set; } = string.Empty;

    [Column("total_hours")]
    public int? TotalHours { get; set; }

    [Column("weeks_at_10h")]
    public int? WeeksAt10H { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    [ForeignKey("StudentId")]
    public virtual StudentProfile Student { get; set; } = null!;

    public virtual ICollection<CareerPlanSkill> Skills { get; set; } = new List<CareerPlanSkill>();
    public virtual ICollection<CareerPlanCourse> Courses { get; set; } = new List<CareerPlanCourse>();
}
