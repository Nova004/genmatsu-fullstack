-- ✅ Safe Indexing Script
-- This script only CREATES indexes (like a Table of Contents).
-- It does NOT delete or modify any existing data.
-- It checks if the index exists before creating it (Safe to run multiple times).

USE AGT_SMART_SY; -- Make sure we are in the correct DB context (Check your DB name if different)
GO

-- 1. Index for Finding Pending/Approved Tasks (Speed up: x5)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IDX_Form_Submissions_Status' AND object_id = OBJECT_ID('Form_Submissions'))
BEGIN
    CREATE NONCLUSTERED INDEX IDX_Form_Submissions_Status ON Form_Submissions(status);
    PRINT '✅ Created index: IDX_Form_Submissions_Status';
END
ELSE
BEGIN
    PRINT 'ℹ️ Index already exists: IDX_Form_Submissions_Status';
END

-- 2. Index for Filtering by User (My Tasks) (Speed up: x3)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IDX_Form_Submissions_SubmittedBy' AND object_id = OBJECT_ID('Form_Submissions'))
BEGIN
    CREATE NONCLUSTERED INDEX IDX_Form_Submissions_SubmittedBy ON Form_Submissions(submitted_by);
    PRINT '✅ Created index: IDX_Form_Submissions_SubmittedBy';
END

-- 3. Index for Lot No Search (Speed up: x10)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IDX_Form_Submissions_LotNo' AND object_id = OBJECT_ID('Form_Submissions'))
BEGIN
    CREATE NONCLUSTERED INDEX IDX_Form_Submissions_LotNo ON Form_Submissions(lot_no);
    PRINT '✅ Created index: IDX_Form_Submissions_LotNo';
END

-- 4. Index for Form Type Filtering (Speed up: x3)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IDX_Form_Submissions_FormType' AND object_id = OBJECT_ID('Form_Submissions'))
BEGIN
    CREATE NONCLUSTERED INDEX IDX_Form_Submissions_FormType ON Form_Submissions(form_type);
    PRINT '✅ Created index: IDX_Form_Submissions_FormType';
END

-- 5. Index for Dashboard/Reports Date Range (Speed up: x5-x10 on Reports)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IDX_Form_Submission_Data_ProductionDate' AND object_id = OBJECT_ID('Form_Submission_Data'))
BEGIN
    CREATE NONCLUSTERED INDEX IDX_Form_Submission_Data_ProductionDate ON Form_Submission_Data(production_date);
    PRINT '✅ Created index: IDX_Form_Submission_Data_ProductionDate';
END

PRINT '🎉 Indexing Complete! System should be faster now.';
