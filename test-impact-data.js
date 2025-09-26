// Script para simular cómo se verían los datos después de la migración
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function calculateImpactData(changeOrder) {
  const amount = changeOrder.amount || 0;
  const currency = changeOrder.currency || 'USD';
  const exchangeRate = 520.0000;
  
  // Calcular cost_impact_crc
  const cost_impact_crc = currency === 'CRC' ? amount : amount * exchangeRate;
  
  // Calcular schedule_impact_days basado en el monto
  let schedule_impact_days;
  let cost_impact_level;
  let schedule_impact_level;
  
  if (amount > 50000) {
    schedule_impact_days = 30;
    cost_impact_level = 'alto';
    schedule_impact_level = 'alto';
  } else if (amount > 20000) {
    schedule_impact_days = 15;
    cost_impact_level = 'medio';
    schedule_impact_level = 'medio';
  } else {
    schedule_impact_days = 7;
    cost_impact_level = 'bajo';
    schedule_impact_level = 'bajo';
  }
  
  return {
    ...changeOrder,
    cost_impact: amount,
    cost_impact_crc,
    schedule_impact_days,
    cost_impact_level,
    schedule_impact_level,
    exchange_rate: exchangeRate
  };
}

function formatCurrency(amount, currency = 'CRC') {
  if (amount === null || amount === undefined) return '₡0';
  
  if (currency === 'CRC') {
    return `₡${new Intl.NumberFormat('es-CR').format(amount)}`;
  } else {
    return `$${new Intl.NumberFormat('en-US').format(amount)}`;
  }
}

async function testImpactData() {
  try {
    console.log('Conectando a Supabase...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const changeOrderId = '550e8400-e29b-41d4-a716-446655441002';
    console.log(`Obteniendo datos actuales de la orden: ${changeOrderId}`);
    
    const { data, error } = await supabase
      .from('change_orders')
      .select('*')
      .eq('id', changeOrderId)
      .single();
    
    if (error) {
      console.error('Error al obtener la orden de cambio:', error);
      return;
    }
    
    if (!data) {
      console.log('No se encontró la orden de cambio');
      return;
    }
    
    console.log('\n=== DATOS ACTUALES ===');
    console.log('ID:', data.id);
    console.log('Título:', data.title);
    console.log('Monto:', formatCurrency(data.amount, data.currency));
    console.log('Moneda:', data.currency);
    
    // Simular datos después de la migración
    const simulatedData = calculateImpactData(data);
    
    console.log('\n=== DATOS SIMULADOS DESPUÉS DE LA MIGRACIÓN ===');
    console.log('cost_impact:', formatCurrency(simulatedData.cost_impact, simulatedData.currency));
    console.log('cost_impact_crc:', formatCurrency(simulatedData.cost_impact_crc, 'CRC'));
    console.log('schedule_impact_days:', simulatedData.schedule_impact_days, 'días');
    console.log('cost_impact_level:', simulatedData.cost_impact_level);
    console.log('schedule_impact_level:', simulatedData.schedule_impact_level);
    console.log('exchange_rate:', simulatedData.exchange_rate);
    
    console.log('\n=== CÓMO SE VERÁ EN LA INTERFAZ ===');
    console.log('Impacto Financiero:');
    console.log(`  +${formatCurrency(simulatedData.cost_impact_crc)}`);
    console.log('  Incremento del presupuesto');
    
    console.log('\nImpacto en Cronograma:');
    console.log(`  +${simulatedData.schedule_impact_days} días`);
    console.log('  Retraso en cronograma');
    
    console.log('\n=== CONVERSIÓN USD A CRC ===');
    console.log(`$${data.amount} USD × ${simulatedData.exchange_rate} = ${formatCurrency(simulatedData.cost_impact_crc)}`);
    
  } catch (err) {
    console.error('Error:', err);
  }
}

testImpactData();