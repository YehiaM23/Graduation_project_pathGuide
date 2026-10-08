using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace grad_project.Server.Models;

[Table("admin_profiles")]
public class AdminProfile
{
    [Key]
    [Column("admin_profile_id")]
    public int AdminProfileId { get; set; }

    [Column("user_id")]
    public int UserId { get; set; }

    [Column("is_full_admin")]
    public bool IsFullAdmin { get; set; } = false;

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}
