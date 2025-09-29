const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno desde .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

// Usar service role key para acceso completo
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyRealData() {
  console.log('🔍 Verificando datos reales con service role key...\n');

  try {
    // 1. Verificar proyectos con COUNT
    console.log('1️⃣ Contando proyectos...');
    const { count: projectCount, error: projectCountError } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true });
    
    if (projectCountError) {
      console.error('❌ Error contando projects:', projectCountError.message);
    } else {
      console.log(`✅ Total de proyectos: ${projectCount}`);
    }

    // 2. Verificar gastos con COUNT
    console.log('\n2️⃣ Contando gastos...');
    const { count: expenseCount, error: expenseCountError } = await supabase
      .from('expenses')
      .select('*', { count: 'exact', head: true });
    
    if (expenseCountError) {
      console.error('❌ Error contando expenses:', expenseCountError.message);
    } else {
      console.log(`✅ Total de gastos: ${expenseCount}`);
    }

    // 3. Verificar ingresos con COUNT
    console.log('\n3️⃣ Contando ingresos...');
    const { count: incomeCount, error: incomeCountError } = await supabase
      .from('incomes')
      .select('*', { count: 'exact', head: true });
    
    if (incomeCountError) {
      console.error('❌ Error contando incomes:', incomeCountError.message);
    } else {
      console.log(`✅ Total de ingresos: ${incomeCount}`);
    }

    // 4. Obtener datos reales de proyectos
    console.log('\n4️⃣ Obteniendo datos de proyectos...');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(10);
    
    if (projectsError) {
      console.error('❌ Error obteniendo projects:', projectsError.message);
    } else {
      console.log(`✅ Proyectos obtenidos: ${projects.length}`);
      projects.forEach(project => {
        console.log(`   🏗️ ${project.name} (${project.status}) - Presupuesto: $${project.budget || 0}`);
        console.log(`      ID: ${project.id}`);
      });
    }

    // 5. Obtener datos reales de gastos
    console.log('\n5️⃣ Obteniendo datos de gastos...');
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .limit(15);
    
    if (expensesError) {
      console.error('❌ Error obteniendo expenses:', expensesError.message);
    } else {
      console.log(`✅ Gastos obtenidos: ${expenses.length}`);
      let totalExpenses = 0;
      expenses.forEach((expense, index) => {
        const amount = parseFloat(expense.amount || 0);
        totalExpenses += amount;
        console.log(`   ${index + 1}. 💸 $${amount.toFixed(2)} - ${expense.description || 'Sin descripción'}`);
        console.log(`      Proyecto: ${expense.project_id}, Fecha: ${expense.expense_date || expense.created_at}`);
      });
      console.log(`   💰 Total de gastos: $${totalExpenses.toFixed(2)}`);
    }

    // 6. Obtener datos reales de ingresos
    console.log('\n6️⃣ Obteniendo datos de ingresos...');
    const { data: incomes, error: incomesError } = await supabase
      .from('incomes')
      .select('*')
      .limit(10);
    
    if (incomesError) {
      console.error('❌ Error obteniendo incomes:', incomesError.message);
    } else {
      console.log(`✅ Ingresos obtenidos: ${incomes.length}`);
      let totalIncomes = 0;
      incomes.forEach((income, index) => {
        const amount = parseFloat(income.amount || 0);
        totalIncomes += amount;
        console.log(`   ${index + 1}. 💰 $${amount.toFixed(2)} - ${income.description || 'Sin descripción'}`);
        console.log(`      Proyecto: ${income.project_id}, Fecha: ${income.received_date || income.created_at}`);
      });
      console.log(`   💵 Total de ingresos: $${totalIncomes.toFixed(2)}`);
    }

    // 7. Probar función RPC get_dashboard_kpis
    console.log('\n7️⃣ Probando función RPC get_dashboard_kpis...');
    const { data: kpis, error: kpisError } = await supabase.rpc('get_dashboard_kpis');
    
    if (kpisError) {
      console.error('❌ Error en RPC get_dashboard_kpis:', kpisError.message);
      console.error('   Detalles:', kpisError);
    } else {
      console.log('✅ RPC get_dashboard_kpis ejecutada');
      console.log('   📊 Resultado:', kpis[0]);
    }

    // 8. Verificar estructura de tablas
    console.log('\n8️⃣ Verificando estructura de tablas...');
    
    // Verificar columnas de projects
    const { data: projectColumns, error: projectColumnsError } = await supabase
      .from('projects')
      .select('*')
      .limit(1);
    
    if (!projectColumnsError && projectColumns && projectColumns.length > 0) {
      console.log('   📋 Columnas de projects:', Object.keys(projectColumns[0]));
    }

    // Verificar columnas de expenses
    const { data: expenseColumns, error: expenseColumnsError } = await supabase
      .from('expenses')
      .select('*')
      .limit(1);
    
    if (!expenseColumnsError && expenseColumns && expenseColumns.length > 0) {
      console.log('   📋 Columnas de expenses:', Object.keys(expenseColumns[0]));
    }

    // Verificar columnas de incomes
    const { data: incomeColumns, error: incomeColumnsError } = await supabase
      .from('incomes')
      .select('*')
      .limit(1);
    
    if (!incomeColumnsError && incomeColumns && incomeColumns.length > 0) {
      console.log('   📋 Columnas de incomes:', Object.keys(incomeColumns[0]));
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
    console.error('   Stack:', error.stack);
  }
}

verifyRealData();