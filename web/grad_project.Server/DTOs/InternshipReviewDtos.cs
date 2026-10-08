using System.ComponentModel.DataAnnotations;

namespace grad_project.Server.DTOs;

public class CreateInternshipReviewDto
{
    [Required]
    public int ApplicationId { get; set; }

    [Required]
    [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
    public int OverallRating { get; set; }

    [StringLength(2000, ErrorMessage = "Review text cannot exceed 2000 characters")]
    public string? ReviewText { get; set; }
}

public class UpdateInternshipReviewDto
{
    [Required]
    [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
    public int OverallRating { get; set; }

    [StringLength(2000, ErrorMessage = "Review text cannot exceed 2000 characters")]
    public string? ReviewText { get; set; }
}

public class InternshipReviewDto
{
    public int ReviewId { get; set; }
    public int ApplicationId { get; set; }
    public int StudentId { get; set; }
    public string? StudentName { get; set; }
    public int InternshipId { get; set; }
    public string? InternshipTitle { get; set; }
    public string? CompanyName { get; set; }
    public int OverallRating { get; set; }
    public string? ReviewText { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public bool IsOwnReview { get; set; }
}

public class InternshipReviewSummaryDto
{
    public int InternshipId { get; set; }
    public string? InternshipTitle { get; set; }
    public string? CompanyName { get; set; }
    public double AverageOverallRating { get; set; }
    public int TotalReviews { get; set; }
    public List<InternshipReviewDto> Reviews { get; set; } = new();
}

public class InternshipReviewCheckDto
{
    public bool Exists { get; set; }
    public int? ReviewId { get; set; }
}
