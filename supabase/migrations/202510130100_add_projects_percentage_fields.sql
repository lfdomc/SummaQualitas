-- Migration: Add percentage fields required by ProjectForm to public.projects
-- Created on: 2025-10-13
-- Purpose: Persist percentage breakdown values used by the UI

BEGIN;

-- Costos directos porcentaje (0-100)
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS costos_directos_porcentaje NUMERIC(5,2) NOT NULL DEFAULT 0
  CHECK (costos_directos_porcentaje >= 0 AND costos_directos_porcentaje <= 100);
COMMENT ON COLUMN public.projects.costos_directos_porcentaje IS 'Porcentaje de costos directos (0-100)';

-- Costos indirectos porcentaje (0-100)
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS costos_indirectos_porcentaje NUMERIC(5,2) NOT NULL DEFAULT 0
  CHECK (costos_indirectos_porcentaje >= 0 AND costos_indirectos_porcentaje <= 100);
COMMENT ON COLUMN public.projects.costos_indirectos_porcentaje IS 'Porcentaje de costos indirectos (0-100)';

-- Mano de obra porcentaje (0-100)
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS mano_obra_porcentaje NUMERIC(5,2) NOT NULL DEFAULT 0
  CHECK (mano_obra_porcentaje >= 0 AND mano_obra_porcentaje <= 100);
COMMENT ON COLUMN public.projects.mano_obra_porcentaje IS 'Porcentaje de mano de obra (0-100)';

-- Administración porcentaje (0-100)
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS administracion_porcentaje NUMERIC(5,2) NOT NULL DEFAULT 0
  CHECK (administracion_porcentaje >= 0 AND administracion_porcentaje <= 100);
COMMENT ON COLUMN public.projects.administracion_porcentaje IS 'Porcentaje de administración (0-100)';

-- Imprevistos porcentaje (0-100)
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS imprevistos_porcentaje NUMERIC(5,2) NOT NULL DEFAULT 0
  CHECK (imprevistos_porcentaje >= 0 AND imprevistos_porcentaje <= 100);
COMMENT ON COLUMN public.projects.imprevistos_porcentaje IS 'Porcentaje de imprevistos (0-100)';

-- Utilidad porcentaje (0-100)
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS utilidad_porcentaje NUMERIC(5,2) NOT NULL DEFAULT 0
  CHECK (utilidad_porcentaje >= 0 AND utilidad_porcentaje <= 100);
COMMENT ON COLUMN public.projects.utilidad_porcentaje IS 'Porcentaje de utilidad (0-100)';

COMMIT;