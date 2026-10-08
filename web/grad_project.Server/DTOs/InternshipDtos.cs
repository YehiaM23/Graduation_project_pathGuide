using System.ComponentModel.DataAnnotations;

namespace grad_project.Server.DTOs;

public class InternshipDto
{
    public int InternshipId { get; set; }
    public int RecruiterProfileId { get; set; }
    public string? CompanyName { get; set; }
    public string? CompanyLogo { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? Location { get; set; }
    public DateTime? StartDate { get; set; }
    public int? PeriodInWeeks { get; set; }
    public DateTime? Deadline { get; set; }
    public int? SkillId { get; set; }
    public SkillDto? RequiredSkill { get; set; }
    public decimal? Stipend { get; set; }
    public bool IsActive { get; set; }
    public int ApplicationsCount { get; set; }
    public DateTime? CreatedAt { get; set; }
}

public class CreateInternshipDto
{
    [Required]
    [StringLength(100)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Description { get; set; } = string.Empty;

    [StringLength(200)]
    public string? Location { get; set; }

    public DateTime? StartDate { get; set; }

    [Range(1, 52)]
    public int? PeriodInWeeks { get; set; }

    public DateTime? Deadline { get; set; }

    public int? SkillId { get; set; }

    [Range(0, 100000)]
    public decimal? Stipend { get; set; }
}

public class UpdateInternshipDto
{
    [StringLength(100)]
    public string? Title { get; set; }

    public string? Description { get; set; }

    [StringLength(200)]
    public string? Location { get; set; }

    public DateTime? StartDate { get; set; }

    [Range(1, 52)]
    public int? PeriodInWeeks { get; set; }

    public DateTime? Deadline { get; set; }

    public int? SkillId { get; set; }

    [Range(0, 100000)]
    public decimal? Stipend { get; set; }

    public bool? IsActive { get; set; }
}

public class InternshipApplicationDto
{
    public int ApplicationId { get; set; }
    public int InternshipId { get; set; }
    public string? InternshipTitle { get; set; }
    public string? CompanyName { get; set; }
    public int StudentId { get; set; }
    public string? StudentName { get; set; }
    public string? StudentEmail { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? AppliedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewerNotes { get; set; }

    // Completion fields
    public int? PerformanceRating { get; set; }
    public string? PerformanceComment { get; set; }
    public string? CertificateUrl { get; set; }
    public DateTime? CompletedAt { get; set; }

    // Student details for recruiter view
    public string? UniversityName { get; set; }
    public string? MajorName { get; set; }
    public decimal? Gpa { get; set; }
    public int? GraduationYear { get; set; }
    /// <summary>
    /// True when the applicant has an uploaded CV. The recruiter downloads it via
    /// <c>GET /api/applications/{applicationId}/cv</c>; the raw path is never exposed.
    /// </summary>
    public bool HasCv { get; set; }
    public string? LinkedinUrl { get; set; }
    public string? GithubUrl { get; set; }
    public List<SkillDto>? StudentSkills { get; set; }

    /// <summary>
    /// True when <c>internship_applications.mock_interview_report</c> is non-empty
    /// for this row. The full report is fetched on demand from
    /// <c>GET /api/applications/{id}/mock-interview-report</c> to keep the list
    /// response small.
    ///
    /// For the recruiter views this is additionally gated on the student having
    /// shared the report (<see cref="MockInterviewReportShared"/>), so a recruiter
    /// never sees a report the student has not opted to share.
    /// </summary>
    public bool HasMockInterviewReport { get; set; }

    /// <summary>
    /// True when the student has opted to share their mock interview report with
    /// the recruiter. Used by the student view to drive the "Show Report to
    /// Recruiter" toggle.
    /// </summary>
    public bool MockInterviewReportShared { get; set; }
}

public class CreateApplicationDto
{
    [Required]
    public int InternshipId { get; set; }
}

public class UpdateApplicationStatusDto
{
    [Required]
    public string Status { get; set; } = string.Empty; // pending, reviewed, accepted, rejected

    public string? ReviewerNotes { get; set; }
}

public class CompleteApplicationDto
{
    [Required]
    [Range(1, 5, ErrorMessage = "Performance rating must be between 1 and 5")]
    public int PerformanceRating { get; set; }

    public string? PerformanceComment { get; set; }
}

public class ShareMockInterviewReportDto
{
    // true = make the report visible to the recruiter; false = hide it again.
    public bool Shared { get; set; }
}
