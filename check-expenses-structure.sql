-- Script para verificar la estructura actual de la tabla expenses
-- Ejecutar en Supabase SQL Editor

-- Verificar las columnas de la tabla expenses
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'expenses' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar si existe el campo exchange_rate específicamente
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'expenses' 
            AND table_schema = 'public' 
            AND column_name = 'exchange_rate'
        ) 
        THEN 'El campo exchange_rate EXISTE en la tabla expenses'
        ELSE 'El campo exchange_rate NO EXISTE en la tabla expenses'
    END AS resultado;

-- Mostrar algunos registros de ejemplo para ver qué campos están disponibles
SELECT * FROM expenses LIMIT 3;