-- Migration: Align incomes table with current app expectations
-- Purpose: Replace legacy attachment_* columns with receipt_url used by the app
-- Safe operations with IF EXISTS / IF NOT EXISTS guards

BEGIN;

-- 1) Add receipt_url if it doesn't exist
ALTER TABLE public.incomes
  ADD COLUMN IF NOT EXISTS receipt_url TEXT;

COMMENT ON COLUMN public.incomes.receipt_url IS 'URL del recibo o comprobante del ingreso';

-- 2) If legacy attachment_url exists and receipt_url is NULL, copy data
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'incomes'
      AND column_name = 'attachment_url'
  ) THEN
    UPDATE public.incomes
    SET receipt_url = COALESCE(receipt_url, attachment_url)::text
    WHERE receipt_url IS NULL;
  END IF;
END $$;

-- 3) Drop legacy attachment_* columns if they exist
ALTER TABLE public.incomes DROP COLUMN IF EXISTS attachment_url;
ALTER TABLE public.incomes DROP COLUMN IF EXISTS attachment_name;
ALTER TABLE public.incomes DROP COLUMN IF EXISTS attachment_type;
ALTER TABLE public.incomes DROP COLUMN IF EXISTS attachment_size;

COMMIT;