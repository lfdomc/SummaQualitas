-- =====================================================
-- SCRIPT PARA AGREGAR CAMPOS DE IMPACTO A CHANGE_ORDERS
-- =====================================================
-- Ejecutar este script en el SQL Editor de Supabase Dashboard
-- =====================================================

-- 1. Agregar columnas de impacto financiero
ALTER TABLE public.change_orders 
ADD COLUMN IF NOT EXISTS cost_impact DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(10,4) DEFAULT 520.0000,
ADD COLUMN IF NOT EXISTS cost_impact_crc DECIMAL(15,2) DEFAULT 0;

-- 2. Agregar columna de impacto en cronograma
ALTER TABLE public.change_orders 
ADD COLUMN IF NOT EXISTS schedule_impact_days INTEGER DEFAULT 0;

-- 3. Agregar columnas de niveles de impacto
ALTER TABLE public.change_orders 
ADD COLUMN IF NOT EXISTS cost_impact_level VARCHAR(20) DEFAULT 'bajo' CHECK (cost_impact_level IN ('bajo', 'medio', 'alto')),
ADD COLUMN IF NOT EXISTS schedule_impact_level VARCHAR(20) DEFAULT 'bajo' CHECK (schedule_impact_level IN ('bajo', 'medio', 'alto'));

-- 4. Agregar columnas adicionales útiles
ALTER TABLE public.change_orders 
ADD COLUMN IF NOT EXISTS designer VARCHAR(255),
ADD COLUMN IF NOT EXISTS cost_comments TEXT,
ADD COLUMN IF NOT EXISTS schedule_comments TEXT;

-- 5. Actualizar registros existentes con valores calculados
UPDATE public.change_orders 
SET 
    cost_impact = amount,
    cost_impact_crc = CASE 
        WHEN currency = 'CRC' THEN amount
        ELSE amount * 520.0000
    END,
    schedule_impact_days = CASE 
        WHEN amount > 50000 THEN 30  -- Proyectos grandes: 30 días
        WHEN amount > 20000 THEN 15  -- Proyectos medianos: 15 días
        ELSE 7                       -- Proyectos pequeños: 7 días
    END,
    cost_impact_level = CASE 
        WHEN amount > 50000 THEN 'alto'
        WHEN amount > 20000 THEN 'medio'
        ELSE 'bajo'
    END,
    schedule_impact_level = CASE 
        WHEN amount > 50000 THEN 'alto'
        WHEN amount > 20000 THEN 'medio'
        ELSE 'bajo'
    END
WHERE cost_impact IS NULL OR cost_impact = 0;

-- 6. Crear función para calcular automáticamente cost_impact_crc
CREATE OR REPLACE FUNCTION calculate_cost_impact_crc()
RETURNS TRIGGER AS $$
BEGIN
    -- Si la moneda es CRC, cost_impact_crc = cost_impact
    -- Si la moneda es USD, cost_impact_crc = cost_impact * exchange_rate
    IF NEW.currency = 'CRC' THEN
        NEW.cost_impact_crc = NEW.cost_impact;
    ELSE
        NEW.cost_impact_crc = NEW.cost_impact * COALESCE(NEW.exchange_rate, 520.0000);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Crear trigger para calcular automáticamente cost_impact_crc
DROP TRIGGER IF EXISTS trigger_calculate_cost_impact_crc ON public.change_orders;
CREATE TRIGGER trigger_calculate_cost_impact_crc
    BEFORE INSERT OR UPDATE ON public.change_orders
    FOR EACH ROW
    EXECUTE FUNCTION calculate_cost_impact_crc();

-- 8. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_change_orders_cost_impact_level ON public.change_orders(cost_impact_level);
CREATE INDEX IF NOT EXISTS idx_change_orders_schedule_impact_level ON public.change_orders(schedule_impact_level);
CREATE INDEX IF NOT EXISTS idx_change_orders_currency ON public.change_orders(currency);

-- 9. Agregar comentarios para documentar las columnas
COMMENT ON COLUMN public.change_orders.cost_impact IS 'Impacto financiero en la moneda original';
COMMENT ON COLUMN public.change_orders.cost_impact_crc IS 'Impacto financiero calculado en colones costarricenses';
COMMENT ON COLUMN public.change_orders.exchange_rate IS 'Tipo de cambio utilizado para conversión a CRC';
COMMENT ON COLUMN public.change_orders.schedule_impact_days IS 'Impacto en cronograma expresado en días';
COMMENT ON COLUMN public.change_orders.cost_impact_level IS 'Nivel de impacto en costos: bajo, medio, alto';
COMMENT ON COLUMN public.change_orders.schedule_impact_level IS 'Nivel de impacto en cronograma: bajo, medio, alto';

-- 10. Verificar que los campos se agregaron correctamente
SELECT 
    id,
    title,
    amount,
    currency,
    cost_impact,
    cost_impact_crc,
    schedule_impact_days,
    cost_impact_level,
    schedule_impact_level
FROM public.change_orders 
LIMIT 5;