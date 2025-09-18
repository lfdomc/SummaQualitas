-- Migración para agregar campos de tipo de cambio y área total a la tabla projects
-- Fecha: 2024
-- Descripción: Agrega exchange_rate_usd y total_area para cálculos de costos

-- Agregar campo de tipo de cambio USD/CRC
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS exchange_rate_usd DECIMAL(10,2) DEFAULT 520.00;

-- Agregar comentario al campo exchange_rate_usd
COMMENT ON COLUMN projects.exchange_rate_usd IS 'Tipo de cambio USD/CRC al momento del contrato';

-- Agregar campo de área total del proyecto
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS total_area DECIMAL(10,2) DEFAULT 0;

-- Agregar comentario al campo total_area
COMMENT ON COLUMN projects.total_area IS 'Área total del proyecto en metros cuadrados';

-- Actualizar proyectos existentes con valores por defecto si es necesario
-- (Los valores por defecto ya se aplicarán automáticamente)

-- Verificar que los campos se agregaron correctamente
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name IN ('exchange_rate_usd', 'total_area')
ORDER BY column_name;