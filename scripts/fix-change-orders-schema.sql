-- =====================================================
-- SCRIPT PARA CORREGIR ESQUEMA DE CHANGE_ORDERS
-- =====================================================
-- Este script agrega las columnas faltantes a la tabla change_orders
-- que no se definieron correctamente en el script original
-- =====================================================

-- Agregar columnas faltantes a la tabla change_orders
ALTER TABLE public.change_orders 
ADD COLUMN IF NOT EXISTS cost_impact DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(10,4) DEFAULT 520.0000,
ADD COLUMN IF NOT EXISTS cost_impact_crc DECIMAL(15,2) DEFAULT 0;

-- Actualizar comentarios para las nuevas columnas
COMMENT ON COLUMN public.change_orders.cost_impact IS 'Impacto monetario base de la orden de cambio';
COMMENT ON COLUMN public.change_orders.exchange_rate IS 'Tipo de cambio USD a CRC utilizado';
COMMENT ON COLUMN public.change_orders.cost_impact_crc IS 'Impacto monetario calculado en colones costarricenses';

-- Crear función para calcular cost_impact_crc automáticamente
CREATE OR REPLACE FUNCTION calculate_cost_impact_crc()
RETURNS TRIGGER AS $$
BEGIN
    -- Si la moneda es USD, calcular el equivalente en CRC
    IF NEW.currency = 'USD' THEN
        NEW.cost_impact_crc = NEW.cost_impact * COALESCE(NEW.exchange_rate, 520.0000);
    ELSE
        -- Si la moneda es CRC, usar el valor directo
        NEW.cost_impact_crc = NEW.cost_impact;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para calcular cost_impact_crc automáticamente
DROP TRIGGER IF EXISTS trigger_calculate_cost_impact_crc ON public.change_orders;
CREATE TRIGGER trigger_calculate_cost_impact_crc
    BEFORE INSERT OR UPDATE ON public.change_orders
    FOR EACH ROW
    EXECUTE FUNCTION calculate_cost_impact_crc();

-- Actualizar registros existentes para calcular cost_impact_crc
UPDATE public.change_orders 
SET 
    cost_impact = COALESCE(cost_impact, 0),
    exchange_rate = COALESCE(exchange_rate, 520.0000),
    cost_impact_crc = CASE 
        WHEN currency = 'USD' THEN COALESCE(cost_impact, 0) * COALESCE(exchange_rate, 520.0000)
        ELSE COALESCE(cost_impact, 0)
    END
WHERE cost_impact_crc = 0 OR cost_impact_crc IS NULL;

-- Verificar que las columnas se agregaron correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'change_orders' 
AND table_schema = 'public'
AND column_name IN ('cost_impact', 'exchange_rate', 'cost_impact_crc')
ORDER BY column_name;

-- Mensaje de confirmación
SELECT 'Esquema de change_orders corregido exitosamente' AS resultado;