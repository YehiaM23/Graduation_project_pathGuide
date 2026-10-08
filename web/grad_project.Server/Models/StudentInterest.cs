using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace grad_project.Server.Models;

[Table("students_interests")]
public class StudentInterest
{
    [Key]
    [Column("student_interest_id")]
    public int StudentInterestId { get; set; }

    [Column("student_id")]
    public int StudentId { get; set; }

    [Column("interest_id")]
    public int InterestId { get; set; }

    // Navigation properties
    [ForeignKey("StudentId")]
    public virtual StudentProfile Student { get; set; } = null!;

    [ForeignKey("InterestId")]
    public virtual Interest Interest { get; set; } = null!;
}
