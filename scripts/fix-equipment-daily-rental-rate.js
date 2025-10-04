const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno desde .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
}

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas');
  console.error('Necesitas NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixEquipmentTable() {
  console.log('🔧 REPARANDO TABLA EQUIPMENT - AGREGANDO DAILY_RENTAL_RATE');
  console.log('========================================================');
  
  try {
    // 1. Verificar estructura actual de la tabla equipment
    console.log('\n1. Verificando estructura actual de la tabla equipment...');
    const { data: sampleEquipment, error: sampleError } = await supabase
      .from('equipment')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('❌ Error al acceder a la tabla equipment:', sampleError.message);
      return;
    }
    
    if (sampleEquipment && sampleEquipment.length > 0) {
      console.log('📊 Columnas actuales en equipment:');
      Object.keys(sampleEquipment[0]).forEach(key => {
        console.log(`   • ${key}`);
      });
      
      if (sampleEquipment[0].hasOwnProperty('daily_rental_rate')) {
        console.log('✅ La columna daily_rental_rate ya existe!');
        return;
      }
    }
    
    // 2. Agregar la columna daily_rental_rate usando SQL directo
    console.log('\n2. Agregando columna daily_rental_rate...');
    const { data: alterResult, error: alterError } = await supabase
      .rpc('exec_sql', {
        sql: `
          ALTER TABLE equipment 
          ADD COLUMN IF NOT EXISTS daily_rental_rate DECIMAL(10,2) DEFAULT 0 NOT NULL;
          
          COMMENT ON COLUMN equipment.daily_rental_rate IS 'Daily rental rate for this equipment in the default currency';
        `
      });
    
    if (alterError) {
      console.error('❌ Error al agregar columna con RPC:', alterError.message);
      
      // Intentar método alternativo usando SQL directo
      console.log('\n3. Intentando método alternativo...');
      const { error: directError } = await supabase
        .from('equipment')
        .update({ daily_rental_rate: 0 })
        .eq('id', '00000000-0000-0000-0000-000000000000'); // Query que no afecta nada pero verifica la columna
      
      if (directError && directError.message.includes('daily_rental_rate')) {
        console.log('⚠️  La columna daily_rental_rate no existe. Necesitas ejecutar SQL manualmente.');
        console.log('\n📋 EJECUTA ESTE SQL EN EL EDITOR DE SUPABASE:');
        console.log('==============================================');
        console.log(`
ALTER TABLE equipment 
ADD COLUMN daily_rental_rate DECIMAL(10,2) DEFAULT 0 NOT NULL;

COMMENT ON COLUMN equipment.daily_rental_rate IS 'Daily rental rate for this equipment in the default currency';

-- Actualizar equipos existentes con valores por defecto
UPDATE equipment 
SET daily_rental_rate = 100.00 
WHERE daily_rental_rate = 0;
        `);
        console.log('==============================================');
        return;
      }
    } else {
      console.log('✅ Columna daily_rental_rate agregada exitosamente!');
    }
    
    // 3. Verificar que la columna fue agregada
    console.log('\n4. Verificando que la columna fue agregada...');
    const { data: updatedEquipment, error: verifyError } = await supabase
      .from('equipment')
      .select('id, name, daily_rental_rate')
      .limit(1);
    
    if (verifyError) {
      console.error('❌ Error al verificar la nueva columna:', verifyError.message);
    } else {
      console.log('✅ Verificación exitosa! La columna daily_rental_rate está disponible.');
      if (updatedEquipment && updatedEquipment.length > 0) {
        console.log('📊 Ejemplo de registro:', updatedEquipment[0]);
      }
    }
    
    // 4. Actualizar equipos existentes con valores por defecto
    console.log('\n5. Actualizando equipos existentes con valores por defecto...');
    const { data: updateResult, error: updateError } = await supabase
      .from('equipment')
      .update({ daily_rental_rate: 100.00 })
      .eq('daily_rental_rate', 0);
    
    if (updateError) {
      console.error('❌ Error al actualizar valores por defecto:', updateError.message);
    } else {
      console.log('✅ Valores por defecto actualizados exitosamente!');
    }
    
    console.log('\n🎉 REPARACIÓN COMPLETADA!');
    console.log('La tabla equipment ahora tiene la columna daily_rental_rate.');
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

fixEquipmentTable();