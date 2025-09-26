const { default: fetch } = require('node-fetch');

async function testAuthAPI() {
  try {
    console.log('🔍 Probando API de autenticación...');
    
    const response = await fetch('http://localhost:3000/api/auth/status', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('📊 Status de respuesta:', response.status);
    
    const data = await response.json();
    console.log('📋 Datos de respuesta:', JSON.stringify(data, null, 2));

    if (data.user) {
      console.log('✅ Usuario encontrado:', data.user.email);
    } else {
      console.log('❌ No hay usuario autenticado');
    }

    if (data.profile) {
      console.log('✅ Perfil encontrado:', data.profile.full_name);
    } else {
      console.log('❌ No hay perfil de usuario');
    }

  } catch (error) {
    console.error('❌ Error al probar API:', error);
  }
}

testAuthAPI();