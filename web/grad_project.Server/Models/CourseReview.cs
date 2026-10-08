using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace grad_project.Server.Models;

[Table("course_reviews")]
public class CourseReview
{
    [Key]
    [Column("review_id")]
    public int ReviewId { get; set; }

    [Column("student_id")]
    public int StudentId { get; set; }

    [Required]
    [Column("rating")]
    [Range(1, 5)]
    public int Rating { get; set; }

    [Column("review_text")]
    [StringLength(1000)]
    public string? ReviewText { get; set; }

    [Required]
    [Column("course_title")]
    [StringLength(255)]
    public string CourseTitle { get; set; } = string.Empty;

    [Column("course_link")]
    [StringLength(500)]
    public string? CourseLink { get; set; }

    [Required]
    [Column("skill_name")]
    [StringLength(255)]
    public string SkillName { get; set; } = string.Empty;

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    [ForeignKey("StudentId")]
    public virtual StudentProfile Student { get; set; } = null!;
}
