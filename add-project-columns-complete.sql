-- Script SQL completo para agregar todas las columnas necesarias a la tabla projects
-- Incluye campos básicos, presupuesto detallado por porcentajes, fechas y tipo de cambio
-- Ejecutar en el editor SQL de Supabase

-- 1. Primero, verificar y crear el tipo ENUM para project_status si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
        CREATE TYPE project_status AS ENUM (
            'planificacion',
            'en_progreso', 
            'pausado',
            'completado',
            'cancelado'
        );
    ELSE
        -- Si existe, actualizar con todos los valores necesarios
        ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'planificacion';
        ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'en_progreso';
        ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'pausado';
        ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'completado';
        ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'cancelado';
    END IF;
END $$;

-- 2. Agregar columnas básicas del proyecto
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS total_area DECIMAL(10,2);

-- 3. Agregar columnas de presupuesto inicial
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS presupuesto_inicial DECIMAL(15,2) DEFAULT 0;

-- 4. Agregar columnas de desglose presupuestario por categorías (montos)
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS costos_directos DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS costos_indirectos DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS mano_obra DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS administracion DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS imprevistos DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS utilidad DECIMAL(15,2) DEFAULT 0;

-- 5. Agregar columnas de desglose presupuestario por porcentajes
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS costos_directos_porcentaje DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS costos_indirectos_porcentaje DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS mano_obra_porcentaje DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS administracion_porcentaje DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS imprevistos_porcentaje DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS utilidad_porcentaje DECIMAL(5,2) DEFAULT 0;

-- 6. Agregar columnas adicionales de presupuesto que aparecen en otros componentes
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS mano_obra_quincenal DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS utilidad_esperada DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS direct_cost DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS equipos DECIMAL(15,2) DEFAULT 0;

-- 7. Agregar columnas de fechas del proyecto
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS estimated_start_date DATE,
ADD COLUMN IF NOT EXISTS estimated_end_date DATE,
ADD COLUMN IF NOT EXISTS actual_start_date DATE,
ADD COLUMN IF NOT EXISTS actual_end_date DATE;

-- 8. Asegurar que la columna exchange_rate_usd existe y tiene un valor por defecto
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS exchange_rate_usd DECIMAL(10,4) DEFAULT 520.0000;

-- 9. Hacer que client_id sea opcional (nullable)
ALTER TABLE projects 
ALTER COLUMN client_id DROP NOT NULL;

-- 10. Actualizar la columna status para usar el ENUM
ALTER TABLE projects 
ALTER COLUMN status TYPE project_status USING status::project_status;

-- 11. Agregar comentarios a la tabla y columnas para documentación
COMMENT ON TABLE projects IS 'Tabla principal de proyectos de construcción con presupuesto detallado';

-- Comentarios para columnas básicas
COMMENT ON COLUMN projects.name IS 'Nombre del proyecto';
COMMENT ON COLUMN projects.description IS 'Descripción detallada del proyecto';
COMMENT ON COLUMN projects.client_id IS 'ID del cliente (opcional)';
COMMENT ON COLUMN projects.manager_id IS 'ID del gerente/responsable del proyecto';
COMMENT ON COLUMN projects.status IS 'Estado actual del proyecto';
COMMENT ON COLUMN projects.location IS 'Ubicación física del proyecto';
COMMENT ON COLUMN projects.total_area IS 'Área total del proyecto en metros cuadrados';
COMMENT ON COLUMN projects.exchange_rate_usd IS 'Tipo de cambio USD a moneda local';

-- Comentarios para presupuesto
COMMENT ON COLUMN projects.presupuesto_inicial IS 'Presupuesto inicial total del proyecto';
COMMENT ON COLUMN projects.costos_directos IS 'Monto asignado a costos directos';
COMMENT ON COLUMN projects.costos_indirectos IS 'Monto asignado a costos indirectos';
COMMENT ON COLUMN projects.mano_obra IS 'Monto asignado a mano de obra';
COMMENT ON COLUMN projects.administracion IS 'Monto asignado a administración';
COMMENT ON COLUMN projects.imprevistos IS 'Monto asignado a imprevistos';
COMMENT ON COLUMN projects.utilidad IS 'Monto asignado a utilidad';

-- Comentarios para porcentajes
COMMENT ON COLUMN projects.costos_directos_porcentaje IS 'Porcentaje del presupuesto para costos directos';
COMMENT ON COLUMN projects.costos_indirectos_porcentaje IS 'Porcentaje del presupuesto para costos indirectos';
COMMENT ON COLUMN projects.mano_obra_porcentaje IS 'Porcentaje del presupuesto para mano de obra';
COMMENT ON COLUMN projects.administracion_porcentaje IS 'Porcentaje del presupuesto para administración';
COMMENT ON COLUMN projects.imprevistos_porcentaje IS 'Porcentaje del presupuesto para imprevistos';
COMMENT ON COLUMN projects.utilidad_porcentaje IS 'Porcentaje del presupuesto para utilidad';

-- Comentarios para campos adicionales
COMMENT ON COLUMN projects.mano_obra_quincenal IS 'Costo quincenal de mano de obra';
COMMENT ON COLUMN projects.utilidad_esperada IS 'Utilidad esperada del proyecto';
COMMENT ON COLUMN projects.direct_cost IS 'Costo directo total';
COMMENT ON COLUMN projects.equipos IS 'Costo de equipos';

-- Comentarios para fechas
COMMENT ON COLUMN projects.estimated_start_date IS 'Fecha estimada de inicio';
COMMENT ON COLUMN projects.estimated_end_date IS 'Fecha estimada de finalización';
COMMENT ON COLUMN projects.actual_start_date IS 'Fecha real de inicio';
COMMENT ON COLUMN projects.actual_end_date IS 'Fecha real de finalización';

