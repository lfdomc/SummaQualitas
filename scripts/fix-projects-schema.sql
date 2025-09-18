-- Script para corregir la tabla projects con los nombres de columnas correctos en inglés
-- Ejecutar en Supabase SQL Editor

-- Primero, eliminar la vista que depende de las columnas en español
DROP VIEW IF EXISTS project_budget_breakdown CASCADE;

-- Eliminar las columnas en español si existen
ALTER TABLE public.projects 
DROP COLUMN IF EXISTS fecha_inicio_estimada CASCADE,
DROP COLUMN IF EXISTS fecha_fin_estimada CASCADE,
DROP COLUMN IF EXISTS fecha_inicio_real CASCADE,
DROP COLUMN IF EXISTS fecha_fin_real CASCADE;

-- Agregar las columnas con nombres en inglés que coinciden con el esquema
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS estimated_start_date DATE,
ADD COLUMN IF NOT EXISTS estimated_end_date DATE,
ADD COLUMN IF NOT EXISTS actual_start_date DATE,
ADD COLUMN IF NOT EXISTS actual_end_date DATE;

-- Agregar campos de presupuesto si no existen
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS presupuesto_inicial DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS costos_directos_materiales DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS costos_directos_equipos DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS costos_indirectos DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS gastos_administrativos DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS mano_obra_quincenal DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS imprevistos DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS utilidad_esperada DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS exchange_rate_usd DECIMAL(10,2) DEFAULT 520.00,
ADD COLUMN IF NOT EXISTS total_area DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS location TEXT;

-- Agregar comentarios para documentar los campos
COMMENT ON COLUMN public.projects.estimated_start_date IS 'Fecha estimada de inicio del proyecto';
COMMENT ON COLUMN public.projects.estimated_end_date IS 'Fecha estimada de finalización del proyecto';
COMMENT ON COLUMN public.projects.actual_start_date IS 'Fecha real de inicio del proyecto';
COMMENT ON COLUMN public.projects.actual_end_date IS 'Fecha real de finalización del proyecto';
COMMENT ON COLUMN public.projects.presupuesto_inicial IS 'Presupuesto inicial del proyecto en colones';
COMMENT ON COLUMN public.projects.costos_directos_materiales IS 'Costos directos de materiales del proyecto';
COMMENT ON COLUMN public.projects.costos_directos_equipos IS 'Costos directos de equipos del proyecto';
COMMENT ON COLUMN public.projects.costos_indirectos IS 'Costos indirectos del proyecto';
COMMENT ON COLUMN public.projects.gastos_administrativos IS 'Gastos administrativos del proyecto';
COMMENT ON COLUMN public.projects.mano_obra_quincenal IS 'Costo de mano de obra por quincena';
COMMENT ON COLUMN public.projects.imprevistos IS 'Presupuesto para imprevistos';
COMMENT ON COLUMN public.projects.utilidad_esperada IS 'Utilidad esperada del proyecto';
COMMENT ON COLUMN public.projects.exchange_rate_usd IS 'Tipo de cambio USD/CRC al momento del contrato';
COMMENT ON COLUMN public.projects.total_area IS 'Área total del proyecto en metros cuadrados';
COMMENT ON COLUMN public.projects.location IS 'Ubicación del proyecto';

-- Crear función para calcular el presupuesto total automáticamente
CREATE OR REPLACE FUNCTION calculate_total_budget()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcular el presupuesto total sumando todos los componentes
  NEW.presupuesto_inicial = COALESCE(NEW.costos_directos_materiales, 0) + 
                            COALESCE(NEW.costos_directos_equipos, 0) + 
                            COALESCE(NEW.costos_indirectos, 0) + 
                            COALESCE(NEW.gastos_administrativos, 0) + 
                            COALESCE(NEW.mano_obra_quincenal, 0) + 
                            COALESCE(NEW.imprevistos, 0) + 
                            COALESCE(NEW.utilidad_esperada, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para calcular automáticamente el presupuesto total
DROP TRIGGER IF EXISTS trigger_calculate_total_budget ON public.projects;
CREATE TRIGGER trigger_calculate_total_budget
  BEFORE INSERT OR UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION calculate_total_budget();

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_projects_dates_english ON public.projects(
  estimated_start_date, 
  estimated_end_date, 
  actual_start_date, 
  actual_end_date
);

-- Recrear la vista project_budget_breakdown con los nombres correctos en inglés
CREATE VIEW public.project_budget_breakdown AS
SELECT 
    id,
    name,
    location,
    estimated_start_date,
    estimated_end_date,
    actual_start_date,
    actual_end_date,
    presupuesto_inicial,
    costos_directos_materiales,
    costos_directos_equipos,
    costos_indirectos,
    gastos_administrativos,
    mano_obra_quincenal,
    imprevistos,
    utilidad_esperada,
    exchange_rate_usd,
    total_area,
    (costos_directos_materiales + costos_directos_equipos + costos_indirectos + gastos_administrativos + mano_obra_quincenal + imprevistos + utilidad_esperada) AS presupuesto_calculado,
    CASE 
        WHEN total_area > 0 THEN presupuesto_inicial / total_area 
        ELSE 0 
    END AS costo_por_metro_cuadrado
FROM public.projects;

-- Verificar la estructura actualizada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND table_schema = 'public'
AND column_name IN ('estimated_start_date', 'estimated_end_date', 'actual_start_date', 'actual_end_date', 'presupuesto_inicial')
ORDER BY ordinal_position;

-- Mensaje de confirmación
SELECT 'Esquema de projects corregido exitosamente con nombres de columnas en inglés' AS resultado;