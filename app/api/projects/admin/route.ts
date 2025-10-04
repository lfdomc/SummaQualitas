import { NextRequest, NextResponse } from 'next/server';
import { ProjectService } from '@/lib/services/projectService';
import { ProjectFilters, PaginationParams, ProjectStatus } from '@/lib/types';

// GET /api/projects/admin - Obtener proyectos usando cliente administrativo
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
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