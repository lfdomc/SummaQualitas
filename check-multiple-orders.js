// Script para verificar múltiples órdenes de cambio
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function formatCurrency(amount, currency = 'CRC') {
  if (amount === null || amount === undefined) return '₡0';
  
  if (currency === 'CRC') {
    return `₡${new Intl.NumberFormat('es-CR').format(amount)}`;
  } else {
    return `$${new Intl.NumberFormat('en-US').format(amount)}`;
  }
}

async function checkMultipleOrders() {
  try {
    console.log('Conectando a Supabase...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const orderIds = [
      '550e8400-e29b-41d4-a716-446655441002',
      '550e8400-e29b-41d4-a716-446655441003'
    ];
    
    for (const orderId of orderIds) {
      console.log(`\n=== ORDEN DE CAMBIO: ${orderId} ===`);
      
      const { data, error } = await supabase
        .from('change_orders')
        .select('*')
        .eq('id', orderId)
        .single();
      
      if (error) {
        console.error(`Error al obtener la orden ${orderId}:`, error);
        continue;
      }
      
      if (!data) {
        console.log(`No se encontró la orden ${orderId}`);
        continue;
      }
      
      console.log('Título:', data.title);
      console.log('Descripción:', data.description);
      console.log('Monto:', formatCurrency(data.amount, data.currency));
      console.log('Moneda:', data.currency);
      console.log('Estado:', data.status);
      
      // Verificar campos de impacto
      console.log('\n--- Campos de Impacto ---');
      console.log('designer:', data.designer || 'undefined');
      console.log('cost_impact:', data.cost_impact || 'undefined');
      console.log('cost_impact_crc:', data.cost_impact_crc || 'undefined');
      console.log('schedule_impact_days:', data.schedule_impact_days || 'undefined');
      console.log('cost_impact_level:', data.cost_impact_level || 'undefined');
      console.log('schedule_impact_level:', data.schedule_impact_level || 'undefined');
      console.log('exchange_rate:', data.exchange_rate || 'undefined');
      
      // Simular valores después de la migración
      const exchangeRate = 520.0000;
      const cost_impact_crc = data.currency === 'CRC' ? data.amount : data.amount * exchangeRate;
      
      let schedule_impact_days, cost_impact_level, schedule_impact_level;
      if (data.amount > 50000) {
        schedule_impact_days = 30;
        cost_impact_level = 'alto';
        schedule_impact_level = 'alto';
      } else if (data.amount > 20000) {
        schedule_impact_days = 15;
        cost_impact_level = 'medio';
        schedule_impact_level = 'medio';
      } else {
        schedule_impact_days = 7;
        cost_impact_level = 'bajo';
        schedule_impact_level = 'bajo';
      }
      
      console.log('\n--- Valores Simulados Después de Migración ---');
      console.log('cost_impact_crc:', formatCurrency(cost_impact_crc));
      console.log('schedule_impact_days:', schedule_impact_days, 'días');
      console.log('cost_impact_level:', cost_impact_level);
      console.log('schedule_impact_level:', schedule_impact_level);
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

checkMultipleOrders();