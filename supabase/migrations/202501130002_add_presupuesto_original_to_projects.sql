-- Migration: Add presupuesto_original column to projects and backfill from budget
-- Purpose: Align database with application expecting presupuesto_original
-- Safe steps: add column as nullable, backfill values from budget, then enforce NOT NULL and > 0 constraint

BEGIN;

-- 1) Add the column as NULLABLE first
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS presupuesto_original DECIMAL(15,2);

-- 2) Backfill from existing budget values
UPDATE projects
  SET presupuesto_original = budget
  WHERE presupuesto_original IS NULL;

-- 3) Enforce NOT NULL constraint now that values are populated
ALTER TABLE projects
  ALTER COLUMN presupuesto_original SET NOT NULL;

-- 4) Add CHECK constraint to ensure positive values (mirrors budget > 0)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'projects_presupuesto_original_check'
  ) THEN
    ALTER TABLE projects
      ADD CONSTRAINT projects_presupuesto_original_check CHECK (presupuesto_original > 0);
  END IF;
END$$;

-- 5) Ensure new inserts populate presupuesto_original from budget if not provided
CREATE OR REPLACE FUNCTION set_presupuesto_original_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.presupuesto_original IS NULL THEN
    NEW.presupuesto_original := NEW.budget;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_presupuesto_original ON projects;
CREATE TRIGGER trg_set_presupuesto_original
BEFORE INSERT ON projects
FOR EACH ROW
EXECUTE FUNCTION set_presupuesto_original_on_insert();
COMMIT;