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

async function testOptimizations() {
  console.log('🚀 Iniciando pruebas de optimización...\n');

  try {
    // 1. Probar función de dashboard KPIs
    console.log('📊 Probando función get_dashboard_kpis...');
    const startKpis = Date.now();
    const { data: kpis, error: kpisError } = await supabase
      .rpc('get_dashboard_kpis');
    const kpisTime = Date.now() - startKpis;
    
    if (kpisError) {
      console.error('❌ Error en get_dashboard_kpis:', kpisError);
    } else {
      console.log(`✅ KPIs obtenidos en ${kpisTime}ms`);
      console.log('   Datos:', kpis[0]);
    }

    // 2. Probar función de proyectos con resumen financiero
    console.log('\n🏗️ Probando función get_projects_with_financial_summary...');
    const startProjects = Date.now();
    const { data: projects, error: projectsError } = await supabase
      .rpc('get_projects_with_financial_summary', {
        p_limit: 10,
        p_offset: 0
      });
    const projectsTime = Date.now() - startProjects;
    
    if (projectsError) {
      console.error('❌ Error en get_projects_with_financial_summary:', projectsError);
    } else {
      console.log(`✅ Proyectos obtenidos en ${projectsTime}ms`);
      console.log(`   Total de proyectos: ${projects.length}`);
      if (projects.length > 0) {
        console.log('   Primer proyecto:', {
          name: projects[0].name,
          total_expenses: projects[0].total_expenses,
          total_incomes: projects[0].total_incomes,
          net_balance: projects[0].net_balance
        });
      }
    }

    // 3. Probar función de gastos paginados
    console.log('\n💰 Probando función get_expenses_paginated...');
    const startExpenses = Date.now();
    const { data: expensesData, error: expensesError } = await supabase
      .rpc('get_expenses_paginated', {
        p_limit: 10,
        p_offset: 0,
        p_project_id: null,
        p_category: null,
        p_payment_status: null
      });
    const expensesTime = Date.now() - startExpenses;
    
    if (expensesError) {
      console.error('❌ Error en get_expenses_paginated:', expensesError);
    } else {
      console.log(`✅ Gastos obtenidos en ${expensesTime}ms`);
      console.log(`   Total de gastos: ${expensesData.length}`);
      if (expensesData.length > 0) {
         console.log('   Primer gasto:', {
           description: expensesData[0].description,
           amount: expensesData[0].amount,
           category: expensesData[0].category,
           supplier_name: expensesData[0].supplier_name
         });
       }
    }

    // 4. Probar función de ingresos con información del proyecto
    console.log('\n💵 Probando función get_incomes_with_project_info...');
    const startIncomes = Date.now();
    const { data: incomes, error: incomesError } = await supabase
      .rpc('get_incomes_with_project_info', {
        p_limit: 10,
        p_offset: 0,
        p_project_id: null,
        p_status: null
      });
    const incomesTime = Date.now() - startIncomes;
    
    if (incomesError) {
      console.error('❌ Error en get_incomes_with_project_info:', incomesError);
    } else {
      console.log(`✅ Ingresos obtenidos en ${incomesTime}ms`);
      console.log(`   Total de ingresos: ${incomes.length}`);
      if (incomes.length > 0) {
        console.log('   Primer ingreso:', {
          amount: incomes[0].amount,
          status: incomes[0].status,
          project_name: incomes[0].project_name,
          client_name: incomes[0].client_name
        });
      }
    }

    // 5. Probar función de búsqueda de texto completo
    console.log('\n🔍 Probando función search_expenses_fulltext...');
    let searchTime = 0;
    try {
      const start = Date.now();
      const { data: searchData, error: searchError } = await supabase
        .rpc('search_expenses_fulltext', {
          p_limit: 5,
          p_offset: 0,
          p_project_id: null,
          search_term: 'materiales'
        });

      searchTime = Date.now() - start;
      
      if (searchError) {
        console.error('❌ Error en search_expenses_fulltext:', searchError);
      } else {
        console.log(`✅ Búsqueda completada en ${searchTime}ms`);
        console.log(`📄 ${searchData.length} resultados encontrados`);
        if (searchData.length > 0) {
          console.log(`📝 Primer resultado: ${searchData[0].description} - ${searchData[0].supplier_name}`);
        }
      }
    } catch (error) {
      console.error('❌ Error en search_expenses_fulltext:', error);
    }

    // 6. Probar análisis de gastos por categoría y período
    console.log('\n📈 Probando función get_expenses_by_category_period...');
    let categoryTime = 0;
    try {
      const start = Date.now();
      const { data: categoryData, error: categoryError } = await supabase
        .rpc('get_expenses_by_category_period', {
          start_date: '2024-01-01',
          end_date: '2024-12-31',
          p_project_id: null
        });

      categoryTime = Date.now() - start;
      
      if (categoryError) {
        console.error('❌ Error en get_expenses_by_category_period:', categoryError);
      } else {
        console.log(`✅ Análisis completado en ${categoryTime}ms`);
        console.log(`📊 ${categoryData.length} categorías analizadas`);
        if (categoryData.length > 0) {
          console.log(`📈 Primera categoría: ${categoryData[0].category} - $${categoryData[0].total_amount}`);
        }
      }
    } catch (error) {
      console.error('❌ Error en get_expenses_by_category_period:', error);
    }

    // 7. Comparar rendimiento con consultas tradicionales
    console.log('\n⚡ Comparando rendimiento con consultas tradicionales...');
    
    // Consulta tradicional para obtener proyectos con gastos
    const startTraditional = Date.now();
    const { data: traditionalProjects, error: traditionalError } = await supabase
      .from('projects')
      .select(`
        *,
        expenses(amount),
        incomes(amount)
      `)
      .limit(10);
    const traditionalTime = Date.now() - startTraditional;
    
    if (traditionalError) {
      console.error('❌ Error en consulta tradicional:', traditionalError);
    } else {
      console.log(`📊 Consulta tradicional: ${traditionalTime}ms`);
      console.log(`📊 Función optimizada: ${projectsTime}ms`);
      const improvement = ((traditionalTime - projectsTime) / traditionalTime * 100).toFixed(1);
      console.log(`🚀 Mejora de rendimiento: ${improvement}% más rápido`);
    }

    console.log('\n✅ Todas las pruebas de optimización completadas exitosamente!');
    
    // Resumen de tiempos
    console.log('\n📊 RESUMEN DE RENDIMIENTO:');
    console.log(`   Dashboard KPIs: ${kpisTime}ms`);
    console.log(`   Proyectos con resumen: ${projectsTime}ms`);
    console.log(`   Gastos paginados: ${expensesTime}ms`);
    console.log(`   Ingresos con proyecto: ${incomesTime}ms`);
    console.log(`   Búsqueda texto completo: ${searchTime}ms`);
    console.log(`   Análisis por categoría: ${categoryTime}ms`);
    
    const totalOptimizedTime = kpisTime + projectsTime + expensesTime + incomesTime + searchTime + categoryTime;
    console.log(`   Tiempo total optimizado: ${totalOptimizedTime}ms`);

  } catch (error) {
    console.error('❌ Error general en las pruebas:', error);
  }
}

// Ejecutar las pruebas
testOptimizations();