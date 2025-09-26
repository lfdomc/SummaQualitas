require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProjectsStructure() {
  console.log('🔍 Verificando estructura de la tabla projects...\n');

  try {
    // Intentar obtener un proyecto existente para ver la estructura
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error al consultar projects:', error);
      return;
    }

    if (projects && projects.length > 0) {
      console.log('📋 Estructura de la tabla projects (basada en un registro existente):');
      const project = projects[0];
      const columns = Object.keys(project);
      
      columns.forEach(column => {
        const value = project[column];
        const type = typeof value;
        console.log(`  - ${column}: ${type} ${value !== null ? `(ejemplo: ${value})` : '(null)'}`);
      });

      // Verificar específicamente los campos de porcentajes
      console.log('\n🔍 Verificando campos de porcentajes:');
      const percentageFields = [
        'costos_directos_porcentaje',
        'costos_indirectos_porcentaje', 
        'mano_obra_porcentaje',
        'administracion_porcentaje',
        'imprevistos_porcentaje',
        'utilidad_porcentaje'
      ];

      percentageFields.forEach(field => {
        const exists = columns.includes(field);
        console.log(`  - ${field}: ${exists ? '✅ Existe' : '❌ No existe'}`);
      });

    } else {
      console.log('⚠️ No hay proyectos en la base de datos para verificar la estructura');
      
      // Intentar crear un proyecto mínimo para ver qué campos son requeridos
      console.log('\n🧪 Intentando crear un proyecto mínimo para identificar campos requeridos...');
      
      const { data, error: createError } = await supabase
        .from('projects')
        .insert({
          name: 'Test Structure',
          client_id: '550e8400-e29b-41d4-a716-446655440000'
        })
        .select();

      if (createError) {
        console.log('❌ Error esperado al crear proyecto mínimo:', createError.message);
        console.log('Esto nos ayuda a identificar qué campos son requeridos.');
      } else {
        console.log('✅ Proyecto mínimo creado exitosamente');
        if (data && data.length > 0) {
          console.log('Estructura del proyecto creado:', Object.keys(data[0]));
          
          // Limpiar el proyecto de prueba
          await supabase.from('projects').delete().eq('id', data[0].id);
          console.log('🧹 Proyecto de prueba eliminado');
        }
      }
    }

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  }
}

checkProjectsStructure();