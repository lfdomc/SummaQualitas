const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function applyImpactMigration() {
  try {
    console.log('Conectando a Supabase...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('Aplicando migración de campos de impacto...');
    
    // Ejecutar la migración paso a paso
    const migrations = [
      // Agregar columnas de diseño y costos
      `ALTER TABLE change_orders 
       ADD COLUMN IF NOT EXISTS designer VARCHAR(255),
       ADD COLUMN IF NOT EXISTS cost_impact DECIMAL(15,2) DEFAULT 0,
       ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(10,4) DEFAULT 520.0000,
       ADD COLUMN IF NOT EXISTS cost_impact_crc DECIMAL(15,2) DEFAULT 0;`,
      
      // Agregar columnas de impacto en cronograma
      `ALTER TABLE change_orders 
       ADD COLUMN IF NOT EXISTS schedule_impact_days INTEGER DEFAULT 0;`,
      
      // Agregar columnas de niveles de impacto
      `ALTER TABLE change_orders 
       ADD COLUMN IF NOT EXISTS cost_impact_level VARCHAR(20) DEFAULT 'bajo' CHECK (cost_impact_level IN ('bajo', 'medio', 'alto')),
       ADD COLUMN IF NOT EXISTS quality_impact_level VARCHAR(20) DEFAULT 'bajo' CHECK (quality_impact_level IN ('bajo', 'medio', 'alto')),
       ADD COLUMN IF NOT EXISTS schedule_impact_level VARCHAR(20) DEFAULT 'bajo' CHECK (schedule_impact_level IN ('bajo', 'medio', 'alto')),
       ADD COLUMN IF NOT EXISTS risk_impact_level VARCHAR(20) DEFAULT 'bajo' CHECK (risk_impact_level IN ('bajo', 'medio', 'alto'));`,
      
      // Agregar columnas de comentarios detallados
      `ALTER TABLE change_orders 
       ADD COLUMN IF NOT EXISTS cost_comments TEXT,
       ADD COLUMN IF NOT EXISTS quality_comments TEXT,
       ADD COLUMN IF NOT EXISTS schedule_comments TEXT,
       ADD COLUMN IF NOT EXISTS risk_comments TEXT,
       ADD COLUMN IF NOT EXISTS general_comments TEXT;`
    ];
    
    for (let i = 0; i < migrations.length; i++) {
      console.log(`Ejecutando migración ${i + 1}/${migrations.length}...`);
      
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: migrations[i]
      });
      
      if (error) {
        console.error(`Error en migración ${i + 1}:`, error);
        // Intentar con una consulta directa
        console.log('Intentando con consulta directa...');
        
        const { data: directData, error: directError } = await supabase
          .from('change_orders')
          .select('id')
          .limit(1);
        
        if (directError) {
          console.error('Error en consulta directa:', directError);
        } else {
          console.log('La tabla existe, continuando...');
        }
      } else {
        console.log(`✅ Migración ${i + 1} completada`);
      }
    }
    
    // Verificar que los campos se agregaron
    console.log('\nVerificando campos agregados...');
    const { data: testData, error: testError } = await supabase
      .from('change_orders')
      .select('*')
      .limit(1)
      .single();
    
    if (testError) {
      console.error('Error al verificar:', testError);
      return;
    }
    
    console.log('\n=== CAMPOS DESPUÉS DE LA MIGRACIÓN ===');
    Object.keys(testData).forEach(key => {
      console.log(`- ${key}`);
    });
    
    // Verificar campos específicos de impacto
    const impactFields = ['cost_impact', 'cost_impact_crc', 'schedule_impact_days', 'cost_impact_level', 'schedule_impact_level', 'exchange_rate'];
    console.log('\n=== VERIFICACIÓN DE CAMPOS DE IMPACTO ===');
    impactFields.forEach(field => {
      const exists = testData.hasOwnProperty(field);
      console.log(`${field}: ${exists ? '✅ EXISTE' : '❌ NO EXISTE'}`);
    });
    
  } catch (err) {
    console.error('Error:', err);
  }
}

applyImpactMigration();