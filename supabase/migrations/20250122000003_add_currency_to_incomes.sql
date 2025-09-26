-- Agregar columna currency a la tabla incomes
-- Esta columna es necesaria para manejar diferentes monedas en los ingresos

ALTER TABLE public.incomes 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'CRC' CHECK (currency IN ('USD', 'CRC', 'EUR'));

-- Agregar comentario a la nueva columna
COMMENT ON COLUMN public.incomes.currency IS 'Moneda del ingreso (USD, CRC, EUR)';