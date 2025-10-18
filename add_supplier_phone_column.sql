-- Script para agregar la columna supplier_phone a la tabla sumitals
-- Ejecutar este script en el panel de Supabase (SQL Editor)

-- Agregar la columna supplier_phone a la tabla sumitals
ALTER TABLE sumitals 
ADD COLUMN IF NOT EXISTS supplier_phone VARCHAR(50);

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns 
WHERE table_name = 'sumitals' 
AND column_name = 'supplier_phone';

-- Opcional: Agregar un comentario a la columna para documentación
COMMENT ON COLUMN sumitals.supplier_phone IS 'Teléfono del proveedor del sumital';