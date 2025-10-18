require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBrowserLike() {
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

    // 2. Obtener la sesión y las cookies
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('❌ Error obteniendo sesión:', sessionError?.message);
      return;
    }

    console.log('✅ Sesión activa:', session.user.email);

    // 3. Simular las cookies que enviaría el navegador
    const cookies = [
      `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token=${JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        user: session.user
      })}`
    ];

    console.log('🍪 Cookies simuladas preparadas');

    // 4. Obtener un cliente válido
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name')
      .limit(1);
    if (clientsError || !clients || clients.length === 0) {
      console.error('❌ No se pudo obtener un cliente válido:', clientsError?.message);
      return;
    }
    const clientId = clients[0].id;

    // 5. Preparar datos del proyecto (como en el formulario)
    const projectData = {
      name: `Proyecto API ${new Date().toISOString()}`,
      description: 'Creado via /api/projects para verificación',
      location: 'San José, Costa Rica',
      client_id: clientId,
      presupuesto_inicial: 750000,
      costos_directos: 262500,
      costos_indirectos: 37500,
      administracion: 75000,
      mano_obra: 225000,
      imprevistos: 37500,
      utilidad: 112500,
      presupuesto_final: 750000,
      estimated_start_date: '2025-10-20',
      estimated_end_date: '2025-12-31',
      actual_start_date: null,
      actual_end_date: null,
      total_area: 800,
      exchange_rate_usd: 540
    };

    console.log('📦 Datos del proyecto (API):', JSON.stringify(projectData, null, 2));

    // 6. Hacer la petición a /api/projects con cookies de sesión
    const response = await fetch('http://localhost:3001/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies.join('; ')
      },
      body: JSON.stringify(projectData)
    });

    console.log('📨 Status:', response.status);
    console.log('📨 Status Text:', response.statusText);

    // Intentar parsear JSON solo si el content-type es JSON
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      console.log('📝 Respuesta no JSON:', text.slice(0, 200));
      throw new Error('Respuesta no JSON del servidor');
    }

    const result = await response.json();
    console.log('📄 Resultado completo:', JSON.stringify(result, null, 2));

    if (!response.ok || !result.success) {
      console.log('❌ Error en la respuesta de /api/projects:', result.error || result);
    } else {
      console.log('✅ Proyecto creado exitosamente vía API');
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

testBrowserLike();