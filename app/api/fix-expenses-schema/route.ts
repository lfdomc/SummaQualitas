import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

// Este endpoint intenta corregir el esquema de la tabla expenses en Supabase
// para que acepte inserciones desde la app. Usa la clave de servicio (SUPABASE_SERVICE_ROLE_KEY).
// Si la función RPC exec_sql no existe, devuelve el SQL para que lo pegues manualmente
// en el SQL editor de Supabase.

const FIX_SQL = `
DO $$
BEGIN
  -- Agregar columnas de subcategoría si no existen (como TEXT para compatibilidad rápida)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'subcategory_direct'
  ) THEN
    ALTER TABLE public.expenses ADD COLUMN subcategory_direct TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'subcategory_indirect'
  ) THEN
    ALTER TABLE public.expenses ADD COLUMN subcategory_indirect TEXT;
  END IF;

  -- Tipo de cambio en USD
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'exchange_rate_usd'
  ) THEN
    ALTER TABLE public.expenses ADD COLUMN exchange_rate_usd NUMERIC;
  END IF;

  -- Comprobante e información de referencia
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'receipt_url'
  ) THEN
    ALTER TABLE public.expenses ADD COLUMN receipt_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'reference'
  ) THEN
    ALTER TABLE public.expenses ADD COLUMN reference TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'reference_attachment_url'
  ) THEN
    ALTER TABLE public.expenses ADD COLUMN reference_attachment_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'reference_attachment_name'
  ) THEN
    ALTER TABLE public.expenses ADD COLUMN reference_attachment_name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'reference_attachment_type'
  ) THEN
    ALTER TABLE public.expenses ADD COLUMN reference_attachment_type TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'reference_attachment_size'
  ) THEN
    ALTER TABLE public.expenses ADD COLUMN reference_attachment_size INTEGER;
  END IF;

  -- Moneda y estado de pago por compatibilidad
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'currency'
  ) THEN
    ALTER TABLE public.expenses ADD COLUMN currency VARCHAR(3) DEFAULT 'CRC';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE public.expenses ADD COLUMN payment_status TEXT DEFAULT 'pendiente';
  END IF;

  -- Índices útiles
  CREATE INDEX IF NOT EXISTS idx_expenses_receipt_url ON public.expenses(receipt_url);
  CREATE INDEX IF NOT EXISTS idx_expenses_reference_attachment_url ON public.expenses(reference_attachment_url);
END $$;

-- Intentar recargar el cache de esquema de PostgREST (puede no estar disponible)
DO $$ BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
EXCEPTION WHEN OTHERS THEN
  -- Ignorar si no está permitido
END $$;
`;

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();

    // Intentar ejecutar la corrección vía RPC exec_sql
    const { error } = await (supabase as any).rpc('exec_sql', { sql: FIX_SQL });

    if (error) {
      console.error('Error ejecutando exec_sql:', error);
      return NextResponse.json({
        success: false,
        message: 'No se pudo ejecutar automáticamente. Copia el SQL y ejecútalo en el SQL Editor de Supabase.',
        sql: FIX_SQL
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Esquema de expenses corregido.' });
  } catch (error: any) {
    console.error('Error en fix-expenses-schema:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Error desconocido', sql: FIX_SQL }, { status: 500 });
  }
}

// También permitir GET para facilidad de uso (aunque modificar DB por GET no es ideal)
export async function GET(request: NextRequest) {
  return POST(request);
}