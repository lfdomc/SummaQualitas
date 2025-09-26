const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Mapeo de categorías antiguas a la nueva estructura
const categoryMapping = {
  // Categorías que van a costos_directos
  'materiales': { category: 'costos_directos', subcategory_direct: 'materiales' },
  'subcontratos': { category: 'costos_directos', subcategory_direct: 'subcontratos' },
  'direct_cost': { category: 'costos_directos', subcategory_direct: 'otros' },
  
  // Categorías que van a costos_indirectos
  'cargas_sociales': { category: 'costos_indirectos', subcategory_indirect: 'cargas_sociales' },
  'alquiler': { category: 'costos_indirectos', subcategory_indirect: 'alquiler' },
  'control_calidad': { category: 'costos_indirectos', subcategory_indirect: 'control_calidad' },
  'servicios_basicos': { category: 'costos_indirectos', subcategory_indirect: 'servicios_basicos' },
  'transporte': { category: 'costos_indirectos', subcategory_indirect: 'transporte' },
  'polizas': { category: 'costos_indirectos', subcategory_indirect: 'polizas' },
  'inspeccion_ingenieros': { category: 'costos_indirectos', subcategory_indirect: 'inspeccion_ingenieros' },
  'viaticos': { category: 'costos_indirectos', subcategory_indirect: 'viaticos' },
  'garantias': { category: 'costos_indirectos', subcategory_indirect: 'garantias' },
  'equipos': { category: 'costos_indirectos', subcategory_indirect: 'equipos' },
  'indirect_cost': { category: 'costos_indirectos', subcategory_indirect: 'otros' },
  
  // Categorías que se mantienen sin subcategorías
  'mano_obra': { category: 'mano_obra' },
  'imprevistos': { category: 'imprevistos' },
  'administracion': { category: 'administracion' },
  'gastos_administrativos': { category: 'administracion' }
};

async function migrateExpenseData() {
  console.log('🔄 Iniciando migración de datos de gastos...\n');
  
  try {
    // Obtener todos los gastos existentes
    const { data: expenses, error: fetchError } = await supabase
      .from('expenses')
      .select('*');

    if (fetchError) {
      console.error('❌ Error al obtener gastos:', fetchError);
      return;
    }

    console.log(`📊 Encontrados ${expenses.length} gastos para migrar\n`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const expense of expenses) {
      const oldCategory = expense.category;
      const mapping = categoryMapping[oldCategory];

      if (!mapping) {
        console.log(`⚠️  Categoría no reconocida: ${oldCategory} (ID: ${expense.id})`);
        skippedCount++;
        continue;
      }

      try {
        const updateData = {
          category: mapping.category,
          subcategory_direct: mapping.subcategory_direct || null,
          subcategory_indirect: mapping.subcategory_indirect || null
        };

        const { error: updateError } = await supabase
          .from('expenses')
          .update(updateData)
          .eq('id', expense.id);

        if (updateError) {
          console.error(`❌ Error al actualizar gasto ${expense.id}:`, updateError);
          errorCount++;
        } else {
          console.log(`✅ Migrado: ${oldCategory} → ${mapping.category}${mapping.subcategory_direct ? ` (${mapping.subcategory_direct})` : ''}${mapping.subcategory_indirect ? ` (${mapping.subcategory_indirect})` : ''}`);
          migratedCount++;
        }
      } catch (error) {
        console.error(`❌ Error inesperado al migrar gasto ${expense.id}:`, error);
        errorCount++;
      }
    }

    console.log('\n📈 Resumen de migración:');
    console.log(`✅ Migrados exitosamente: ${migratedCount}`);
    console.log(`⚠️  Omitidos: ${skippedCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`📊 Total procesados: ${expenses.length}`);

    if (migratedCount > 0) {
      console.log('\n🎉 Migración completada exitosamente!');
    }

  } catch (error) {
    console.error('❌ Error general en la migración:', error);
  }
}

// Función para verificar el estado después de la migración
async function verifyMigration() {
  console.log('\n🔍 Verificando estado después de la migración...\n');
  
  try {
    const { data: expenses, error } = await supabase
      .from('expenses')
      .select('category, subcategory_direct, subcategory_indirect');

    if (error) {
      console.error('❌ Error al verificar:', error);
      return;
    }

    const categoryCounts = {};
    expenses.forEach(expense => {
      const key = `${expense.category}${expense.subcategory_direct ? ` (${expense.subcategory_direct})` : ''}${expense.subcategory_indirect ? ` (${expense.subcategory_indirect})` : ''}`;
      categoryCounts[key] = (categoryCounts[key] || 0) + 1;
    });

    console.log('📊 Distribución de categorías después de la migración:');
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`  • ${category}: ${count} gastos`);
    });

  } catch (error) {
    console.error('❌ Error en verificación:', error);
  }
}

// Ejecutar migración
async function main() {
  await migrateExpenseData();
  await verifyMigration();
}

main().catch(console.error);