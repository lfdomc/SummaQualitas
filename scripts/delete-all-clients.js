const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://eavnuiwjtuzvkyghexfj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhdm51aXdqdHV6dmt5Z2hleGZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTczNzEzMCwiZXhwIjoyMDcxMzEzMTMwfQ.GI_1wtNDYkt9M0gf3hxv-XfrSlnzyyr4-oiJQL-F6d4';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deleteAllClients() {
  console.log('🗑️ Iniciando eliminación completa de clientes...\n');

  try {
    // 1. Verificar estado inicial
    console.log('📊 Estado inicial de la base de datos:');
    
    const { data: initialClients } = await supabase.from('clients').select('id, name');
    const { data: initialProjects } = await supabase.from('projects').select('id, name, client_id');
    const { data: initialPayments } = await supabase.from('client_payments').select('id, client_id');
    const { data: initialIncomes } = await supabase.from('incomes').select('id, client_id');

    console.log(`- Clientes: ${initialClients?.length || 0}`);
    console.log(`- Proyectos: ${initialProjects?.length || 0}`);
    console.log(`- Pagos de clientes: ${initialPayments?.length || 0}`);
    console.log(`- Ingresos: ${initialIncomes?.length || 0}\n`);

    if (!initialClients || initialClients.length === 0) {
      console.log('✅ No hay clientes para eliminar.');
      return;
    }

    console.log('📋 Clientes encontrados:');
    initialClients.forEach((client, index) => {
      console.log(`${index + 1}. ${client.name} (${client.id})`);
    });
    console.log('');

    // 2. ENFOQUE 1: Eliminación masiva de dependencias
    console.log('🔄 ENFOQUE 1: Eliminación masiva de dependencias...\n');

    try {
      // Eliminar ingresos relacionados con clientes
      console.log('🗑️ Eliminando ingresos...');
      const { error: incomesError } = await supabase
        .from('incomes')
        .delete()
        .not('client_id', 'is', null);
      
      if (incomesError) {
        console.log(`❌ Error eliminando ingresos: ${incomesError.message}`);
      } else {
        console.log('✅ Ingresos eliminados');
      }

      // Eliminar pagos de clientes
      console.log('🗑️ Eliminando pagos de clientes...');
      const { error: paymentsError } = await supabase
        .from('client_payments')
        .delete()
        .not('client_id', 'is', null);
      
      if (paymentsError) {
        console.log(`❌ Error eliminando pagos: ${paymentsError.message}`);
      } else {
        console.log('✅ Pagos de clientes eliminados');
      }

      // Eliminar proyectos relacionados con clientes
      console.log('🗑️ Eliminando proyectos...');
      const { error: projectsError } = await supabase
        .from('projects')
        .delete()
        .not('client_id', 'is', null);
      
      if (projectsError) {
        console.log(`❌ Error eliminando proyectos: ${projectsError.message}`);
      } else {
        console.log('✅ Proyectos eliminados');
      }

    } catch (error) {
      console.log(`❌ Error en eliminación masiva: ${error.message}`);
    }

    // 3. ENFOQUE 2: Eliminación individual de clientes
    console.log('\n🔄 ENFOQUE 2: Eliminación individual de clientes...\n');

    for (const client of initialClients) {
      try {
        console.log(`🗑️ Eliminando cliente: ${client.name} (${client.id})`);

        // Eliminar dependencias específicas del cliente
        await supabase.from('incomes').delete().eq('client_id', client.id);
        await supabase.from('client_payments').delete().eq('client_id', client.id);
        await supabase.from('projects').delete().eq('client_id', client.id);

        // Eliminar el cliente
        const { error: clientError } = await supabase
          .from('clients')
          .delete()
          .eq('id', client.id);

        if (clientError) {
          console.log(`❌ Error eliminando cliente ${client.name}: ${clientError.message}`);
        } else {
          console.log(`✅ Cliente ${client.name} eliminado exitosamente`);
        }

      } catch (error) {
        console.log(`❌ Error procesando cliente ${client.name}: ${error.message}`);
      }
    }

    // 4. ENFOQUE 3: Fuerza bruta - eliminar en todas las tablas que puedan tener client_id
    console.log('\n🔄 ENFOQUE 3: Fuerza bruta - limpieza exhaustiva...\n');

    const tablesToClean = [
      'incomes',
      'client_payments', 
      'projects',
      'clients'
    ];

    for (const table of tablesToClean) {
      try {
        console.log(`🧹 Limpiando tabla: ${table}`);
        
        if (table === 'clients') {
          // Para la tabla clients, eliminar todos los registros
          const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
          if (error) {
            console.log(`❌ Error limpiando ${table}: ${error.message}`);
          } else {
            console.log(`✅ Tabla ${table} limpiada`);
          }
        } else {
          // Para otras tablas, eliminar registros con client_id
          const { error } = await supabase.from(table).delete().not('client_id', 'is', null);
          if (error) {
            console.log(`❌ Error limpiando ${table}: ${error.message}`);
          } else {
            console.log(`✅ Tabla ${table} limpiada`);
          }
        }
      } catch (error) {
        console.log(`❌ Error en tabla ${table}: ${error.message}`);
      }
    }

    // 5. Verificación final
    console.log('\n📊 Estado final de la base de datos:');
    
    const { data: finalClients } = await supabase.from('clients').select('id');
    const { data: finalProjects } = await supabase.from('projects').select('id');
    const { data: finalPayments } = await supabase.from('client_payments').select('id');
    const { data: finalIncomes } = await supabase.from('incomes').select('id');

    console.log(`- Clientes: ${finalClients?.length || 0}`);
    console.log(`- Proyectos: ${finalProjects?.length || 0}`);
    console.log(`- Pagos de clientes: ${finalPayments?.length || 0}`);
    console.log(`- Ingresos: ${finalIncomes?.length || 0}`);

    if ((finalClients?.length || 0) === 0) {
      console.log('\n🎉 ¡Eliminación completada exitosamente! Todos los clientes han sido eliminados.');
    } else {
      console.log(`\n⚠️ Aún quedan ${finalClients?.length} clientes en la base de datos.`);
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar la eliminación
deleteAllClients().then(() => {
  console.log('\n✅ Proceso de eliminación completado.');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error en el proceso:', error);
  process.exit(1);
});