-- Add attachment fields to expenses table
-- This migration adds the missing attachment fields that are defined in TypeScript types

-- Add reference attachment fields if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'expenses' 
        AND column_name = 'reference_attachment_url'
    ) THEN
        ALTER TABLE expenses ADD COLUMN reference_attachment_url TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'expenses' 
        AND column_name = 'reference_attachment_name'
    ) THEN
        ALTER TABLE expenses ADD COLUMN reference_attachment_name TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'expenses' 
        AND column_name = 'reference_attachment_type'
    ) THEN
        ALTER TABLE expenses ADD COLUMN reference_attachment_type TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'expenses' 
        AND column_name = 'reference_attachment_size'
    ) THEN
        ALTER TABLE expenses ADD COLUMN reference_attachment_size INTEGER;
    END IF;
END $$;

-- Add comments to the new columns
COMMENT ON COLUMN expenses.reference_attachment_url IS 'URL to the reference attachment file';
COMMENT ON COLUMN expenses.reference_attachment_name IS 'Original name of the reference attachment file';
COMMENT ON COLUMN expenses.reference_attachment_type IS 'MIME type of the reference attachment file';
COMMENT ON COLUMN expenses.reference_attachment_size IS 'Size of the reference attachment file in bytes';

-- Create indexes for better performance when filtering by attachment existence
CREATE INDEX IF NOT EXISTS idx_expenses_receipt_url ON expenses(receipt_url) WHERE receipt_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_expenses_reference_attachment_url ON expenses(reference_attachment_url) WHERE reference_attachment_url IS NOT NULL;