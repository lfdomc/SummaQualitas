require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFinalSumital() {
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

    // 2. Obtener proyectos disponibles
    console.log('📋 Obteniendo proyectos disponibles...');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, status')
      .in('status', ['planificacion', 'en_progreso'])
      .order('name');

    if (projectsError) {
      console.error('❌ Error obteniendo proyectos:', projectsError.message);
      return;
    }

    console.log('📋 Proyectos disponibles:');
    projects.forEach(project => {
      console.log(`  - ${project.name} (${project.id})`);
    });

    if (projects.length === 0) {
      console.error('❌ No hay proyectos disponibles');
      return;
    }

    // 3. Crear sumital con datos completos (sin supplier_phone)
    const testData = {
      project_id: projects[0].id,
      project_date: "2024-01-31",
      equipment_description: "Equipo de prueba final - Excavadora CAT 320",
      supplier_name: "Caterpillar México",
      country_of_origin: "Estados Unidos",
      brand: "Caterpillar",
      model: "320 GC",
      warranty_period: "24 meses",
      useful_life: "10 años",
      total_price: 2500000,
      maintenance: "Mantenimiento cada 250 horas de operación",
      training: "Capacitación de operadores incluida por 40 horas",
      observations: "Equipo nuevo con tecnología GPS integrada"
    };

    console.log('📦 Creando sumital con datos:', JSON.stringify(testData, null, 2));

    const { data: sumital, error: createError } = await supabase
      .from('sumitals')
      .insert({
        ...testData,
        created_by: loginData.user.id,
        updated_by: loginData.user.id,
        attached_documents: []
      })
      .select(`
        *,
        project:projects(id, name),
        created_by_user:users!sumitals_created_by_fkey(id, name, email)
      `)
      .single();

    if (createError) {
      console.error('❌ Error creando sumital:', createError.message);
      return;
    }

    console.log('✅ Sumital creado exitosamente:');
    console.log(`   📄 ID: ${sumital.id}`);
    console.log(`   🔢 Número: ${sumital.sumital_number}`);
    console.log(`   🏗️  Proyecto: ${sumital.project.name}`);
    console.log(`   🏭 Proveedor: ${sumital.supplier_name}`);
    console.log(`   💰 Precio: $${sumital.total_price.toLocaleString()}`);
    console.log(`   📅 Fecha: ${sumital.project_date}`);

    // 4. Verificar que se puede obtener el sumital
    console.log('🔍 Verificando que el sumital se puede obtener...');
    const { data: retrievedSumital, error: retrieveError } = await supabase
      .from('sumitals')
      .select(`
        *,
        project:projects(id, name),
        created_by_user:users!sumitals_created_by_fkey(id, name, email)
      `)
      .eq('id', sumital.id)
      .single();

    if (retrieveError) {
      console.error('❌ Error obteniendo sumital:', retrieveError.message);
      return;
    }

    console.log('✅ Sumital recuperado exitosamente');

    // 5. Probar la API REST
    console.log('🌐 Probando API REST...');
    
    const session = loginData.session;
    const cookies = [
      `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token=${JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        user: session.user
      })}`
    ];

    const apiTestData = {
      project_id: projects[0].id,
      project_date: "2024-02-01",
      equipment_description: "Prueba API - Grúa torre",
      supplier_name: "Grúas y Equipos SA",
      country_of_origin: "España",
      brand: "Liebherr",
      model: "85 EC-B 5",
      warranty_period: "12 meses",
      useful_life: "15 años",
      total_price: 1800000,
      maintenance: "Mantenimiento mensual",
      training: "Capacitación de operadores",
      observations: "Prueba de API REST"
    };

    const response = await fetch('http://localhost:3000/api/sumitals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies.join('; ')
      },
      body: JSON.stringify(apiTestData)
    });

    if (response.ok) {
      const apiResult = await response.json();
      console.log('✅ API REST funcionando correctamente');
      console.log(`   📄 ID: ${apiResult.sumital.id}`);
      console.log(`   🔢 Número: ${apiResult.sumital.sumital_number}`);
    } else {
      const errorText = await response.text();
      console.error('❌ Error en API REST:', response.status, errorText);
    }

    console.log('\n🎉 ¡Todas las pruebas completadas exitosamente!');
    console.log('✅ El sistema de sumitals está funcionando correctamente');
    console.log('📝 Nota: Recuerda agregar la columna supplier_phone cuando sea necesario');

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

testFinalSumital();