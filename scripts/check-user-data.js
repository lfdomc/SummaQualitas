require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

// Cliente con permisos de administrador
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkUserData() {
  console.log('🔍 VERIFICANDO DATOS DEL USUARIO');
  console.log('================================');
  
  const targetEmail = 'lfdomc@gmail.com';
  
  try {
    // 1. Verificar usuario en tabla users
    console.log(`\n👤 Verificando usuario: ${targetEmail}`);
    
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', targetEmail)
      .single();
    
    if (userError) {
      console.log('❌ Error obteniendo usuario:', userError.message);
      return;
    }
    
    console.log('✅ Usuario encontrado:');
    console.log('   - ID:', userData.id);
    console.log('   - Email:', userData.email);
    console.log('   - Nombre:', userData.name);
    console.log('   - Rol:', userData.role);
    console.log('   - Activo:', userData.is_active ? 'Sí' : 'No');
    console.log('   - Creado:', userData.created_at);
    
    const userId = userData.id;
    
    // 2. Verificar proyectos asociados
    console.log('\n📋 Verificando proyectos...');
    
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('created_by', userId);
    
    if (projectsError) {
      console.log('❌ Error obteniendo proyectos:', projectsError.message);
    } else {
      console.log(`📊 Proyectos encontrados: ${projects.length}`);
      projects.forEach((project, index) => {
        console.log(`   ${index + 1}. ${project.name} (ID: ${project.id})`);
      });
    }
    
    // 3. Verificar gastos (expenses)
    console.log('\n💰 Verificando gastos...');
    
    const { data: expenses, error: expensesError } = await supabaseAdmin
      .from('expenses')
      .select('*')
      .eq('created_by', userId);
    
    if (expensesError) {
      console.log('❌ Error obteniendo gastos:', expensesError.message);
    } else {
      console.log(`💸 Gastos encontrados: ${expenses.length}`);
      expenses.forEach((expense, index) => {
        console.log(`   ${index + 1}. ${expense.description} - $${expense.amount} (${expense.date})`);
      });
    }
    
    // 4. Verificar ingresos (incomes)
    console.log('\n💵 Verificando ingresos...');
    
    const { data: incomes, error: incomesError } = await supabaseAdmin
      .from('incomes')
      .select('*')
      .eq('created_by', userId);
    
    if (incomesError) {
      console.log('❌ Error obteniendo ingresos:', incomesError.message);
    } else {
      console.log(`💰 Ingresos encontrados: ${incomes.length}`);
      incomes.forEach((income, index) => {
        console.log(`   ${index + 1}. ${income.description} - $${income.amount} (${income.date})`);
      });
    }
    
    // 5. Verificar sumitales
    console.log('\n📄 Verificando sumitales...');
    
    const { data: sumitals, error: sumitalsError } = await supabaseAdmin
      .from('sumitals')
      .select('*')
      .eq('created_by', userId);
    
    if (sumitalsError) {
      console.log('❌ Error obteniendo sumitales:', sumitalsError.message);
    } else {
      console.log(`📋 Sumitales encontrados: ${sumitals.length}`);
      sumitals.forEach((sumital, index) => {
        console.log(`   ${index + 1}. Proyecto ID: ${sumital.project_id} (${sumital.created_at})`);
      });
    }
    
    // 6. Verificar equipos
    console.log('\n🚛 Verificando equipos...');
    
    const { data: equipment, error: equipmentError } = await supabaseAdmin
      .from('equipment')
      .select('*')
      .eq('created_by', userId);
    
    if (equipmentError) {
      console.log('❌ Error obteniendo equipos:', equipmentError.message);
    } else {
      console.log(`🔧 Equipos encontrados: ${equipment.length}`);
      equipment.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.name} - ${item.type}`);
      });
    }
    
    // 7. Verificar datos de muestra en general
    console.log('\n🔍 Verificando datos de muestra en el sistema...');
    
    // Contar todos los registros en las tablas principales
    const tables = ['projects', 'expenses', 'incomes', 'sumitals', 'equipment'];
    
    for (const table of tables) {
      const { count, error } = await supabaseAdmin
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ Error contando ${table}:`, error.message);
      } else {
        console.log(`📊 Total de registros en ${table}: ${count}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

checkUserData().then(() => {
  console.log('\n✅ Verificación completada');
}).catch(error => {
  console.error('❌ Error en verificación:', error);
});