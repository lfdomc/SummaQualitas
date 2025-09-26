-- ========================================
-- MIGRACIÓN: Agregar columna exchange_rate_usd a la tabla expenses
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

-- Agregar columna exchange_rate_usd a la tabla expenses
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS exchange_rate_usd DECIMAL(10,4);

-- Agregar comentario descriptivo
COMMENT ON COLUMN expenses.exchange_rate_usd IS 'Tipo de cambio USD/CRC utilizado para la conversión de moneda';

-- Actualizar gastos existentes con un valor por defecto basado en la fecha
-- (Usaremos 520 como valor por defecto para gastos existentes)
UPDATE expenses 
SET exchange_rate_usd = 520.00 
WHERE exchange_rate_usd IS NULL AND currency = 'USD';

-- Para gastos en CRC, podemos dejar el campo como NULL o usar 1
UPDATE expenses 
SET exchange_rate_usd = 1.00 
WHERE exchange_rate_usd IS NULL AND currency = 'CRC';

-- Verificar que la columna se agregó correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'expenses' 
AND column_name = 'exchange_rate_usd';

-- Mostrar algunos gastos con la nueva columna
SELECT 
    id, 
    description,
    amount,
    currency,
    exchange_rate_usd,
    expense_date,
    created_at
FROM expenses 
ORDER BY created_at DESC
LIMIT 5;

-- ========================================
-- RESULTADO ESPERADO:
-- - La columna exchange_rate_usd debe aparecer en la consulta de verificación
-- - Los gastos en USD deben tener exchange_rate_usd = 520.00
-- - Los gastos en CRC deben tener exchange_rate_usd = 1.00
-- - La página de gastos debe funcionar sin errores de columna faltante
-- ========================================