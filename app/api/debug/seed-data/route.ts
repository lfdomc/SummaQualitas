import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    console.log('🌱 Seeding test data...');
    
    const supabase = createAdminClient();

    // 1. Crear un cliente de prueba
    console.log('👤 Creating test client...');
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert({
        name: 'Cliente de Prueba',
        contact_person: 'Juan Pérez',
        email: 'cliente@prueba.com',
        phone: '555-0123',
        address: 'Dirección de Prueba 123'
      })
      .select()
      .single();

    if (clientError) {
      console.error('❌ Client error:', clientError);
      return NextResponse.json({ error: 'Error creating client', details: clientError }, { status: 500 });
    }

    console.log('✅ Client created:', client.id);

    // 2. Crear un proyecto de prueba
    console.log('🏗️ Creating test project...');
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: 'Proyecto de Prueba - Cálculo de Presupuesto',
        description: 'Proyecto para probar el cálculo de presupuesto final con órdenes de cambio',
        client_id: client.id,
        status: 'en_progreso',
        presupuesto_inicial: 100000,
        presupuesto_original: 100000,
        presupuesto_final: 100000,
        budget: 100000,
        costos_directos: 60000,
        costos_indirectos: 15000,
        administracion: 10000,
        mano_obra: 8000,
        imprevistos: 4000,
        utilidad: 3000,
        start_date: '2024-01-01',
        estimated_end_date: '2024-06-30',
        location: 'Ciudad de Prueba'
      })
      .select()
      .single();

    if (projectError) {
      console.error('❌ Project error:', projectError);
      return NextResponse.json({ error: 'Error creating project', details: projectError }, { status: 500 });
    }

    console.log('✅ Project created:', project.id);

    // 3. Crear órdenes de cambio de prueba
    console.log('📋 Creating test change orders...');
    
    // Generar timestamp único para los números de documento
    const timestamp = Date.now();
    
    // Orden de cambio 1: Positiva (incrementa el presupuesto)
    const { data: changeOrder1, error: co1Error } = await supabase
      .from('change_orders')
      .insert({
        project_id: project.id,
        title: 'Orden de Cambio 1 - Mejoras Adicionales',
        description: 'Instalación de sistema de seguridad adicional',
        amount: 15000,
        currency: 'USD',
        impact_type: 'positivo',
        cost_impact: 15000,
        cost_impact_crc: 15000,
        status: 'implementado',
        request_date: '2024-02-15',
        approval_date: '2024-02-20',
        implementation_date: '2024-02-25',
        document_number: `OC-${timestamp}-001`
      })
      .select()
      .single();

    if (co1Error) {
      console.error('❌ Change order 1 error:', co1Error);
    } else {
      console.log('✅ Change order 1 created:', changeOrder1.id);
    }

    // Orden de cambio 2: Negativa (reduce el presupuesto)
    const { data: changeOrder2, error: co2Error } = await supabase
      .from('change_orders')
      .insert({
        project_id: project.id,
        title: 'Orden de Cambio 2 - Reducción de Alcance',
        description: 'Eliminación de acabados premium',
        amount: 8000,
        currency: 'USD',
        impact_type: 'negativo',
        cost_impact: 8000,
        cost_impact_crc: 8000,
        status: 'implementado',
        request_date: '2024-03-10',
        approval_date: '2024-03-15',
        implementation_date: '2024-03-20',
        document_number: `OC-${timestamp}-002`
      })
      .select()
      .single();

    if (co2Error) {
      console.error('❌ Change order 2 error:', co2Error);
    } else {
      console.log('✅ Change order 2 created:', changeOrder2.id);
    }

    // Orden de cambio 3: Positiva (incrementa el presupuesto)
    const { data: changeOrder3, error: co3Error } = await supabase
      .from('change_orders')
      .insert({
        project_id: project.id,
        title: 'Orden de Cambio 3 - Ampliación',
        description: 'Construcción de área adicional',
        amount: 25000,
        currency: 'USD',
        impact_type: 'positivo',
        cost_impact: 25000,
        cost_impact_crc: 25000,
        status: 'implementado',
        request_date: '2024-04-05',
        approval_date: '2024-04-10',
        implementation_date: '2024-04-15',
        document_number: `OC-${timestamp}-003`
      })
      .select()
      .single();

    if (co3Error) {
      console.error('❌ Change order 3 error:', co3Error);
    } else {
      console.log('✅ Change order 3 created:', changeOrder3.id);
    }

    // Calcular el presupuesto final esperado
    const expectedFinalBudget = 100000 + 15000 - 8000 + 25000; // 132000

    return NextResponse.json({
      success: true,
      message: 'Test data created successfully',
      data: {
        client: client,
        project: project,
        changeOrders: [changeOrder1, changeOrder2, changeOrder3].filter(Boolean),
        expectedFinalBudget: expectedFinalBudget,
        calculation: {
          initial: 100000,
          changeOrder1: '+15000',
          changeOrder2: '-8000',
          changeOrder3: '+25000',
          final: expectedFinalBudget
        }
      }
    });

  } catch (error) {
    console.error('❌ Seed data error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}