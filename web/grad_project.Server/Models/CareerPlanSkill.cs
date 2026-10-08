using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace grad_project.Server.Models;

[Table("career_plan_skills")]
public class CareerPlanSkill
{
    [Key]
    [Column("plan_skill_id")]
    public int PlanSkillId { get; set; }

    [Column("saved_plan_id")]
    public int SavedPlanId { get; set; }

    [Required]
    [Column("skill_name")]
    [StringLength(255)]
    public string SkillName { get; set; } = string.Empty;

    [Column("skill_id")]
    public int? SkillId { get; set; }

    // Navigation properties
    [ForeignKey("SavedPlanId")]
    public virtual SavedCareerPlan SavedCareerPlan { get; set; } = null!;

    [ForeignKey("SkillId")]
    public virtual Skill? Skill { get; set; }
}
