require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configurar cliente de Supabase con service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno de Supabase no encontradas');
  console.error('Asegúrate de que NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY estén configuradas en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function detectMissingColumns() {
  console.log('🚀 Detectando columnas faltantes en change_orders...');
  
  try {
    // Primero verificar que la orden de cambio existe
    console.log('🔍 Verificando orden de cambio existente...');
    const { data: existingOrder, error: fetchError } = await supabase
      .from('change_orders')
      .select('*')
      .eq('id', '550e8400-e29b-41d4-a716-446655441001')
      .single();
    
    if (fetchError) {
      console.error('❌ Error obteniendo orden de cambio:', fetchError.message);
      return;
    }
    
    console.log('✅ Orden de cambio encontrada:', existingOrder.title);
    console.log('📋 Columnas actuales:', Object.keys(existingOrder));
    
    // Definir los campos que queremos probar
    const fieldsToTest = {
      designer: 'Ing. María González',
      cost_impact: 2500000.00,
      cost_impact_crc: 2500000.00,
      schedule_impact_days: 15,
      exchange_rate: 520.0000,
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
    
    const existingFields = [];
    const missingFields = [];
    
    // Probar cada campo individualmente
    for (const [fieldName, fieldValue] of Object.entries(fieldsToTest)) {
      console.log(`\n🔄 Probando campo: ${fieldName}`);
      
      try {
        const { data, error } = await supabase
          .from('change_orders')
          .update({ [fieldName]: fieldValue })
          .eq('id', '550e8400-e29b-41d4-a716-446655441001')
          .select();
        
        if (error) {
          console.log(`❌ Campo ${fieldName}: NO EXISTE (${error.message})`);
          missingFields.push(fieldName);
        } else {
          console.log(`✅ Campo ${fieldName}: EXISTE y actualizado`);
          existingFields.push(fieldName);
        }
      } catch (err) {
        console.log(`❌ Campo ${fieldName}: ERROR (${err.message})`);
        missingFields.push(fieldName);
      }
    }
    
    console.log('\n📊 RESUMEN:');
    console.log(`✅ Campos existentes (${existingFields.length}):`, existingFields);
    console.log(`❌ Campos faltantes (${missingFields.length}):`, missingFields);
    
    if (missingFields.length > 0) {
      console.log('\n📝 SQL para ejecutar en el panel de Supabase:');
      console.log('```sql');
      console.log('-- Agregar columnas faltantes a change_orders');
      console.log('ALTER TABLE change_orders');
      
      const alterStatements = [];
      
      missingFields.forEach(field => {
        switch (field) {
          case 'designer':
            alterStatements.push('ADD COLUMN IF NOT EXISTS designer VARCHAR(255)');
            break;
          case 'cost_impact':
            alterStatements.push('ADD COLUMN IF NOT EXISTS cost_impact DECIMAL(15,2) DEFAULT 0');
            break;
          case 'exchange_rate':
            alterStatements.push('ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(10,4) DEFAULT 520.0000');
            break;
          case 'cost_impact_crc':
            alterStatements.push('ADD COLUMN IF NOT EXISTS cost_impact_crc DECIMAL(15,2) DEFAULT 0');
            break;
          case 'schedule_impact_days':
            alterStatements.push('ADD COLUMN IF NOT EXISTS schedule_impact_days INTEGER DEFAULT 0');
            break;
          case 'cost_impact_level':
            alterStatements.push('ADD COLUMN IF NOT EXISTS cost_impact_level VARCHAR(20) DEFAULT \'bajo\' CHECK (cost_impact_level IN (\'bajo\', \'medio\', \'alto\'))');
            break;
          case 'quality_impact_level':
            alterStatements.push('ADD COLUMN IF NOT EXISTS quality_impact_level VARCHAR(20) DEFAULT \'bajo\' CHECK (quality_impact_level IN (\'bajo\', \'medio\', \'alto\'))');
            break;
          case 'schedule_impact_level':
            alterStatements.push('ADD COLUMN IF NOT EXISTS schedule_impact_level VARCHAR(20) DEFAULT \'bajo\' CHECK (schedule_impact_level IN (\'bajo\', \'medio\', \'alto\'))');
            break;
          case 'risk_impact_level':
            alterStatements.push('ADD COLUMN IF NOT EXISTS risk_impact_level VARCHAR(20) DEFAULT \'bajo\' CHECK (risk_impact_level IN (\'bajo\', \'medio\', \'alto\'))');
            break;
          case 'cost_comments':
          case 'quality_comments':
          case 'schedule_comments':
          case 'risk_comments':
          case 'general_comments':
            alterStatements.push(`ADD COLUMN IF NOT EXISTS ${field} TEXT`);
            break;
        }
      });
      
      console.log(alterStatements.join(',\n'));
      console.log(';');
      console.log('```');
      
      console.log('\n💡 Instrucciones:');
      console.log('1. Ve al panel de Supabase (https://supabase.com/dashboard)');
      console.log('2. Selecciona tu proyecto');
      console.log('3. Ve a "SQL Editor"');
      console.log('4. Copia y pega el SQL de arriba');
      console.log('5. Ejecuta la consulta');
      console.log('6. Vuelve a ejecutar este script para actualizar los datos');
    } else {
      console.log('\n🎉 ¡Todas las columnas existen y los datos han sido actualizados!');
      console.log('🔄 Ahora puedes verificar la página web para ver los cambios.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

detectMissingColumns();