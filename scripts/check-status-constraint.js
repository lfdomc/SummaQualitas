const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkStatusConstraint() {
  console.log('🔍 VERIFICANDO RESTRICCIÓN DE STATUS EN PROJECTS');
  console.log('='.repeat(50));
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ Variables de entorno faltantes');
      return;
    }
    
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    
    console.log('\n1. Verificando restricciones de la tabla projects...');
    
    // Método alternativo: probar diferentes valores de status
    console.log('\n2. Probando diferentes valores de status...');
    
    const statusValues = [
      'planificacion',
      'en_progreso', 
      'pausado',
      'completado',
      'cancelado',
      'planning',
      'in_progress',
      'paused',
      'completed',
      'cancelled',
      'active',
      'inactive'
    ];
    
    for (const status of statusValues) {
      console.log(`\n   Probando status: '${status}'`);
      
      const testData = {
        name: `Test Status ${status}`,
        description: 'Test description',
        status: status,
        client_id: '00000000-0000-0000-0000-000000000001',
        manager_id: '00000000-0000-0000-0000-000000000002',
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
          console.log(`   ❌ '${status}' - NO VÁLIDO (violación de restricción)`);
        } else {
          console.log(`   ❌ '${status}' - Error: ${error.message}`);
        }
      } else {
        console.log(`   ✅ '${status}' - VÁLIDO`);
        
        // Limpiar el registro de prueba
        await adminClient
          .from('projects')
          .delete()
          .eq('id', data.id);
      }
    }
    
    console.log('\n3. Verificando proyectos existentes para ver qué status usan...');
    const { data: existingProjects, error: projectsError } = await adminClient
      .from('projects')
      .select('status')
      .limit(10);
    
    if (projectsError) {
      console.error('❌ Error obteniendo proyectos existentes:', projectsError.message);
    } else {
      const uniqueStatuses = [...new Set(existingProjects?.map(p => p.status) || [])];
      console.log('📋 Status encontrados en proyectos existentes:', uniqueStatuses);
    }
    
  } catch (error) {
    console.error('💥 ERROR GENERAL:', error.message);
  }
}

checkStatusConstraint();