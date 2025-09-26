const { config } = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// Cargar variables de entorno desde .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ Configurada' : '❌ No encontrada');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓ Configurada' : '❌ No encontrada');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProjectsLoad() {
  try {
    console.log('🔍 Probando la carga de proyectos...');
    
    // Probar la consulta exacta que usa getAllProjects()
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        client:clients(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error al cargar proyectos:', error);
      return;
    }

    console.log('✅ Proyectos cargados exitosamente');
    console.log(`📊 Total de proyectos encontrados: ${data?.length || 0}`);
    
    if (data && data.length > 0) {
      console.log('\n📋 Proyectos encontrados:');
      data.forEach((project, index) => {
        console.log(`${index + 1}. ${project.name} (ID: ${project.id})`);
        console.log(`   Cliente: ${project.client?.name || 'Sin cliente'}`);
        console.log(`   Estado: ${project.status}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No se encontraron proyectos en la base de datos');
    }

    // Verificar también la tabla de clientes
    console.log('\n🔍 Verificando clientes...');
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .order('name');

    if (clientsError) {
      console.error('❌ Error al cargar clientes:', clientsError);
    } else {
      console.log(`✅ Clientes encontrados: ${clients?.length || 0}`);
      if (clients && clients.length > 0) {
        clients.forEach((client, index) => {
          console.log(`${index + 1}. ${client.name} (ID: ${client.id})`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

testProjectsLoad();