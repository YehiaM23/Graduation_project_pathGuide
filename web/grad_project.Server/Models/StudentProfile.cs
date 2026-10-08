using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace grad_project.Server.Models;

[Table("student_profiles")]
public class StudentProfile
{
    [Key]
    [Column("student_profile_id")]
    public int StudentProfileId { get; set; }

    [Column("user_id")]
    public int UserId { get; set; }

    [Column("university_id")]
    public int? UniversityId { get; set; }

    [Column("major_id")]
    public int? MajorId { get; set; }

    [Column("gpa", TypeName = "decimal(3, 2)")]
    public decimal? Gpa { get; set; }

    [Column("graduation_year")]
    public int? GraduationYear { get; set; }

    [Column("cv_url")]
    [StringLength(200)]
    public string? CvUrl { get; set; }

    [Column("transcript_url")]
    [StringLength(200)]
    public string? TranscriptUrl { get; set; }

    [Column("linkedin_url")]
    [StringLength(200)]
    public string? LinkedinUrl { get; set; }

    [Column("github_url")]
    [StringLength(200)]
    public string? GithubUrl { get; set; }

    [Column("career_path_id")]
    public int? CareerPathId { get; set; }

    [Column("bio")]
    public string? Bio { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;

    [ForeignKey("UniversityId")]
    public virtual University? University { get; set; }

    [ForeignKey("MajorId")]
    public virtual Major? Major { get; set; }

    [ForeignKey("CareerPathId")]
    public virtual CareerPath? CareerPath { get; set; }

    public virtual ICollection<StudentSkill> StudentSkills { get; set; } = new List<StudentSkill>();
    public virtual ICollection<StudentInterest> StudentInterests { get; set; } = new List<StudentInterest>();
    public virtual ICollection<InternshipApplication> InternshipApplications { get; set; } = new List<InternshipApplication>();
}
