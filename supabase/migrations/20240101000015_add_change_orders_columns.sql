-- =====================================================
-- MIGRACIÓN: AGREGAR COLUMNAS FALTANTES A CHANGE_ORDERS
-- =====================================================
-- Esta migración agrega las columnas necesarias para el manejo
-- completo de órdenes de cambio incluyendo impactos y comentarios
-- =====================================================

-- Agregar columnas de diseño y costos
ALTER TABLE change_orders 
ADD COLUMN IF NOT EXISTS designer VARCHAR(255),
ADD COLUMN IF NOT EXISTS cost_impact DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(10,4) DEFAULT 520.0000,
ADD COLUMN IF NOT EXISTS cost_impact_crc DECIMAL(15,2) DEFAULT 0;

-- Agregar columnas de impacto en cronograma
ALTER TABLE change_orders 
ADD COLUMN IF NOT EXISTS schedule_impact_days INTEGER DEFAULT 0;

-- Agregar columnas de niveles de impacto
ALTER TABLE change_orders 
ADD COLUMN IF NOT EXISTS cost_impact_level VARCHAR(20) DEFAULT 'bajo' CHECK (cost_impact_level IN ('bajo', 'medio', 'alto')),
ADD COLUMN IF NOT EXISTS quality_impact_level VARCHAR(20) DEFAULT 'bajo' CHECK (quality_impact_level IN ('bajo', 'medio', 'alto')),
ADD COLUMN IF NOT EXISTS schedule_impact_level VARCHAR(20) DEFAULT 'bajo' CHECK (schedule_impact_level IN ('bajo', 'medio', 'alto')),
ADD COLUMN IF NOT EXISTS risk_impact_level VARCHAR(20) DEFAULT 'bajo' CHECK (risk_impact_level IN ('bajo', 'medio', 'alto'));

-- Agregar columnas de comentarios detallados
ALTER TABLE change_orders 
ADD COLUMN IF NOT EXISTS cost_comments TEXT,
ADD COLUMN IF NOT EXISTS quality_comments TEXT,
ADD COLUMN IF NOT EXISTS schedule_comments TEXT,
ADD COLUMN IF NOT EXISTS risk_comments TEXT,
ADD COLUMN IF NOT EXISTS general_comments TEXT;

-- Crear función para calcular automáticamente cost_impact_crc
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

-- Crear trigger para calcular automáticamente cost_impact_crc
DROP TRIGGER IF EXISTS trigger_calculate_cost_impact_crc ON change_orders;
CREATE TRIGGER trigger_calculate_cost_impact_crc
    BEFORE INSERT OR UPDATE ON change_orders
    FOR EACH ROW
    EXECUTE FUNCTION calculate_cost_impact_crc();

-- Actualizar registros existentes para calcular cost_impact_crc
UPDATE change_orders 
SET cost_impact_crc = CASE 
    WHEN currency = 'CRC' THEN COALESCE(cost_impact, amount)
    ELSE COALESCE(cost_impact, amount) * COALESCE(exchange_rate, 520.0000)
END
WHERE cost_impact_crc IS NULL OR cost_impact_crc = 0;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_change_orders_designer ON change_orders(designer);
CREATE INDEX IF NOT EXISTS idx_change_orders_cost_impact_level ON change_orders(cost_impact_level);
CREATE INDEX IF NOT EXISTS idx_change_orders_schedule_impact_level ON change_orders(schedule_impact_level);
CREATE INDEX IF NOT EXISTS idx_change_orders_currency ON change_orders(currency);

-- Comentarios para documentar las columnas
COMMENT ON COLUMN change_orders.designer IS 'Nombre del diseñador responsable de la orden de cambio';
COMMENT ON COLUMN change_orders.cost_impact IS 'Impacto financiero en la moneda original';
COMMENT ON COLUMN change_orders.cost_impact_crc IS 'Impacto financiero calculado en colones costarricenses';
COMMENT ON COLUMN change_orders.exchange_rate IS 'Tipo de cambio utilizado para conversión a CRC';
COMMENT ON COLUMN change_orders.schedule_impact_days IS 'Impacto en cronograma expresado en días';
COMMENT ON COLUMN change_orders.cost_impact_level IS 'Nivel de impacto en costos: bajo, medio, alto';
COMMENT ON COLUMN change_orders.quality_impact_level IS 'Nivel de impacto en calidad: bajo, medio, alto';
COMMENT ON COLUMN change_orders.schedule_impact_level IS 'Nivel de impacto en cronograma: bajo, medio, alto';
COMMENT ON COLUMN change_orders.risk_impact_level IS 'Nivel de impacto en riesgo: bajo, medio, alto';
COMMENT ON COLUMN change_orders.cost_comments IS 'Comentarios detallados sobre el impacto en costos';
COMMENT ON COLUMN change_orders.quality_comments IS 'Comentarios detallados sobre el impacto en calidad';
COMMENT ON COLUMN change_orders.schedule_comments IS 'Comentarios detallados sobre el impacto en cronograma';
COMMENT ON COLUMN change_orders.risk_comments IS 'Comentarios detallados sobre el impacto en riesgo';
COMMENT ON COLUMN change_orders.general_comments IS 'Comentarios generales sobre la orden de cambio';