import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Intentar obtener suppliers
    const { data: suppliers, error: suppliersError } = await supabase
      .from('suppliers')
      .select('*')
      .order('created_at', { ascending: false });

    if (suppliersError) {
      return NextResponse.json(
        { 
          error: 'Error al obtener proveedores',
          details: suppliersError.message,
          code: suppliersError.code
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: suppliers || [],
      count: suppliers?.length || 0
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}