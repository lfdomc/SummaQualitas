-- =====================================================
-- SCRIPT PARA ACTUALIZAR DATOS DE PRUEBA DE CHANGE_ORDERS
-- =====================================================
-- Este script actualiza la orden de cambio de prueba con datos reales
-- para verificar que los campos se muestren correctamente en la interfaz
-- =====================================================

-- Primero, verificar si las columnas existen y agregarlas si no están
DO $$
BEGIN
    -- Agregar columna cost_impact si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'change_orders' 
                   AND column_name = 'cost_impact') THEN
        ALTER TABLE public.change_orders ADD COLUMN cost_impact DECIMAL(15,2) DEFAULT 0;
    END IF;
    
    -- Agregar columna exchange_rate si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'change_orders' 
                   AND column_name = 'exchange_rate') THEN
        ALTER TABLE public.change_orders ADD COLUMN exchange_rate DECIMAL(10,4) DEFAULT 520.0000;
    END IF;
    
    -- Agregar columna cost_impact_crc si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'change_orders' 
                   AND column_name = 'cost_impact_crc') THEN
        ALTER TABLE public.change_orders ADD COLUMN cost_impact_crc DECIMAL(15,2) DEFAULT 0;
    END IF;
END $$;

-- Actualizar la orden de cambio de prueba con datos reales
UPDATE public.change_orders 
SET 
    designer = 'Ing. María González',
    cost_impact = 2500000.00,
    currency = 'CRC',
    exchange_rate = 520.0000,
    cost_impact_crc = 2500000.00,
    schedule_impact_days = 15,
    cost_impact_level = 'alto',
    quality_impact_level = 'medio',
    schedule_impact_level = 'alto',
    risk_impact_level = 'medio',
    cost_comments = 'Incremento debido a cambios en especificaciones de materiales',
    quality_comments = 'Mejora en la calidad de acabados',
    schedule_comments = 'Retraso por tiempo adicional de instalación',
    risk_comments = 'Riesgo controlado con supervisión adicional',
    general_comments = 'Orden de cambio aprobada por el cliente para mejorar la calidad del proyecto'
WHERE id = '550e8400-e29b-41d4-a716-446655441001';

-- Verificar que la actualización se realizó correctamente
SELECT 
    id,
    title,
    designer,
    cost_impact,
    cost_impact_crc,
    schedule_impact_days,
    currency,
    exchange_rate,
    cost_impact_level,
    quality_impact_level,
    schedule_impact_level,
    risk_impact_level
FROM public.change_orders 
WHERE id = '550e8400-e29b-41d4-a716-446655441001';

-- Mensaje de confirmación
SELECT 'Datos de prueba actualizados exitosamente' AS resultado;