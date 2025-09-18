-- Script para actualizar la tabla projects con campos detallados del presupuesto
-- Ejecutar en Supabase SQL Editor

-- Agregar campos de desglose presupuestario a la tabla projects
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS costos_directos_materiales DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS costos_directos_equipos DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS costos_indirectos DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS gastos_administrativos DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS mano_obra_quincenal DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS imprevistos DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS utilidad_esperada DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS fecha_inicio_estimada DATE,
ADD COLUMN IF NOT EXISTS fecha_fin_estimada DATE,
ADD COLUMN IF NOT EXISTS fecha_inicio_real DATE,
ADD COLUMN IF NOT EXISTS fecha_fin_real DATE;

-- Agregar comentarios para documentar los campos
COMMENT ON COLUMN public.projects.costos_directos_materiales IS 'Costos directos de materiales del proyecto';
COMMENT ON COLUMN public.projects.costos_directos_equipos IS 'Costos directos de equipos del proyecto';
COMMENT ON COLUMN public.projects.costos_indirectos IS 'Costos indirectos del proyecto';
COMMENT ON COLUMN public.projects.gastos_administrativos IS 'Gastos administrativos del proyecto';
COMMENT ON COLUMN public.projects.mano_obra_quincenal IS 'Costo de mano de obra por quincena';
COMMENT ON COLUMN public.projects.imprevistos IS 'Presupuesto para imprevistos';
COMMENT ON COLUMN public.projects.utilidad_esperada IS 'Utilidad esperada del proyecto';
COMMENT ON COLUMN public.projects.fecha_inicio_estimada IS 'Fecha estimada de inicio del proyecto';
COMMENT ON COLUMN public.projects.fecha_fin_estimada IS 'Fecha estimada de finalización del proyecto';
COMMENT ON COLUMN public.projects.fecha_inicio_real IS 'Fecha real de inicio del proyecto';
COMMENT ON COLUMN public.projects.fecha_fin_real IS 'Fecha real de finalización del proyecto';

-- Crear función para calcular el presupuesto total automáticamente
CREATE OR REPLACE FUNCTION calculate_total_budget()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcular el presupuesto total sumando todos los componentes
  NEW.budget = COALESCE(NEW.costos_directos_materiales, 0) + 
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

-- Crear vista para facilitar consultas del desglose presupuestario
CREATE OR REPLACE VIEW project_budget_breakdown AS
SELECT 
  p.id,
  p.name,
  p.status,
  p.costos_directos_materiales,
  p.costos_directos_equipos,
  (p.costos_directos_materiales + p.costos_directos_equipos) AS total_costos_directos,
  p.costos_indirectos,
  p.gastos_administrativos,
  p.mano_obra_quincenal,
  p.imprevistos,
  p.utilidad_esperada,
  p.budget AS presupuesto_total,
  p.fecha_inicio_estimada,
  p.fecha_fin_estimada,
  p.fecha_inicio_real,
  p.fecha_fin_real,
  c.name AS cliente_nombre,
  up.full_name AS gerente_nombre
FROM public.projects p
LEFT JOIN public.clients c ON p.client_id = c.id
LEFT JOIN public.user_profiles up ON p.manager_id = up.id;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_projects_budget_components ON public.projects(
  costos_directos_materiales, 
  costos_directos_equipos, 
  costos_indirectos, 
  gastos_administrativos, 
  mano_obra_quincenal, 
  imprevistos, 
  utilidad_esperada
);

CREATE INDEX IF NOT EXISTS idx_projects_dates ON public.projects(
  fecha_inicio_estimada, 
  fecha_fin_estimada, 
  fecha_inicio_real, 
  fecha_fin_real
);

-- Verificar la estructura actualizada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Mensaje de confirmación
SELECT 'Esquema de projects actualizado exitosamente con campos de desglose presupuestario' AS resultado;