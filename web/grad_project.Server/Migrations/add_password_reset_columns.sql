-- Add password reset token columns to users table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND name = 'reset_token')
BEGIN
    ALTER TABLE [dbo].[users] ADD [reset_token] NVARCHAR(255) NULL;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND name = 'reset_token_expires')
BEGIN
    ALTER TABLE [dbo].[users] ADD [reset_token_expires] DATETIME2 NULL;
END
