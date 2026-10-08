using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace grad_project.Server.Models;

[Table("internship_skills")]
public class InternshipSkill
{
    [Key]
    [Column("internship_skill_id")]
    public int InternshipSkillId { get; set; }

    [Column("internship_id")]
    public int InternshipId { get; set; }

    [Column("skill_id")]
    public int SkillId { get; set; }

    // Navigation properties
    [ForeignKey("InternshipId")]
    public virtual Internship Internship { get; set; } = null!;

    [ForeignKey("SkillId")]
    public virtual Skill Skill { get; set; } = null!;
}
