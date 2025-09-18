const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? 'Presente' : 'Ausente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProjectCreation() {
  console.log('🔗 Probando conexión a Supabase...');
  console.log('URL:', supabaseUrl);
  
  try {
    // Primero, verificar conexión básica
    console.log('\n1. Verificando conexión básica...');
    const { data: testData, error: testError } = await supabase
      .from('projects')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Error en conexión básica:', testError);
      return;
    }
    
    console.log('✅ Conexión básica exitosa');
    
    // Verificar si existe un cliente para usar
    console.log('\n2. Verificando clientes disponibles...');
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('id, name')
      .limit(1);
    
    if (clientError) {
      console.error('❌ Error al obtener clientes:', clientError);
      return;
    }
    
    if (!clients || clients.length === 0) {
      console.log('⚠️ No hay clientes disponibles. Creando uno de prueba...');
      
      const { data: newClient, error: createClientError } = await supabase
        .from('clients')
        .insert({
          name: 'Cliente de Prueba',
          email: 'test@example.com',
          phone: '1234567890'
        })
        .select()
        .single();
      
      if (createClientError) {
        console.error('❌ Error al crear cliente de prueba:', createClientError);
        return;
      }
      
      console.log('✅ Cliente de prueba creado:', newClient);
      clients.push(newClient);
    }
    
    const clientId = clients[0].id;
    console.log('✅ Usando cliente:', clients[0].name, '(ID:', clientId, ')');
    
    // Ahora probar la creación del proyecto
    console.log('\n3. Probando creación de proyecto...');
    
    // Obtener un usuario para usar como created_by
    console.log('🔍 Buscando usuario para created_by...');
    
    // Primero intentar obtener usuario autenticado
    const { data: users, error: userError } = await supabase.auth.getUser();
    let createdBy = null;
    
    if (!userError && users?.user?.id) {
      createdBy = users.user.id;
      console.log('✅ Usuario autenticado encontrado:', createdBy);
    } else {
      console.log('⚠️ No hay usuario autenticado, buscando en tabla users...');
      
      // Buscar un usuario existente en la tabla users
      const { data: existingUsers, error: usersError } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      if (!usersError && existingUsers && existingUsers.length > 0) {
        createdBy = existingUsers[0].id;
        console.log('✅ Usuario existente encontrado:', createdBy);
      } else {
        console.log('⚠️ No se encontraron usuarios, usando UUID dummy...');
        // Usar un UUID dummy válido
        createdBy = '00000000-0000-0000-0000-000000000000';
      }
    }
    
    const projectData = {
      name: 'Proyecto de Prueba ' + Date.now(),
      description: 'Proyecto creado para probar la funcionalidad',
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
      created_by: createdBy
    };
    
    console.log('📝 Datos del proyecto a crear:', JSON.stringify(projectData, null, 2));
    
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert([projectData])
      .select(`
        *,
        client:clients(*)
      `)
      .single();
    
    if (projectError) {
      console.error('❌ Error al crear proyecto:');
      console.error('- Código:', projectError.code);
      console.error('- Mensaje:', projectError.message);
      console.error('- Detalles:', projectError.details);
      console.error('- Hint:', projectError.hint);
      console.error('- Error completo:', JSON.stringify(projectError, null, 2));
      return;
    }
    
    console.log('✅ Proyecto creado exitosamente:');
    console.log('- ID:', project.id);
    console.log('- Nombre:', project.name);
    console.log('- Status:', project.status);
    console.log('- Cliente:', project.client?.name);
    
    // Limpiar: eliminar el proyecto de prueba
    console.log('\n4. Limpiando proyecto de prueba...');
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', project.id);
    
    if (deleteError) {
      console.error('⚠️ Error al eliminar proyecto de prueba:', deleteError);
    } else {
      console.log('✅ Proyecto de prueba eliminado');
    }
    
  } catch (error) {
    console.error('💥 Error inesperado:', error);
  }
}

testProjectCreation();