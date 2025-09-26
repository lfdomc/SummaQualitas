require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPercentageColumns() {
  try {
    console.log('Verificando columnas de porcentajes en la tabla projects...\n');
    
    // Usar consulta SQL directa para obtener información de las columnas
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `
    });
    
    if (error) {
      console.error('Error al obtener columnas con SQL:', error);
      
      // Método alternativo: intentar hacer una consulta simple a la tabla
      const { data: testData, error: testError } = await supabase
        .from('projects')
        .select('*')
        .limit(1);
      
      if (testError) {
        console.error('Error al hacer consulta de prueba:', testError);
        return;
      }
      
      if (testData && testData.length > 0) {
        console.log('Columnas encontradas en la tabla projects (basado en datos):');
        const columns = Object.keys(testData[0]);
        columns.forEach(col => {
          console.log(`- ${col}`);
        });
        
        // Buscar columnas de porcentajes
        const percentageColumns = columns.filter(col => 
          col.includes('porcentaje')
        );
        
        console.log('\nColumnas de porcentajes encontradas:');
        if (percentageColumns.length > 0) {
          percentageColumns.forEach(col => {
            console.log(`✓ ${col}`);
          });
        } else {
          console.log('❌ No se encontraron columnas de porcentajes');
        }
      } else {
        console.log('No hay datos en la tabla projects para analizar');
      }
      
      return;
    }
    
    console.log('Columnas encontradas en la tabla projects:');
    data.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type})`);
    });
    
    // Buscar columnas de porcentajes
    const percentageColumns = data.filter(col => 
      col.column_name.includes('porcentaje')
    );
    
    console.log('\nColumnas de porcentajes encontradas:');
    if (percentageColumns.length > 0) {
      percentageColumns.forEach(col => {
        console.log(`✓ ${col.column_name} (${col.data_type})`);
      });
    } else {
      console.log('❌ No se encontraron columnas de porcentajes');
    }
    
  } catch (err) {
    console.error('Error general:', err);
  }
}

checkPercentageColumns();