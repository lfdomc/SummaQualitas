import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Corregir la función SQL
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION generate_change_order_document_number()
        RETURNS TEXT AS $$
        DECLARE
            current_year TEXT;
            sequence_number INTEGER;
            document_number TEXT;
        BEGIN
            -- Obtener el año actual
            current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
            
            -- Obtener el siguiente número de secuencia para este año
            SELECT COALESCE(MAX(CAST(SUBSTRING(co.document_number FROM 'OC-' || current_year || '-(\\\\d+)') AS INTEGER)), 0) + 1
            INTO sequence_number
            FROM public.change_orders co
            WHERE co.document_number LIKE 'OC-' || current_year || '-%';
            
            -- Generar el número de documento con formato OC-YYYY-NNNN
            document_number := 'OC-' || current_year || '-' || LPAD(sequence_number::TEXT, 4, '0');
            
            RETURN document_number;
        END;
        $$ LANGUAGE plpgsql;
      `
    });
    
    if (error) {
      console.error('Error fixing function:', error);
      return NextResponse.json(
        { success: false, error: 'Error al corregir la función' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Función corregida exitosamente'
    });
    
  } catch (error) {
    console.error('Error in fix-db API:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}