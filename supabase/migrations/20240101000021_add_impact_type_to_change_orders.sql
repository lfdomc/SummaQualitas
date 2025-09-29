-- Add impact_type column to change_orders table
-- This field is required for the form to work properly

-- Add the impact_type column if it doesn't exist
ALTER TABLE change_orders ADD COLUMN IF NOT EXISTS impact_type VARCHAR(20) DEFAULT 'positivo'
CHECK (impact_type IN ('positivo', 'negativo'));

-- Create index for impact_type
CREATE INDEX IF NOT EXISTS idx_change_orders_impact_type ON change_orders(impact_type);

-- Update existing change orders with appropriate impact_type values
UPDATE change_orders 
SET impact_type = 'positivo' 
WHERE impact_type IS NULL OR impact_type = '';

-- Add comment to the column
COMMENT ON COLUMN change_orders.impact_type IS 'Tipo de impacto: positivo (aumenta presupuesto), negativo (disminuye presupuesto)';