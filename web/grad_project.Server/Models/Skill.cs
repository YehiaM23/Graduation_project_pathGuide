using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace grad_project.Server.Models;

[Table("skills")]
public class Skill
{
    [Key]
    [Column("skill_id")]
    public int SkillId { get; set; }

    [Required]
    [Column("skill_name")]
    [StringLength(255)]
    public string SkillName { get; set; } = string.Empty;

    [Column("category")]
    [StringLength(255)]
    public string? Category { get; set; }

    [Column("is_active")]
    public bool? IsActive { get; set; } = true;

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    // Navigation properties
    public virtual ICollection<StudentSkill> StudentSkills { get; set; } = new List<StudentSkill>();
    public virtual ICollection<InternshipSkill> InternshipSkills { get; set; } = new List<InternshipSkill>();
}
