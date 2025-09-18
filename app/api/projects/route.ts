import { NextRequest, NextResponse } from "next/server"
import { createClient } from '@/lib/supabase/server'
import { createProject } from '@/lib/services/projectService'
import { CreateProjectDTO } from '@/lib/types'

// Cache headers para optimizar rendimiento
const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
  'CDN-Cache-Control': 'public, s-maxage=120',
  'Vercel-CDN-Cache-Control': 'public, s-maxage=120'
};

// Datos mock compatibles con el tipo Project
const mockProjects = [
  {
    id: '1',
    name: 'Residencial Norte',
    client_id: '1',
    description: 'Complejo residencial de 200 unidades',
    location: 'Zona Norte, Ciudad',
    start_date: '2024-01-15',
    end_date: '2024-12-15',
    status: 'active',
    presupuesto_inicial: 5000000,
    costos_directos_materiales: 1250000,
    costos_directos_equipos: 500000,
    costos_indirectos: 300000,
    gastos_administrativos: 200000,
    mano_obra_quincenal: 800000,
    imprevistos: 150000,
    utilidad_esperada: 250000,
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
  {
    id: '2',
    name: 'Centro Comercial Plaza',
    client_id: '2',
    description: 'Centro comercial de 3 niveles',
    location: 'Centro, Ciudad',
    start_date: '2024-02-01',
    end_date: '2024-10-01',
    status: 'active',
    presupuesto_inicial: 8000000,
    costos_directos_materiales: 2000000,
    costos_directos_equipos: 800000,
    costos_indirectos: 480000,
    gastos_administrativos: 320000,
    mano_obra_quincenal: 1200000,
    imprevistos: 240000,
    utilidad_esperada: 400000,
    created_at: '2024-01-20T00:00:00Z',
    updated_at: '2024-01-20T00:00:00Z',
  },
  {
    id: '3',
    name: 'Torre Corporativa Skyline',
    client_id: '3',
    description: 'Edificio de oficinas de 20 pisos',
    location: 'Distrito Financiero',
    start_date: '2024-03-01',
    end_date: '2025-09-01',
    status: 'planning',
    presupuesto_inicial: 12000000,
    costos_directos_materiales: 3000000,
    costos_directos_equipos: 1200000,
    costos_indirectos: 720000,
    gastos_administrativos: 480000,
    mano_obra_quincenal: 1800000,
    imprevistos: 360000,
    utilidad_esperada: 600000,
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
  }
];

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(request);
    const { searchParams } = new URL(request.url);
    
    // Parámetros de paginación y filtros
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    
    // Construir query optimizada con filtros
    let query = supabase
      .from('projects')
      .select(`
        id,
        name,
        client_id,
        description,
        location,
        start_date,
        end_date,
        status,
        presupuesto_inicial,
        costos_directos_materiales,
        costos_directos_equipos,
        costos_indirectos,
        gastos_administrativos,
        mano_obra_quincenal,
        imprevistos,
        utilidad_esperada,
        presupuesto_original,
        presupuesto_final,
        created_at,
        updated_at
      `, { count: 'exact' });
    
    // Aplicar filtros
    if (status) {
      query = query.eq('status', status);
    }
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`);
    }
    
    // Aplicar paginación
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    query = query
      .range(from, to)
      .order('created_at', { ascending: false });
    
    // Ejecutar query
    const { data: projects, error, count } = await query;
    
    if (error) {
      console.error('Error fetching projects from database:', error);
      // Usar datos mock como fallback con paginación simulada
      let filteredMockData = mockProjects;
      
      if (status) {
        filteredMockData = filteredMockData.filter(p => p.status === status);
      }
      
      if (search) {
        const searchLower = search.toLowerCase();
        filteredMockData = filteredMockData.filter(p => 
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.location.toLowerCase().includes(searchLower)
        );
      }
      
      const total = filteredMockData.length;
      const from = (page - 1) * limit;
      const paginatedData = filteredMockData.slice(from, from + limit);
      
      const response = NextResponse.json({
        success: true,
        data: paginatedData,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
      
      Object.entries(CACHE_HEADERS).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      return response;
    }
    
    // Si hay proyectos en la base de datos, usarlos; si no, usar mock
    const projectsData = projects && projects.length > 0 ? projects : mockProjects;
    
    const response = NextResponse.json({
      success: true,
      data: projectsData,
      pagination: {
        page,
        limit,
        total: count || projectsData.length,
        totalPages: Math.ceil((count || projectsData.length) / limit)
      }
    });
    
    // Agregar headers de cache
    Object.entries(CACHE_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
    
  } catch (error) {
    console.error("Error fetching projects:", error)
    // Usar datos mock como fallback en caso de error
    return NextResponse.json({
      success: true,
      data: mockProjects
    });
  }
}

/**
 * POST /api/projects
 * Crea un nuevo proyecto
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar datos requeridos
    if (!body.name) {
      return NextResponse.json(
        {
          success: false,
          error: 'El nombre del proyecto es requerido'
        },
        { status: 400 }
      );
    }

    // Crear el proyecto usando el servicio
    const projectData: CreateProjectDTO = {
      name: body.name,
      description: body.description || '',
      location: body.location || '',
      client_id: body.client_id,
      presupuesto_inicial: body.presupuesto_inicial || 0,
      costos_directos_materiales: body.costos_directos_materiales || 0,
      costos_directos_equipos: body.costos_directos_equipos || 0,
      costos_indirectos: body.costos_indirectos || 0,
      gastos_administrativos: body.gastos_administrativos || 0,
      mano_obra_quincenal: body.mano_obra_quincenal || 0,
      imprevistos: body.imprevistos || 0,
      utilidad_esperada: body.utilidad_esperada || 0,
      presupuesto_final: body.presupuesto_final,
      estimated_start_date: body.estimated_start_date,
      estimated_end_date: body.estimated_end_date,
      actual_start_date: body.actual_start_date,
      actual_end_date: body.actual_end_date,
      total_area: body.total_area,
      exchange_rate_usd: body.exchange_rate_usd || 500
    };

    const newProject = await createProject(projectData);

    return NextResponse.json({
      success: true,
      data: newProject,
      message: 'Proyecto creado exitosamente'
    }, { status: 201 });

  } catch (error) {
    console.error('Error en POST /api/projects:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}
