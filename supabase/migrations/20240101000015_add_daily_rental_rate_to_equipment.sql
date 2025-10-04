-- Add daily_rental_rate column to equipment table
-- This column is required for equipment rental functionality

ALTER TABLE equipment 
ADD COLUMN daily_rental_rate DECIMAL(10,2) DEFAULT 0 NOT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN equipment.daily_rental_rate IS 'Daily rental rate for this equipment in the default currency';

-- Update existing equipment with default values (can be updated later)
UPDATE equipment 
SET daily_rental_rate = 100.00 
WHERE daily_rental_rate = 0;