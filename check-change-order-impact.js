const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkChangeOrderImpact() {
  try {
    console.log('Conectando a Supabase...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const changeOrderId = '550e8400-e29b-41d4-a716-446655441002';
    console.log(`Verificando orden de cambio: ${changeOrderId}`);
    
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
    
    console.log('\n=== DATOS DE LA ORDEN DE CAMBIO ===');
    console.log('ID:', data.id);
    console.log('Título:', data.title);
    console.log('Descripción:', data.description);
    console.log('Monto (amount):', data.amount);
    console.log('Moneda:', data.currency);
    console.log('Tipo de cambio:', data.exchange_rate);
    
    console.log('\n=== CAMPOS DE IMPACTO ===');
    console.log('cost_impact:', data.cost_impact);
    console.log('cost_impact_crc:', data.cost_impact_crc);
    console.log('schedule_impact_days:', data.schedule_impact_days);
    console.log('cost_impact_level:', data.cost_impact_level);
    console.log('schedule_impact_level:', data.schedule_impact_level);
    
    console.log('\n=== ANÁLISIS ===');
    if (data.cost_impact_crc === null || data.cost_impact_crc === 0) {
      console.log('❌ cost_impact_crc está en cero o nulo');
    } else {
      console.log('✅ cost_impact_crc tiene valor:', data.cost_impact_crc);
    }
    
    if (data.schedule_impact_days === null || data.schedule_impact_days === 0) {
      console.log('❌ schedule_impact_days está en cero o nulo');
    } else {
      console.log('✅ schedule_impact_days tiene valor:', data.schedule_impact_days);
    }
    
    console.log('\n=== TODOS LOS CAMPOS ===');
    console.log(JSON.stringify(data, null, 2));
    
  } catch (err) {
    console.error('Error:', err);
  }
}

checkChangeOrderImpact();