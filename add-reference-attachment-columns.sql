-- =====================================================
-- AGREGAR COLUMNAS DE ADJUNTO DE REFERENCIA A LA TABLA EXPENSES
-- =====================================================
-- Este script agrega las columnas necesarias para manejar archivos adjuntos
-- del comprobante de referencia en los gastos. Ejecutar en Supabase SQL Editor.

-- Verificar estructura actual de la tabla
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'expenses' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Agregar columnas de adjunto de referencia si no existen
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS reference_attachment_url TEXT,
ADD COLUMN IF NOT EXISTS reference_attachment_name TEXT,
ADD COLUMN IF NOT EXISTS reference_attachment_type TEXT,
ADD COLUMN IF NOT EXISTS reference_attachment_size INTEGER;

-- Agregar comentarios para documentar las columnas
COMMENT ON COLUMN expenses.reference_attachment_url IS 'URL del archivo adjunto del comprobante de referencia en Supabase Storage';
COMMENT ON COLUMN expenses.reference_attachment_name IS 'Nombre original del archivo adjunto del comprobante de referencia';
COMMENT ON COLUMN expenses.reference_attachment_type IS 'Tipo MIME del archivo adjunto del comprobante de referencia (application/pdf, image/jpeg, etc.)';
COMMENT ON COLUMN expenses.reference_attachment_size IS 'Tamaño del archivo adjunto del comprobante de referencia en bytes';

-- Verificar que las columnas se agregaron correctamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'expenses' 
AND table_schema = 'public'
AND column_name LIKE '%reference_attachment%'
ORDER BY column_name;

-- Mensaje de confirmación
SELECT 'Columnas de adjunto de referencia agregadas exitosamente a la tabla expenses' AS status;