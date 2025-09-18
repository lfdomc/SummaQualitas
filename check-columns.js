const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Columnas que deberían existir en la tabla projects
const requiredColumns = [
  'id',
  'name',
  'description',
  'client_id',
  'status',
  'location',
  'estimated_start_date',
  'estimated_end_date',
  'actual_start_date',
  'actual_end_date',
  'total_area',
  'exchange_rate_usd',
  'presupuesto_inicial',
  'presupuesto_original',
  'presupuesto_final',
  'budget',
  'costos_directos_materiales',
  'costos_directos_equipos',
  'costos_indirectos',
  'gastos_administrativos',
  'mano_obra_quincenal',
  'imprevistos',
  'utilidad_esperada',
  'created_at',
  'updated_at',
  'created_by'
];

async function checkProjectsColumns() {
  try {
    console.log('🧪 Probando creación de proyecto para verificar columnas...');
    
    // Primero verificar si hay clientes
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('id, name')
      .limit(1);

    if (clientError) {
      console.error('❌ Error obteniendo clientes:', clientError);
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
        console.error('❌ Error creando cliente:', createClientError);
        return;
      }
      
      console.log('✅ Cliente creado:', newClient.name, '(ID:', newClient.id, ')');
      clients.push(newClient);
    }

    const clientId = clients[0].id;
    console.log('✅ Usando cliente:', clients[0].name, '(ID:', clientId, ')');

    const testProject = {
      name: 'Proyecto de Prueba ' + Date.now(),
      description: 'Proyecto creado para verificar que todas las columnas funcionan',
      client_id: clientId,
      status: 'en_progreso',
      location: 'San José, Costa Rica',
      estimated_start_date: new Date().toISOString().split('T')[0],
      estimated_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      exchange_rate_usd: 500,
      total_area: 100,
      presupuesto_inicial: 1000000,
      presupuesto_original: 1000000,
      presupuesto_final: 1000000,
      budget: 1000000,
      costos_directos_materiales: 400000,
      costos_directos_equipos: 200000,
      costos_indirectos: 150000,
      gastos_administrativos: 100000,
      mano_obra_quincenal: 100000,
      imprevistos: 30000,
      utilidad_esperada: 20000,
      created_by: '00000000-0000-0000-0000-000000000000'
    };

    console.log('📝 Intentando crear proyecto de prueba...');
    
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert([testProject])
      .select()
      .single();

    if (projectError) {
      console.error('❌ Error al crear proyecto de prueba:');
      console.error('- Código:', projectError.code);
      console.error('- Mensaje:', projectError.message);
      console.error('- Detalles:', projectError.details);
      console.error('- Hint:', projectError.hint);
    } else {
      console.log('✅ Proyecto de prueba creado exitosamente!');
      console.log('- ID:', project.id);
      console.log('- Nombre:', project.name);
      
      // Limpiar - eliminar el proyecto de prueba
      console.log('\n🧹 Limpiando proyecto de prueba...');
      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id);
      
      if (deleteError) {
        console.error('⚠️ Error eliminando proyecto de prueba:', deleteError.message);
      } else {
        console.log('✅ Proyecto de prueba eliminado correctamente');
      }
    }

  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

checkProjectsColumns()
  .then(() => {
    console.log('\n✅ Verificación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });