-- ========================================
-- MIGRACIÓN DEFINITIVA: Agregar columna exchange_rate_usd
-- ========================================
-- 
-- INSTRUCCIONES:
-- 1. Ve a https://app.supabase.com/
-- 2. Selecciona tu proyecto
-- 3. Ve a "SQL Editor" 
-- 4. Copia y pega este SQL completo
-- 5. Haz clic en "Run" para ejecutar
-- 
-- ========================================

-- Agregar columna exchange_rate_usd a la tabla projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS exchange_rate_usd DECIMAL(10,2) DEFAULT 520.00;

-- Agregar comentario descriptivo
COMMENT ON COLUMN projects.exchange_rate_usd IS 'Tipo de cambio USD/CRC al momento del contrato';

-- Actualizar todos los proyectos existentes con el valor por defecto
UPDATE projects 
SET exchange_rate_usd = 520.00 
WHERE exchange_rate_usd IS NULL;

-- Verificar que la columna se agregó correctamente
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name = 'exchange_rate_usd';

-- Mostrar algunos proyectos con la nueva columna
SELECT 
    id, 
    name, 
    exchange_rate_usd,
    created_at
FROM projects 
LIMIT 5;

-- ========================================
-- RESULTADO ESPERADO:
-- - La columna exchange_rate_usd debe aparecer en la consulta de verificación
-- - Todos los proyectos deben tener exchange_rate_usd = 520.00
-- - La página de reportes debe funcionar sin errores
-- ========================================