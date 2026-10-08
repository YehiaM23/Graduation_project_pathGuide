USE [PathGuide]
GO

-- Create internship_applications table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[internship_applications]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[internship_applications](
        [application_id] [int] IDENTITY(1,1) NOT NULL,
        [internship_id] [int] NOT NULL,
        [student_id] [int] NOT NULL,
        [status] [nvarchar](50) NOT NULL DEFAULT 'pending',
        [applied_at] [datetime2](7) NULL DEFAULT GETDATE(),
        [reviewed_at] [datetime2](7) NULL,
        [reviewer_notes] [nvarchar](max) NULL,
        CONSTRAINT [PK_internship_applications] PRIMARY KEY CLUSTERED
        (
            [application_id] ASC
        ) WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    ) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

    -- Add foreign key to internships table (using intership_id due to typo in original schema)
    ALTER TABLE [dbo].[internship_applications] ADD CONSTRAINT [FK_internship_applications_internships]
        FOREIGN KEY([internship_id]) REFERENCES [dbo].[internships] ([intership_id])
        ON DELETE CASCADE

    -- Add foreign key to student_profiles table
    ALTER TABLE [dbo].[internship_applications] ADD CONSTRAINT [FK_internship_applications_student_profiles]
        FOREIGN KEY([student_id]) REFERENCES [dbo].[student_profiles] ([student_profile_id])
        ON DELETE CASCADE

    PRINT 'Table internship_applications created successfully'
END
ELSE
BEGIN
    PRINT 'Table internship_applications already exists'
END
GO

-- Add primary key to recruiter_profiles if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[recruiter_profiles]') AND is_primary_key = 1)
BEGIN
    ALTER TABLE [dbo].[recruiter_profiles] ADD CONSTRAINT [PK_recruiter_profiles] PRIMARY KEY CLUSTERED
    (
        [recruiter_profile_id] ASC
    ) WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]

    PRINT 'Primary key added to recruiter_profiles'
END
GO

-- Add foreign key from internships to recruiter_profiles if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_internships_recruiter_profiles]') AND parent_object_id = OBJECT_ID(N'[dbo].[internships]'))
BEGIN
    ALTER TABLE [dbo].[internships] ADD CONSTRAINT [FK_internships_recruiter_profiles]
        FOREIGN KEY([recruiter_profile_id]) REFERENCES [dbo].[recruiter_profiles] ([recruiter_profile_id])
        ON DELETE CASCADE

    PRINT 'Foreign key FK_internships_recruiter_profiles added'
END
GO

-- Add foreign key from internships to skills if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_internships_skills]') AND parent_object_id = OBJECT_ID(N'[dbo].[internships]'))
BEGIN
    ALTER TABLE [dbo].[internships] ADD CONSTRAINT [FK_internships_skills]
        FOREIGN KEY([skill_id]) REFERENCES [dbo].[skills] ([skill_id])
        ON DELETE SET NULL

    PRINT 'Foreign key FK_internships_skills added'
END
GO
