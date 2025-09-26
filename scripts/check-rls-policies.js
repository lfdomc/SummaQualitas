const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRLSPolicies() {
  try {
    console.log('🔍 Verificando políticas RLS para change_orders...\n');
    
    // Verificar el usuario actual
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('👤 Usuario actual:', user ? user.id : 'No autenticado');
    console.log('📧 Email:', user ? user.email : 'N/A');
    
    if (authError) {
      console.error('❌ Error de autenticación:', authError);
      return;
    }

    // Intentar hacer una actualización directa con el service role key
    console.log('\n🔧 Intentando actualización directa con service role...');
    
    const testUpdate = {
      title: 'Test Update - ' + new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: directUpdate, error: directError } = await supabase
      .from('change_orders')
      .update(testUpdate)
      .eq('id', '550e8400-e29b-41d4-a716-446655441001')
      .select('id, title, updated_at');

    if (directError) {
      console.error('❌ Error en actualización directa:', directError);
    } else {
      console.log('✅ Actualización directa exitosa:', directUpdate);
      
      // Revertir el cambio
      const { data: revertUpdate, error: revertError } = await supabase
        .from('change_orders')
        .update({ title: 'Modificación en diseño de fachada' })
        .eq('id', '550e8400-e29b-41d4-a716-446655441001');
        
      if (!revertError) {
        console.log('🔄 Cambio revertido exitosamente');
      }
    }

    // Verificar si el registro existe y es accesible
    console.log('\n📋 Verificando acceso al registro...');
    const { data: record, error: recordError } = await supabase
      .from('change_orders')
      .select('*')
      .eq('id', '550e8400-e29b-41d4-a716-446655441001')
      .single();

    if (recordError) {
      console.error('❌ Error accediendo al registro:', recordError);
    } else {
      console.log('✅ Registro encontrado:', {
        id: record.id,
        title: record.title,
        status: record.status,
        project_id: record.project_id
      });
    }

    // Probar con un cliente normal (sin service role)
    console.log('\n🔐 Probando con cliente normal (sin service role)...');
    const normalClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data: normalUpdate, error: normalError } = await normalClient
      .from('change_orders')
      .update({ notes: 'Test update from normal client' })
      .eq('id', '550e8400-e29b-41d4-a716-446655441001')
      .select('id, notes');

    if (normalError) {
      console.error('❌ Error con cliente normal:', normalError);
    } else {
      console.log('✅ Actualización con cliente normal exitosa:', normalUpdate);
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkRLSPolicies();