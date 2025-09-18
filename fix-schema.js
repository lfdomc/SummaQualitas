const { createClient } = require('@supabase/supabase-js');

async function addColumnsToProjects() {
  // Configuración de Supabase con service role key
  const supabaseUrl = 'https://hypravgvtrlfpepslhmc.supabase.co';
  const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5cHJhdmd2dHJsZnBlcHNsaG1jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE1ODUwNCwiZXhwIjoyMDczNzM0NTA0fQ.ffmRtDz8rVTXS89dcUJM3TqnRbVe1SxisauLanSwC_E';
  
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    console.log('Conectando a Supabase...');

    // Comandos SQL para agregar las columnas faltantes
    const sqlCommands = [
      // Agregar columnas de costos directos
      'ALTER TABLE projects ADD COLUMN IF NOT EXISTS costos_directos_equipos DECIMAL(15,2) DEFAULT 0',
      'ALTER TABLE projects ADD COLUMN IF NOT EXISTS costos_directos_materiales DECIMAL(15,2) DEFAULT 0',
      'ALTER TABLE projects ADD COLUMN IF NOT EXISTS costos_directos_mano_obra DECIMAL(15,2) DEFAULT 0',
      'ALTER TABLE projects ADD COLUMN IF NOT EXISTS costos_directos_subcontratos DECIMAL(15,2) DEFAULT 0',
      
      // Agregar columnas de costos indirectos
      'ALTER TABLE projects ADD COLUMN IF NOT EXISTS costos_indirectos_administracion DECIMAL(15,2) DEFAULT 0',
      'ALTER TABLE projects ADD COLUMN IF NOT EXISTS costos_indirectos_imprevistos DECIMAL(15,2) DEFAULT 0',
      'ALTER TABLE projects ADD COLUMN IF NOT EXISTS costos_indirectos_utilidad DECIMAL(15,2) DEFAULT 0',
      'ALTER TABLE projects ADD COLUMN IF NOT EXISTS costos_indirectos_financiamiento DECIMAL(15,2) DEFAULT 0',
      'ALTER TABLE projects ADD COLUMN IF NOT EXISTS costos_indirectos_fianzas DECIMAL(15,2) DEFAULT 0',
      
      // Agregar columnas de presupuesto
      'ALTER TABLE projects ADD COLUMN IF NOT EXISTS presupuesto_inicial DECIMAL(15,2) DEFAULT 0',
      'ALTER TABLE projects ADD COLUMN IF NOT EXISTS presupuesto_actual DECIMAL(15,2) DEFAULT 0',
      'ALTER TABLE projects ADD COLUMN IF NOT EXISTS presupuesto_final DECIMAL(15,2) DEFAULT 0',
      
      // Agregar columnas de fechas
      'ALTER TABLE projects ADD COLUMN IF NOT EXISTS estimated_start_date DATE',
      'ALTER TABLE projects ADD COLUMN IF NOT EXISTS actual_start_date DATE',
      'ALTER TABLE projects ADD COLUMN IF NOT EXISTS estimated_end_date DATE',
      'ALTER TABLE projects ADD COLUMN IF NOT EXISTS actual_end_date DATE',
      
      // Agregar otras columnas necesarias
      'ALTER TABLE projects ADD COLUMN IF NOT EXISTS exchange_rate_usd DECIMAL(10,4) DEFAULT 1.0000',
      'ALTER TABLE projects ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT \'MXN\'',
      'ALTER TABLE projects ADD COLUMN IF NOT EXISTS profit_margin DECIMAL(5,2) DEFAULT 0',
      'ALTER TABLE projects ADD COLUMN IF NOT EXISTS contingency_percentage DECIMAL(5,2) DEFAULT 0'
    ];

    console.log('Ejecutando comandos SQL...');
    
    // Ejecutar cada comando SQL
    for (let i = 0; i < sqlCommands.length; i++) {
      try {
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: sqlCommands[i] 
        });
        
        if (error) {
          // Si exec_sql no existe, intentar con una consulta directa
          console.log(`Intentando método alternativo para comando ${i + 1}...`);
          
          // Para ALTER TABLE, usaremos una función personalizada o API directa
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${serviceRoleKey}`,
              'apikey': serviceRoleKey
            },
            body: JSON.stringify({ sql_query: sqlCommands[i] })
          });
          
          if (!response.ok) {
            console.log(`✗ Error en comando ${i + 1}: ${response.statusText}`);
          } else {
            console.log(`✓ Comando ${i + 1}/${sqlCommands.length} ejecutado`);
          }
        } else {
          console.log(`✓ Comando ${i + 1}/${sqlCommands.length} ejecutado`);
        }
      } catch (error) {
        console.log(`✗ Error en comando ${i + 1}: ${error.message}`);
      }
    }

    // Verificar las columnas existentes
    console.log('\nVerificando estructura de la tabla projects...');
    
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'projects')
      .eq('table_schema', 'public')
      .order('column_name');

    if (columnsError) {
      console.log('Error al verificar columnas:', columnsError.message);
      
      // Método alternativo: intentar insertar un proyecto de prueba
      console.log('\nProbando inserción de proyecto de prueba...');
      
      const testProject = {
        name: 'TEST_PROJECT_SCHEMA',
        description: 'Proyecto de prueba para verificar esquema',
        costos_directos_equipos: 1000,
        costos_directos_materiales: 2000,
        costos_directos_mano_obra: 3000,
        costos_directos_subcontratos: 4000,
        costos_indirectos_administracion: 500,
        costos_indirectos_imprevistos: 600,
        costos_indirectos_utilidad: 700,
        costos_indirectos_financiamiento: 800,
        costos_indirectos_fianzas: 900,
        presupuesto_inicial: 10000,
        presupuesto_actual: 10500,
        presupuesto_final: 11000,
        estimated_start_date: '2024-01-01',
        actual_start_date: '2024-01-02',
        estimated_end_date: '2024-12-31',
        actual_end_date: '2024-12-30',
        exchange_rate_usd: 17.5000,
        currency: 'MXN',
        profit_margin: 15.00,
        contingency_percentage: 5.00
      };

      const { data: insertData, error: insertError } = await supabase
        .from('projects')
        .insert([testProject])
        .select();

      if (insertError) {
        console.log('✗ Error al insertar proyecto de prueba:', insertError.message);
        console.log('Esto indica que faltan columnas en la tabla.');
      } else {
        console.log('✓ Proyecto de prueba insertado exitosamente');
        
        // Eliminar el proyecto de prueba
        const { error: deleteError } = await supabase
          .from('projects')
          .delete()
          .eq('name', 'TEST_PROJECT_SCHEMA');
          
        if (!deleteError) {
          console.log('✓ Proyecto de prueba eliminado');
        }
      }
    } else {
      console.log('Columnas en la tabla projects:');
      columns.forEach(col => {
        console.log(`- ${col.column_name} (${col.data_type})`);
      });
    }

    console.log('\n✓ Proceso completado!');

  } catch (error) {
    console.error('✗ Error general:', error.message);
  }
}

addColumnsToProjects();