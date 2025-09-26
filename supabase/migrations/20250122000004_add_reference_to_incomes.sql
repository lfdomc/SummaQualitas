-- Agregar columna reference a la tabla incomes
-- Esta columna es para referencias adicionales del ingreso

ALTER TABLE public.incomes 
ADD COLUMN IF NOT EXISTS reference TEXT;

-- Migrar datos existentes: copiar reference_number a reference si existe
UPDATE public.incomes 
SET reference = reference_number 
WHERE reference_number IS NOT NULL;

-- Agregar comentario a la nueva columna
COMMENT ON COLUMN public.incomes.reference IS 'Referencia adicional del ingreso';