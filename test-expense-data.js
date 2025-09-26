const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testExpenseData() {
  try {
    console.log('🔍 Verificando datos de gastos...\n');
    
    // Obtener algunos gastos para verificar
    const { data: expenses, error } = await supabase
      .from('expenses')
      .select(`
        id,
        description,
        reference,
        invoice_number,
        supplier_id,
        supplier:suppliers(id, name)
      `)
      .limit(5);

    if (error) {
      console.error('❌ Error al obtener gastos:', error);
      return;
    }

    console.log('📊 Datos de gastos encontrados:');
    console.log('Total de gastos obtenidos:', expenses?.length || 0);
    
    if (expenses && expenses.length > 0) {
      expenses.forEach((expense, index) => {
        console.log(`\n--- Gasto ${index + 1} ---`);
        console.log('ID:', expense.id);
        console.log('Descripción:', expense.description);
        console.log('Reference:', expense.reference || 'NULL/VACÍO');
        console.log('Invoice Number:', expense.invoice_number || 'NULL/VACÍO');
        console.log('Supplier ID:', expense.supplier_id || 'NULL/VACÍO');
        console.log('Supplier Name:', expense.supplier?.name || 'NULL/VACÍO');
      });
    } else {
      console.log('⚠️ No se encontraron gastos en la base de datos');
    }

    // Verificar estructura de la tabla
    console.log('\n🔧 Verificando estructura de la tabla expenses...');
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'expenses' })
      .catch(() => {
        // Si la función no existe, intentamos una consulta alternativa
        return supabase
          .from('information_schema.columns')
          .select('column_name, data_type')
          .eq('table_name', 'expenses')
          .eq('table_schema', 'public');
      });

    if (columnsError) {
      console.log('⚠️ No se pudo verificar la estructura de la tabla');
    } else if (columns) {
      console.log('Columnas encontradas:', columns.map(col => col.column_name || col.name).join(', '));
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

testExpenseData();