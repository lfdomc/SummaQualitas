const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkEquipmentStructure() {
  console.log('🔍 VERIFICANDO ESTRUCTURA DE LA TABLA EQUIPMENT');
  console.log('='.repeat(50));

  try {
    // Intentar obtener información de la tabla equipment
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error al consultar equipment:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('📊 Columnas disponibles en equipment:');
      const columns = Object.keys(data[0]);
      columns.forEach(col => {
        console.log(`   • ${col}`);
      });
      
      console.log('\n🔍 Verificando columnas específicas:');
      console.log(`   • is_active: ${columns.includes('is_active') ? '✅ Existe' : '❌ No existe'}`);
      console.log(`   • daily_rental_rate: ${columns.includes('daily_rental_rate') ? '✅ Existe' : '❌ No existe'}`);
      console.log(`   • status: ${columns.includes('status') ? '✅ Existe' : '❌ No existe'}`);
    } else {
      console.log('⚠️  La tabla equipment está vacía, intentando obtener estructura...');
      
      // Intentar una consulta que nos dé información sobre las columnas
      const { error: structureError } = await supabase
        .from('equipment')
        .select('id, name, category, status, daily_rental_rate, is_active')
        .limit(0);
        
      if (structureError) {
        console.error('❌ Error al verificar estructura:', structureError);
        
        // Intentar sin is_active
        const { error: withoutIsActive } = await supabase
          .from('equipment')
          .select('id, name, category, status, daily_rental_rate')
          .limit(0);
          
        if (withoutIsActive) {
          console.error('❌ Error sin is_active:', withoutIsActive);
        } else {
          console.log('✅ La consulta funciona SIN is_active');
        }
      } else {
        console.log('✅ La consulta funciona CON is_active');
      }
    }

  } catch (err) {
    console.error('❌ Error general:', err);
  }
}

checkEquipmentStructure();