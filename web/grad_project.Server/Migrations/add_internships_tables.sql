-- SQL Migration Script for Internship Tables
-- Run this script in SQL Server Management Studio on the PathGuide database

USE [PathGuide]
GO

-- Create internships table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'internships')
BEGIN
    CREATE TABLE [dbo].[internships] (
        [internship_id] INT IDENTITY(1,1) NOT NULL,
        [recruiter_id] INT NOT NULL,
        [title] NVARCHAR(200) NOT NULL,
        [description] NVARCHAR(MAX) NULL,
        [location] NVARCHAR(200) NOT NULL,
        [work_type] NVARCHAR(50) NOT NULL DEFAULT 'remote',
        [duration_months] INT NOT NULL DEFAULT 3,
        [stipend] DECIMAL(10, 2) NULL,
        [application_deadline] DATETIME2(7) NOT NULL,
        [requirements] NVARCHAR(MAX) NULL,
        [status] NVARCHAR(50) NOT NULL DEFAULT 'active',
        [created_at] DATETIME2(7) NULL DEFAULT GETDATE(),
        [updated_at] DATETIME2(7) NULL,
        CONSTRAINT [PK_internships] PRIMARY KEY CLUSTERED ([internship_id] ASC),
        CONSTRAINT [FK_internships_recruiter_profiles] FOREIGN KEY ([recruiter_id])
            REFERENCES [dbo].[recruiter_profiles] ([recruiter_profile_id]) ON DELETE CASCADE
    ) ON [PRIMARY]

    PRINT 'Created internships table'
END
ELSE
    PRINT 'internships table already exists'
GO

-- Create internship_applications table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'internship_applications')
BEGIN
    CREATE TABLE [dbo].[internship_applications] (
        [application_id] INT IDENTITY(1,1) NOT NULL,
        [internship_id] INT NOT NULL,
        [student_id] INT NOT NULL,
        [status] NVARCHAR(50) NOT NULL DEFAULT 'pending',
        [applied_at] DATETIME2(7) NULL DEFAULT GETDATE(),
        [reviewed_at] DATETIME2(7) NULL,
        [reviewer_notes] NVARCHAR(MAX) NULL,
        CONSTRAINT [PK_internship_applications] PRIMARY KEY CLUSTERED ([application_id] ASC),
        CONSTRAINT [FK_internship_applications_internships] FOREIGN KEY ([internship_id])
            REFERENCES [dbo].[internships] ([internship_id]) ON DELETE CASCADE,
        CONSTRAINT [FK_internship_applications_student_profiles] FOREIGN KEY ([student_id])
            REFERENCES [dbo].[student_profiles] ([student_profile_id]) ON DELETE CASCADE,
        CONSTRAINT [UQ_internship_student] UNIQUE ([internship_id], [student_id])
    ) ON [PRIMARY]

    PRINT 'Created internship_applications table'
END
ELSE
    PRINT 'internship_applications table already exists'
GO

-- Create internship_skills table (many-to-many relationship)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'internship_skills')
BEGIN
    CREATE TABLE [dbo].[internship_skills] (
        [internship_skill_id] INT IDENTITY(1,1) NOT NULL,
        [internship_id] INT NOT NULL,
        [skill_id] INT NOT NULL,
        CONSTRAINT [PK_internship_skills] PRIMARY KEY CLUSTERED ([internship_skill_id] ASC),
        CONSTRAINT [FK_internship_skills_internships] FOREIGN KEY ([internship_id])
            REFERENCES [dbo].[internships] ([internship_id]) ON DELETE CASCADE,
        CONSTRAINT [FK_internship_skills_skills] FOREIGN KEY ([skill_id])
            REFERENCES [dbo].[skills] ([skill_id]) ON DELETE CASCADE,
        CONSTRAINT [UQ_internship_skill] UNIQUE ([internship_id], [skill_id])
    ) ON [PRIMARY]

    PRINT 'Created internship_skills table'
END
ELSE
    PRINT 'internship_skills table already exists'
GO

-- Create indexes for better query performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_internships_recruiter_id')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_internships_recruiter_id] ON [dbo].[internships] ([recruiter_id])
    PRINT 'Created index IX_internships_recruiter_id'
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_internships_status')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_internships_status] ON [dbo].[internships] ([status])
    PRINT 'Created index IX_internships_status'
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_internship_applications_internship_id')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_internship_applications_internship_id] ON [dbo].[internship_applications] ([internship_id])
    PRINT 'Created index IX_internship_applications_internship_id'
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_internship_applications_student_id')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_internship_applications_student_id] ON [dbo].[internship_applications] ([student_id])
    PRINT 'Created index IX_internship_applications_student_id'
END
GO

PRINT 'Migration completed successfully!'
GO
