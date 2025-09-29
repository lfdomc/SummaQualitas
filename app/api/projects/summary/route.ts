import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = createAdminClient();
    
    // Llamar a la función RPC get_projects_with_summary
    const { data, error } = await supabase.rpc('get_projects_with_summary', {
      p_limit: limit,
      p_offset: offset
    });
    
    if (error) {
      console.error('Error fetching projects with summary:', error);
      return NextResponse.json(
        { error: 'Error al obtener proyectos con resumen', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in projects summary API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}