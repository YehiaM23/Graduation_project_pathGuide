using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace grad_project.Server.Models;

[Table("internship_applications")]
public class InternshipApplication
{
    [Key]
    [Column("application_id")]
    public int ApplicationId { get; set; }

    [Column("internship_id")]
    public int InternshipId { get; set; }

    [Column("student_id")]
    public int StudentId { get; set; }

    [Required]
    [Column("status")]
    [StringLength(50)]
    public string Status { get; set; } = "pending"; // pending, reviewed, accepted, rejected, completed

    [Column("applied_at")]
    public DateTime? AppliedAt { get; set; }

    [Column("reviewed_at")]
    public DateTime? ReviewedAt { get; set; }

    [Column("reviewer_notes")]
    public string? ReviewerNotes { get; set; }

    // Completion fields
    [Column("performance_rating")]
    public int? PerformanceRating { get; set; }  // 1-5 star rating

    [Column("performance_comment")]
    public string? PerformanceComment { get; set; }

    [Column("certificate_url")]
    [StringLength(500)]
    public string? CertificateUrl { get; set; }

    [Column("completed_at")]
    public DateTime? CompletedAt { get; set; }

    // NVARCHAR(MAX) — written by the Python mock-interview agent at the end of
    // an interview via /api/mockinterview/report. Markdown report.
    //
    // A student may retake the mock interview as many times as they like; only
    // the most recent report is kept. Each save simply overwrites the previous
    // value (last write wins), so there is no concurrency token here.
    [Column("mock_interview_report")]
    public string? MockInterviewReport { get; set; }

    // The mock interview report is private to the student by default. The
    // recruiter can only see it after the student explicitly opts in via the
    // "Show Report to Recruiter" action. Defaults to false.
    [Column("mock_interview_report_shared")]
    public bool MockInterviewReportSharedWithRecruiter { get; set; }

    // Navigation properties
    [ForeignKey("InternshipId")]
    public virtual Internship Internship { get; set; } = null!;

    [ForeignKey("StudentId")]
    public virtual StudentProfile StudentProfile { get; set; } = null!;
}
