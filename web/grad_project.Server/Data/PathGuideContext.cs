using Microsoft.EntityFrameworkCore;
using grad_project.Server.Models;

namespace grad_project.Server.Data;

public class PathGuideContext : DbContext
{
    public PathGuideContext(DbContextOptions<PathGuideContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<StudentProfile> StudentProfiles { get; set; }
    public DbSet<RecruiterProfile> RecruiterProfiles { get; set; }
    public DbSet<AdminProfile> AdminProfiles { get; set; }
    public DbSet<Skill> Skills { get; set; }
    public DbSet<Interest> Interests { get; set; }
    public DbSet<Major> Majors { get; set; }
    public DbSet<University> Universities { get; set; }
    public DbSet<CareerPath> CareerPaths { get; set; }
    public DbSet<StudentSkill> StudentSkills { get; set; }
    public DbSet<StudentInterest> StudentInterests { get; set; }
    public DbSet<Internship> Internships { get; set; }
    public DbSet<InternshipApplication> InternshipApplications { get; set; }
    public DbSet<SavedCareerPlan> SavedCareerPlans { get; set; }
    public DbSet<CareerPlanSkill> CareerPlanSkills { get; set; }
    public DbSet<CareerPlanCourse> CareerPlanCourses { get; set; }
    public DbSet<CourseReview> CourseReviews { get; set; }
    public DbSet<InternshipReview> InternshipReviews { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(e => e.Email).IsUnique();

            entity.HasOne(u => u.StudentProfile)
                .WithOne(sp => sp.User)
                .HasForeignKey<StudentProfile>(sp => sp.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(u => u.RecruiterProfile)
                .WithOne(rp => rp.User)
                .HasForeignKey<RecruiterProfile>(rp => rp.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(u => u.AdminProfile)
                .WithOne(ap => ap.User)
                .HasForeignKey<AdminProfile>(ap => ap.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // AdminProfile configuration
        modelBuilder.Entity<AdminProfile>(entity =>
        {
            entity.Property(ap => ap.IsFullAdmin).HasDefaultValue(false);
            entity.Property(ap => ap.CreatedAt).HasDefaultValueSql("GETDATE()");
            entity.Property(ap => ap.UpdatedAt).HasDefaultValueSql("GETDATE()");
        });

        // StudentProfile configuration
        modelBuilder.Entity<StudentProfile>(entity =>
        {
            entity.HasOne(sp => sp.University)
                .WithMany(u => u.StudentProfiles)
                .HasForeignKey(sp => sp.UniversityId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(sp => sp.Major)
                .WithMany(m => m.StudentProfiles)
                .HasForeignKey(sp => sp.MajorId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // StudentSkill configuration (many-to-many)
        modelBuilder.Entity<StudentSkill>(entity =>
        {
            entity.HasOne(ss => ss.Student)
                .WithMany(sp => sp.StudentSkills)
                .HasForeignKey(ss => ss.StudentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(ss => ss.Skill)
                .WithMany(s => s.StudentSkills)
                .HasForeignKey(ss => ss.SkillId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // StudentInterest configuration (many-to-many)
        modelBuilder.Entity<StudentInterest>(entity =>
        {
            entity.HasOne(si => si.Student)
                .WithMany(sp => sp.StudentInterests)
                .HasForeignKey(si => si.StudentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(si => si.Interest)
                .WithMany(i => i.StudentInterests)
                .HasForeignKey(si => si.InterestId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Skill default values
        modelBuilder.Entity<Skill>(entity =>
        {
            entity.Property(s => s.IsActive).HasDefaultValue(true);
            entity.Property(s => s.CreatedAt).HasDefaultValueSql("GETDATE()");
        });

        // Internship configuration
        modelBuilder.Entity<Internship>(entity =>
        {
            entity.HasOne(i => i.RecruiterProfile)
                .WithMany(rp => rp.Internships)
                .HasForeignKey(i => i.RecruiterProfileId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(i => i.Skill)
                .WithMany()
                .HasForeignKey(i => i.SkillId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.Property(i => i.IsActive).HasDefaultValue(true);
            entity.Property(i => i.CreatedAt).HasDefaultValueSql("GETDATE()");
        });

        // InternshipApplication configuration
        modelBuilder.Entity<InternshipApplication>(entity =>
        {
            entity.HasOne(ia => ia.Internship)
                .WithMany(i => i.Applications)
                .HasForeignKey(ia => ia.InternshipId)
                .HasPrincipalKey(i => i.InternshipId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(ia => ia.StudentProfile)
                .WithMany(sp => sp.InternshipApplications)
                .HasForeignKey(ia => ia.StudentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(ia => ia.AppliedAt).HasDefaultValueSql("GETDATE()");
            entity.Property(ia => ia.MockInterviewReportSharedWithRecruiter).HasDefaultValue(false);
        });

        // SavedCareerPlan configuration
        modelBuilder.Entity<SavedCareerPlan>(entity =>
        {
            entity.HasOne(scp => scp.Student)
                .WithMany()
                .HasForeignKey(scp => scp.StudentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(scp => scp.IsActive).HasDefaultValue(true);
            entity.Property(scp => scp.CreatedAt).HasDefaultValueSql("GETDATE()");
            entity.Property(scp => scp.UpdatedAt).HasDefaultValueSql("GETDATE()");
        });

        // CareerPlanSkill configuration
        modelBuilder.Entity<CareerPlanSkill>(entity =>
        {
            entity.HasOne(cps => cps.SavedCareerPlan)
                .WithMany(scp => scp.Skills)
                .HasForeignKey(cps => cps.SavedPlanId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(cps => cps.Skill)
                .WithMany()
                .HasForeignKey(cps => cps.SkillId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // CareerPlanCourse configuration
        modelBuilder.Entity<CareerPlanCourse>(entity =>
        {
            entity.HasOne(cpc => cpc.SavedCareerPlan)
                .WithMany(scp => scp.Courses)
                .HasForeignKey(cpc => cpc.SavedPlanId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(cpc => cpc.IsCompleted).HasDefaultValue(false);
            entity.Property(cpc => cpc.CreatedAt).HasDefaultValueSql("GETDATE()");
        });

        // CourseReview configuration
        modelBuilder.Entity<CourseReview>(entity =>
        {
            entity.HasOne(cr => cr.Student)
                .WithMany()
                .HasForeignKey(cr => cr.StudentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(cr => cr.CreatedAt).HasDefaultValueSql("GETDATE()");
            entity.Property(cr => cr.UpdatedAt).HasDefaultValueSql("GETDATE()");

            entity.HasIndex(cr => new { cr.StudentId, cr.CourseTitle, cr.CourseLink })
                .IsUnique();
        });

        // InternshipReview configuration
        modelBuilder.Entity<InternshipReview>(entity =>
        {
            entity.HasOne(ir => ir.Application)
                .WithOne()
                .HasForeignKey<InternshipReview>(ir => ir.ApplicationId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(ir => ir.Student)
                .WithMany()
                .HasForeignKey(ir => ir.StudentProfileId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(ir => ir.Internship)
                .WithMany()
                .HasForeignKey(ir => ir.InternshipId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.Property(ir => ir.CreatedAt).HasDefaultValueSql("GETDATE()");
            entity.Property(ir => ir.UpdatedAt).HasDefaultValueSql("GETDATE()");
            entity.Property(ir => ir.WouldRecommend).HasDefaultValue(true);

            // Unique constraint: one review per application
            entity.HasIndex(ir => ir.ApplicationId).IsUnique();
        });
    }
}
