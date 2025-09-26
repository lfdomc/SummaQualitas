-- =====================================================
-- SCRIPT PARA AGREGAR COLUMNAS A LA TABLA PROJECTS
-- =====================================================
-- Ejecutar este script en el SQL Editor de Supabase
-- Dashboard > SQL Editor > New Query

-- Columnas básicas del proyecto
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS manager_id UUID;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS total_area DECIMAL(10,2);

-- Columnas de presupuesto
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS presupuesto_inicial DECIMAL(15,2) DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS costos_directos DECIMAL(15,2) DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS costos_indirectos DECIMAL(15,2) DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS mano_obra DECIMAL(15,2) DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS administracion DECIMAL(15,2) DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS imprevistos DECIMAL(15,2) DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS utilidad DECIMAL(15,2) DEFAULT 0;

-- Columnas de fechas
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS estimated_start_date DATE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS estimated_end_date DATE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS actual_start_date DATE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS actual_end_date DATE;

-- Hacer client_id opcional (remover restricción NOT NULL)
ALTER TABLE public.projects ALTER COLUMN client_id DROP NOT NULL;

-- Agregar comentarios a las columnas
COMMENT ON COLUMN public.projects.description IS 'Descripción del proyecto';
COMMENT ON COLUMN public.projects.manager_id IS 'ID del gerente del proyecto';
COMMENT ON COLUMN public.projects.location IS 'Ubicación del proyecto';
COMMENT ON COLUMN public.projects.total_area IS 'Área total del proyecto en m²';
COMMENT ON COLUMN public.projects.presupuesto_inicial IS 'Presupuesto inicial del proyecto';
COMMENT ON COLUMN public.projects.costos_directos IS 'Costos directos del proyecto';
COMMENT ON COLUMN public.projects.costos_indirectos IS 'Costos indirectos del proyecto';
COMMENT ON COLUMN public.projects.mano_obra IS 'Costos de mano de obra';
COMMENT ON COLUMN public.projects.administracion IS 'Costos de administración';
COMMENT ON COLUMN public.projects.imprevistos IS 'Costos de imprevistos';
COMMENT ON COLUMN public.projects.utilidad IS 'Utilidad esperada del proyecto';
COMMENT ON COLUMN public.projects.estimated_start_date IS 'Fecha estimada de inicio';
COMMENT ON COLUMN public.projects.estimated_end_date IS 'Fecha estimada de finalización';
COMMENT ON COLUMN public.projects.actual_start_date IS 'Fecha real de inicio';
COMMENT ON COLUMN public.projects.actual_end_date IS 'Fecha real de finalización';

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_manager_id ON public.projects(manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_estimated_start_date ON public.projects(estimated_start_date);
CREATE INDEX IF NOT EXISTS idx_projects_estimated_end_date ON public.projects(estimated_end_date);

-- Verificar el esquema final
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
  AND table_schema = 'public'
ORDER BY ordinal_position;