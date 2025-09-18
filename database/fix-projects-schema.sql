-- =====================================================
-- SCRIPT PARA CORREGIR ESQUEMA DE PROYECTOS
-- =====================================================
-- Este script corrige la tabla projects para que coincida
-- con los campos esperados por la aplicación frontend
-- =====================================================

-- Primero, eliminamos las columnas en español si existen
ALTER TABLE IF EXISTS public.projects 
DROP COLUMN IF EXISTS fecha_inicio_estimada,
DROP COLUMN IF EXISTS fecha_fin_estimada,
DROP COLUMN IF EXISTS presupuesto_total,
DROP COLUMN IF EXISTS ubicacion;

-- Agregamos las columnas faltantes si no existen
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS exchange_rate_usd DECIMAL(10,2) DEFAULT 520.00,
ADD COLUMN IF NOT EXISTS total_area DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS location TEXT;

-- Agregamos comentarios descriptivos para las nuevas columnas
COMMENT ON COLUMN public.projects.exchange_rate_usd IS 'Tipo de cambio USD/CRC al momento del contrato';
COMMENT ON COLUMN public.projects.total_area IS 'Área total del proyecto en metros cuadrados';
COMMENT ON COLUMN public.projects.location IS 'Ubicación del proyecto';

-- Verificamos que todas las columnas necesarias existan
-- Si alguna no existe, la creamos
DO $$
BEGIN
    -- Verificar y crear columna name si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'name') THEN
        ALTER TABLE public.projects ADD COLUMN name VARCHAR(255) NOT NULL DEFAULT 'Proyecto Sin Nombre';
        COMMENT ON COLUMN public.projects.name IS 'Nombre del proyecto';
    END IF;
    
    -- Verificar y crear columna description si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'description') THEN
        ALTER TABLE public.projects ADD COLUMN description TEXT;
        COMMENT ON COLUMN public.projects.description IS 'Descripción del proyecto';
    END IF;
    
    -- Verificar y crear columna client_id si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'client_id') THEN
        ALTER TABLE public.projects ADD COLUMN client_id UUID REFERENCES clients(id);
        COMMENT ON COLUMN public.projects.client_id IS 'ID del cliente asociado al proyecto';
    END IF;
    
    -- Verificar y crear columna estimated_start_date si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'estimated_start_date') THEN
        ALTER TABLE public.projects ADD COLUMN estimated_start_date DATE;
        COMMENT ON COLUMN public.projects.estimated_start_date IS 'Fecha estimada de inicio del proyecto';
    END IF;
    
    -- Verificar y crear columna estimated_end_date si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'estimated_end_date') THEN
        ALTER TABLE public.projects ADD COLUMN estimated_end_date DATE;
        COMMENT ON COLUMN public.projects.estimated_end_date IS 'Fecha estimada de finalización del proyecto';
    END IF;
    
    -- Verificar y crear columna presupuesto_inicial si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'presupuesto_inicial') THEN
        ALTER TABLE public.projects ADD COLUMN presupuesto_inicial DECIMAL(15,2) DEFAULT 0;
        COMMENT ON COLUMN public.projects.presupuesto_inicial IS 'Presupuesto inicial del proyecto';
    END IF;
    
    -- Verificar y crear columna status si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'status') THEN
        ALTER TABLE public.projects ADD COLUMN status VARCHAR(50) DEFAULT 'planning';
        COMMENT ON COLUMN public.projects.status IS 'Estado actual del proyecto';
    END IF;
END $$;

-- Recrear la vista project_budget_breakdown con todas las columnas
DROP VIEW IF EXISTS public.project_budget_breakdown;

CREATE OR REPLACE VIEW public.project_budget_breakdown AS
SELECT 
    p.id,
    p.name,
    p.description,
    p.client_id,
    p.estimated_start_date,
    p.estimated_end_date,
    p.presupuesto_inicial,
    p.exchange_rate_usd,
    p.total_area,
    p.location,
    p.status,
    p.created_at,
    p.updated_at,
    -- Cálculo del costo por metro cuadrado
    CASE 
        WHEN p.total_area > 0 THEN p.presupuesto_inicial / p.total_area
        ELSE 0
    END as costo_por_metro_cuadrado
FROM public.projects p;

-- Agregar comentario a la vista
COMMENT ON VIEW public.project_budget_breakdown IS 'Vista que incluye todos los campos del proyecto con cálculo de costo por metro cuadrado';

-- Verificar que la tabla tenga los índices necesarios
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_dates ON public.projects(estimated_start_date, estimated_end_date);

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Script de corrección de esquema de proyectos ejecutado exitosamente';
    RAISE NOTICE 'Columnas agregadas: exchange_rate_usd, total_area, location';
    RAISE NOTICE 'Vista project_budget_breakdown recreada con todas las columnas';
    RAISE NOTICE 'Índices creados para optimizar consultas';
END $$;