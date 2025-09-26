require('dotenv').config({ path: '.env.local' });
const { default: fetch } = require('node-fetch');

async function testBrowserAuth() {
  try {
    console.log('🌐 Probando autenticación desde el navegador...');
    
    // Simular login desde el navegador
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'lfdomc@gmail.com',
        password: 'admin123'
      })
    });
    
    console.log('📡 Respuesta del login:', loginResponse.status);
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login exitoso:', loginData);
      
      // Obtener cookies de la respuesta
      const cookies = loginResponse.headers.get('set-cookie');
      console.log('🍪 Cookies:', cookies);
      
      // Probar el endpoint de status con las cookies
      const statusResponse = await fetch('http://localhost:3000/api/auth/status', {
        headers: {
          'Cookie': cookies || ''
        }
      });
      
      const statusData = await statusResponse.json();
      console.log('📊 Status después del login:', statusData);
      
    } else {
      const errorData = await loginResponse.text();
      console.log('❌ Error en login:', errorData);
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

testBrowserAuth();