require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  console.log('Verifica que .env.local contenga:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  console.log('🧪 PROBANDO LA BASE DE DATOS DESPUÉS DEL RESET');
  console.log('===============================================');
  
  try {
    // Paso 1: Probar acceso a user_profiles
    console.log('\n📋 Paso 1: Probando acceso a user_profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
      
    if (profilesError) {
      console.log('    ❌ Error accediendo a user_profiles:', profilesError.message);
      if (profilesError.message.includes('infinite recursion')) {
        console.log('    🚨 PROBLEMA: Aún existe recursión RLS');
        console.log('    🔧 SOLUCIÓN: Ejecuta database/complete-reset.sql en Supabase');
        return;
      }
    } else {
      console.log('    ✅ Acceso a user_profiles funcionando');
      console.log(`    📊 Registros encontrados: ${profiles?.length || 0}`);
    }
    
    // Paso 2: Probar acceso a projects
    console.log('\n📋 Paso 2: Probando acceso a projects...');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(1);
      
    if (projectsError) {
      console.log('    ❌ Error accediendo a projects:', projectsError.message);
    } else {
      console.log('    ✅ Acceso a projects funcionando');
      console.log(`    📊 Registros encontrados: ${projects?.length || 0}`);
    }
    
    // Paso 3: Probar acceso a equipment
    console.log('\n📋 Paso 3: Probando acceso a equipment...');
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .select('*')
      .limit(1);
      
    if (equipmentError) {
      console.log('    ❌ Error accediendo a equipment:', equipmentError.message);
    } else {
      console.log('    ✅ Acceso a equipment funcionando');
      console.log(`    📊 Registros encontrados: ${equipment?.length || 0}`);
    }
    
    // Paso 4: Probar acceso a invoices
    console.log('\n📋 Paso 4: Probando acceso a invoices...');
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('*')
      .limit(1);
      
    if (invoicesError) {
      console.log('    ❌ Error accediendo a invoices:', invoicesError.message);
    } else {
      console.log('    ✅ Acceso a invoices funcionando');
      console.log(`    📊 Registros encontrados: ${invoices?.length || 0}`);
    }
    
    // Paso 5: Probar acceso a reports
    console.log('\n📋 Paso 5: Probando acceso a reports...');
    const { data: reports, error: reportsError } = await supabase
      .from('reports')
      .select('*')
      .limit(1);
      
    if (reportsError) {
      console.log('    ❌ Error accediendo a reports:', reportsError.message);
    } else {
      console.log('    ✅ Acceso a reports funcionando');
      console.log(`    📊 Registros encontrados: ${reports?.length || 0}`);
    }
    
    // Paso 6: Probar acceso a alerts
    console.log('\n📋 Paso 6: Probando acceso a alerts...');
    const { data: alerts, error: alertsError } = await supabase
      .from('alerts')
      .select('*')
      .limit(1);
      
    if (alertsError) {
      console.log('    ❌ Error accediendo a alerts:', alertsError.message);
    } else {
      console.log('    ✅ Acceso a alerts funcionando');
      console.log(`    📊 Registros encontrados: ${alerts?.length || 0}`);
    }
    
    // Resumen final
    console.log('\n🎉 RESUMEN DE PRUEBAS');
    console.log('=====================');
    
    const errors = [
      profilesError,
      projectsError,
      equipmentError,
      invoicesError,
      reportsError,
      alertsError
    ].filter(Boolean);
    
    if (errors.length === 0) {
      console.log('✅ ¡TODAS LAS TABLAS FUNCIONAN CORRECTAMENTE!');
      console.log('✅ No hay errores de recursión RLS');
      console.log('✅ La base de datos está lista para usar');
      console.log('\n🚀 Tu aplicación Next.js debería funcionar sin problemas');
    } else {
      console.log(`❌ Se encontraron ${errors.length} errores`);
      console.log('🔧 Ejecuta database/complete-reset.sql en el panel de Supabase');
    }
    
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
    console.log('\n🔧 SOLUCIÓN: Ejecuta database/complete-reset.sql en Supabase');
  }
}

// Ejecutar las pruebas
testDatabase();