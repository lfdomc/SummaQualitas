const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkCurrentStatusConstraint() {
  console.log('🔍 VERIFICANDO RESTRICCIÓN ACTUAL DE STATUS');
  console.log('='.repeat(50));
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ Variables de entorno faltantes');
      return;
    }
    
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    
    console.log('\n1. Obteniendo información de la tabla projects...');
    
    // Obtener información de la tabla
    const { data: tableInfo, error: tableError } = await adminClient
      .rpc('exec_sql', {
        sql: `
          SELECT 
            column_name,
            data_type,
            column_default,
            is_nullable
          FROM information_schema.columns 
          WHERE table_name = 'projects' 
            AND table_schema = 'public'
            AND column_name = 'status';
        `
      });
    
    if (tableError) {
      console.log('ℹ️  No se pudo obtener info con RPC, probando método directo...');
    } else {
      console.log('📋 Información de la columna status:', tableInfo);
    }
    
    console.log('\n2. Probando valores específicos basados en los archivos encontrados...');
    
    // Valores encontrados en los diferentes archivos
    const statusSets = {
      'reset-database.js': ['planning', 'in_progress', 'completed', 'cancelled'],
      'complete-reset.sql': ['active', 'completed', 'paused', 'cancelled'],
      'recreate-projects-table.js': ['planificacion', 'en_progreso', 'pausado', 'completado', 'cancelado']
    };
    
    for (const [source, statuses] of Object.entries(statusSets)) {
      console.log(`\n   Probando valores de ${source}:`);
      
      for (const status of statuses) {
        const testData = {
          name: `Test ${status}`,
          description: 'Test description',
          status: status,
          created_by: '00000000-0000-0000-0000-000000000003',
          presupuesto_inicial: 1000
        };
        
        const { data, error } = await adminClient
          .from('projects')
          .insert([testData])
          .select('id, status')
          .single();
        
        if (error) {
          if (error.code === '23514') {
            console.log(`     ❌ '${status}' - NO VÁLIDO (restricción check)`);
          } else if (error.code === '23503') {
            console.log(`     ⚠️  '${status}' - Válido para status, pero falla por foreign key`);
          } else {
            console.log(`     ❌ '${status}' - Error: ${error.message}`);
          }
        } else {
          console.log(`     ✅ '${status}' - VÁLIDO Y CREADO`);
          
          // Limpiar el registro de prueba
          await adminClient
            .from('projects')
            .delete()
            .eq('id', data.id);
        }
      }
    }
    
    console.log('\n3. Intentando obtener la definición exacta de la restricción...');
    
    const { data: constraints, error: constraintsError } = await adminClient
      .rpc('exec_sql', {
        sql: `
          SELECT 
            conname as constraint_name,
            pg_get_constraintdef(oid) as constraint_definition
          FROM pg_constraint 
          WHERE conrelid = 'public.projects'::regclass 
            AND contype = 'c'
            AND conname LIKE '%status%';
        `
      });
    
    if (constraintsError) {
      console.log('❌ No se pudo obtener la definición de restricciones');
    } else {
      console.log('📋 Restricciones de status encontradas:');
      constraints?.forEach(constraint => {
        console.log(`   ${constraint.constraint_name}: ${constraint.constraint_definition}`);
      });
    }
    
  } catch (error) {
    console.error('💥 ERROR GENERAL:', error.message);
  }
}

checkCurrentStatusConstraint();