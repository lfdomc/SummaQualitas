import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CreateSumitalData, SumitalFilters } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient(request);
    const { searchParams } = new URL(request.url);
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Construir query base
    let query = supabase
      .from('sumitals')
      .select(`
        *,
        project:projects(id, name)
      `)
      .order('created_at', { ascending: false });

    // Aplicar filtros
    const projectId = searchParams.get('project_id');
    const supplierName = searchParams.get('supplier_name');
    const isApproved = searchParams.get('is_approved');
    const brand = searchParams.get('brand');
    const countryOfOrigin = searchParams.get('country_of_origin');
    const priceMin = searchParams.get('price_min');
    const priceMax = searchParams.get('price_max');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const search = searchParams.get('search');

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    if (supplierName) {
      query = query.ilike('supplier_name', `%${supplierName}%`);
    }

    if (isApproved !== null && isApproved !== '') {
      if (isApproved === 'true') {
        query = query.eq('is_approved', true);
      } else if (isApproved === 'false') {
        query = query.eq('is_approved', false);
      } else if (isApproved === 'null' || isApproved === 'pending') {
        query = query.is('is_approved', null);
      }
    }

    if (brand) {
      query = query.ilike('brand', `%${brand}%`);
    }

    if (countryOfOrigin) {
      query = query.ilike('country_of_origin', `%${countryOfOrigin}%`);
    }

    if (priceMin) {
      query = query.gte('total_price', parseFloat(priceMin));
    }

    if (priceMax) {
      query = query.lte('total_price', parseFloat(priceMax));
    }

    if (dateFrom) {
      query = query.gte('project_date', dateFrom);
    }

    if (dateTo) {
      query = query.lte('project_date', dateTo);
    }

    if (search) {
      query = query.or(`equipment_description.ilike.%${search}%,supplier_name.ilike.%${search}%,brand.ilike.%${search}%,model.ilike.%${search}%`);
    }

    const { data: sumitals, error } = await query;

    if (error) {
      console.error('Error fetching sumitals:', error);
      return NextResponse.json({ error: 'Error al obtener sumitals' }, { status: 500 });
    }

    return NextResponse.json({ sumitals });

  } catch (error) {
    console.error('Error in GET /api/sumitals:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient(request);
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body: CreateSumitalData = await request.json();

    // Validar campos requeridos
    if (!body.project_id || !body.equipment_description || !body.supplier_name || body.total_price === undefined) {
      return NextResponse.json({ 
        error: 'Faltan campos requeridos: project_id, equipment_description, supplier_name, total_price' 
      }, { status: 400 });
    }

    // Verificar que el proyecto existe
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', body.project_id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }

    // Crear el sumital
    const { data: sumital, error } = await supabase
      .from('sumitals')
      .insert({
        ...body,
        created_by: user.id,
        updated_by: user.id,
        project_date: body.project_date || new Date().toISOString().split('T')[0],
        attached_documents: body.attached_documents || []
      })
      .select(`
        *,
        project:projects(id, name)
      `)
      .single();

    if (error) {
      console.error('Error creating sumital:', error);
      return NextResponse.json({ error: 'Error al crear sumital' }, { status: 500 });
    }

    return NextResponse.json({ sumital }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/sumitals:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}