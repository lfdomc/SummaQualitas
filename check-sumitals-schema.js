require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSumitalsSchema() {
  try {
    console.log('🔐 Iniciando sesión...');
    
    // 1. Autenticarse
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'lfdomc@gmail.com',
      password: 'Luimorca22'
    });

    if (loginError) {
      console.error('❌ Error en login:', loginError.message);
      return;
    }

    console.log('✅ Login exitoso:', loginData.user.email);

    // 2. Verificar si la tabla sumitals existe
    console.log('📋 Verificando esquema de la tabla sumitals...');
    
    // Intentar hacer una consulta simple para ver qué columnas están disponibles
    const { data: sumitals, error: sumitalsError } = await supabase
      .from('sumitals')
      .select('*')
      .limit(1);

    if (sumitalsError) {
      console.error('❌ Error consultando sumitals:', sumitalsError);
      
      // Si la tabla no existe, intentar crearla
      if (sumitalsError.code === 'PGRST106') {
        console.log('⚠️  La tabla sumitals no existe. Intentando crearla...');
        
        // Ejecutar el script de creación de tabla
        const { spawn } = require('child_process');
        const createTable = spawn('node', ['scripts/create-sumitals-table.js'], {
          stdio: 'inherit'
        });
        
        createTable.on('close', (code) => {
          console.log(`Script de creación terminó con código: ${code}`);
        });
        
        return;
      }
    } else {
      console.log('✅ Tabla sumitals existe');
      console.log('📊 Sumitals encontrados:', sumitals.length);
      
      if (sumitals.length > 0) {
        console.log('📋 Estructura de la primera fila:');
        console.log(Object.keys(sumitals[0]));
      }
    }

    // 3. Verificar las columnas específicamente
    console.log('\n🔍 Verificando columnas específicas...');
    
    // Intentar seleccionar solo las columnas que necesitamos
    const testColumns = [
      'id',
      'project_id', 
      'equipment_description',
      'supplier_name',
      'supplier_phone', // Esta es la que falla
      'total_price',
      'created_at'
    ];
    
    for (const column of testColumns) {
      try {
        const { data, error } = await supabase
          .from('sumitals')
          .select(column)
          .limit(1);
          
        if (error) {
          console.log(`❌ Columna '${column}': ${error.message}`);
        } else {
          console.log(`✅ Columna '${column}': OK`);
        }
      } catch (err) {
        console.log(`❌ Columna '${column}': ${err.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

checkSumitalsSchema();