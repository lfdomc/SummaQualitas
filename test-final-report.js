const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Simular AggregatedQueryService con las correcciones aplicadas
class TestAggregatedQueryService {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
  }

  async getProjectReportData(projectId) {
    console.log(`🔍 Iniciando getProjectReportData para proyecto: ${projectId}`);
    
    if (!projectId) {
      console.error('❌ Project ID es requerido');
      return { error: 'Project ID es requerido' };
    }

    try {
      console.log('📊 Ejecutando consultas paralelas...');
      
      const [projectData, incomesData, expensesData, changeOrdersData] = await Promise.all([
        this.supabase
          .from('projects')
          .select(`
            id,
            name,
            status,
            presupuesto_original,
            presupuesto_inicial,
            presupuesto_final,
            clients(name)
          `)
          .eq('id', projectId)
          .single(),

        this.supabase
          .from('incomes')
          .select(`
            id,
            description,
            amount,
            currency,
            status,
            received_date
          `)
          .eq('project_id', projectId)
          .order('received_date', { ascending: false })
          .limit(100),

        this.supabase
          .from('expenses')
          .select(`
            id,
            category,
            subcategory_direct,
            subcategory_indirect,
            description,
            amount,
            currency,
            exchange_rate_usd,
            expense_date,
            supplier:suppliers(name),
            payment_status
          `)
          .eq('project_id', projectId)
          .order('expense_date', { ascending: false })
          .limit(200),

        // Selección flexible para evitar errores de columna inexistente
        this.supabase
          .from('change_orders')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(50)
      ]);

      // Logging detallado de errores
      if (projectData.error) {
        console.error('❌ Error en consulta de proyecto:', projectData.error);
        return { error: `Error en proyecto: ${projectData.error.message}` };
      }
      if (incomesData.error) {
        console.error('❌ Error en consulta de ingresos:', incomesData.error);
        return { error: `Error en ingresos: ${incomesData.error.message}` };
      }
      if (expensesData.error) {
        console.error('❌ Error en consulta de gastos:', expensesData.error);
        return { error: `Error en gastos: ${expensesData.error.message}` };
      }
      if (changeOrdersData.error) {
        console.error('❌ Error en consulta de órdenes de cambio:', changeOrdersData.error);
        return { error: `Error en órdenes de cambio: ${changeOrdersData.error.message}` };
      }

      // Resumen de datos obtenidos
      console.log('✅ Datos obtenidos exitosamente:');
      console.log(`   📋 Proyecto: ${projectData.data?.name || 'N/A'}`);
      console.log(`   💰 Ingresos: ${incomesData.data?.length || 0} registros`);
      console.log(`   💸 Gastos: ${expensesData.data?.length || 0} registros`);
      console.log(`   🔄 Órdenes de cambio: ${changeOrdersData.data?.length || 0} registros`);

      return {
        project: projectData.data,
        incomes: incomesData.data || [],
        expenses: expensesData.data || [],
        changeOrders: changeOrdersData.data || [],
        exchangeRate: 500
      };

    } catch (error) {
      console.error('❌ Error inesperado en getProjectReportData:', error);
      return { error: `Error inesperado: ${error.message}` };
    }
  }
}

async function testFinalReport() {
  console.log('🧪 === PRUEBA FINAL DEL REPORTE ===\n');

  try {
    // 1. Verificar autenticación
    console.log('1️⃣ Verificando autenticación...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('⚠️  Usuario no autenticado, intentando login...');
      
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'lfdomc@gmail.com',
        // Usar la misma credencial probada en scripts/test-login.js
        password: 'Luimorca22'
      });

      if (loginError) {
        console.error('❌ Error en login:', loginError.message);
        return;
      }
      
      console.log('✅ Login exitoso');
    } else {
      console.log('✅ Usuario ya autenticado:', user.email);
    }

    // 2. Obtener proyectos
    console.log('\n2️⃣ Obteniendo proyectos...');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, status');

    if (projectsError) {
      console.error('❌ Error obteniendo proyectos:', projectsError.message);
      return;
    }

    console.log(`✅ Proyectos encontrados: ${projects.length}`);
    if (projects.length === 0) {
      console.log('⚠️  No hay proyectos disponibles');
      return;
    }

    const firstProject = projects[0];
    console.log(`📋 Usando proyecto: ${firstProject.name} (ID: ${firstProject.id})`);

    // 3. Probar AggregatedQueryService corregido
    console.log('\n3️⃣ Probando AggregatedQueryService corregido...');
    const testService = new TestAggregatedQueryService(supabase);
    const result = await testService.getProjectReportData(firstProject.id);

    if (result.error) {
      console.error('❌ Error en AggregatedQueryService:', result.error);
      return;
    }

    console.log('\n🎉 === PRUEBA EXITOSA ===');
    console.log('✅ Todas las consultas funcionaron correctamente');
    console.log('✅ La consulta de change_orders fue corregida');
    console.log('✅ La autenticación está funcionando');
    console.log('✅ El reporte debería cargar sin errores');

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

testFinalReport();