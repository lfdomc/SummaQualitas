const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno desde .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
}

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStructure() {
  console.log('🔍 Verificando estructura de las tablas...\n');

  try {
    // Verificar estructura de la tabla projects
    console.log('📋 Estructura de la tabla PROJECTS:');
    const { data: projectsColumns, error: projectsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'projects')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    if (projectsError) {
      console.error('❌ Error obteniendo estructura de projects:', projectsError);
    } else if (projectsColumns && projectsColumns.length > 0) {
      projectsColumns.forEach(col => {
        console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
      });
    }

    // Verificar estructura de la tabla expenses
    console.log('\n💰 Estructura de la tabla EXPENSES:');
    const { data: expensesColumns, error: expensesError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'expenses')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    if (expensesError) {
      console.error('❌ Error obteniendo estructura de expenses:', expensesError);
    } else if (expensesColumns && expensesColumns.length > 0) {
      expensesColumns.forEach(col => {
        console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
      });
    }

    // Verificar estructura de la tabla incomes
    console.log('\n💵 Estructura de la tabla INCOMES:');
    const { data: incomesColumns, error: incomesError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'incomes')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    if (incomesError) {
      console.error('❌ Error obteniendo estructura de incomes:', incomesError);
    } else if (incomesColumns && incomesColumns.length > 0) {
      incomesColumns.forEach(col => {
        console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
      });
    }

    // Verificar valores únicos en las tablas
    console.log('\n📊 Verificando valores únicos:');
    
    // Verificar project status
    const { data: projectStatusValues, error: projectStatusError } = await supabase
      .from('projects')
      .select('status')
      .not('status', 'is', null)
      .limit(10);

    if (!projectStatusError && projectStatusValues) {
      const uniqueStatuses = [...new Set(projectStatusValues.map(v => v.status))];
      console.log('   project status valores únicos:', uniqueStatuses);
    }

    // Verificar payment_status
    const { data: paymentStatusValues, error: paymentStatusError } = await supabase
      .from('expenses')
      .select('payment_status')
      .not('payment_status', 'is', null)
      .limit(10);

    if (!paymentStatusError && paymentStatusValues) {
      const uniqueStatuses = [...new Set(paymentStatusValues.map(v => v.payment_status))];
      console.log('   payment_status valores únicos:', uniqueStatuses);
    }

    // Verificar income status
    const { data: incomeStatusValues, error: incomeStatusError } = await supabase
      .from('incomes')
      .select('status')
      .not('status', 'is', null)
      .limit(10);

    if (!incomeStatusError && incomeStatusValues) {
      const uniqueIncomeStatuses = [...new Set(incomeStatusValues.map(v => v.status))];
      console.log('   income status valores únicos:', uniqueIncomeStatuses);
    }

    // Verificar estructura de la tabla change_orders
    console.log('\n🧾 Estructura de la tabla CHANGE_ORDERS:');
    const { data: changeOrdersColumns, error: changeOrdersError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'change_orders')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    if (changeOrdersError) {
      console.error('❌ Error obteniendo estructura de change_orders:', changeOrdersError);
    } else if (changeOrdersColumns && changeOrdersColumns.length > 0) {
      const cols = changeOrdersColumns.map(col => col.column_name);
      changeOrdersColumns.forEach(col => {
        console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
      });
      // Señalar columnas críticas
      const critical = ['document_number','cost_impact','exchange_rate','cost_impact_crc','requested_date','request_date','exchange_rate_usd'];
      const missingCritical = critical.filter(c => !cols.includes(c));
      if (missingCritical.length > 0) {
        console.log('⚠️  Columnas críticas faltantes en change_orders:', missingCritical);
      } else {
        console.log('✅ Columnas críticas presentes en change_orders');
      }
    }

    // Verificar expense categories
    const { data: expenseCategories, error: expenseCategoriesError } = await supabase
      .from('expenses')
      .select('category')
      .not('category', 'is', null)
      .limit(10);

    if (!expenseCategoriesError && expenseCategories) {
      const uniqueCategories = [...new Set(expenseCategories.map(v => v.category))];
      console.log('   expense categories valores únicos:', uniqueCategories);
    }

    console.log('\n✅ Verificación de estructura completada!');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar la verificación
checkTableStructure();