-- Add attachment fields to expenses table
-- This migration adds the missing attachment fields that are defined in TypeScript types

-- Add reference attachment fields
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS reference_attachment_url TEXT;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS reference_attachment_name TEXT;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS reference_attachment_type TEXT;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS reference_attachment_size INTEGER;

-- Add comments to the new columns
COMMENT ON COLUMN expenses.reference_attachment_url IS 'URL to the reference attachment file';
COMMENT ON COLUMN expenses.reference_attachment_name IS 'Original name of the reference attachment file';
COMMENT ON COLUMN expenses.reference_attachment_type IS 'MIME type of the reference attachment file';
COMMENT ON COLUMN expenses.reference_attachment_size IS 'Size of the reference attachment file in bytes';

-- Create index for better performance when filtering by attachment existence
CREATE INDEX IF NOT EXISTS idx_expenses_receipt_url ON expenses(receipt_url) WHERE receipt_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_expenses_reference_attachment_url ON expenses(reference_attachment_url) WHERE reference_attachment_url IS NOT NULL;