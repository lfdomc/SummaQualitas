-- Migration: Add new fields to projects to support full Nuevo Proyecto form
-- Date: 2025-10-13

BEGIN;

-- 1) Ensure enums or constraints for status support Spanish values
DO $$
BEGIN
  -- Create enum if not exists (skip if already present)
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'project_status'
  ) THEN
    CREATE TYPE project_status AS ENUM ('planificacion', 'en_progreso', 'pausado', 'completado', 'cancelado');
  END IF;
END $$;

-- 2) Add manager_id referencing public.user_profiles(id)
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- 3) Add location and area/exchange rate fields
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS total_area DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exchange_rate_usd DECIMAL(10,2) DEFAULT 520.00;

COMMENT ON COLUMN public.projects.total_area IS 'Área total del proyecto en m²';
COMMENT ON COLUMN public.projects.exchange_rate_usd IS 'Tipo de cambio CRC a USD';

-- 4) Add dates (estimated and actual)
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS estimated_start_date DATE,
  ADD COLUMN IF NOT EXISTS estimated_end_date DATE,
  ADD COLUMN IF NOT EXISTS actual_start_date DATE,
  ADD COLUMN IF NOT EXISTS actual_end_date DATE;

-- 5) Add budget breakdown fields (if not present)
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS presupuesto_inicial NUMERIC(18,2),
  ADD COLUMN IF NOT EXISTS presupuesto_original NUMERIC(18,2),
  ADD COLUMN IF NOT EXISTS presupuesto_final NUMERIC(18,2),
  ADD COLUMN IF NOT EXISTS costos_directos NUMERIC(18,2),
  ADD COLUMN IF NOT EXISTS costos_indirectos NUMERIC(18,2),
  ADD COLUMN IF NOT EXISTS mano_obra NUMERIC(18,2),
  ADD COLUMN IF NOT EXISTS administracion NUMERIC(18,2),
  ADD COLUMN IF NOT EXISTS imprevistos NUMERIC(18,2),
  ADD COLUMN IF NOT EXISTS utilidad NUMERIC(18,2);

-- 6) Backfill presupuesto_original from budget if NULL
UPDATE public.projects
SET presupuesto_original = budget
WHERE presupuesto_original IS NULL AND budget IS NOT NULL;

-- 7) Enforce NOT NULL and > 0 constraints for presupuesto_original
DO $$
BEGIN
  -- only set NOT NULL if all rows have value
  IF EXISTS (
    SELECT 1 FROM public.projects WHERE presupuesto_original IS NULL
  ) THEN
    RAISE NOTICE 'presupuesto_original still has NULL values, skipping NOT NULL constraint';
  ELSE
    ALTER TABLE public.projects ALTER COLUMN presupuesto_original SET NOT NULL;

    -- Agregar constraint solo si no existe
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'presupuesto_original_positive'
        AND conrelid = 'public.projects'::regclass
    ) THEN
      ALTER TABLE public.projects ADD CONSTRAINT presupuesto_original_positive CHECK (presupuesto_original > 0);
    ELSE
      RAISE NOTICE 'Constraint presupuesto_original_positive already exists, skipping';
    END IF;
  END IF;
END $$;

-- 8) Create helpful indexes
CREATE INDEX IF NOT EXISTS idx_projects_manager_id ON public.projects(manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_client_manager_created_at ON public.projects(client_id, created_at DESC, manager_id);

COMMIT;