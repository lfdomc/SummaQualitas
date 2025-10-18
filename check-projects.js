require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProjects() {
  try {
    console.log('🔐 Iniciando sesión...');
    
    // 1. Autenticarse
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'lfdomc@gmail.com',
      password: 'Luimorca22'
    });

    if (loginError) {
      console.error('❌ Error en login:', loginError.message);
      return;
    }

    console.log('✅ Login exitoso:', loginData.user.email);

    // 2. Consultar proyectos directamente de la base de datos
    console.log('📋 Consultando proyectos en la base de datos...');
    
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(10);

    if (projectsError) {
      console.error('❌ Error consultando proyectos:', projectsError.message);
      return;
    }

    console.log('📊 Proyectos encontrados:', projects.length);
    
    if (projects.length === 0) {
      console.log('⚠️  No hay proyectos en la base de datos');
      
      // Crear un proyecto de prueba
      console.log('🔨 Creando proyecto de prueba...');
      
      const { data: newProject, error: createError } = await supabase
        .from('projects')
        .insert([
          {
            name: 'Proyecto de Prueba',
            client_id: '1',
            description: 'Proyecto creado para pruebas de sumitals',
            location: 'Ubicación de prueba',
            start_date: '2024-01-01',
            end_date: '2024-12-31',
            status: 'en_progreso',
            presupuesto_inicial: 1000000
          }
        ])
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creando proyecto:', createError.message);
        return;
      }

      console.log('✅ Proyecto creado:', newProject);
      return newProject.id;
    } else {
      console.log('📋 Proyectos disponibles:');
      projects.forEach(project => {
        console.log(`  - ID: ${project.id}, Nombre: ${project.name}, Estado: ${project.status}`);
      });
      return projects[0].id;
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

checkProjects().then(projectId => {
  if (projectId) {
    console.log(`\n🎯 Usar project_id: "${projectId}" para crear sumitals`);
  }
});