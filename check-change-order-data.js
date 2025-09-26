const fetch = require('node-fetch');

async function checkChangeOrderData() {
  console.log('🔍 Verificando datos de la orden de cambio a través de la API local...');
  
  const orderId = '550e8400-e29b-41d4-a716-446655441001';
  const apiUrl = `http://localhost:3000/api/change-orders/${orderId}`;
  
  try {
    console.log(`📡 Haciendo petición a: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Simular una sesión autenticada (esto normalmente vendría de las cookies)
        'Cookie': 'sb-access-token=fake-token-for-testing'
      }
    });
    
    console.log(`📊 Status de respuesta: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error en la respuesta:', errorText);
      return;
    }
    
    const result = await response.json();
    
    if (result.success) {
      const changeOrder = result.data;
      
      console.log('\n📋 Datos de la orden de cambio:');
      console.log('ID:', changeOrder.id);
      console.log('Título:', changeOrder.title);
      console.log('Descripción:', changeOrder.description);
      console.log('Monto:', changeOrder.amount);
      console.log('Moneda:', changeOrder.currency);
      console.log('Estado:', changeOrder.status);
      console.log('Tipo:', changeOrder.type);
      console.log('Impacto:', changeOrder.impact);
      
      // Campos específicos que están mostrando problemas
      console.log('\n🎯 Campos problemáticos:');
      console.log('Impacto financiero:', changeOrder.financial_impact);
      console.log('Impacto en cronograma:', changeOrder.schedule_impact);
      console.log('Diseñador:', changeOrder.designer);
      
      console.log('\n📊 Todos los campos disponibles:');
      Object.keys(changeOrder).forEach(key => {
        console.log(`${key}: ${changeOrder[key]}`);
      });
      
      // Verificar datos del proyecto si están incluidos
      if (changeOrder.projects) {
        console.log('\n🏗️ Datos del proyecto:');
        console.log('Proyecto ID:', changeOrder.projects.id);
        console.log('Proyecto nombre:', changeOrder.projects.name);
        console.log('Proyecto descripción:', changeOrder.projects.description);
        console.log('Proyecto ubicación:', changeOrder.projects.location);
        console.log('Proyecto estado:', changeOrder.projects.status);
      }
      
    } else {
      console.error('❌ Error en el resultado:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

checkChangeOrderData();