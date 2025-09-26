const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eavnuiwjtuzvkyghexfj.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhdm51aXdqdHV6dmt5Z2hleGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzcxMzAsImV4cCI6MjA3MTMxMzEzMH0.R-vRms1HyN6qRWw-gSlmys071KoLwXvSe0t9rDpbrqo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkClients() {
  console.log('🔍 Verificando clientes en la base de datos...\n');

  try {
    // Obtener todos los clientes
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*');

    if (clientsError) {
      console.error('❌ Error al obtener clientes:', clientsError);
      return;
    }

    console.log(`📊 Total de clientes encontrados: ${clients?.length || 0}`);
    
    if (clients && clients.length > 0) {
      console.log('\n📋 Lista de clientes:');
      clients.forEach((client, index) => {
        console.log(`${index + 1}. ${client.name} (ID: ${client.id})`);
        console.log(`   - Email: ${client.email || 'No especificado'}`);
        console.log(`   - Teléfono: ${client.phone || 'No especificado'}`);
        console.log(`   - Estado: ${client.status || 'No especificado'}`);
        console.log('');
      });

      // Verificar dependencias
      console.log('🔗 Verificando dependencias...\n');

      for (const client of clients) {
        console.log(`📋 Cliente: ${client.name} (${client.id})`);

        // Verificar proyectos
        const { data: projects, error: projectsError } = await supabase
          .from('projects')
          .select('id, name')
          .eq('client_id', client.id);

        if (!projectsError && projects) {
          console.log(`   - Proyectos: ${projects.length}`);
          if (projects.length > 0) {
            projects.forEach(project => {
              console.log(`     • ${project.name} (${project.id})`);
            });
          }
        }

        // Verificar pagos de clientes
        const { data: payments, error: paymentsError } = await supabase
          .from('client_payments')
          .select('id, amount')
          .eq('client_id', client.id);

        if (!paymentsError && payments) {
          console.log(`   - Pagos: ${payments.length}`);
        }

        // Verificar ingresos
        const { data: incomes, error: incomesError } = await supabase
          .from('incomes')
          .select('id, amount')
          .eq('client_id', client.id);

        if (!incomesError && incomes) {
          console.log(`   - Ingresos: ${incomes.length}`);
        }

        console.log('');
      }
    } else {
      console.log('✅ No hay clientes en la base de datos.');
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar la verificación
checkClients().then(() => {
  console.log('✅ Verificación completada.');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error en la verificación:', error);
  process.exit(1);
});