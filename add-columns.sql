-- Script para agregar columnas faltantes a la tabla projects
-- Ejecutar este script en el panel de Supabase > SQL Editor

-- Agregar columnas de costos que el código espera
ALTER TABLE projects ADD COLUMN IF NOT EXISTS costos_directos_materiales DECIMAL(15,2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS costos_directos_equipos DECIMAL(15,2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS costos_indirectos DECIMAL(15,2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS gastos_administrativos DECIMAL(15,2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS mano_obra_quincenal DECIMAL(15,2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS imprevistos DECIMAL(15,2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS utilidad_esperada DECIMAL(15,2) DEFAULT 0;

-- Agregar columnas de presupuesto
ALTER TABLE projects ADD COLUMN IF NOT EXISTS presupuesto_inicial DECIMAL(15,2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS presupuesto_original DECIMAL(15,2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS presupuesto_final DECIMAL(15,2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget DECIMAL(15,2) DEFAULT 0;

-- Agregar columnas de fechas
ALTER TABLE projects ADD COLUMN IF NOT EXISTS estimated_start_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS estimated_end_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS actual_start_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS actual_end_date DATE;

-- Agregar otras columnas necesarias
ALTER TABLE projects ADD COLUMN IF NOT EXISTS total_area DECIMAL(10,2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS exchange_rate_usd DECIMAL(10,4) DEFAULT 500.0000;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS created_by UUID;

-- Agregar índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_dates ON projects(estimated_start_date, estimated_end_date);

-- Verificar que las columnas se agregaron correctamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND table_schema = 'public'
AND column_name IN (
  'costos_directos_materiales', 'costos_directos_equipos', 'costos_indirectos', 
  'gastos_administrativos', 'mano_obra_quincenal', 'imprevistos', 'utilidad_esperada',
  'presupuesto_inicial', 'presupuesto_original', 'presupuesto_final', 'budget',
  'estimated_start_date', 'estimated_end_date', 'actual_start_date', 'actual_end_date',
  'total_area', 'exchange_rate_usd', 'created_by'
)
ORDER BY column_name;