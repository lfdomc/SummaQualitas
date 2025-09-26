-- Agregar columnas de attachment a la tabla incomes
-- Estas columnas son necesarias para el manejo de archivos adjuntos

ALTER TABLE incomes 
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_name TEXT,
ADD COLUMN IF NOT EXISTS attachment_type TEXT,
ADD COLUMN IF NOT EXISTS attachment_size INTEGER;

-- Comentarios para documentar las columnas
COMMENT ON COLUMN incomes.attachment_url IS 'URL del archivo adjunto en Supabase Storage';
COMMENT ON COLUMN incomes.attachment_name IS 'Nombre original del archivo adjunto';
COMMENT ON COLUMN incomes.attachment_type IS 'Tipo MIME del archivo adjunto';
COMMENT ON COLUMN incomes.attachment_size IS 'Tamaño del archivo adjunto en bytes';