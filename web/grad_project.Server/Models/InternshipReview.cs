using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace grad_project.Server.Models;

[Table("internship_reviews")]
public class InternshipReview
{
    [Key]
    [Column("review_id")]
    public int ReviewId { get; set; }

    [Column("application_id")]
    public int ApplicationId { get; set; }

    // DB column is `student_id` (FK to student_profiles.student_profile_id).
    // The C# name stays StudentProfileId because it's referenced widely.
    [Column("student_id")]
    public int StudentProfileId { get; set; }

    [Column("internship_id")]
    public int InternshipId { get; set; }

    [Required]
    [Range(1, 5)]
    [Column("overall_rating")]
    public int OverallRating { get; set; }

    [Range(1, 5)]
    [Column("learning_rating")]
    public int? LearningRating { get; set; }

    [Range(1, 5)]
    [Column("culture_rating")]
    public int? CultureRating { get; set; }

    [Range(1, 5)]
    [Column("mentorship_rating")]
    public int? MentorshipRating { get; set; }

    [Column("review_text")]
    [StringLength(2000)]
    public string? ReviewText { get; set; }

    [Column("pros")]
    [StringLength(500)]
    public string? Pros { get; set; }

    [Column("cons")]
    [StringLength(500)]
    public string? Cons { get; set; }

    [Column("would_recommend")]
    public bool WouldRecommend { get; set; } = true;

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    [ForeignKey("ApplicationId")]
    public virtual InternshipApplication Application { get; set; } = null!;

    [ForeignKey("StudentProfileId")]
    public virtual StudentProfile Student { get; set; } = null!;

    [ForeignKey("InternshipId")]
    public virtual Internship Internship { get; set; } = null!;
}
