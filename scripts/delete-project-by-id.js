const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase (NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function isUUID(v) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

async function deleteDependencies(projectId) {
  console.log('   🧹 Eliminando dependencias conocidas...');
  const steps = [
    { table: 'project_summaries', name: 'resúmenes de proyecto', critical: true },
    { table: 'equipment_rentals', name: 'alquileres de equipo', critical: false },
    { table: 'change_orders', name: 'órdenes de cambio', critical: false },
    { table: 'incomes', name: 'ingresos', critical: false },
    { table: 'expenses', name: 'gastos', critical: true },
    // Tablas adicionales que pueden existir en algunos entornos
    { table: 'budget_items', name: 'partidas presupuestarias', critical: false },
    { table: 'sumitals', name: 'sumitals', critical: false },
    { table: 'sumital_attachments', name: 'adjuntos de sumitals', critical: false },
  ];

  for (const step of steps) {
    try {
      // Verificar si hay registros
      const { data: records, error: selectErr } = await supabase
        .from(step.table)
        .select('id')
        .eq('project_id', projectId);

      if (selectErr) {
        console.log(`   ⚠️ No se pudo verificar ${step.name} (${step.table}): ${selectErr.message}`);
        continue;
      }

      if (!records || records.length === 0) {
        console.log(`   ℹ️ No hay ${step.name} para eliminar`);
        continue;
      }

      console.log(`   🗑️ Eliminando ${records.length} ${step.name} (${step.table})...`);

      if (step.critical) {
        // Eliminar uno por uno para evitar problemas con triggers
        for (const r of records) {
          const { error: delErr } = await supabase
            .from(step.table)
            .delete()
            .eq('id', r.id);
          if (delErr) {
            console.log(`   ❌ Error eliminando ${step.name} id=${r.id}: ${delErr.message}`);
          }
        }
      } else {
        // Eliminación en lote
        const { error: batchErr } = await supabase
          .from(step.table)
          .delete()
          .eq('project_id', projectId);
        if (batchErr) {
          console.log(`   ❌ Error eliminando en lote ${step.name}: ${batchErr.message}`);
        }
      }

      // Verificar que ya no queden registros
      const { data: remaining } = await supabase
        .from(step.table)
        .select('id')
        .eq('project_id', projectId);
      if (remaining && remaining.length > 0) {
        console.log(`   ⚠️ Aún quedan ${remaining.length} registros en ${step.table}`);
      } else {
        console.log(`   ✅ ${step.name} eliminados exitosamente`);
      }
    } catch (e) {
      console.log(`   💥 Error inesperado procesando ${step.name}: ${e.message}`);
    }
  }
}

async function main() {
  const projectId = process.argv[2] || process.env.PROJECT_ID;

  if (!projectId) {
    console.error('❌ Debes pasar el ID del proyecto como argumento: node scripts/delete-project-by-id.js <projectId>');
    process.exit(1);
  }

  if (!isUUID(projectId)) {
    console.error('❌ El ID proporcionado no parece un UUID válido:', projectId);
    process.exit(1);
  }

  console.log('🗑️  Eliminación de proyecto por ID');
  console.log('🔗 Supabase URL:', supabaseUrl);
  console.log('🔑 Usando service role para operaciones administrativas');
  console.log('📁 Proyecto ID:', projectId);

  // Confirmar que existe
  const { data: project, error: getErr } = await supabase
    .from('projects')
    .select('id, name')
    .eq('id', projectId)
    .single();

  if (getErr) {
    console.error('❌ Error consultando el proyecto:', getErr.message);
    process.exit(1);
  }

  if (!project) {
    console.log('ℹ️  No existe un proyecto con ese ID. Nada que eliminar.');
    process.exit(0);
  }

  console.log('📌 Proyecto encontrado:', project.name || project.id);

  // Intento directo de eliminación
  const { error: delErr1 } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (delErr1) {
    console.log(`⚠️ Error eliminando proyecto directamente: ${delErr1.message}`);
    console.log('🔧 Intentando eliminación de dependencias y reintento...');
    await deleteDependencies(projectId);

    const { error: delErr2 } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (delErr2) {
      console.error(`❌ Error final eliminando el proyecto: ${delErr2.message}`);
    } else {
      console.log('✅ Proyecto eliminado exitosamente después de limpiar dependencias');
    }
  } else {
    console.log('✅ Proyecto eliminado exitosamente (eliminación directa)');
  }

  // Verificación final
  const { data: remaining } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId);

  if (remaining && remaining.length > 0) {
    console.log('⚠️ El proyecto aún aparece en la base de datos. Puede requerir limpieza manual.');
  } else {
    console.log('🎉 Verificación final: El proyecto ya no existe en la base de datos.');
  }
}

main().catch((e) => {
  console.error('💥 Error inesperado:', e);
  process.exit(1);
});