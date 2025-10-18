-- =====================================================
-- FIX: Agregar y poblar document_number en change_orders
--      y asegurar funciones/trigger para autogenerarlo
-- Ejecutar este script en el SQL Editor de Supabase.
-- Es idempotente (puede correrse varias veces sin fallar).
-- =====================================================

-- 1) Asegurar columna document_number
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'change_orders' AND column_name = 'document_number'
  ) THEN
    ALTER TABLE public.change_orders 
      ADD COLUMN document_number VARCHAR(50) UNIQUE;
  END IF;
END$$;

-- 2) Índice para búsquedas por document_number
CREATE INDEX IF NOT EXISTS idx_change_orders_document_number 
ON public.change_orders(document_number);

-- 3) Función para generar el número de documento en formato OC-YYYY-NNNN
CREATE OR REPLACE FUNCTION public.generate_change_order_document_number()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  sequence_number INTEGER;
  doc TEXT;
BEGIN
  current_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(co.document_number FROM 'OC-' || current_year || '-(\\d+)') AS INTEGER)), 0) + 1
  INTO sequence_number
  FROM public.change_orders co
  WHERE co.document_number LIKE 'OC-' || current_year || '-%';

  doc := 'OC-' || current_year || '-' || LPAD(sequence_number::TEXT, 4, '0');
  RETURN doc;
END;
$$ LANGUAGE plpgsql;

-- 4) Poblar document_number faltantes preservando el año del created_at
WITH to_fill AS (
  SELECT 
    id,
    COALESCE(TO_CHAR(created_at, 'YYYY'), TO_CHAR(NOW(), 'YYYY')) AS anio,
    created_at
  FROM public.change_orders
  WHERE (document_number IS NULL OR document_number = '')
), numbered AS (
  SELECT 
    id,
    anio,
    ROW_NUMBER() OVER (PARTITION BY anio ORDER BY created_at NULLS LAST, id) AS rn
  FROM to_fill
)
UPDATE public.change_orders co
SET document_number = 'OC-' || n.anio || '-' || LPAD(n.rn::TEXT, 4, '0')
FROM numbered n
WHERE co.id = n.id AND (co.document_number IS NULL OR co.document_number = '');

-- 5) Trigger para autogenerar en INSERT si falta
CREATE OR REPLACE FUNCTION public.trigger_generate_change_order_document_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.document_number IS NULL OR NEW.document_number = '' THEN
    NEW.document_number := public.generate_change_order_document_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_change_orders_document_number ON public.change_orders;
CREATE TRIGGER trigger_change_orders_document_number
BEFORE INSERT ON public.change_orders
FOR EACH ROW
EXECUTE FUNCTION public.trigger_generate_change_order_document_number();

-- 6) Verificación rápida
SELECT 
  COUNT(*) AS total,
  COUNT(NULLIF(document_number, '')) AS con_documento,
  MIN(document_number) AS ejemplo_min,
  MAX(document_number) AS ejemplo_max
FROM public.change_orders;

-- 7) Mensaje final
SELECT 'OK: document_number asegurado y trigger creado' AS resultado;