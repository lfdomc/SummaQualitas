-- Migration to restructure expense categories with hierarchical structure
-- Main categories: costos_directos, costos_indirectos, mano_obra, imprevistos, administracion

-- First, create new enum types for subcategories
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'direct_cost_subcategory') THEN
    CREATE TYPE direct_cost_subcategory AS ENUM (
      'subcontratos',
      'materiales',
      'otros'
    );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'indirect_cost_subcategory') THEN
    CREATE TYPE indirect_cost_subcategory AS ENUM (
      'cargas_sociales',
      'alquiler',
      'control_calidad',
      'servicios_basicos',
      'transporte',
      'polizas',
      'inspeccion_ingenieros',
      'viaticos',
      'garantias',
      'equipos',
      'otros'
    );
  END IF;
END $$;

-- Add subcategory columns to expenses table
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS subcategory_direct direct_cost_subcategory,
ADD COLUMN IF NOT EXISTS subcategory_indirect indirect_cost_subcategory;

-- Create a temporary column to store old category values
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS old_category TEXT;

-- Copy current category values to temporary column
UPDATE expenses SET old_category = category::TEXT;

-- Remove the category column
ALTER TABLE expenses DROP COLUMN IF EXISTS category;

-- Create new main expense categories enum
CREATE TYPE expense_category_new AS ENUM (
  'costos_directos',
  'costos_indirectos', 
  'mano_obra',
  'imprevistos',
  'administracion'
);

-- Add the category column back with new enum
ALTER TABLE expenses ADD COLUMN category expense_category_new DEFAULT 'costos_directos';

-- Map old categories to new structure
UPDATE expenses SET 
  category = CASE 
    WHEN old_category IN ('direct_cost', 'otros') THEN 'costos_directos'::expense_category_new
    WHEN old_category = 'mano_obra' THEN 'mano_obra'::expense_category_new
    WHEN old_category = 'equipos' THEN 'costos_indirectos'::expense_category_new
    WHEN old_category = 'servicios' THEN 'costos_indirectos'::expense_category_new
    WHEN old_category = 'transporte' THEN 'costos_indirectos'::expense_category_new
    ELSE 'costos_directos'::expense_category_new
  END,
  subcategory_direct = CASE 
    WHEN old_category IN ('direct_cost', 'otros') THEN 'materiales'::direct_cost_subcategory
    ELSE NULL
  END,
  subcategory_indirect = CASE 
    WHEN old_category = 'equipos' THEN 'equipos'::indirect_cost_subcategory
    WHEN old_category = 'servicios' THEN 'servicios_basicos'::indirect_cost_subcategory
    WHEN old_category = 'transporte' THEN 'transporte'::indirect_cost_subcategory
    ELSE NULL
  END;

-- Drop the temporary column
ALTER TABLE expenses DROP COLUMN IF EXISTS old_category;

-- Rename the new enum to the original name
DROP TYPE IF EXISTS expense_category;
ALTER TYPE expense_category_new RENAME TO expense_category;

-- Update any remaining records that don't have proper subcategories
UPDATE expenses 
SET subcategory_indirect = 'otros'::indirect_cost_subcategory
WHERE category = 'costos_indirectos' AND subcategory_indirect IS NULL;

UPDATE expenses 
SET subcategory_direct = 'otros'::direct_cost_subcategory
WHERE category = 'costos_directos' AND subcategory_direct IS NULL;

-- Add constraints to ensure proper subcategory usage
ALTER TABLE expenses 
ADD CONSTRAINT check_subcategory_usage 
CHECK (
  (category = 'costos_directos' AND subcategory_direct IS NOT NULL AND subcategory_indirect IS NULL) OR
  (category = 'costos_indirectos' AND subcategory_indirect IS NOT NULL AND subcategory_direct IS NULL) OR
  (category IN ('mano_obra', 'imprevistos', 'administracion') AND subcategory_direct IS NULL AND subcategory_indirect IS NULL)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_expenses_category_subcategory ON expenses(category, subcategory_direct, subcategory_indirect);

-- Update existing data - map old categories to new structure
-- This will be handled in a separate data migration script

-- Create migration_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.migration_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  migration_name VARCHAR(255) UNIQUE NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT
);

-- Log the migration
INSERT INTO public.migration_log (migration_name, executed_at, description) 
VALUES (
  '20240101000016_restructure_expense_categories',
  NOW(),
  'Restructured expense categories with hierarchical main categories and subcategories'
) ON CONFLICT (migration_name) DO NOTHING;