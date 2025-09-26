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

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAnalyticsProduction() {
  console.log('🔍 Diagnóstico del problema de Analytics en Producción\n');
  
  try {
    // 1. Verificar conexión a Supabase
    console.log('1️⃣ Verificando conexión a Supabase...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('projects')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Error de conexión a Supabase:', connectionError.message);
      return;
    }
    console.log('✅ Conexión a Supabase exitosa\n');

    // 2. Verificar proyectos en la base de datos
    console.log('2️⃣ Verificando proyectos en la base de datos...');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        status,
        client_id,
        budget,
        created_at,
        client:clients(id, name)
      `)
      .order('created_at', { ascending: false });

    if (projectsError) {
      console.error('❌ Error obteniendo proyectos:', projectsError.message);
      return;
    }

    console.log(`📊 Total de proyectos encontrados: ${projects?.length || 0}`);
    
    if (projects && projects.length > 0) {
      console.log('\n📋 Lista de proyectos:');
      projects.forEach((project, index) => {
        console.log(`   ${index + 1}. ${project.name || 'Sin nombre'}`);
        console.log(`      ID: ${project.id}`);
        console.log(`      Cliente: ${project.client?.name || 'Sin cliente'}`);
        console.log(`      Estado: ${project.status || 'Sin estado'}`);
        console.log(`      Presupuesto: $${project.budget || 0}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No se encontraron proyectos en la base de datos');
    }

    // 3. Verificar estructura de datos
    console.log('3️⃣ Verificando estructura de datos...');
    if (projects && projects.length > 0) {
      const firstProject = projects[0];
      console.log('📋 Estructura del primer proyecto:');
      console.log(JSON.stringify(firstProject, null, 2));
    }

    // 4. Simular la consulta que hace el componente Analytics
    console.log('\n4️⃣ Simulando consulta del componente Analytics...');
    const { data: analyticsProjects, error: analyticsError } = await supabase
      .from('projects')
      .select(`
        *,
        client:clients(*)
      `)
      .order('created_at', { ascending: false });

    if (analyticsError) {
      console.error('❌ Error en consulta de analytics:', analyticsError.message);
      return;
    }

    console.log(`📊 Proyectos obtenidos por analytics: ${analyticsProjects?.length || 0}`);
    
    if (analyticsProjects && analyticsProjects.length > 0) {
      console.log('\n✅ Los proyectos se obtienen correctamente');
      console.log('📋 Primer proyecto para analytics:');
      console.log(`   - ID: ${analyticsProjects[0].id}`);
      console.log(`   - Nombre: ${analyticsProjects[0].name}`);
      console.log(`   - Cliente: ${analyticsProjects[0].client?.name || 'Sin cliente'}`);
      console.log(`   - Estado: ${analyticsProjects[0].status}`);
    }

    // 5. Verificar permisos RLS
    console.log('\n5️⃣ Verificando permisos RLS...');
    
    // Intentar obtener proyectos sin autenticación
    const supabaseAnon = createClient(supabaseUrl, supabaseKey);
    const { data: anonProjects, error: anonError } = await supabaseAnon
      .from('projects')
      .select('id, name')
      .limit(1);

    if (anonError) {
      console.log('⚠️  RLS está activo (esperado):', anonError.message);
    } else {
      console.log('✅ Proyectos accesibles sin autenticación:', anonProjects?.length || 0);
    }

    // 6. Verificar clientes relacionados
    console.log('\n6️⃣ Verificando clientes relacionados...');
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name')
      .order('name');

    if (clientsError) {
      console.error('❌ Error obteniendo clientes:', clientsError.message);
    } else {
      console.log(`📊 Total de clientes: ${clients?.length || 0}`);
      if (clients && clients.length > 0) {
        console.log('📋 Primeros 3 clientes:');
        clients.slice(0, 3).forEach((client, index) => {
          console.log(`   ${index + 1}. ${client.name} (ID: ${client.id})`);
        });
      }
    }

    // 7. Diagnóstico final
    console.log('\n🎯 DIAGNÓSTICO FINAL:');
    
    if (!projects || projects.length === 0) {
      console.log('❌ PROBLEMA: No hay proyectos en la base de datos');
      console.log('💡 SOLUCIÓN: Crear al menos un proyecto de prueba');
    } else if (analyticsProjects && analyticsProjects.length > 0) {
      console.log('✅ Los datos se obtienen correctamente desde la base de datos');
      console.log('⚠️  El problema podría estar en:');
      console.log('   - Renderizado del componente React');
      console.log('   - Estado de autenticación en producción');
      console.log('   - Configuración de Next.js en producción');
      console.log('   - Caché del navegador');
    }

    // 8. Recomendaciones
    console.log('\n💡 RECOMENDACIONES:');
    console.log('1. Verificar que el usuario esté autenticado en producción');
    console.log('2. Limpiar caché del navegador y hacer hard refresh');
    console.log('3. Verificar logs de Vercel para errores de servidor');
    console.log('4. Verificar que las variables de entorno estén configuradas en Vercel');
    console.log('5. Probar en modo incógnito del navegador');

  } catch (error) {
    console.error('💥 Error general en el diagnóstico:', error.message);
  }
}

// Ejecutar diagnóstico
debugAnalyticsProduction();