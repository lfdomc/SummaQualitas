import { NextRequest, NextResponse } from 'next/server';
import { ProjectService } from '@/lib/supabase/database';
import { ProjectFilters, PaginationParams, ProjectStatus } from '@/lib/types';

// Asegurar que este handler use Node.js runtime (los env vars del Service Role no están disponibles en Edge)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/projects/admin - Obtener proyectos usando cliente administrativo
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Validar variables de entorno críticas para el cliente administrativo
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Falta configuración de Supabase en el servidor: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
      return NextResponse.json(
        { error: 'Configuración del servidor incompleta: faltan variables de entorno de Supabase.' },
        { status: 500 }
      );
    }
    
    // Extraer parámetros de filtros
    const filters: ProjectFilters = {};
    const status = searchParams.get('status');
    const clientId = searchParams.get('client_id');
    const search = searchParams.get('search');
    
    if (status && status !== 'all') {
      filters.status = [status as ProjectStatus];
    }
    if (clientId && clientId !== 'all') {
      filters.client_id = clientId;
    }
    if (search) {
      filters.search = search;
    }
    
    // Extraer parámetros de paginación
    const pagination: PaginationParams = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10')
    };
    
    // Usar cliente administrativo en el servidor
    const projectService = new ProjectService(true);
    const result = await projectService.getProjects(filters, pagination);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error en API de proyectos admin:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}