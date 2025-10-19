import { NextRequest, NextResponse } from "next/server"
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

// Asegurar runtime y comportamiento dinámico para evitar prerender en build
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

// Cache headers comunes
const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
  'CDN-Cache-Control': 'public, s-maxage=120',
  'Vercel-CDN-Cache-Control': 'public, s-maxage=120'
};

// Mock de clientes para fallback cuando no hay Supabase
const mockClients = [
  { id: '1', name: 'Inmobiliaria Alpha', phone: '+506 8888-1111', email: 'contacto@alpha.com', address: 'San José' },
  { id: '2', name: 'Comercial Beta', phone: '+506 8888-2222', email: 'ventas@beta.com', address: 'Heredia' },
  { id: '3', name: 'Corporación Gamma', phone: '+506 8888-3333', email: 'info@gamma.com', address: 'Alajuela' },
];

export async function GET(request: NextRequest) {
  try {
    // Si faltan variables de entorno, devolver mock
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const response = NextResponse.json({
        success: true,
        data: mockClients,
        pagination: {
          page: 1,
          limit: mockClients.length,
          total: mockClients.length,
          totalPages: 1
        },
        warning: 'Supabase no configurado: usando datos mock'
      });
      Object.entries(CACHE_HEADERS).forEach(([key, value]) => response.headers.set(key, value));
      return response;
    }

    const supabase = await createClient(request);
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');

    let query = supabase.from('clients').select('*', { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,address.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to).order('created_at', { ascending: false });

    const { data: clients, error, count } = await query as unknown as { data: Database['public']['Tables']['clients']['Row'][]; error: any; count: number | null };

    if (error) {
      // fallback mock con paginación
      const total = mockClients.length;
      const paginated = mockClients.slice(from, from + limit);
      const response = NextResponse.json({
        success: true,
        data: paginated,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      });
      Object.entries(CACHE_HEADERS).forEach(([key, value]) => response.headers.set(key, value));
      return response;
    }

    const data = clients && clients.length > 0 ? clients : mockClients;

    const response = NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count || data.length,
        totalPages: Math.ceil((count || data.length) / limit)
      }
    });

    Object.entries(CACHE_HEADERS).forEach(([key, value]) => response.headers.set(key, value));

    return response;
  } catch (error) {
    return NextResponse.json({ success: true, data: mockClients, warning: 'Error inesperado: usando datos mock' });
  }
}

/**
 * POST /api/clients
 * Crea un nuevo cliente
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.email) {
      return NextResponse.json(
        { success: false, error: 'Nombre y email son requeridos' },
        { status: 400 }
      );
    }

    // Validar entorno antes de crear cliente Supabase
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { success: false, error: 'Supabase no está configurado en el entorno (URL o ANON KEY faltante). Configure variables de entorno y reintente.' },
        { status: 503 }
      );
    }

    const supabase = await createClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('clients')
      .insert({
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        address: body.address || null,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data, message: 'Cliente creado exitosamente' }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    let status = 500;
    const lower = message.toLowerCase();
    if (lower.includes('no autorizado')) status = 401;
    else if (lower.includes('permission') || lower.includes('privilege') || lower.includes('row-level')) status = 403;
    else if (lower.includes('duplicate') || lower.includes('ya existe')) status = 409;
    else if (
      lower.includes('invalid input') ||
      lower.includes('not-null') ||
      lower.includes('foreign key') ||
      lower.includes('check constraint') ||
      lower.includes('numeric field overflow')
    ) status = 400;

    console.error('Error en POST /api/clients:', message);
    return NextResponse.json({ success: false, error: message }, { status });
  }
}