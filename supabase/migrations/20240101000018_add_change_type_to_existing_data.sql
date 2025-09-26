-- Add change_type column if it doesn't exist and update existing data
-- This migration ensures the change_type field is properly set for existing change orders

-- Add the change_type column if it doesn't exist
ALTER TABLE change_orders ADD COLUMN IF NOT EXISTS change_type VARCHAR(50) 
CHECK (change_type IN ('accion_correctiva', 'accion_preventiva', 'extras'));

-- Create index for change_type
CREATE INDEX IF NOT EXISTS idx_change_orders_change_type ON change_orders(change_type);

-- Update existing change orders with appropriate change_type values
UPDATE change_orders 
SET change_type = 'accion_correctiva' 
WHERE change_type IS NULL OR change_type = '';

-- Add comment to the column
COMMENT ON COLUMN change_orders.change_type IS 'Tipo de orden: accion_correctiva, accion_preventiva, extras';