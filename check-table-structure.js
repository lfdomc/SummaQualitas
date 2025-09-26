const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkTableStructure() {
  try {
    console.log('Conectando a Supabase...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Verificar la estructura de la tabla change_orders
    const { data, error } = await supabase
      .rpc('get_table_columns', { table_name: 'change_orders' })
      .select();
    
    if (error) {
      console.log('Error con RPC, intentando consulta directa...');
      
      // Consulta alternativa para obtener información de columnas
      const { data: columns, error: colError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_name', 'change_orders')
        .eq('table_schema', 'public');
      
      if (colError) {
        console.error('Error al obtener columnas:', colError);
        
        // Última alternativa: obtener un registro y ver sus campos
        console.log('Intentando obtener un registro para ver campos...');
        const { data: sample, error: sampleError } = await supabase
          .from('change_orders')
          .select('*')
          .limit(1)
          .single();
        
        if (sampleError) {
          console.error('Error al obtener muestra:', sampleError);
          return;
        }
        
        console.log('\n=== CAMPOS DISPONIBLES EN LA TABLA ===');
        Object.keys(sample).forEach(key => {
          console.log(`- ${key}: ${typeof sample[key]} (${sample[key]})`);
        });
        
        return;
      }
      
      console.log('\n=== ESTRUCTURA DE LA TABLA change_orders ===');
      columns.forEach(col => {
        console.log(`${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
      });
      
      // Verificar si existen los campos de impacto
      const impactFields = ['cost_impact', 'cost_impact_crc', 'schedule_impact_days', 'cost_impact_level', 'schedule_impact_level', 'exchange_rate'];
      console.log('\n=== VERIFICACIÓN DE CAMPOS DE IMPACTO ===');
      impactFields.forEach(field => {
        const exists = columns.some(col => col.column_name === field);
        console.log(`${field}: ${exists ? '✅ EXISTE' : '❌ NO EXISTE'}`);
      });
      
      return;
    }
    
    console.log('Estructura obtenida:', data);
    
  } catch (err) {
    console.error('Error:', err);
  }
}

checkTableStructure();