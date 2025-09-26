-- Add reference field to expenses table
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS reference VARCHAR(255);

-- Add comment to the column
COMMENT ON COLUMN expenses.reference IS 'Reference number or identifier for the expense';