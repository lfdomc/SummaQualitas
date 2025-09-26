-- =====================================================
-- AGREGAR COLUMNAS DE ATTACHMENT A LA TABLA EXPENSES
-- =====================================================
-- Este script agrega las columnas necesarias para manejar archivos adjuntos
-- en los gastos. Ejecutar en Supabase SQL Editor.

-- Verificar estructura actual de la tabla
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'expenses' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Agregar columnas de attachment si no existen
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_name TEXT,
ADD COLUMN IF NOT EXISTS attachment_type TEXT,
ADD COLUMN IF NOT EXISTS attachment_size INTEGER;

-- Agregar comentarios para documentar las columnas
COMMENT ON COLUMN expenses.attachment_url IS 'URL del archivo adjunto en Supabase Storage';
COMMENT ON COLUMN expenses.attachment_name IS 'Nombre original del archivo adjunto';
COMMENT ON COLUMN expenses.attachment_type IS 'Tipo MIME del archivo adjunto (application/pdf, image/jpeg, etc.)';
COMMENT ON COLUMN expenses.attachment_size IS 'Tamaño del archivo adjunto en bytes';

-- Verificar que las columnas se agregaron correctamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'expenses' 
AND table_schema = 'public'
AND column_name LIKE 'attachment%'
ORDER BY column_name;

-- Mensaje de confirmación
SELECT 'Columnas de attachment agregadas exitosamente a la tabla expenses' AS resultado;