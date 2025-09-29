const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

async function optimizeDatabaseIndexes() {
  console.log('🚀 Iniciando optimización de índices de base de datos...\n');

  try {
    // Configurar Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Variables de entorno de Supabase no encontradas');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250130000005_optimize_database_indexes.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Archivo de migración no encontrado: ${migrationPath}`);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Archivo de migración cargado correctamente\n');

    // Dividir el SQL en comandos individuales
    const sqlCommands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📊 Se ejecutarán ${sqlCommands.length} comandos SQL\n`);

    // Ejecutar comandos uno por uno
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      
      // Saltar comentarios y comandos vacíos
      if (command.startsWith('--') || command.trim() === '') {
        continue;
      }

      try {
        console.log(`⚡ Ejecutando comando ${i + 1}/${sqlCommands.length}...`);
        
        // Ejecutar el comando SQL
        const { error } = await supabase.rpc('exec', { sql: command + ';' });
        
        if (error) {
          // Algunos errores son esperados (como índices que ya existen)
          if (error.message.includes('already exists') || 
              error.message.includes('does not exist') ||
              error.message.includes('IF NOT EXISTS')) {
            console.log(`   ⚠️  Advertencia: ${error.message}`);
          } else {
            console.log(`   ❌ Error: ${error.message}`);
            errorCount++;
          }
        } else {
          console.log(`   ✅ Comando ejecutado exitosamente`);
          successCount++;
        }
      } catch (err) {
        console.log(`   💥 Error inesperado: ${err.message}`);
        errorCount++;
      }
    }

    console.log('\n📊 Resumen de la optimización:');
    console.log(`   ✅ Comandos exitosos: ${successCount}`);
    console.log(`   ❌ Comandos con errores: ${errorCount}`);
    console.log(`   📈 Total procesados: ${successCount + errorCount}\n`);

    // Verificar índices creados
    console.log('🔍 Verificando índices creados...');
    
    const { data: indexes, error: indexError } = await supabase
      .from('pg_indexes')
      .select('schemaname, tablename, indexname')
      .eq('schemaname', 'public')
      .like('indexname', 'idx_%')
      .order('tablename')
      .order('indexname');

    if (indexError) {
      console.log(`❌ Error al verificar índices: ${indexError.message}`);
    } else if (indexes && indexes.length > 0) {
      console.log(`📋 Índices encontrados (${indexes.length}):`);
      
      const indexesByTable = indexes.reduce((acc, index) => {
        if (!acc[index.tablename]) {
          acc[index.tablename] = [];
        }
        acc[index.tablename].push(index.indexname);
        return acc;
      }, {});

      Object.entries(indexesByTable).forEach(([table, tableIndexes]) => {
        console.log(`   📊 ${table}: ${tableIndexes.length} índices`);
        tableIndexes.forEach(indexName => {
          console.log(`      - ${indexName}`);
        });
      });
    } else {
      console.log('   ⚠️  No se encontraron índices personalizados');
    }

    // Probar rendimiento de consultas clave
    console.log('\n🏃‍♂️ Probando rendimiento de consultas optimizadas...');
    
    const performanceTests = [
      {
        name: 'Dashboard KPIs',
        query: () => supabase.rpc('get_dashboard_kpis')
      },
      {
        name: 'Proyectos con resumen',
        query: () => supabase.rpc('get_projects_with_summary', { p_limit: 10, p_offset: 0 })
      },
      {
        name: 'Gastos paginados',
        query: () => supabase.rpc('get_expenses_paginated', { 
          p_limit: 10, 
          p_offset: 0,
          p_project_id: null,
          p_category: null,
          p_payment_status: null
        })
      }
    ];

    for (const test of performanceTests) {
      try {
        const startTime = Date.now();
        const { data, error } = await test.query();
        const endTime = Date.now();
        
        if (error) {
          console.log(`   ❌ ${test.name}: Error - ${error.message}`);
        } else {
          console.log(`   ✅ ${test.name}: ${endTime - startTime}ms (${data?.length || 0} resultados)`);
        }
      } catch (err) {
        console.log(`   💥 ${test.name}: Error inesperado - ${err.message}`);
      }
    }

    console.log('\n🎉 Optimización de índices completada!');
    
    if (errorCount === 0) {
      console.log('✨ Todos los índices se aplicaron correctamente');
    } else {
      console.log(`⚠️  Se completó con ${errorCount} errores (algunos pueden ser esperados)`);
    }

  } catch (error) {
    console.error('💥 Error fatal durante la optimización:', error.message);
    process.exit(1);
  }
}

// Ejecutar la optimización
optimizeDatabaseIndexes()
  .then(() => {
    console.log('\n✅ Proceso de optimización finalizado');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Error fatal:', error.message);
    process.exit(1);
  });