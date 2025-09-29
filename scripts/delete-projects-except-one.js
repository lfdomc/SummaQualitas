const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const KEEP_PROJECT_ID = '64561c06-e646-468a-9112-24a600e7f8f0';

async function deleteProjectsExceptOne() {
  try {
    console.log('🔍 Obteniendo lista de proyectos...');
    
    // Primero obtener todos los proyectos
    const { data: projects, error: fetchError } = await supabase
      .from('projects')
      .select('id, name')
      .neq('id', KEEP_PROJECT_ID);

    if (fetchError) {
      console.error('❌ Error al obtener proyectos:', fetchError);
      return;
    }

    if (!projects || projects.length === 0) {
      console.log('✅ No hay proyectos para eliminar (solo existe el proyecto a conservar)');
      return;
    }

    console.log(`📋 Proyectos a eliminar: ${projects.length}`);
    projects.forEach(project => {
      console.log(`  - ${project.name} (${project.id})`);
    });

    console.log(`\n🔒 Proyecto a conservar: ${KEEP_PROJECT_ID}`);
    
    // Confirmar antes de proceder
    console.log('\n⚠️  ADVERTENCIA: Esta operación eliminará permanentemente los proyectos listados arriba.');
    console.log('⚠️  También eliminará todos los datos relacionados (gastos, ingresos, etc.)');
    
    // Eliminar proyectos relacionados primero (si existen tablas con foreign keys)
    console.log('\n🗑️  Eliminando datos relacionados...');
    
    const projectIds = projects.map(p => p.id);
    
    // Eliminar gastos relacionados
    const { error: expensesError } = await supabase
      .from('expenses')
      .delete()
      .in('project_id', projectIds);
    
    if (expensesError) {
      console.error('❌ Error al eliminar gastos:', expensesError);
      return;
    }
    console.log('✅ Gastos relacionados eliminados');

    // Eliminar ingresos relacionados
    const { error: incomesError } = await supabase
      .from('incomes')
      .delete()
      .in('project_id', projectIds);
    
    if (incomesError) {
      console.error('❌ Error al eliminar ingresos:', incomesError);
      return;
    }
    console.log('✅ Ingresos relacionados eliminados');

    // Eliminar equipos relacionados (si existe la tabla)
    try {
      const { error: equipmentError } = await supabase
        .from('equipment')
        .delete()
        .in('project_id', projectIds);
      
      if (equipmentError && !equipmentError.message.includes('does not exist')) {
        console.error('❌ Error al eliminar equipos:', equipmentError);
        return;
      }
      console.log('✅ Equipos relacionados eliminados');
    } catch (e) {
      console.log('ℹ️  Tabla equipment no existe, continuando...');
    }

    // Finalmente eliminar los proyectos
    console.log('\n🗑️  Eliminando proyectos...');
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .in('id', projectIds);

    if (deleteError) {
      console.error('❌ Error al eliminar proyectos:', deleteError);
      return;
    }

    console.log(`✅ ${projects.length} proyectos eliminados exitosamente`);
    console.log(`✅ Proyecto conservado: ${KEEP_PROJECT_ID}`);
    
    // Verificar que el proyecto conservado sigue existiendo
    const { data: remainingProject, error: checkError } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', KEEP_PROJECT_ID)
      .single();

    if (checkError) {
      console.error('❌ Error al verificar proyecto conservado:', checkError);
      return;
    }

    if (remainingProject) {
      console.log(`✅ Verificado: Proyecto "${remainingProject.name}" conservado correctamente`);
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  deleteProjectsExceptOne();
}

module.exports = { deleteProjectsExceptOne };