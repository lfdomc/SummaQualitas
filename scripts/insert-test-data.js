require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Usar service key para bypass auth

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function insertTestData() {
  console.log('🚀 Iniciando inserción de datos de prueba...');

  try {
    // 1. Verificar qué órdenes de cambio existen
    const { data: existingOrders, error: checkError } = await supabase
      .from('change_orders')
      .select('id, title, amount, currency, status');

    if (checkError) {
      console.error('❌ Error verificando datos existentes:', checkError);
      return;
    }

    console.log('📊 Órdenes de cambio existentes:', existingOrders?.length || 0);
    if (existingOrders && existingOrders.length > 0) {
      console.log('📋 Órdenes encontradas:');
      existingOrders.forEach(order => {
        console.log(`  - ${order.id}: ${order.title} (${order.amount} ${order.currency})`);
      });
    }

    // 2. Buscar la orden específica que necesitamos
    const targetId = '550e8400-e29b-41d4-a716-446655441001';
    const existingOrder = existingOrders?.find(order => order.id === targetId);

    if (existingOrder) {
      console.log('✅ La orden de cambio objetivo ya existe:', existingOrder.title);
      console.log('💡 Los datos básicos están disponibles, pero faltan las columnas adicionales.');
      console.log('🔧 Para solucionar esto completamente, necesitas aplicar las migraciones que añaden las columnas faltantes.');
      
      // Verificar los datos actuales
      const { data: fullOrder, error: fullError } = await supabase
        .from('change_orders')
        .select('*')
        .eq('id', targetId)
        .single();

      if (fullError) {
        console.error('❌ Error obteniendo datos completos:', fullError);
        return;
      }

      console.log('\n📄 Datos actuales de la orden:');
      console.log('- ID:', fullOrder.id);
      console.log('- Título:', fullOrder.title);
      console.log('- Descripción:', fullOrder.description);
      console.log('- Monto:', fullOrder.amount);
      console.log('- Moneda:', fullOrder.currency);
      console.log('- Estado:', fullOrder.status);
      
      console.log('\n🔍 Campos que faltan (causando el problema):');
      console.log('- designer: NO EXISTE EN LA TABLA');
      console.log('- cost_impact: NO EXISTE EN LA TABLA');
      console.log('- cost_impact_crc: NO EXISTE EN LA TABLA');
      console.log('- schedule_impact_days: NO EXISTE EN LA TABLA');
      console.log('- exchange_rate: NO EXISTE EN LA TABLA');

      console.log('\n💡 Solución:');
      console.log('1. Aplicar las migraciones para añadir las columnas faltantes');
      console.log('2. O modificar la página para manejar campos opcionales');
      
      return;
    }

    // 3. Si no existe, verificar si hay proyectos disponibles
    const { data: existingProjects, error: projectError } = await supabase
      .from('projects')
      .select('id, name')
      .limit(1);

    if (projectError) {
      console.error('❌ Error verificando proyectos:', projectError);
      return;
    }

    let projectId;
    if (!existingProjects || existingProjects.length === 0) {
      console.log('📋 No hay proyectos. Creando proyecto de prueba...');
      
      const { data: newProject, error: createProjectError } = await supabase
        .from('projects')
        .insert({
          name: 'Proyecto de Prueba - Construcción Residencial',
          description: 'Proyecto de prueba para testing de órdenes de cambio',
          budget: 500000.00,
          currency: 'USD',
          status: 'en_progreso',
          start_date: '2024-01-15',
          estimated_end_date: '2024-12-15',
          location: 'San José, Costa Rica'
        })
        .select()
        .single();

      if (createProjectError) {
        console.error('❌ Error creando proyecto:', createProjectError);
        return;
      }

      projectId = newProject.id;
      console.log('✅ Proyecto creado:', newProject.name);
    } else {
      projectId = existingProjects[0].id;
      console.log('📋 Usando proyecto existente:', existingProjects[0].name);
    }

    // 4. Insertar orden de cambio básica
    console.log('📝 Insertando orden de cambio de prueba...');
    
    const basicChangeOrderData = {
      id: targetId,
      project_id: projectId,
      title: 'Cambio de Materiales de Acabado',
      description: 'Solicitud de cambio para actualizar los materiales de acabado de pisos y paredes según nuevas especificaciones del cliente.',
      amount: 15000.00,
      currency: 'USD',
      status: 'aprobada',
      request_date: '2024-01-20',
      approval_date: '2024-01-25',
      implementation_date: '2024-02-01',
      notes: 'Cambio aprobado por el cliente. Requiere coordinación con proveedores especializados.'
    };

    const { data: newChangeOrder, error: insertError } = await supabase
      .from('change_orders')
      .insert(basicChangeOrderData)
      .select();

    if (insertError) {
      console.error('❌ Error insertando orden de cambio:', insertError);
      return;
    }

    console.log('✅ Orden de cambio básica insertada exitosamente');
    console.log('⚠️ Nota: Solo se insertaron los campos básicos. Los campos adicionales requieren aplicar las migraciones.');

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

// Ejecutar el script
insertTestData().catch(console.error);