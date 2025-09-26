-- Fix missing document numbers for existing change orders
-- This migration adds document numbers to existing change orders that don't have them

-- First, add the document_number column if it doesn't exist
ALTER TABLE change_orders ADD COLUMN IF NOT EXISTS document_number VARCHAR(50) UNIQUE;

-- Create index for document_number
CREATE INDEX IF NOT EXISTS idx_change_orders_document_number ON change_orders(document_number);

-- First, let's create the function if it doesn't exist
CREATE OR REPLACE FUNCTION generate_change_order_document_number()
RETURNS TEXT AS $$
DECLARE
    current_year TEXT;
    sequence_number INTEGER;
    document_number TEXT;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(co.document_number FROM 'OC-' || current_year || '-(\\d+)') AS INTEGER)), 0) + 1
    INTO sequence_number
    FROM change_orders co
    WHERE co.document_number LIKE 'OC-' || current_year || '-%';
    
    document_number := 'OC-' || current_year || '-' || LPAD(sequence_number::TEXT, 4, '0');
    
    RETURN document_number;
END;
$$ LANGUAGE plpgsql;

-- Update existing change orders that don't have document numbers
DO $$
DECLARE
    change_order_record RECORD;
    new_document_number TEXT;
    counter INTEGER := 1;
BEGIN
    FOR change_order_record IN 
        SELECT id FROM change_orders 
        WHERE document_number IS NULL OR document_number = ''
        ORDER BY created_at ASC
    LOOP
        new_document_number := 'OC-2024-' || LPAD(counter::TEXT, 4, '0');
        
        UPDATE change_orders 
        SET document_number = new_document_number
        WHERE id = change_order_record.id;
        
        counter := counter + 1;
    END LOOP;
END $$;

-- Create a trigger to automatically generate document numbers for new change orders
CREATE OR REPLACE FUNCTION trigger_generate_document_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.document_number IS NULL OR NEW.document_number = '' THEN
        NEW.document_number := generate_change_order_document_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists and create it
DROP TRIGGER IF EXISTS trigger_change_orders_document_number ON change_orders;
CREATE TRIGGER trigger_change_orders_document_number
    BEFORE INSERT ON change_orders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_generate_document_number();