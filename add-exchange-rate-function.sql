-- Función para agregar la columna exchange_rate_usd a la tabla projects
-- Ejecutar este SQL en el dashboard de Supabase > SQL Editor

-- Primero crear la función que agregará la columna
CREATE OR REPLACE FUNCTION add_exchange_rate_column()
RETURNS TEXT AS $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    -- Verificar si la columna ya existe
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'exchange_rate_usd'
    ) INTO column_exists;
    
    -- Si la columna no existe, agregarla
    IF NOT column_exists THEN
        -- Agregar la columna
        ALTER TABLE projects 
        ADD COLUMN exchange_rate_usd DECIMAL(10,2) DEFAULT 520.00;
        
        -- Agregar comentario
        COMMENT ON COLUMN projects.exchange_rate_usd IS 'Tipo de cambio USD/CRC al momento del contrato';
        
        -- Actualizar proyectos existentes
        UPDATE projects 
        SET exchange_rate_usd = 520.00 
        WHERE exchange_rate_usd IS NULL;
        
        RETURN 'Columna exchange_rate_usd agregada exitosamente';
    ELSE
        RETURN 'La columna exchange_rate_usd ya existe';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ejecutar la función inmediatamente
SELECT add_exchange_rate_column();

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name = 'exchange_rate_usd';