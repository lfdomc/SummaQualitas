require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Usar service role key para bypasear RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno necesarias');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

// Cliente con service role (bypasa RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testProjectCreationWithServiceRole() {
  console.log('🔗 Probando creación de proyecto con Service Role Key...');
  console.log('URL:', supabaseUrl);
  console.log('Service Role Key:', supabaseServiceKey ? 'Configurada ✅' : 'No configurada ❌');
  
  try {
    console.log('\n1. Verificando conexión básica...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('projects')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Error de conexión:', connectionError.message);
      return;
    }
    
    console.log('✅ Conexión básica exitosa');
    
    console.log('\n2. Verificando clientes disponibles...');
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('id, name')
      .limit(1);
    
    if (clientError) {
      console.error('❌ Error obteniendo clientes:', clientError.message);
      return;
    }
    
    if (!clients || clients.length === 0) {
      console.log('⚠️ No hay clientes disponibles, creando uno...');
      
      const { data: newClient, error: createClientError } = await supabase
        .from('clients')
        .insert({
          name: 'Cliente de Prueba',
          email: 'cliente@prueba.com',
          phone: '+506 1234-5678'
        })
        .select()
        .single();
      
      if (createClientError) {
        console.error('❌ Error creando cliente:', createClientError.message);
        return;
      }
      
      console.log('✅ Cliente creado:', newClient.name, '(ID:', newClient.id, ')');
      clients.push(newClient);
    }
    
    const clientId = clients[0].id;
    console.log('✅ Usando cliente:', clients[0].name, '(ID:', clientId, ')');
    
    console.log('\n3. Probando creación de proyecto...');
    
    const projectData = {
      name: 'Proyecto de Prueba Service Role ' + Date.now(),
      description: 'Proyecto creado para probar la funcionalidad con service role',
      client_id: clientId,
      status: 'active',
      location: 'San José, Costa Rica',
      estimated_start_date: new Date().toISOString().split('T')[0],
      estimated_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      exchange_rate_usd: 500,
      total_area: 100,
      presupuesto_inicial: 1000000,
      costos_directos_materiales: 400000,
      costos_directos_equipos: 200000,
      costos_indirectos: 150000,
      gastos_administrativos: 100000,
      mano_obra_quincenal: 100000,
      imprevistos: 30000,
      utilidad_esperada: 20000,
      budget: 1000000,
      created_by: '00000000-0000-0000-0000-000000000000' // UUID dummy
    };
    
    console.log('📝 Datos del proyecto a crear:', JSON.stringify(projectData, null, 2));
    
    const { data: newProject, error: createError } = await supabase
      .from('projects')
      .insert([projectData])
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Error al crear proyecto:');
      console.error('- Código:', createError.code);
      console.error('- Mensaje:', createError.message);
      console.error('- Detalles:', createError.details);
      console.error('- Hint:', createError.hint);
      console.error('- Error completo:', JSON.stringify(createError, null, 2));
      return;
    }
    
    console.log('✅ Proyecto creado exitosamente!');
    console.log('📋 Datos del proyecto:', JSON.stringify(newProject, null, 2));
    
    console.log('\n4. Limpiando - eliminando proyecto de prueba...');
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', newProject.id);
    
    if (deleteError) {
      console.error('⚠️ Error eliminando proyecto de prueba:', deleteError.message);
    } else {
      console.log('✅ Proyecto de prueba eliminado correctamente');
    }
    
  } catch (error) {
    console.error('💥 Error general:', error.message);
    console.error('Stack:', error.stack);
  }
}

testProjectCreationWithServiceRole()
  .then(() => {
    console.log('\n✅ Prueba completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });