const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Diagnóstico del Dashboard Optimizado\n');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDashboardFunctions() {
  console.log('📊 Probando funciones del dashboard optimizado...\n');

  try {
    // Test 1: get_dashboard_kpis
    console.log('1️⃣ Probando get_dashboard_kpis...');
    const { data: kpis, error: kpisError } = await supabase.rpc('get_dashboard_kpis');
    
    if (kpisError) {
      console.error('❌ Error en get_dashboard_kpis:', kpisError.message);
    } else {
      console.log('✅ get_dashboard_kpis exitoso');
      console.log('   📈 KPIs obtenidos:', {
        total_projects: kpis?.[0]?.total_projects || 0,
        active_projects: kpis?.[0]?.active_projects || 0,
        total_expenses: kpis?.[0]?.total_expenses || 0,
        total_incomes: kpis?.[0]?.total_incomes || 0
      });
    }

    console.log('');

    // Test 2: get_projects_with_summary
    console.log('2️⃣ Probando get_projects_with_summary...');
    const { data: projects, error: projectsError } = await supabase.rpc('get_projects_with_summary', {
      p_limit: 5,
      p_offset: 0
    });
    
    if (projectsError) {
      console.error('❌ Error en get_projects_with_summary:', projectsError.message);
    } else {
      console.log('✅ get_projects_with_summary exitoso');
      console.log(`   📋 Proyectos encontrados: ${projects?.length || 0}`);
      if (projects && projects.length > 0) {
        console.log('   📝 Primer proyecto:', {
          name: projects[0].name,
          status: projects[0].status,
          total_budget: projects[0].total_budget
        });
      }
    }

    console.log('');

    // Test 3: Verificar tablas básicas
    console.log('3️⃣ Verificando acceso a tablas básicas...');
    
    const { data: projectsTable, error: projectsTableError } = await supabase
      .from('projects')
      .select('id, name, status')
      .limit(1);
    
    if (projectsTableError) {
      console.error('❌ Error accediendo a tabla projects:', projectsTableError.message);
    } else {
      console.log('✅ Acceso a tabla projects exitoso');
      console.log(`   📊 Proyectos en tabla: ${projectsTable?.length || 0}`);
    }

    const { data: expensesTable, error: expensesTableError } = await supabase
      .from('expenses')
      .select('id, amount')
      .limit(1);
    
    if (expensesTableError) {
      console.error('❌ Error accediendo a tabla expenses:', expensesTableError.message);
    } else {
      console.log('✅ Acceso a tabla expenses exitoso');
      console.log(`   💰 Gastos en tabla: ${expensesTable?.length || 0}`);
    }

    const { data: incomesTable, error: incomesTableError } = await supabase
      .from('incomes')
      .select('id, amount')
      .limit(1);
    
    if (incomesTableError) {
      console.error('❌ Error accediendo a tabla incomes:', incomesTableError.message);
    } else {
      console.log('✅ Acceso a tabla incomes exitoso');
      console.log(`   💵 Ingresos en tabla: ${incomesTable?.length || 0}`);
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

async function main() {
  console.log('🚀 Iniciando diagnóstico...\n');
  
  // Verificar conexión
  console.log('🔗 Verificando conexión a Supabase...');
  try {
    const { data, error } = await supabase.from('projects').select('count').limit(1);
    if (error) {
      console.error('❌ Error de conexión:', error.message);
      return;
    }
    console.log('✅ Conexión exitosa\n');
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    return;
  }

  await testDashboardFunctions();
  
  console.log('\n🎯 Diagnóstico completado');
}

main().catch(console.error);