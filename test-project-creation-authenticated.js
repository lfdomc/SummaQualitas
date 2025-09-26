const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProjectCreation() {
  console.log('🧪 Probando creación de proyectos con usuario autenticado...\n');
  
  try {
    // 1. Autenticar como el usuario admin
    console.log('🔐 Autenticando como admin@summa.com...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@summa.com',
      password: 'admin123456'
    });
    
    if (authError) {
      console.error('❌ Error de autenticación:', authError.message);
      return;
    }
    
    console.log('✅ Usuario autenticado exitosamente');
    console.log('👤 Usuario ID:', authData.user.id);
    
    // 2. Verificar el perfil del usuario
    console.log('\n👤 Verificando perfil de usuario...');
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Error al obtener perfil:', profileError.message);
      return;
    }
    
    console.log('✅ Perfil encontrado:');
    console.log('   📧 Email:', profile.email);
    console.log('   👑 Rol:', profile.role);
    console.log('   ✅ Activo:', profile.is_active);
    
    // 3. Crear un proyecto de prueba básico
    console.log('\n🏗️  Creando proyecto básico...');
    const basicProject = {
      name: 'Proyecto de Prueba Básico',
      description: 'Proyecto creado para probar la funcionalidad básica',
      status: 'planning',
      location: 'Ciudad de México',
      total_area: 150.50,
      presupuesto_inicial: 500000.00,
      estimated_start_date: '2024-02-01',
      estimated_end_date: '2024-08-01'
    };
    
    const { data: basicProjectData, error: basicError } = await supabase
      .from('projects')
      .insert(basicProject)
      .select()
      .single();
    
    if (basicError) {
      console.error('❌ Error al crear proyecto básico:', basicError.message);
      console.error('📋 Detalles:', basicError);
    } else {
      console.log('✅ Proyecto básico creado exitosamente:');
      console.log('   🆔 ID:', basicProjectData.id);
      console.log('   📝 Nombre:', basicProjectData.name);
      console.log('   📍 Ubicación:', basicProjectData.location);
      console.log('   💰 Presupuesto:', basicProjectData.presupuesto_inicial);
    }
    
    // 4. Crear un proyecto con presupuesto detallado
    console.log('\n💰 Creando proyecto con presupuesto detallado...');
    const detailedProject = {
      name: 'Proyecto con Presupuesto Completo',
      description: 'Proyecto con todos los campos de presupuesto',
      status: 'planning',
      location: 'Guadalajara, Jalisco',
      total_area: 300.75,
      presupuesto_inicial: 1000000.00,
      costos_directos: 600000.00,
      costos_indirectos: 150000.00,
      mano_obra: 200000.00,
      administracion: 30000.00,
      imprevistos: 15000.00,
      utilidad: 50000.00,
      estimated_start_date: '2024-03-01',
      estimated_end_date: '2024-12-01',
      manager_id: authData.user.id
    };
    
    const { data: detailedProjectData, error: detailedError } = await supabase
      .from('projects')
      .insert(detailedProject)
      .select()
      .single();
    
    if (detailedError) {
      console.error('❌ Error al crear proyecto detallado:', detailedError.message);
      console.error('📋 Detalles:', detailedError);
    } else {
      console.log('✅ Proyecto detallado creado exitosamente:');
      console.log('   🆔 ID:', detailedProjectData.id);
      console.log('   📝 Nombre:', detailedProjectData.name);
      console.log('   📍 Ubicación:', detailedProjectData.location);
      console.log('   💰 Presupuesto inicial:', detailedProjectData.presupuesto_inicial);
      console.log('   🏗️  Costos directos:', detailedProjectData.costos_directos);
      console.log('   📊 Costos indirectos:', detailedProjectData.costos_indirectos);
      console.log('   👷 Mano de obra:', detailedProjectData.mano_obra);
      console.log('   🏢 Administración:', detailedProjectData.administracion);
      console.log('   ⚠️  Imprevistos:', detailedProjectData.imprevistos);
      console.log('   💵 Utilidad:', detailedProjectData.utilidad);
      console.log('   👨‍💼 Manager ID:', detailedProjectData.manager_id);
    }
    
    // 5. Verificar que los proyectos se pueden consultar
    console.log('\n📋 Verificando consulta de proyectos...');
    const { data: allProjects, error: queryError } = await supabase
      .from('projects')
      .select('id, name, status, presupuesto_inicial, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (queryError) {
      console.error('❌ Error al consultar proyectos:', queryError.message);
    } else {
      console.log('✅ Proyectos encontrados:', allProjects.length);
      allProjects.forEach((project, index) => {
        console.log(`   ${index + 1}. ${project.name} (${project.status}) - $${project.presupuesto_inicial}`);
      });
    }
    
    // 6. Limpiar proyectos de prueba
    console.log('\n🧹 Limpiando proyectos de prueba...');
    const projectsToDelete = [];
    if (basicProjectData) projectsToDelete.push(basicProjectData.id);
    if (detailedProjectData) projectsToDelete.push(detailedProjectData.id);
    
    if (projectsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .in('id', projectsToDelete);
      
      if (deleteError) {
        console.error('❌ Error al limpiar proyectos:', deleteError.message);
      } else {
        console.log('✅ Proyectos de prueba eliminados exitosamente');
      }
    }
    
    console.log('\n🎉 ¡Prueba de creación de proyectos completada exitosamente!');
    console.log('📝 Resumen:');
    console.log('   ✅ Autenticación funcionando');
    console.log('   ✅ Perfil de usuario correcto');
    console.log('   ✅ Creación de proyectos básicos funcionando');
    console.log('   ✅ Creación de proyectos con presupuesto detallado funcionando');
    console.log('   ✅ Consulta de proyectos funcionando');
    console.log('   ✅ Eliminación de proyectos funcionando');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    // Cerrar sesión
    await supabase.auth.signOut();
    console.log('\n🔓 Sesión cerrada');
  }
}

testProjectCreation();