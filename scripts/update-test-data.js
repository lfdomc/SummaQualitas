// Script para actualizar datos de prueba usando la API local
const https = require('https');
const http = require('http');

// Configuración para ignorar certificados SSL en desarrollo
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

async function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const protocol = urlObj.protocol === 'https:' ? https : http;
    const req = protocol.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsedData });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function updateTestData() {
  console.log('🔄 Actualizando datos de prueba de la orden de cambio...');
  
  try {
    // Primero, obtener los datos actuales
    console.log('📋 Obteniendo datos actuales...');
    const currentData = await makeRequest('http://localhost:3000/api/change-orders/550e8400-e29b-41d4-a716-446655441001');
    
    if (currentData.status !== 200) {
      console.error('❌ Error al obtener datos actuales:', currentData);
      return;
    }

    console.log('✅ Datos actuales obtenidos');
    console.log('🎯 Campos problemáticos actuales:');
    console.log('Diseñador:', currentData.data.designer || 'N/A');
    console.log('Impacto financiero (cost_impact):', currentData.data.cost_impact || 0);
    console.log('Impacto financiero CRC (cost_impact_crc):', currentData.data.cost_impact_crc || 0);
    console.log('Impacto en cronograma:', currentData.data.schedule_impact_days || 0);

    // Datos de actualización
    const updateData = {
      designer: 'Ing. María González',
      cost_impact: 2500000.00,
      currency: 'CRC',
      exchange_rate: 520.0000,
      cost_impact_crc: 2500000.00,
      schedule_impact_days: 15,
      cost_impact_level: 'alto',
      quality_impact_level: 'medio',
      schedule_impact_level: 'alto',
      risk_impact_level: 'medio',
      cost_comments: 'Incremento debido a cambios en especificaciones de materiales',
      quality_comments: 'Mejora en la calidad de acabados',
      schedule_comments: 'Retraso por tiempo adicional de instalación',
      risk_comments: 'Riesgo controlado con supervisión adicional',
      general_comments: 'Orden de cambio aprobada por el cliente para mejorar la calidad del proyecto'
    };

    // Actualizar usando PUT
    console.log('🔄 Actualizando datos...');
    const updateResult = await makeRequest(
      'http://localhost:3000/api/change-orders/550e8400-e29b-41d4-a716-446655441001',
      'PUT',
      updateData
    );

    if (updateResult.status !== 200) {
      console.error('❌ Error al actualizar:', updateResult);
      return;
    }

    console.log('✅ Datos actualizados exitosamente');

    // Verificar los datos actualizados
    console.log('🔍 Verificando datos actualizados...');
    const verifyData = await makeRequest('http://localhost:3000/api/change-orders/550e8400-e29b-41d4-a716-446655441001');
    
    if (verifyData.status === 200) {
      console.log('\n🎯 Verificación de campos problemáticos:');
      console.log('Diseñador:', verifyData.data.designer || 'N/A');
      console.log('Impacto financiero (cost_impact):', verifyData.data.cost_impact || 0);
      console.log('Impacto financiero CRC (cost_impact_crc):', verifyData.data.cost_impact_crc || 0);
      console.log('Impacto en cronograma:', verifyData.data.schedule_impact_days || 0);
      console.log('Moneda:', verifyData.data.currency || 'N/A');
      console.log('Tipo de cambio:', verifyData.data.exchange_rate || 0);
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

updateTestData();