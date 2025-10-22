import { NextRequest, NextResponse } from "next/server"
import { createClient } from '@/lib/supabase/server'
import { createProject } from '@/lib/services/projectService'
import { mapProjectStatus } from '@/types/database'
import type { CreateProjectDTO } from '@/lib/types'

// Asegurar runtime y comportamiento dinámico para evitar prerender en build
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

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
    status: 'en_progreso',
    presupuesto_inicial: 5000000,
    costos_directos: 1750000,
    costos_indirectos: 300000,
    administracion: 200000,
    mano_obra: 800000,
    imprevistos: 150000,
    utilidad: 250000,
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
    status: 'en_progreso',
    presupuesto_inicial: 8000000,
    costos_directos: 2800000,
    costos_indirectos: 480000,
    administracion: 320000,
    mano_obra: 1200000,
    imprevistos: 240000,
    utilidad: 400000,
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
    status: 'planificacion',
    presupuesto_inicial: 12000000,
    costos_directos: 4200000,
    costos_indirectos: 720000,
    administracion: 480000,
    mano_obra: 1800000,
    imprevistos: 360000,
    utilidad: 600000,
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
  }
];

export async function GET(request: NextRequest) {
  try {
    // Si faltan variables de entorno, usar mock y evitar crear cliente
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const response = NextResponse.json({
        success: true,
        data: mockProjects,
        pagination: {
          page: 1,
          limit: mockProjects.length,
          total: mockProjects.length,
          totalPages: 1
        },
        warning: 'Supabase no configurado: usando datos mock'
      });
      Object.entries(CACHE_HEADERS).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    const supabase = await createClient(request);
    const { searchParams } = new URL(request.url);
    
    // Parámetros de paginación y filtros
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    
    // Construir query optimizada con filtros
    let query = supabase
      .from('projects')
      .select('*', { count: 'exact' });
    
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
    // Usar datos mock como fallback en caso de error
    return NextResponse.json({
      success: true,
      data: mockProjects,
      warning: 'Error inesperado: usando datos mock'
    });
  }
}

/**
 * POST /api/projects
 * Crea un nuevo proyecto
 */
export async function POST(request: NextRequest) {
  // Permitir modo debug en producción con ?debug=1 o ?debug=true
  const { searchParams } = new URL(request.url);
  const debugParam = searchParams.get('debug');
  const isDebug = debugParam === '1' || debugParam === 'true';

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

    // Validación adicional: cliente y presupuesto inicial > 0
    const initialBudget = Number(body.presupuesto_inicial ?? body.budget ?? 0);
    if (!body.client_id) {
      return NextResponse.json(
        { success: false, error: 'El cliente es requerido' },
        { status: 400 }
      );
    }
    if (!Number.isFinite(initialBudget) || initialBudget <= 0) {
      return NextResponse.json(
        { success: false, error: 'El presupuesto inicial debe ser mayor a 0' },
        { status: 400 }
      );
    }
    // Validación de límite superior según tipo NUMERIC(15,2) usado en DB legacy
    const MAX_NUMERIC_15_2 = 9_999_999_999_999.99; // máximo permitido por DECIMAL(15,2)
    if (initialBudget > MAX_NUMERIC_15_2) {
      return NextResponse.json(
        {
          success: false,
          error: 'El presupuesto inicial excede el límite permitido (máximo ₡9,999,999,999,999.99). Use un número menor o contacte soporte.'
        },
        { status: 400 }
      );
    }

    // Antes de crear cliente Supabase, validar entorno
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { success: false, error: 'Supabase no está configurado en el entorno (URL o ANON KEY faltante). Configure variables de entorno y reintente.' },
        { status: 503 }
      );
    }

    // Obtener usuario autenticado para asignar created_by
    const supabase = await createClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Crear el proyecto usando el servicio
    const projectData: CreateProjectDTO = {
      name: body.name,
      description: body.description || '',
      location: body.location || '',
      client_id: body.client_id,
      // Mapear estado a español si viene en inglés
      status: mapProjectStatus(body.status),
      manager_id: body.manager_id,
      // Mapear presupuesto_inicial a presupuesto_original (campo requerido en DB)
      presupuesto_original: initialBudget,
      presupuesto_inicial: initialBudget, // Mantener por compatibilidad
      costos_directos: body.costos_directos || 0,
      costos_indirectos: body.costos_indirectos || 0,
      mano_obra: body.mano_obra || 0,
      administracion: body.administracion || 0,
      imprevistos: body.imprevistos || 0,
      utilidad: body.utilidad || 0,
      presupuesto_final: body.presupuesto_final,
      estimated_start_date: body.estimated_start_date,
      estimated_end_date: body.estimated_end_date,
      actual_start_date: body.actual_start_date,
      actual_end_date: body.actual_end_date,
      total_area: body.total_area,
      exchange_rate_usd: body.exchange_rate_usd || 500,
      created_by: user.id
    };

    const newProject = await createProject(projectData);

    return NextResponse.json({
      success: true,
      data: newProject,
      message: 'Proyecto creado exitosamente'
    }, { status: 201 });

  } catch (error) {
    const e: any = error;
    const rawMessage = e?.message || (error instanceof Error ? error.message : '') || '';
    const message = rawMessage || 'Error interno del servidor';
    // Intentar extraer columna en violación NOT NULL: "null value in column \"<col>\" violates not-null constraint"
    let notNullColumn: string | undefined = undefined;
    const m = rawMessage.match(/null value in column\s+\"([a-zA-Z0-9_]+)\"\s+violates not-null constraint/i);
    if (m && m[1]) notNullColumn = m[1];

    // Mapear a códigos HTTP más apropiados
    let status = 500;
    const lower = message.toLowerCase();
    if (e?.code === '23502') {
      status = 400; // NOT NULL violation -> Bad Request
    } else if (lower.includes('no autorizado')) {
      status = 401;
    } else if (
      lower.includes('no tienes permisos') ||
      lower.includes('row-level security') ||
      lower.includes('violates row-level security') ||
      lower.includes('permission denied') ||
      lower.includes('insufficient privilege')
    ) {
      status = 403;
    } else if (
      lower.includes('ya existe un proyecto') ||
      lower.includes('duplicado') ||
      lower.includes('duplicate key') ||
      lower.includes('already exists')
    ) {
      status = 409;
    } else if (
      lower.includes('cliente') ||
      lower.includes('falta un campo') ||
      lower.includes('presupuesto') ||
      lower.includes('invalid input syntax') ||
      lower.includes('22p02') ||
      lower.includes('uuid') ||
      lower.includes('not-null') ||
      lower.includes('violates not-null') ||
      lower.includes('foreign key') ||
      lower.includes('violates foreign key') ||
      lower.includes('check constraint') ||
      lower.includes('numeric field overflow') ||
      lower.includes('value out of range') ||
      lower.includes('22003')
    ) {
      status = 400;
    }
    // Log detallado del error para diagnóstico
    console.error('Error en POST /api/projects:', {
      message,
      code: e?.code,
      details: e?.details,
      hint: e?.hint,
      name: e?.name,
      column: notNullColumn
    });
    return NextResponse.json(
      {
        success: false,
        error: message,
        ...(isDebug || process.env.NODE_ENV !== 'production' ? { code: e?.code, details: e?.details, hint: e?.hint, message: rawMessage, column: notNullColumn } : {})
      },
      { status }
    );
  }
}
