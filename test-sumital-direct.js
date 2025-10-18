require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSumitalDirect() {
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
    console.log('👤 User ID:', loginData.user.id);

    // 2. Verificar el perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', loginData.user.id)
      .single();

    if (profileError) {
      console.error('❌ Error obteniendo perfil:', profileError.message);
      return;
    }

    console.log('👤 Perfil del usuario:', profile);

    // 3. Verificar el proyecto
    const projectId = "64561c06-e646-468a-9112-24a600e7f8f0";
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError) {
      console.error('❌ Error obteniendo proyecto:', projectError.message);
      return;
    }

    console.log('📋 Proyecto encontrado:', project);

    // 4. Obtener el siguiente número de sumital
    const { data: nextNumber, error: numberError } = await supabase
      .rpc('get_next_sumital_number', { p_project_id: projectId });

    if (numberError) {
      console.error('❌ Error obteniendo número de sumital:', numberError.message);
    } else {
      console.log('🔢 Siguiente número de sumital:', nextNumber);
    }

    // 5. Preparar datos de prueba con sumital_number
    const testData = {
      project_id: projectId,
      sumital_number: nextNumber || 1,
      project_date: "2024-01-31",
      equipment_description: "Equipo de prueba directo",
      supplier_name: "Proveedor de prueba",
      supplier_phone: "123456789",
      country_of_origin: "México",
      brand: "Marca Test",
      model: "Modelo Test",
      warranty_period: "12 meses",
      useful_life: "5 años",
      total_price: 1000,
      maintenance: "Mantenimiento básico",
      training: "Capacitación incluida",
      observations: "Observaciones de prueba",
      created_by: loginData.user.id,
      updated_by: loginData.user.id
    };

    console.log('📦 Datos de prueba:', JSON.stringify(testData, null, 2));

    // 6. Intentar crear el sumital directamente en la base de datos
    const { data: sumital, error: sumitalError } = await supabase
      .from('sumitals')
      .insert(testData)
      .select()
      .single();

    if (sumitalError) {
      console.error('❌ Error creando sumital:', sumitalError);
      
      // Verificar si es un problema de RLS
      if (sumitalError.code === 'PGRST301') {
        console.log('🔒 Problema de Row Level Security detectado');
        
        // Verificar políticas RLS
        const { data: policies, error: policiesError } = await supabase
          .from('pg_policies')
          .select('*')
          .eq('tablename', 'sumitals');
          
        if (!policiesError) {
          console.log('📋 Políticas RLS para sumitals:', policies);
        }
      }
      
      return;
    }

    console.log('✅ Sumital creado exitosamente:', sumital);

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

testSumitalDirect();