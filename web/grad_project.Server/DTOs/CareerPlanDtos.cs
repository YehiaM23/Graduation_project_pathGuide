using System.Text.Json.Serialization;

namespace grad_project.Server.DTOs;

// Request DTOs
public class SaveCareerPlanRequest
{
    [JsonPropertyName("targetRole")]
    public string TargetRole { get; set; } = string.Empty;

    [JsonPropertyName("skillsNeeded")]
    public List<string> SkillsNeeded { get; set; } = new();

    [JsonPropertyName("steps")]
    public List<CourseStepRequest> Steps { get; set; } = new();

    [JsonPropertyName("totalHours")]
    public double TotalHours { get; set; }

    [JsonPropertyName("weeksAt10H")]
    public double WeeksAt10H { get; set; }
}

public class CourseStepRequest
{
    [JsonPropertyName("step")]
    public int Step { get; set; }

    [JsonPropertyName("skill")]
    public string Skill { get; set; } = string.Empty;

    [JsonPropertyName("courseTitle")]
    public string CourseTitle { get; set; } = string.Empty;

    [JsonPropertyName("courseLink")]
    public string CourseLink { get; set; } = string.Empty;

    [JsonPropertyName("hours")]
    public double? Hours { get; set; }

    [JsonPropertyName("cumulativeHours")]
    public double? CumulativeHours { get; set; }

    [JsonPropertyName("prerequisites")]
    public List<string> Prerequisites { get; set; } = new();
}

public class MarkCourseCompleteRequest
{
    public string? CertificateUrl { get; set; }
}

// Response DTOs
public class SavedCareerPlanDto
{
    public int SavedPlanId { get; set; }
    public int StudentId { get; set; }
    public string TargetRole { get; set; } = string.Empty;
    public int? TotalHours { get; set; }
    public int? WeeksAt10H { get; set; }
    public bool IsActive { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<CareerPlanSkillDto> Skills { get; set; } = new();
    public List<CareerPlanCourseDto> Courses { get; set; } = new();
    public int CompletedCoursesCount { get; set; }
    public int TotalCoursesCount { get; set; }
    public double ProgressPercentage { get; set; }
}

public class CareerPlanSkillDto
{
    public int PlanSkillId { get; set; }
    public string SkillName { get; set; } = string.Empty;
    public int? SkillId { get; set; }
}

public class CareerPlanCourseDto
{
    public int CourseId { get; set; }
    public int StepNumber { get; set; }
    public string SkillName { get; set; } = string.Empty;
    public string CourseTitle { get; set; } = string.Empty;
    public string? CourseLink { get; set; }
    public int? Hours { get; set; }
    public int? CumulativeHours { get; set; }
    public List<string> Prerequisites { get; set; } = new();
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? CertificateUrl { get; set; }
}

public class SavedCareerPlanSummaryDto
{
    public int SavedPlanId { get; set; }
    public string TargetRole { get; set; } = string.Empty;
    public int? TotalHours { get; set; }
    public int? WeeksAt10H { get; set; }
    public bool IsActive { get; set; }
    public DateTime? CreatedAt { get; set; }
    public int CompletedCoursesCount { get; set; }
    public int TotalCoursesCount { get; set; }
    public double ProgressPercentage { get; set; }
}

// Course Review DTOs
public class CreateCourseReviewRequest
{
    [JsonPropertyName("courseTitle")]
    public string CourseTitle { get; set; } = string.Empty;

    [JsonPropertyName("courseLink")]
    public string? CourseLink { get; set; }

    [JsonPropertyName("skillName")]
    public string SkillName { get; set; } = string.Empty;

    [JsonPropertyName("rating")]
    public int Rating { get; set; }

    [JsonPropertyName("reviewText")]
    public string? ReviewText { get; set; }
}

public class UpdateCourseReviewRequest
{
    [JsonPropertyName("rating")]
    public int Rating { get; set; }

    [JsonPropertyName("reviewText")]
    public string? ReviewText { get; set; }
}

public class CourseReviewDto
{
    public int ReviewId { get; set; }
    public int StudentId { get; set; }
    public string? StudentName { get; set; }
    public int Rating { get; set; }
    public string? ReviewText { get; set; }
    public string CourseTitle { get; set; } = string.Empty;
    public string? CourseLink { get; set; }
    public string SkillName { get; set; } = string.Empty;
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public bool IsOwnReview { get; set; }
}

public class CourseReviewSummaryDto
{
    public string CourseTitle { get; set; } = string.Empty;
    public string? CourseLink { get; set; }
    public double AverageRating { get; set; }
    public int TotalReviews { get; set; }
    public List<CourseReviewDto> Reviews { get; set; } = new();
}
