using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace grad_project.Server.Models;

[Table("interests")]
public class Interest
{
    [Key]
    [Column("interest_id")]
    public int InterestId { get; set; }

    [Column("interest_name")]
    [StringLength(50)]
    public string? InterestName { get; set; }

    // Navigation property
    public virtual ICollection<StudentInterest> StudentInterests { get; set; } = new List<StudentInterest>();
}
