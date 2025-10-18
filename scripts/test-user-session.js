require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

// Cliente normal (como lo usa la aplicación)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUserSession() {
  console.log('🔐 PROBANDO SESIÓN DE USUARIO Y ACCESO A DATOS');
  console.log('==============================================');
  
  const targetEmail = 'lfdomc@gmail.com';
  const targetPassword = 'Luimorca22';
  
  try {
    // 1. Intentar login
    console.log(`\n🔑 Intentando login con: ${targetEmail}`);
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password: targetPassword,
    });
    
    if (loginError) {
      console.log('❌ Error en login:', loginError.message);
      return;
    }
    
    console.log('✅ Login exitoso');
    console.log('   - Usuario ID:', loginData.user?.id);
    console.log('   - Email:', loginData.user?.email);
    
    // 2. Verificar sesión actual
    console.log('\n📋 Verificando sesión actual...');
    
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Error obteniendo sesión:', sessionError.message);
      return;
    }
    
    if (!sessionData.session) {
      console.log('❌ No hay sesión activa');
      return;
    }
    
    console.log('✅ Sesión activa confirmada');
    console.log('   - Usuario ID:', sessionData.session.user.id);
    console.log('   - Expira:', new Date(sessionData.session.expires_at * 1000).toLocaleString());
    
    // 3. Intentar obtener perfil del usuario
    console.log('\n👤 Obteniendo perfil de usuario...');
    
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', sessionData.session.user.id)
      .single();
    
    if (profileError) {
      console.log('❌ Error obteniendo perfil:', profileError.message);
      console.log('   - Código:', profileError.code);
      console.log('   - Detalles:', profileError.details);
    } else {
      console.log('✅ Perfil obtenido exitosamente');
      console.log('   - ID:', profile.id);
      console.log('   - Email:', profile.email);
      console.log('   - Nombre:', profile.name);
      console.log('   - Rol:', profile.role);
    }
    
    // 4. Intentar obtener proyectos
    console.log('\n📋 Intentando obtener proyectos...');
    
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*');
    
    if (projectsError) {
      console.log('❌ Error obteniendo proyectos:', projectsError.message);
      console.log('   - Código:', projectsError.code);
      console.log('   - Detalles:', projectsError.details);
    } else {
      console.log(`✅ Proyectos obtenidos: ${projects.length}`);
      projects.forEach((project, index) => {
        console.log(`   ${index + 1}. ${project.name || 'Sin nombre'} (ID: ${project.id})`);
      });
    }
    
    // 5. Intentar obtener gastos
    console.log('\n💰 Intentando obtener gastos...');
    
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*');
    
    if (expensesError) {
      console.log('❌ Error obteniendo gastos:', expensesError.message);
      console.log('   - Código:', expensesError.code);
      console.log('   - Detalles:', expensesError.details);
    } else {
      console.log(`✅ Gastos obtenidos: ${expenses.length}`);
      expenses.forEach((expense, index) => {
        console.log(`   ${index + 1}. ${expense.description || 'Sin descripción'} - $${expense.amount} (${expense.date})`);
      });
    }
    
    // 6. Intentar obtener equipos
    console.log('\n🚛 Intentando obtener equipos...');
    
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .select('*');
    
    if (equipmentError) {
      console.log('❌ Error obteniendo equipos:', equipmentError.message);
      console.log('   - Código:', equipmentError.code);
      console.log('   - Detalles:', equipmentError.details);
    } else {
      console.log(`✅ Equipos obtenidos: ${equipment.length}`);
      equipment.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.name || 'Sin nombre'} - ${item.type || 'Sin tipo'}`);
      });
    }
    
    // 7. Crear un proyecto de prueba completo y verificar campos guardados
    console.log('\n🧪 Creando proyecto de prueba con TODOS los campos del formulario...');

    // Obtener un cliente válido
    const { data: clientsList, error: clientsError } = await supabase
      .from('clients')
      .select('id, name')
      .limit(1);

    if (clientsError) {
      console.log('❌ Error obteniendo clientes:', clientsError.message);
      return;
    }
    if (!clientsList || clientsList.length === 0) {
      console.log('❌ No hay clientes disponibles para asignar al proyecto');
      return;
    }

    const clientId = clientsList[0].id;
    const userId = sessionData.session.user.id;

    // Definir datos del proyecto de prueba (usando valores válidos para el esquema actual)
    const testProject = {
      name: `Proyecto de Prueba ${new Date().toISOString()}`,
      description: 'Proyecto de prueba automático para verificación de campos',
      client_id: clientId,
      manager_id: userId, // opcional
      status: 'planificacion',
      location: 'San José, Costa Rica',
      exchange_rate_usd: 540,
      total_area: 1200,
      // Presupuestos y desglose
      presupuesto_inicial: 1000000,
      presupuesto_original: 1000000,
      presupuesto_final: 1000000,
      costos_directos: 350000,
      costos_indirectos: 50000,
      administracion: 100000,
      mano_obra: 300000,
      imprevistos: 50000,
      utilidad: 150000,
      // Fechas
      estimated_start_date: '2025-10-15',
      estimated_end_date: '2025-12-31',
      actual_start_date: null,
      actual_end_date: null,
      // Metadatos
      created_by: userId,
      // Compatibilidad con schema legacy
      budget: 1000000
    };

    // Insertar proyecto y obtener el ID
    const { data: insertData, error: insertError } = await supabase
      .from('projects')
      .insert(testProject)
      .select('id');

    if (insertError) {
      console.log('❌ No se puede insertar proyecto:', insertError.message);
      console.log('   - Código:', insertError.code);
      console.log('   - Detalles:', insertError.details);
      console.log('   - Hint:', insertError.hint);
      return;
    }

    const insertedId = Array.isArray(insertData) && insertData.length > 0 ? insertData[0].id : insertData?.id;
    console.log('✅ Proyecto insertado');
    console.log('   - ID del proyecto:', insertedId);

    // Obtener el proyecto completo para verificar campos
    const { data: savedProject, error: fetchError } = await supabase
      .from('projects')
      .select(`
        id, name, description, client_id, manager_id, status, location,
        exchange_rate_usd, total_area,
        presupuesto_inicial, presupuesto_original, presupuesto_final, budget,
        costos_directos, costos_indirectos, administracion, mano_obra, imprevistos, utilidad,
        estimated_start_date, estimated_end_date, actual_start_date, actual_end_date,
        created_by, created_at, updated_at
      `)
      .eq('id', insertedId)
      .single();

    if (fetchError) {
      console.log('⚠️ Proyecto creado, pero no se pudo obtener datos completos:', fetchError.message);
      console.log('   - Código:', fetchError.code);
      console.log('   - Detalles:', fetchError.details);
    } else {
      console.log('\n🔎 Verificación de campos guardados:');
      const fields = [
        'id','name','description','client_id','manager_id','status','location',
        'exchange_rate_usd','total_area',
        'presupuesto_inicial','presupuesto_original','presupuesto_final','budget',
        'costos_directos','costos_indirectos','administracion','mano_obra','imprevistos','utilidad',
        'estimated_start_date','estimated_end_date','actual_start_date','actual_end_date',
        'created_by','created_at','updated_at'
      ];
      fields.forEach(f => {
        console.log(`   - ${f}:`, savedProject?.[f]);
      });

      console.log('\n✅ Proyecto de prueba creado y verificado exitosamente');
      console.log('   (No se eliminará para permitir verificación en la UI y endpoints de debug)');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  } finally {
    // Cerrar sesión al final
    console.log('\n🚪 Cerrando sesión...');
    await supabase.auth.signOut();
    console.log('✅ Sesión cerrada');
  }
}

testUserSession().then(() => {
  console.log('\n✅ Prueba completada');
}).catch(error => {
  console.error('❌ Error en prueba:', error);
});