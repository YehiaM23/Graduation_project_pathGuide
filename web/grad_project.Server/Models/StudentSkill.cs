using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace grad_project.Server.Models;

[Table("students_skills")]
public class StudentSkill
{
    [Key]
    [Column("student_skill_id")]
    public int StudentSkillId { get; set; }

    [Column("student_id")]
    public int? StudentId { get; set; }

    [Column("skill_id")]
    public int? SkillId { get; set; }

    // Navigation properties
    [ForeignKey("StudentId")]
    public virtual StudentProfile? Student { get; set; }

    [ForeignKey("SkillId")]
    public virtual Skill? Skill { get; set; }
}
