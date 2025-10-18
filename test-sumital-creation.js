// Script de prueba para verificar la creación de sumitals
// Ejecutar con: node test-sumital-creation.js

const testSumitalCreation = async () => {
  try {
    console.log('🧪 Iniciando prueba de creación de sumital...');
    
    const testData = {
      project_id: '1',
      project_date: '2024-01-31',
      equipment_description: 'Equipo de prueba',
      supplier_name: 'Proveedor de prueba',
      supplier_phone: '123456789',
      country_of_origin: 'México',
      brand: 'Marca Test',
      model: 'Modelo Test',
      warranty_period: '12 meses',
      useful_life: '5 años',
      total_price: 1000,
      maintenance: 'Mantenimiento básico',
      training: 'Capacitación incluida',
      observations: 'Observaciones de prueba'
    };
    
    console.log('📦 Datos de prueba:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:3000/api/sumitals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
    
    console.log('📨 Status:', response.status);
    console.log('📨 Status Text:', response.statusText);
    
    const result = await response.json();
    console.log('📄 Resultado:', JSON.stringify(result, null, 2));
    
    if (!response.ok) {
      console.log('❌ Error en la respuesta');
    } else {
      console.log('✅ Sumital creado exitosamente');
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
};

testSumitalCreation();