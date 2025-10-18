require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthenticatedSumital() {
  try {
    console.log('🔐 Iniciando sesión...');
    
    // 1. Autenticarse primero
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'lfdomc@gmail.com',
      password: 'Luimorca22'
    });

    if (loginError) {
      console.error('❌ Error en login:', loginError.message);
      return;
    }

    console.log('✅ Login exitoso:', loginData.user.email);

    // 2. Verificar sesión
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('❌ Error obteniendo sesión:', sessionError?.message);
      return;
    }

    console.log('✅ Sesión activa:', session.user.email);

    // 3. Preparar datos de prueba
    const testData = {
      project_id: "1",
      project_date: "2024-01-31",
      equipment_description: "Equipo de prueba autenticado",
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
      observations: "Observaciones de prueba"
    };

    console.log('📦 Datos de prueba:', JSON.stringify(testData, null, 2));

    // 4. Hacer la petición con autenticación
    const response = await fetch('http://localhost:3000/api/sumitals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(testData)
    });

    console.log('📨 Status:', response.status);
    console.log('📨 Status Text:', response.statusText);

    const result = await response.json();
    console.log('📄 Resultado completo:', JSON.stringify(result, null, 2));

    if (!response.ok) {
      console.log('❌ Error en la respuesta:', result);
    } else {
      console.log('✅ Sumital creado exitosamente');
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

testAuthenticatedSumital();