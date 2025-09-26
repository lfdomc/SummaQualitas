// Script para verificar qué datos está devolviendo la API
const http = require('http');

async function checkAPIData() {
  console.log('🔍 Verificando datos de la API...');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/debug/change-orders/550e8400-e29b-41d4-a716-446655441001',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          console.log('📊 Status de respuesta:', res.statusCode);
          
          if (res.statusCode === 200) {
            console.log('\n✅ Datos recibidos de la API:');
            
            if (parsedData.data) {
              const changeOrder = parsedData.data;
              console.log('🎯 Campos problemáticos:');
              console.log('- Diseñador:', changeOrder.designer || 'undefined/null');
              console.log('- cost_impact:', changeOrder.cost_impact || 'undefined/null');
              console.log('- cost_impact_crc:', changeOrder.cost_impact_crc || 'undefined/null');
              console.log('- schedule_impact_days:', changeOrder.schedule_impact_days || 'undefined/null');
              console.log('- currency:', changeOrder.currency || 'undefined/null');
              console.log('- exchange_rate:', changeOrder.exchange_rate || 'undefined/null');
              
              console.log('\n📋 Información de debugging:');
              if (parsedData.debug) {
                console.log('- Columnas disponibles:', parsedData.debug.availableColumns);
                console.log('- Campos problemáticos en DB:', parsedData.debug.problematicFields);
              }
              
              console.log('\n📄 Datos completos del change order:');
              console.log(JSON.stringify(changeOrder, null, 2));
            } else {
              console.log('📄 Respuesta completa:');
              console.log(JSON.stringify(parsedData, null, 2));
            }
          } else {
            console.log('❌ Error en la respuesta:', parsedData);
          }
          
          resolve(parsedData);
        } catch (e) {
          console.error('❌ Error al parsear JSON:', e);
          console.log('📄 Respuesta cruda:', data);
          reject(e);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error en la petición:', error);
      reject(error);
    });

    req.end();
  });
}

checkAPIData().catch(console.error);