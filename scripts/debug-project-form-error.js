const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function debugProjectFormError() {
  console.log('🔍 DEPURANDO ERROR DEL FORMULARIO DE PROYECTOS');
  console.log('='.repeat(50));
  
  try {
    // Configurar cliente administrativo
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ Variables de entorno faltantes');
      return;
    }
    
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    
    console.log('\n1. Verificando conexión con cliente administrativo...');
    const { data: testConnection, error: connectionError } = await adminClient
      .from('projects')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Error de conexión:', connectionError);
      return;
    }
    
    console.log('✅ Conexión exitosa');
    
    console.log('\n2. Simulando datos del formulario...');
    const formData = {
      name: 'Proyecto de Prueba Debug',
      description: 'Descripción de prueba para debug',
      client_id: '00000000-0000-0000-0000-000000000001', // UUID dummy
      manager_id: '00000000-0000-0000-0000-000000000002', // UUID dummy
      status: 'active',
      location: 'Lima, Perú',
      exchange_rate_usd: 3.8,
      total_area: 100,
      presupuesto_inicial: 50000,
      costos_directos_materiales: 20000,
      costos_directos_equipos: 10000,
      costos_indirectos: 5000,
      gastos_administrativos: 3000,
      mano_obra_quincenal: 8000,
      imprevistos: 2000,
      utilidad_esperada: 2000,
      estimated_start_date: '2024-02-01',
      estimated_end_date: '2024-06-01'
    };
    
    console.log('📋 Datos del formulario:', JSON.stringify(formData, null, 2));
    
    console.log('\n3. Verificando si existen clientes...');
    const { data: clients, error: clientsError } = await adminClient
      .from('clients')
      .select('id, name')
      .limit(5);
    
    if (clientsError) {
      console.error('❌ Error obteniendo clientes:', clientsError);
    } else {
      console.log('✅ Clientes encontrados:', clients?.length || 0);
      if (clients && clients.length > 0) {
        formData.client_id = clients[0].id;
        console.log('🔄 Usando cliente existente:', clients[0].name);
      }
    }
    
    console.log('\n4. Verificando si existen usuarios para manager...');
    const { data: users, error: usersError } = await adminClient
      .from('user_profiles')
      .select('id, email, full_name')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Error obteniendo usuarios:', usersError);
    } else {
      console.log('✅ Usuarios encontrados:', users?.length || 0);
      if (users && users.length > 0) {
        formData.manager_id = users[0].id;
        console.log('🔄 Usando usuario existente como manager:', users[0].email);
      }
    }
    
    console.log('\n5. Preparando objeto para inserción...');
    const projectToCreate = {
      ...formData,
      created_by: formData.manager_id || '00000000-0000-0000-0000-000000000003'
    };
    
    console.log('🚀 Objeto final para inserción:', JSON.stringify(projectToCreate, null, 2));
    
    console.log('\n6. Intentando crear proyecto...');
    const { data: newProject, error: createError } = await adminClient
      .from('projects')
      .insert([projectToCreate])
      .select(`
        *,
        client:clients(*)
      `)
      .single();
    
    if (createError) {
      console.error('❌ ERROR COMPLETO DE SUPABASE:');
      console.error('   Tipo:', typeof createError);
      console.error('   Propiedades:', Object.keys(createError));
      console.error('   Mensaje:', createError.message);
      console.error('   Código:', createError.code);
      console.error('   Detalles:', createError.details);
      console.error('   Hint:', createError.hint);
      console.error('   JSON completo:', JSON.stringify(createError, null, 2));
      
      // Verificar si es un error de esquema
      if (createError.code === '42703') {
        console.log('\n🔍 Error de columna no encontrada. Verificando esquema...');
        const { data: schemaInfo, error: schemaError } = await adminClient
          .rpc('get_table_columns', { table_name: 'projects' });
        
        if (!schemaError && schemaInfo) {
          console.log('📋 Columnas disponibles en la tabla projects:', schemaInfo);
        }
      }
      
      return;
    }
    
    console.log('✅ Proyecto creado exitosamente:', newProject);
    
    console.log('\n7. Limpiando - eliminando proyecto de prueba...');
    const { error: deleteError } = await adminClient
      .from('projects')
      .delete()
      .eq('id', newProject.id);
    
    if (deleteError) {
      console.error('⚠️ Error eliminando proyecto de prueba:', deleteError.message);
    } else {
      console.log('✅ Proyecto de prueba eliminado');
    }
    
  } catch (error) {
    console.error('💥 ERROR GENERAL:', {
      message: error.message,
      stack: error.stack,
      type: typeof error,
      keys: Object.keys(error)
    });
  }
}

debugProjectFormError();