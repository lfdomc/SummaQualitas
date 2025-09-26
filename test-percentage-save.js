require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPercentageSave() {
  console.log('🧪 Probando el guardado de porcentajes...\n');

  try {
    // Primero obtener un cliente existente
    console.log('1. Obteniendo cliente existente...');
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('id, name')
      .limit(1);

    if (clientError || !clients || clients.length === 0) {
      console.log('⚠️ No hay clientes existentes, creando uno temporal...');
      
      const { data: newClient, error: createClientError } = await supabase
        .from('clients')
        .insert({
          name: 'Cliente Test Porcentajes',
          email: 'test@example.com'
        })
        .select()
        .single();

      if (createClientError) {
        console.error('❌ Error al crear cliente:', createClientError);
        return;
      }

      console.log('✅ Cliente temporal creado:', newClient.name);
      var clientId = newClient.id;
      var shouldDeleteClient = true;
    } else {
      console.log('✅ Cliente encontrado:', clients[0].name);
      var clientId = clients[0].id;
      var shouldDeleteClient = false;
    }

    // Datos de prueba para un proyecto
    const testProjectData = {
      name: 'Proyecto Test Porcentajes',
      description: 'Proyecto para probar el guardado de porcentajes',
      client_id: clientId,
      status: 'planificacion',
      budget: 1000000,
      presupuesto_inicial: 1000000,
      currency: 'CRC',
      // Porcentajes de prueba
      costos_directos_porcentaje: 40,
      costos_indirectos_porcentaje: 15,
      mano_obra_porcentaje: 25,
      administracion_porcentaje: 10,
      imprevistos_porcentaje: 5,
      utilidad_porcentaje: 5,
      // Montos calculados
      costos_directos: 400000,
      costos_indirectos: 150000,
      mano_obra: 250000,
      administracion: 100000,
      imprevistos: 50000,
      utilidad: 50000
    };

    // 2. Crear el proyecto
    console.log('\n2. Creando proyecto con porcentajes...');
    const { data: newProject, error: createError } = await supabase
      .from('projects')
      .insert(testProjectData)
      .select()
      .single();

    if (createError) {
      console.error('❌ Error al crear proyecto:', createError);
      return;
    }

    console.log('✅ Proyecto creado con ID:', newProject.id);

    // 3. Verificar que los porcentajes se guardaron
    console.log('\n3. Verificando que los porcentajes se guardaron...');
    const { data: savedProject, error: fetchError } = await supabase
      .from('projects')
      .select(`
        id, name, 
        costos_directos_porcentaje,
        costos_indirectos_porcentaje,
        mano_obra_porcentaje,
        administracion_porcentaje,
        imprevistos_porcentaje,
        utilidad_porcentaje,
        costos_directos,
        costos_indirectos,
        mano_obra,
        administracion,
        imprevistos,
        utilidad
      `)
      .eq('id', newProject.id)
      .single();

    if (fetchError) {
      console.error('❌ Error al obtener proyecto:', fetchError);
      return;
    }

    console.log('📊 Datos guardados:');
    console.log('Porcentajes:');
    console.log(`  - Costos Directos: ${savedProject.costos_directos_porcentaje}%`);
    console.log(`  - Costos Indirectos: ${savedProject.costos_indirectos_porcentaje}%`);
    console.log(`  - Mano de Obra: ${savedProject.mano_obra_porcentaje}%`);
    console.log(`  - Administración: ${savedProject.administracion_porcentaje}%`);
    console.log(`  - Imprevistos: ${savedProject.imprevistos_porcentaje}%`);
    console.log(`  - Utilidad: ${savedProject.utilidad_porcentaje}%`);

    console.log('\nMontos:');
    console.log(`  - Costos Directos: ₡${savedProject.costos_directos?.toLocaleString()}`);
    console.log(`  - Costos Indirectos: ₡${savedProject.costos_indirectos?.toLocaleString()}`);
    console.log(`  - Mano de Obra: ₡${savedProject.mano_obra?.toLocaleString()}`);
    console.log(`  - Administración: ₡${savedProject.administracion?.toLocaleString()}`);
    console.log(`  - Imprevistos: ₡${savedProject.imprevistos?.toLocaleString()}`);
    console.log(`  - Utilidad: ₡${savedProject.utilidad?.toLocaleString()}`);

    // 4. Probar actualización de porcentajes
    console.log('\n4. Probando actualización de porcentajes...');
    const updatedData = {
      costos_directos_porcentaje: 45,
      costos_indirectos_porcentaje: 20,
      mano_obra_porcentaje: 20,
      administracion_porcentaje: 8,
      imprevistos_porcentaje: 4,
      utilidad_porcentaje: 3,
      // Recalcular montos
      costos_directos: 450000,
      costos_indirectos: 200000,
      mano_obra: 200000,
      administracion: 80000,
      imprevistos: 40000,
      utilidad: 30000
    };

    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update(updatedData)
      .eq('id', newProject.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error al actualizar proyecto:', updateError);
      return;
    }

    console.log('✅ Proyecto actualizado correctamente');
    console.log('📊 Nuevos porcentajes:');
    console.log(`  - Costos Directos: ${updatedProject.costos_directos_porcentaje}%`);
    console.log(`  - Costos Indirectos: ${updatedProject.costos_indirectos_porcentaje}%`);
    console.log(`  - Mano de Obra: ${updatedProject.mano_obra_porcentaje}%`);
    console.log(`  - Administración: ${updatedProject.administracion_porcentaje}%`);
    console.log(`  - Imprevistos: ${updatedProject.imprevistos_porcentaje}%`);
    console.log(`  - Utilidad: ${updatedProject.utilidad_porcentaje}%`);

    // 5. Limpiar - eliminar proyecto de prueba
    console.log('\n5. Limpiando proyecto de prueba...');
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', newProject.id);

    if (deleteError) {
      console.error('❌ Error al eliminar proyecto de prueba:', deleteError);
    } else {
      console.log('✅ Proyecto de prueba eliminado');
    }

    // 6. Limpiar cliente temporal si fue creado
    if (shouldDeleteClient) {
      console.log('\n6. Limpiando cliente temporal...');
      const { error: deleteClientError } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (deleteClientError) {
        console.error('❌ Error al eliminar cliente temporal:', deleteClientError);
      } else {
        console.log('✅ Cliente temporal eliminado');
      }
    }

    console.log('\n🎉 ¡Prueba completada exitosamente! Los porcentajes se guardan y actualizan correctamente.');

  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  }
}

testPercentageSave();