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

async function checkTableData() {
  console.log('🔍 Verificando datos de las tablas...\n');

  try {
    // Verificar tabla projects
    console.log('📋 Tabla PROJECTS - Muestra de datos:');
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(1);

    if (projectsError) {
      console.error('❌ Error obteniendo datos de projects:', projectsError);
    } else if (projectsData && projectsData.length > 0) {
      console.log('   Columnas encontradas:', Object.keys(projectsData[0]));
      console.log('   Ejemplo de datos:', projectsData[0]);
    } else {
      console.log('   No hay datos en la tabla projects');
    }

    // Verificar tabla expenses
    console.log('\n💰 Tabla EXPENSES - Muestra de datos:');
    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .limit(1);

    if (expensesError) {
      console.error('❌ Error obteniendo datos de expenses:', expensesError);
    } else if (expensesData && expensesData.length > 0) {
      console.log('   Columnas encontradas:', Object.keys(expensesData[0]));
      console.log('   Ejemplo de datos:', expensesData[0]);
    } else {
      console.log('   No hay datos en la tabla expenses');
    }

    // Verificar tabla incomes
    console.log('\n💵 Tabla INCOMES - Muestra de datos:');
    const { data: incomesData, error: incomesError } = await supabase
      .from('incomes')
      .select('*')
      .limit(1);

    if (incomesError) {
      console.error('❌ Error obteniendo datos de incomes:', incomesError);
    } else if (incomesData && incomesData.length > 0) {
      console.log('   Columnas encontradas:', Object.keys(incomesData[0]));
      console.log('   Ejemplo de datos:', incomesData[0]);
    } else {
      console.log('   No hay datos en la tabla incomes');
    }

    // Verificar tabla change_orders
    console.log('\n🔄 Tabla CHANGE_ORDERS - Muestra de datos:');
    const { data: changeOrdersData, error: changeOrdersError } = await supabase
      .from('change_orders')
      .select('*')
      .limit(1);

    if (changeOrdersError) {
      console.error('❌ Error obteniendo datos de change_orders:', changeOrdersError);
    } else if (changeOrdersData && changeOrdersData.length > 0) {
      console.log('   Columnas encontradas:', Object.keys(changeOrdersData[0]));
      console.log('   Ejemplo de datos:', changeOrdersData[0]);
    } else {
      console.log('   No hay datos en la tabla change_orders');
    }

    // Verificar valores únicos específicos
    console.log('\n📊 Verificando valores únicos específicos:');
    
    // Project status
    const { data: projectStatuses } = await supabase
      .from('projects')
      .select('status')
      .not('status', 'is', null);
    
    if (projectStatuses && projectStatuses.length > 0) {
      const uniqueProjectStatuses = [...new Set(projectStatuses.map(p => p.status))];
      console.log('   Project status únicos:', uniqueProjectStatuses);
    }

    // Payment status
    const { data: paymentStatuses } = await supabase
      .from('expenses')
      .select('payment_status')
      .not('payment_status', 'is', null);
    
    if (paymentStatuses && paymentStatuses.length > 0) {
      const uniquePaymentStatuses = [...new Set(paymentStatuses.map(e => e.payment_status))];
      console.log('   Payment status únicos:', uniquePaymentStatuses);
    }

    // Income status
    const { data: incomeStatuses } = await supabase
      .from('incomes')
      .select('status')
      .not('status', 'is', null);
    
    if (incomeStatuses && incomeStatuses.length > 0) {
      const uniqueIncomeStatuses = [...new Set(incomeStatuses.map(i => i.status))];
      console.log('   Income status únicos:', uniqueIncomeStatuses);
    }

    // Change order status
    const { data: changeOrderStatuses } = await supabase
      .from('change_orders')
      .select('status')
      .not('status', 'is', null);
    
    if (changeOrderStatuses && changeOrderStatuses.length > 0) {
      const uniqueChangeOrderStatuses = [...new Set(changeOrderStatuses.map(c => c.status))];
      console.log('   Change order status únicos:', uniqueChangeOrderStatuses);
    }

    console.log('\n✅ Verificación completada!');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar la verificación
checkTableData();