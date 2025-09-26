-- Agregar columnas de attachment a la tabla incomes
ALTER TABLE incomes 
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_name TEXT,
ADD COLUMN IF NOT EXISTS attachment_type TEXT,
ADD COLUMN IF NOT EXISTS attachment_size INTEGER;

-- Agregar comentarios para documentar las columnas
COMMENT ON COLUMN incomes.attachment_url IS 'URL del archivo adjunto en Supabase Storage';
COMMENT ON COLUMN incomes.attachment_name IS 'Nombre original del archivo adjunto';
COMMENT ON COLUMN incomes.attachment_type IS 'Tipo MIME del archivo adjunto (application/pdf, image/jpeg, etc.)';
COMMENT ON COLUMN incomes.attachment_size IS 'Tamaño del archivo adjunto en bytes';

-- Verificar que las columnas se agregaron
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'incomes' 
AND table_schema = 'public'
AND column_name LIKE 'attachment%'
ORDER BY column_name;