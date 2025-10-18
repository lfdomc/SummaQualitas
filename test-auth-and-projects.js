require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthAndProjects() {
  try {
    console.log('🔍 Probando autenticación y acceso a proyectos...\n');
    
    // Test 1: Verificar estado inicial de autenticación
    console.log('1. Verificando estado inicial de autenticación...');
    const { data: { session: initialSession }, error: initialError } = await supabase.auth.getSession();
    
    if (initialError) {
      console.error('❌ Error obteniendo sesión inicial:', initialError.message);
    } else {
      console.log('📋 Estado inicial:', {
        hasSession: !!initialSession,
        userEmail: initialSession?.user?.email || 'Sin usuario'
      });
    }
    
    // Test 2: Intentar acceder a proyectos sin autenticación
    console.log('\n2. Probando acceso a proyectos sin autenticación...');
    const { data: projectsUnauth, error: projectsUnauthError } = await supabase
      .from('projects')
      .select('id, name, status')
      .limit(5);
    
    if (projectsUnauthError) {
      console.log('❌ Error sin autenticación:', projectsUnauthError.message);
      console.log('💡 Esto confirma que se requiere autenticación (RLS activo)');
    } else {
      console.log('✅ Proyectos accesibles sin autenticación:', projectsUnauth?.length || 0);
    }
    
    // Test 3: Intentar login con credenciales
    console.log('\n3. Intentando login...');
    
    // Credenciales de prueba (puedes cambiarlas por las correctas)
    const testCredentials = [
      { email: 'lfdomc@gmail.com', password: 'Luimorca22' },
      { email: 'admin@summa.com', password: 'admin123' },
      { email: 'test@test.com', password: 'test123' }
    ];
    
    let loginSuccess = false;
    let authenticatedUser = null;
    
    for (const creds of testCredentials) {
      console.log(`🔐 Probando login con: ${creds.email}`);
      
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: creds.email,
        password: creds.password
      });
      
      if (loginError) {
        console.log(`❌ Error con ${creds.email}:`, loginError.message);
      } else {
        console.log(`✅ Login exitoso con ${creds.email}`);
        loginSuccess = true;
        authenticatedUser = loginData.user;
        break;
      }
    }
    
    if (!loginSuccess) {
      console.log('\n⚠️  No se pudo hacer login con ninguna credencial.');
      console.log('💡 Necesitas proporcionar credenciales válidas para continuar.');
      return;
    }
    
    // Test 4: Verificar sesión después del login
    console.log('\n4. Verificando sesión después del login...');
    const { data: { session: authSession }, error: authSessionError } = await supabase.auth.getSession();
    
    if (authSessionError) {
      console.error('❌ Error obteniendo sesión autenticada:', authSessionError.message);
    } else {
      console.log('✅ Sesión autenticada:', {
        hasSession: !!authSession,
        userEmail: authSession?.user?.email,
        userId: authSession?.user?.id
      });
    }
    
    // Test 5: Intentar acceder a proyectos con autenticación
    console.log('\n5. Probando acceso a proyectos con autenticación...');
    const { data: projectsAuth, error: projectsAuthError } = await supabase
      .from('projects')
      .select(`
        id, 
        name, 
        status,
        presupuesto_original,
        budget,
        created_at,
        client_id,
        clients(id, name)
      `)
      .limit(10);
    
    if (projectsAuthError) {
      console.error('❌ Error accediendo a proyectos autenticado:', projectsAuthError.message);
    } else {
      console.log('✅ Proyectos encontrados:', projectsAuth?.length || 0);
      
      if (projectsAuth && projectsAuth.length > 0) {
        console.log('\n📋 Lista de proyectos:');
        projectsAuth.forEach((project, index) => {
          console.log(`  ${index + 1}. ${project.name} (${project.id})`);
          console.log(`      Status: ${project.status}`);
          console.log(`      Budget: ${project.budget || project.presupuesto_original || 'N/A'}`);
          console.log(`      Cliente: ${project.clients?.name || 'Sin cliente'}`);
          console.log('');
        });
        
        // Test 6: Probar AggregatedQueryService con el primer proyecto
        const firstProject = projectsAuth[0];
        console.log(`🧪 Probando AggregatedQueryService con proyecto: ${firstProject.name} (${firstProject.id})`);
        
        // Test de consultas individuales
        const [incomesResult, expensesResult, changeOrdersResult] = await Promise.all([
          supabase
            .from('incomes')
            .select('id, amount, description, status, currency')
            .eq('project_id', firstProject.id),
          
          supabase
            .from('expenses')
            .select('id, amount, description, category, currency')
            .eq('project_id', firstProject.id),
          
          supabase
            .from('change_orders')
            .select('id, type, description, amount, status')
            .eq('project_id', firstProject.id)
        ]);
        
        console.log('📊 Resultados de consultas relacionadas:');
        console.log('💰 Ingresos:', {
          count: incomesResult.data?.length || 0,
          error: incomesResult.error?.message || 'ninguno'
        });
        console.log('💸 Gastos:', {
          count: expensesResult.data?.length || 0,
          error: expensesResult.error?.message || 'ninguno'
        });
        console.log('📝 Órdenes de cambio:', {
          count: changeOrdersResult.data?.length || 0,
          error: changeOrdersResult.error?.message || 'ninguno'
        });
        
        // Test 7: Simular el AggregatedQueryService
        console.log('\n🔧 Simulando AggregatedQueryService...');
        
        try {
          const [projectData, incomesData, expensesData, changeOrdersData] = await Promise.all([
            supabase
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
              .eq('id', firstProject.id)
              .single(),

            supabase
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
              .eq('project_id', firstProject.id)
              .order('received_date', { ascending: false })
              .limit(100),

            supabase
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
              .eq('project_id', firstProject.id)
              .order('expense_date', { ascending: false })
              .limit(200),

            supabase
              .from('change_orders')
              .select(`
                id,
                type,
                description,
                amount,
                status,
                created_at
              `)
              .eq('project_id', firstProject.id)
              .order('created_at', { ascending: false })
              .limit(50)
          ]);

          console.log('📊 Resultados de consultas paralelas del servicio:', {
            project: projectData.error ? `ERROR: ${projectData.error.message}` : 'OK',
            incomes: incomesData.error ? `ERROR: ${incomesData.error.message}` : `${incomesData.data?.length || 0} registros`,
            expenses: expensesData.error ? `ERROR: ${expensesData.error.message}` : `${expensesData.data?.length || 0} registros`,
            changeOrders: changeOrdersData.error ? `ERROR: ${changeOrdersData.error.message}` : `${changeOrdersData.data?.length || 0} registros`
          });

          const hasErrors = projectData.error || incomesData.error || expensesData.error || changeOrdersData.error;

          const reportData = {
            project: projectData.data,
            incomes: incomesData.data || [],
            expenses: expensesData.data || [],
            changeOrders: changeOrdersData.data || [],
            error: hasErrors
          };
          
          console.log('📥 Resultado final simulado del servicio:', {
            hasData: !!reportData,
            hasError: !!reportData?.error,
            errorDetails: reportData?.error,
            projectExists: !!reportData?.project,
            projectName: reportData?.project?.name,
            incomesCount: reportData?.incomes?.length || 0,
            expensesCount: reportData?.expenses?.length || 0,
            changeOrdersCount: reportData?.changeOrders?.length || 0
          });
          
          if (!hasErrors && reportData.project) {
            console.log('\n🎉 ¡El servicio debería funcionar correctamente!');
            console.log('💡 El problema era la falta de autenticación.');
          } else {
            console.log('\n⚠️  Aún hay problemas con el servicio:');
            if (projectData.error) console.log('   - Error en proyecto:', projectData.error.message);
            if (incomesData.error) console.log('   - Error en ingresos:', incomesData.error.message);
            if (expensesData.error) console.log('   - Error en gastos:', expensesData.error.message);
            if (changeOrdersData.error) console.log('   - Error en órdenes de cambio:', changeOrdersData.error.message);
          }
          
        } catch (serviceError) {
          console.error('💥 Error simulando el servicio:', serviceError);
        }
        
      } else {
        console.log('⚠️  No se encontraron proyectos en la base de datos');
      }
    }
    
  } catch (error) {
    console.error('💥 Error inesperado:', error);
  }
}

testAuthAndProjects();