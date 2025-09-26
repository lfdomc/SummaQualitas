-- Migración para actualizar la tabla incomes: cambiar attachment_* por receipt_url
-- Esta migración simplifica la estructura de archivos adjuntos

-- Agregar la nueva columna receipt_url
ALTER TABLE public.incomes ADD COLUMN IF NOT EXISTS receipt_url TEXT;

-- Migrar datos existentes: copiar attachment_url a receipt_url
UPDATE public.incomes 
SET receipt_url = attachment_url 
WHERE attachment_url IS NOT NULL;

-- Eliminar las columnas de attachment antiguas
ALTER TABLE public.incomes DROP COLUMN IF EXISTS attachment_url;
ALTER TABLE public.incomes DROP COLUMN IF EXISTS attachment_name;
ALTER TABLE public.incomes DROP COLUMN IF EXISTS attachment_type;
ALTER TABLE public.incomes DROP COLUMN IF EXISTS attachment_size;

-- Agregar comentario a la nueva columna
COMMENT ON COLUMN public.incomes.receipt_url IS 'URL del recibo o comprobante del ingreso';