-- 12. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_projects_manager_id ON projects(manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_estimated_dates ON projects(estimated_start_date, estimated_end_date);
CREATE INDEX IF NOT EXISTS idx_projects_actual_dates ON projects(actual_start_date, actual_end_date);
CREATE INDEX IF NOT EXISTS idx_projects_location ON projects(location);

-- 13. Crear función para validar que los porcentajes sumen 100%
CREATE OR REPLACE FUNCTION validate_budget_percentages()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo validar si al menos uno de los porcentajes no es 0
    IF (NEW.costos_directos_porcentaje + NEW.costos_indirectos_porcentaje + 
        NEW.mano_obra_porcentaje + NEW.administracion_porcentaje + 
        NEW.imprevistos_porcentaje + NEW.utilidad_porcentaje) > 0 THEN
        
        -- Verificar que la suma sea aproximadamente 100% (permitir pequeñas diferencias por redondeo)
        IF ABS((NEW.costos_directos_porcentaje + NEW.costos_indirectos_porcentaje + 
                NEW.mano_obra_porcentaje + NEW.administracion_porcentaje + 
                NEW.imprevistos_porcentaje + NEW.utilidad_porcentaje) - 100) > 0.01 THEN
            RAISE EXCEPTION 'Los porcentajes del presupuesto deben sumar 100%%. Suma actual: %', 
                (NEW.costos_directos_porcentaje + NEW.costos_indirectos_porcentaje + 
                 NEW.mano_obra_porcentaje + NEW.administracion_porcentaje + 
                 NEW.imprevistos_porcentaje + NEW.utilidad_porcentaje);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 14. Crear trigger para validar porcentajes (opcional - comentado por defecto)
-- DROP TRIGGER IF EXISTS trigger_validate_budget_percentages ON projects;
-- CREATE TRIGGER trigger_validate_budget_percentages
--     BEFORE INSERT OR UPDATE ON projects
--     FOR EACH ROW
--     EXECUTE FUNCTION validate_budget_percentages();

-- 15. Función para sincronizar montos con porcentajes
CREATE OR REPLACE FUNCTION sync_budget_amounts()
RETURNS TRIGGER AS $$
BEGIN
    -- Si se actualiza el presupuesto inicial y hay porcentajes definidos, recalcular montos
    IF NEW.presupuesto_inicial IS NOT NULL AND NEW.presupuesto_inicial > 0 THEN
        IF (NEW.costos_directos_porcentaje + NEW.costos_indirectos_porcentaje + 
            NEW.mano_obra_porcentaje + NEW.administracion_porcentaje + 
            NEW.imprevistos_porcentaje + NEW.utilidad_porcentaje) > 0 THEN
            
            NEW.costos_directos := ROUND((NEW.presupuesto_inicial * NEW.costos_directos_porcentaje / 100), 2);
            NEW.costos_indirectos := ROUND((NEW.presupuesto_inicial * NEW.costos_indirectos_porcentaje / 100), 2);
            NEW.mano_obra := ROUND((NEW.presupuesto_inicial * NEW.mano_obra_porcentaje / 100), 2);
            NEW.administracion := ROUND((NEW.presupuesto_inicial * NEW.administracion_porcentaje / 100), 2);
            NEW.imprevistos := ROUND((NEW.presupuesto_inicial * NEW.imprevistos_porcentaje / 100), 2);
            NEW.utilidad := ROUND((NEW.presupuesto_inicial * NEW.utilidad_porcentaje / 100), 2);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 16. Crear trigger para sincronizar montos (opcional - comentado por defecto)
-- DROP TRIGGER IF EXISTS trigger_sync_budget_amounts ON projects;
-- CREATE TRIGGER trigger_sync_budget_amounts
--     BEFORE INSERT OR UPDATE ON projects
--     FOR EACH ROW
--     EXECUTE FUNCTION sync_budget_amounts();

-- 17. Insertar valores por defecto para porcentajes si no existen
UPDATE projects 
SET 
    costos_directos_porcentaje = COALESCE(costos_directos_porcentaje, 40),
    costos_indirectos_porcentaje = COALESCE(costos_indirectos_porcentaje, 20),
    mano_obra_porcentaje = COALESCE(mano_obra_porcentaje, 25),
    administracion_porcentaje = COALESCE(administracion_porcentaje, 8),
    imprevistos_porcentaje = COALESCE(imprevistos_porcentaje, 5),
    utilidad_porcentaje = COALESCE(utilidad_porcentaje, 2),
    exchange_rate_usd = COALESCE(exchange_rate_usd, 520.0000)
WHERE 
    costos_directos_porcentaje = 0 AND 
    costos_indirectos_porcentaje = 0 AND 
    mano_obra_porcentaje = 0 AND 
    administracion_porcentaje = 0 AND 
    imprevistos_porcentaje = 0 AND 
    utilidad_porcentaje = 0;

-- 18. Verificación final - mostrar estructura de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'projects' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Script completado exitosamente
-- La tabla projects ahora incluye:
-- ✅ Campos básicos (description, manager_id, location, total_area)
-- ✅ Presupuesto inicial y desglose por categorías (montos)
-- ✅ Desglose presupuestario por porcentajes
-- ✅ Campos adicionales de presupuesto (mano_obra_quincenal, utilidad_esperada, etc.)
-- ✅ Fechas del proyecto (estimadas y reales)
-- ✅ Tipo de cambio USD
-- ✅ Validaciones y funciones auxiliares
-- ✅ Índices para rendimiento
-- ✅ Documentación completa