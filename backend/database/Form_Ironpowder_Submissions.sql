-- Create Form_Ironpowder_Submissions Table
-- This table stores Ironpowder form submissions with approval workflow

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'Form_Ironpowder_Submissions' AND xtype = 'U')
BEGIN
    CREATE TABLE Form_Ironpowder_Submissions (
        -- Primary Key
        submissionId INT PRIMARY KEY IDENTITY(1,1),
        
        -- Core Information
        lot_no NVARCHAR(50) NOT NULL UNIQUE,
        form_type NVARCHAR(50) DEFAULT 'Ironpowder',
        
        -- Submission Details
        submitted_by INT NOT NULL,
        status NVARCHAR(50) DEFAULT 'Submitted', -- 'Draft', 'Submitted', 'Rejected', 'Approved'
        
        -- Report Information
        report_date DATE,
        machine_name NVARCHAR(100),
        
        -- Key Metrics (Normalized Columns for Fast Queries)
        total_input DECIMAL(10, 2) DEFAULT 0.00,
        total_output DECIMAL(10, 2) DEFAULT 0.00,
        diff_weight DECIMAL(10, 2) DEFAULT 0.00,
        
        -- Full Form Data (JSON Storage for Complete Preservation)
        form_data_json NVARCHAR(MAX),
        
        -- Timestamps
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );
    
    -- Create Indexes
    CREATE INDEX IDX_Ironpowder_Status ON Form_Ironpowder_Submissions(status);
    CREATE INDEX IDX_Ironpowder_SubmittedBy ON Form_Ironpowder_Submissions(submitted_by);
    CREATE INDEX IDX_Ironpowder_CreatedAt ON Form_Ironpowder_Submissions(created_at DESC);
    
    PRINT 'Table Form_Ironpowder_Submissions created successfully!';
END
ELSE
BEGIN
    PRINT 'Table Form_Ironpowder_Submissions already exists.';
END;
