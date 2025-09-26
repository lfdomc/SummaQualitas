-- Migración para agregar el campo exchange_rate a la tabla expenses
-- Ejecutar en Supabase SQL Editor

-- Verificar si el campo exchange_rate ya existe
DO $$ 
BEGIN
    -- Agregar el campo exchange_rate si no existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'expenses' 
        AND table_schema = 'public' 
        AND column_name = 'exchange_rate'
    ) THEN
        ALTER TABLE public.expenses 
        ADD COLUMN exchange_rate DECIMAL(10,4);
        
        -- Agregar comentario al campo
        COMMENT ON COLUMN public.expenses.exchange_rate IS 'Tipo de cambio utilizado para la conversión de moneda (CRC a USD)';
        
        RAISE NOTICE 'Campo exchange_rate agregado exitosamente a la tabla expenses';
    ELSE
        RAISE NOTICE 'El campo exchange_rate ya existe en la tabla expenses';
    END IF;
END $$;

-- Verificar que el campo se agregó correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'expenses' 
AND table_schema = 'public'
AND column_name = 'exchange_rate';

-- Mostrar mensaje de confirmación
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'expenses' 
            AND table_schema = 'public' 
            AND column_name = 'exchange_rate'
        ) 
        THEN '✅ MIGRACIÓN COMPLETADA: El campo exchange_rate está disponible en la tabla expenses'
        ELSE '❌ ERROR: El campo exchange_rate no se pudo agregar a la tabla expenses'
    END AS resultado;