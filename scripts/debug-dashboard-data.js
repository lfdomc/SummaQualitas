const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Diagnóstico de Datos del Dashboard\n');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseData() {
  try {
    console.log('📊 Verificando datos en las tablas principales...\n');

    // 1. Verificar proyectos con columnas básicas
    console.log('1️⃣ Tabla: projects');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(5);
    
    if (projectsError) {
      console.error('❌ Error en projects:', projectsError.message);
    } else {
      console.log(`✅ Proyectos encontrados: ${projects?.length || 0}`);
      if (projects && projects.length > 0) {
        console.log('   📋 Estructura de la primera fila:');
        console.log('   ', Object.keys(projects[0]));
        projects.forEach(project => {
          console.log(`   🏗️ ${project.name} (${project.status})`);
          console.log(`      💰 Budget: $${project.budget || 0}`);
          console.log(`      📅 Creado: ${project.created_at}`);
        });
      }
    }

    console.log('');

    // 2. Verificar ingresos con columnas básicas
    console.log('2️⃣ Tabla: incomes');
    const { data: incomes, error: incomesError } = await supabase
      .from('incomes')
      .select('*')
      .limit(5);
    
    if (incomesError) {
      console.error('❌ Error en incomes:', incomesError.message);
    } else {
      console.log(`✅ Ingresos encontrados: ${incomes?.length || 0}`);
      if (incomes && incomes.length > 0) {
        console.log('   📋 Estructura de la primera fila:');
        console.log('   ', Object.keys(incomes[0]));
        let totalIncomes = 0;
        incomes.forEach(income => {
          console.log(`   💵 $${income.amount} - ${income.description || 'Sin descripción'}`);
          console.log(`      📅 Creado: ${income.created_at}`);
          console.log(`      🏗️ Proyecto ID: ${income.project_id}`);
          totalIncomes += parseFloat(income.amount) || 0;
        });
        console.log(`   💰 Total de ingresos mostrados: $${totalIncomes.toFixed(2)}`);
      }
    }

    console.log('');

    // 3. Verificar gastos con columnas básicas
    console.log('3️⃣ Tabla: expenses');
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .limit(5);
    
    if (expensesError) {
      console.error('❌ Error en expenses:', expensesError.message);
    } else {
      console.log(`✅ Gastos encontrados: ${expenses?.length || 0}`);
      if (expenses && expenses.length > 0) {
        console.log('   📋 Estructura de la primera fila:');
        console.log('   ', Object.keys(expenses[0]));
        let totalExpenses = 0;
        expenses.forEach(expense => {
          console.log(`   💸 $${expense.amount} - ${expense.description || 'Sin descripción'}`);
          console.log(`      📅 Creado: ${expense.created_at}`);
          console.log(`      🏗️ Proyecto ID: ${expense.project_id}`);
          totalExpenses += parseFloat(expense.amount) || 0;
        });
        console.log(`   💰 Total de gastos mostrados: $${totalExpenses.toFixed(2)}`);
      }
    }

    console.log('');

    // 4. Contar totales reales
    console.log('4️⃣ Contando totales reales...');
    
    // Contar todos los ingresos
    const { data: allIncomes, error: allIncomesError } = await supabase
      .from('incomes')
      .select('amount');
    
    if (!allIncomesError && allIncomes) {
      const totalIncomes = allIncomes.reduce((sum, income) => sum + (parseFloat(income.amount) || 0), 0);
      console.log(`   💵 Total real de ingresos: $${totalIncomes.toFixed(2)} (${allIncomes.length} registros)`);
    }

    // Contar todos los gastos
    const { data: allExpenses, error: allExpensesError } = await supabase
      .from('expenses')
      .select('amount');
    
    if (!allExpensesError && allExpenses) {
      const totalExpenses = allExpenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
      console.log(`   💸 Total real de gastos: $${totalExpenses.toFixed(2)} (${allExpenses.length} registros)`);
    }

    console.log('');

    // 5. Probar la función RPC get_dashboard_kpis
    console.log('5️⃣ Probando función RPC: get_dashboard_kpis');
    const { data: kpis, error: kpisError } = await supabase.rpc('get_dashboard_kpis');
    
    if (kpisError) {
      console.error('❌ Error en get_dashboard_kpis:', kpisError.message);
      console.error('   📋 Detalles:', kpisError);
    } else {
      console.log('✅ RPC get_dashboard_kpis exitosa');
      console.log('   📊 Resultado:', {
        total_projects: kpis?.total_projects || 0,
        active_projects: kpis?.active_projects || 0,
        total_incomes: kpis?.total_incomes || 0,
        total_expenses: kpis?.total_expenses || 0,
        net_profit: kpis?.net_profit || 0
      });
    }

    console.log('');

    // 6. Probar la función RPC get_projects_with_summary
    console.log('6️⃣ Probando función RPC: get_projects_with_summary');
    const { data: projectsSummary, error: projectsSummaryError } = await supabase.rpc('get_projects_with_summary');
    
    if (projectsSummaryError) {
      console.error('❌ Error en get_projects_with_summary:', projectsSummaryError.message);
      console.error('   📋 Detalles:', projectsSummaryError);
    } else {
      console.log('✅ RPC get_projects_with_summary exitosa');
      console.log(`   📋 Proyectos con resumen: ${projectsSummary?.length || 0}`);
      if (projectsSummary && projectsSummary.length > 0) {
        projectsSummary.forEach(project => {
          console.log(`   🏗️ ${project.name}`);
          console.log(`      💰 Ingresos: $${project.total_incomes || 0}`);
          console.log(`      💸 Gastos: $${project.total_expenses || 0}`);
          console.log(`      📊 Ganancia: $${project.net_profit || 0}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
    console.error('   📋 Stack:', error.stack);
  }
}

async function main() {
  console.log('🚀 Iniciando diagnóstico de datos del dashboard...\n');
  
  // Verificar conexión básica
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

  await checkDatabaseData();
  
  console.log('\n🎯 Diagnóstico de datos completado');
}

main().catch(console.error);