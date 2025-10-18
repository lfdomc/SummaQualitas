// Test script para verificar conexión a la base de datos y proyectos disponibles
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase (usando variables de entorno)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'OK' : 'MISSING');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? 'OK' : 'MISSING');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('🔍 Probando conexión a Supabase...');
    
    // Test 1: Verificar conexión básica con clave anónima
    console.log('🔑 Probando con clave anónima...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('projects')
      .select('count')
      .limit(1);
    
    if (healthError) {
      console.error('❌ Error de conexión con clave anónima:', healthError);
      console.log('🔧 Probando con service role key...');
      
      // Crear cliente con service role key
      const { createClient } = require('@supabase/supabase-js');
      const supabaseServiceRole = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      
      const { data: serviceData, error: serviceError } = await supabaseServiceRole
        .from('projects')
        .select('count')
        .limit(1);
      
      if (serviceError) {
        console.error('❌ Error con service role key:', serviceError);
        return;
      }
      
      console.log('✅ Conexión exitosa con service role key');
      // Usar el cliente con service role para el resto de las pruebas
      global.supabase = supabaseServiceRole;
    } else {
      console.log('✅ Conexión a Supabase exitosa con clave anónima');
    }
    
    // Test 2: Obtener lista de proyectos con más detalles
     const activeSupabase = global.supabase || supabase;
     const { data: projects, error: projectsError } = await activeSupabase
      .from('projects')
      .select(`
        id, 
        name, 
        status,
        presupuesto_original,
        presupuesto_inicial,
        budget,
        created_at,
        client_id,
        clients(id, name)
      `)
      .limit(10);
    
    if (projectsError) {
      console.error('❌ Error al obtener proyectos:', projectsError);
      return;
    }
    
    console.log('📊 Proyectos encontrados:', projects?.length || 0);
    
    if (projects && projects.length > 0) {
      console.log('📋 Lista de proyectos:');
      projects.forEach((project, index) => {
        console.log(`  ${index + 1}. ${project.name} (${project.id})`);
        console.log(`      Status: ${project.status}`);
        console.log(`      Budget: ${project.budget || project.presupuesto_original || 'N/A'}`);
        console.log(`      Cliente: ${project.clients?.name || 'Sin cliente'}`);
        console.log(`      Creado: ${project.created_at}`);
        console.log('');
      });
      
      // Test 3: Probar consultas individuales para el primer proyecto
      const firstProject = projects[0];
      console.log(`🧪 Probando consultas individuales para: ${firstProject.name} (${firstProject.id})`);
      
      // Test de ingresos
       const { data: incomes, error: incomesError } = await activeSupabase
         .from('incomes')
         .select('id, amount, description, status, currency')
         .eq('project_id', firstProject.id);
       
       console.log('💰 Ingresos:', {
         count: incomes?.length || 0,
         error: incomesError?.message || 'ninguno',
         data: incomes?.slice(0, 2) || []
       });
       
       // Test de gastos
       const { data: expenses, error: expensesError } = await activeSupabase
         .from('expenses')
         .select('id, amount, description, category, currency')
         .eq('project_id', firstProject.id);
      
      console.log('💸 Gastos:', {
        count: expenses?.length || 0,
        error: expensesError?.message || 'ninguno',
        data: expenses?.slice(0, 2) || []
      });
      
      // Test 4: Probar el AggregatedQueryService
      console.log(`\n🔧 Probando AggregatedQueryService...`);
      
      try {
        // Simular el import del servicio
        const fs = require('fs');
        const path = require('path');
        
        // Leer el archivo del servicio
        const servicePath = path.join(__dirname, 'lib', 'services', 'aggregatedQueryService.ts');
        
        if (fs.existsSync(servicePath)) {
          console.log('✅ Archivo del servicio encontrado');
          
          // Crear una instancia manual del servicio para testing
           class TestAggregatedQueryService {
             constructor() {
               this.supabase = activeSupabase;
             }
            
            async getProjectReportData(projectId) {
              try {
                console.log('🔍 Iniciando getProjectReportData para proyecto:', projectId);
                
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
                      budget,
                      costos_directos,
                      costos_indirectos,
                      administracion,
                      mano_obra,
                      imprevistos,
                      utilidad,
                      estimated_start_date,
                      created_at,
                      updated_at,
                      client_id,
                      clients(id, name, email)
                    `)
                    .eq('id', projectId)
                    .single(),

                  this.supabase
                    .from('incomes')
                    .select(`
                      id,
                      amount,
                      description,
                      category,
                      status,
                      received_date,
                      currency,
                      payment_method,
                      reference,
                      client:clients(id, name)
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

                  this.supabase
                    .from('change_orders')
                    .select(`
                      id,
                      type,
                      description,
                      amount,
                      status,
                      created_at
                    `)
                    .eq('project_id', projectId)
                    .order('created_at', { ascending: false })
                    .limit(50)
                ]);

                console.log('📊 Resultados de consultas paralelas:', {
                  project: projectData.error ? `ERROR: ${projectData.error.message}` : 'OK',
                  incomes: incomesData.error ? `ERROR: ${incomesData.error.message}` : `${incomesData.data?.length || 0} registros`,
                  expenses: expensesData.error ? `ERROR: ${expensesData.error.message}` : `${expensesData.data?.length || 0} registros`,
                  changeOrders: changeOrdersData.error ? `ERROR: ${changeOrdersData.error.message}` : `${changeOrdersData.data?.length || 0} registros`
                });

                const hasErrors = projectData.error || incomesData.error || expensesData.error || changeOrdersData.error;

                return {
                  project: projectData.data,
                  incomes: incomesData.data || [],
                  expenses: expensesData.data || [],
                  changeOrders: changeOrdersData.data || [],
                  error: hasErrors
                };
              } catch (error) {
                console.error('💥 Error en getProjectReportData:', error);
                return {
                  project: null,
                  incomes: [],
                  expenses: [],
                  changeOrders: [],
                  error: error.message
                };
              }
            }
          }
          
          const testService = new TestAggregatedQueryService();
          const reportData = await testService.getProjectReportData(firstProject.id);
          
          console.log('📥 Resultado final del servicio:', {
            hasData: !!reportData,
            hasError: !!reportData?.error,
            errorDetails: reportData?.error,
            projectExists: !!reportData?.project,
            projectName: reportData?.project?.name,
            incomesCount: reportData?.incomes?.length || 0,
            expensesCount: reportData?.expenses?.length || 0,
            changeOrdersCount: reportData?.changeOrders?.length || 0
          });
          
        } else {
          console.log('❌ Archivo del servicio no encontrado');
        }
        
      } catch (serviceError) {
        console.error('❌ Error probando el servicio:', serviceError);
      }
      
    } else {
      console.log('⚠️  No se encontraron proyectos en la base de datos');
    }
    
  } catch (error) {
    console.error('💥 Error en test de conexión:', error);
  }
}

testConnection();