require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkIncomesSchema() {
  console.log('🔍 Verificando estructura de la tabla incomes...\n');

  try {
    // Obtener información de las columnas
    const { data: columns, error: columnsError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'incomes')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    if (columnsError) {
      console.log('❌ Error obteniendo columnas:', columnsError);
      return;
    }

    console.log('📋 Columnas de la tabla incomes:');
    columns.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'}`);
    });

    // Intentar una inserción simple con solo las columnas básicas
    console.log('\n🧪 Probando inserción con columnas básicas...');
    
    // Primero obtener un proyecto válido
    const { data: projects } = await supabaseAdmin
      .from('projects')
      .select('id')
      .limit(1);

    if (projects && projects.length > 0) {
      const testIncome = {
        project_id: projects[0].id,
        amount: 1000.00,
        description: 'Test básico de inserción',
        received_date: new Date().toISOString().split('T')[0]
      };

      const { data: insertData, error: insertError } = await supabaseAdmin
        .from('incomes')
        .insert(testIncome)
        .select();

      if (insertError) {
        console.log('❌ Error en inserción básica:', insertError);
      } else {
        console.log('✅ Inserción básica exitosa:', insertData[0].id);
        
        // Limpiar
        await supabaseAdmin
          .from('incomes')
          .delete()
          .eq('id', insertData[0].id);
        console.log('🧹 Registro de prueba eliminado');
      }
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

checkIncomesSchema();