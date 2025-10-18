require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

// Cliente admin para verificar todo
const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function verifyDatabaseIntegrity() {
  console.log('🔍 VERIFICACIÓN COMPLETA DE LA BASE DE DATOS');
  console.log('=============================================');
  
  try {
    // 1. Verificar usuarios
    console.log('\n👥 USUARIOS:');
    const { data: users, error: usersError } = await adminClient
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (usersError) {
      console.log('❌ Error obteniendo usuarios:', usersError.message);
    } else {
      console.log(`✅ Total de usuarios: ${users.length}`);
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} - ${user.name} (${user.role}) - Creado: ${new Date(user.created_at).toLocaleDateString()}`);
      });
    }
    
    // 2. Verificar proyectos
    console.log('\n📋 PROYECTOS:');
    const { data: projects, error: projectsError } = await adminClient
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (projectsError) {
      console.log('❌ Error obteniendo proyectos:', projectsError.message);
    } else {
      console.log(`✅ Total de proyectos: ${projects.length}`);
      projects.forEach((project, index) => {
        console.log(`   ${index + 1}. ${project.name} - Estado: ${project.status} - Presupuesto: $${project.budget || project.presupuesto_inicial || 0}`);
      });
    }
    
    // 3. Verificar gastos
    console.log('\n💰 GASTOS:');
    const { data: expenses, error: expensesError } = await adminClient
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (expensesError) {
      console.log('❌ Error obteniendo gastos:', expensesError.message);
    } else {
      console.log(`✅ Total de gastos: ${expenses.length}`);
      expenses.forEach((expense, index) => {
        console.log(`   ${index + 1}. ${expense.description} - $${expense.amount} - ${expense.date}`);
      });
    }
    
    // 4. Verificar equipos
    console.log('\n🚛 EQUIPOS:');
    const { data: equipment, error: equipmentError } = await adminClient
      .from('equipment')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (equipmentError) {
      console.log('❌ Error obteniendo equipos:', equipmentError.message);
    } else {
      console.log(`✅ Total de equipos: ${equipment.length}`);
      equipment.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.name} - Tipo: ${item.type} - Estado: ${item.status}`);
      });
    }
    
    // 5. Verificar clientes
    console.log('\n🏢 CLIENTES:');
    const { data: clients, error: clientsError } = await adminClient
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (clientsError) {
      console.log('❌ Error obteniendo clientes:', clientsError.message);
    } else {
      console.log(`✅ Total de clientes: ${clients.length}`);
      clients.forEach((client, index) => {
        console.log(`   ${index + 1}. ${client.name} - Email: ${client.email} - Teléfono: ${client.phone}`);
      });
    }
    
    // 6. Verificar proveedores
    console.log('\n🏭 PROVEEDORES:');
    const { data: suppliers, error: suppliersError } = await adminClient
      .from('suppliers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (suppliersError) {
      console.log('❌ Error obteniendo proveedores:', suppliersError.message);
    } else {
      console.log(`✅ Total de proveedores: ${suppliers.length}`);
      suppliers.forEach((supplier, index) => {
        console.log(`   ${index + 1}. ${supplier.name} - Email: ${supplier.email} - Teléfono: ${supplier.phone}`);
      });
    }
    
    // 7. Verificar sumitals
    console.log('\n📊 SUMITALS:');
    const { data: sumitals, error: sumitalsError } = await adminClient
      .from('sumitals')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (sumitalsError) {
      console.log('❌ Error obteniendo sumitals:', sumitalsError.message);
    } else {
      console.log(`✅ Total de sumitals: ${sumitals.length}`);
      sumitals.forEach((sumital, index) => {
        console.log(`   ${index + 1}. Proyecto ID: ${sumital.project_id} - Fecha: ${sumital.date} - Total: $${sumital.total_amount}`);
      });
    }
    
    // 8. Resumen general
    console.log('\n📈 RESUMEN GENERAL:');
    console.log('==================');
    console.log(`👥 Usuarios: ${users?.length || 0}`);
    console.log(`📋 Proyectos: ${projects?.length || 0}`);
    console.log(`💰 Gastos: ${expenses?.length || 0}`);
    console.log(`🚛 Equipos: ${equipment?.length || 0}`);
    console.log(`🏢 Clientes: ${clients?.length || 0}`);
    console.log(`🏭 Proveedores: ${suppliers?.length || 0}`);
    console.log(`📊 Sumitals: ${sumitals?.length || 0}`);
    
    const totalRecords = (users?.length || 0) + (projects?.length || 0) + (expenses?.length || 0) + 
                        (equipment?.length || 0) + (clients?.length || 0) + (suppliers?.length || 0) + 
                        (sumitals?.length || 0);
    
    console.log(`\n🎯 TOTAL DE REGISTROS EN LA BASE DE DATOS: ${totalRecords}`);
    
    if (totalRecords === 0) {
      console.log('\n⚠️  LA BASE DE DATOS PARECE ESTAR VACÍA');
      console.log('   Esto podría indicar:');
      console.log('   1. Base de datos nueva sin datos iniciales');
      console.log('   2. Problema de conexión');
      console.log('   3. Políticas RLS muy restrictivas');
    } else {
      console.log('\n✅ LA BASE DE DATOS CONTIENE DATOS');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

verifyDatabaseIntegrity().then(() => {
  console.log('\n✅ Verificación completada');
}).catch(error => {
  console.error('❌ Error en verificación:', error);
});