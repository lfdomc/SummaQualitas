import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { CreateChangeOrderData } from '@/types/database';

// Cache headers para optimizar rendimiento
const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
  'CDN-Cache-Control': 'public, s-maxage=60',
  'Vercel-CDN-Cache-Control': 'public, s-maxage=60'
};

// GET - Obtener todas las órdenes de cambio
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(request);
    const { searchParams } = new URL(request.url);
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    // Extraer parámetros de filtros
    const projectId = searchParams.get('project_id');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Construir query base optimizada con información del proyecto
    let query = supabase
      .from('change_orders')
      .select(`
        *,
        project:projects (
          id,
          name,
          description,
          location,
          status
        )
      `);
    
    // Aplicar filtros
    if (projectId && projectId !== 'all' && projectId.trim() !== '') {
      query = query.eq('project_id', projectId);
    }
    if (type && type !== 'all') {
      query = query.eq('change_type', type);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (search) {
      query = query.or(`document_number.ilike.%${search}%,description.ilike.%${search}%,designer.ilike.%${search}%`);
    }
    
    // Aplicar paginación
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);
    
    // Ordenar por fecha de creación (más recientes primero)
    query = query.order('created_at', { ascending: false });
    
    const { data: changeOrders, error, count } = await query;
    
    if (error) {
      console.error('Error fetching change orders:', error);
      return NextResponse.json(
        { success: false, error: 'Error al obtener órdenes de cambio' },
        { status: 500 }
      );
    }
    
    const response = NextResponse.json({
      success: true,
      data: changeOrders || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
    
    // Agregar headers de cache para optimizar rendimiento
    Object.entries(CACHE_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
    
  } catch (error) {
    console.error('Error in change orders API:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva orden de cambio
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(request);
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const changeOrderData: CreateChangeOrderData = {
      project_id: body.project_id,
      title: body.title,
      description: body.description,
      amount: parseFloat(body.cost_impact_crc || body.cost_impact || body.amount) || 0,
      currency: body.currency || 'USD',
      status: body.status || 'pendiente',
      request_date: body.request_date || new Date().toISOString().split('T')[0],
      notes: body.additional_comments || body.notes || '',
    };
    
    // Validaciones básicas
    if (!changeOrderData.project_id) {
      return NextResponse.json(
        { success: false, error: 'ID del proyecto es requerido' },
        { status: 400 }
      );
    }
    
    if (!changeOrderData.title?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Título es requerido' },
        { status: 400 }
      );
    }
    
    if (!changeOrderData.description?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Descripción es requerida' },
        { status: 400 }
      );
    }
    
    if (!changeOrderData.change_type?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Tipo de orden es requerido' },
        { status: 400 }
      );
    }
    
    if (!changeOrderData.currency?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Moneda es requerida' },
        { status: 400 }
      );
    }
    
    if (changeOrderData.currency === 'USD' && (!changeOrderData.exchange_rate || changeOrderData.exchange_rate <= 0)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de cambio es requerido para USD' },
        { status: 400 }
      );
    }
    
    if (!changeOrderData.designer?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Diseñador es requerido' },
        { status: 400 }
      );
    }
    
    // Verificar que el proyecto existe
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, presupuesto_original, presupuesto_final')
      .eq('id', changeOrderData.project_id)
      .single();
    
    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }
    
    // Generar número de documento automáticamente
    const currentYear = new Date().getFullYear().toString();
    
    // Obtener el último número de secuencia para este año
    const { data: lastOrder, error: lastOrderError } = await supabase
      .from('change_orders')
      .select('document_number')
      .like('document_number', `OC-${currentYear}-%`)
      .order('document_number', { ascending: false })
      .limit(1)
      .single();
    
    let sequenceNumber = 1;
    if (lastOrder && !lastOrderError) {
      const match = lastOrder.document_number.match(/OC-\d{4}-(\d+)/);
      if (match) {
        sequenceNumber = parseInt(match[1]) + 1;
      }
    }
    
    const documentNumber = `OC-${currentYear}-${sequenceNumber.toString().padStart(4, '0')}`;
    
    // Agregar el número de documento generado
    const finalChangeOrderData = {
      ...changeOrderData,
      document_number: documentNumber
    };
    
    // Crear la orden de cambio
    const { data: newChangeOrder, error: insertError } = await supabase
      .from('change_orders')
      .insert([finalChangeOrderData])
      .select(`
        *,
        projects:project_id (
          id,
          name,
          presupuesto_original,
          presupuesto_final
        )
      `)
      .single();
    
    if (insertError) {
      console.error('Error creating change order:', insertError);
      return NextResponse.json(
        { success: false, error: 'Error al crear la orden de cambio' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: newChangeOrder,
      message: 'Orden de cambio creada exitosamente'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error in change orders POST API:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}