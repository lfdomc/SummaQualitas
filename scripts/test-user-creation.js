import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno SUPABASE');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testUserCreation() {
  console.log('🧪 PROBANDO CREACIÓN DE PERFIL DE USUARIO');
  console.log('==========================================');
  
  try {
    // Crear un perfil de prueba sin el campo phone
    const testProfile = {
      id: crypto.randomUUID(),
      email: 'test@example.com',
      full_name: 'Usuario de Prueba',
      role: 'administrativo',
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('📝 Intentando crear perfil de usuario...');
    console.log('📋 Datos del perfil:', testProfile);
    
    const { data, error } = await supabase
      .from('user_profiles')
      .insert(testProfile)
      .select()
      .single();
    
    if (error) {
      console.log('❌ Error al crear perfil:', error.message);
      console.log('📋 Detalles del error:', error);
      return false;
    } else {
      console.log('✅ ¡Perfil creado exitosamente!');
      console.log('📊 Datos del perfil creado:', data);
      
      // Verificar que el perfil se puede leer
      console.log('\n🔍 Verificando lectura del perfil...');
      const { data: readData, error: readError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', testProfile.id)
        .single();
        
      if (readError) {
        console.log('❌ Error al leer perfil:', readError.message);
        return false;
      } else {
        console.log('✅ Perfil leído correctamente:', readData);
      }
      
      // Limpiar el registro de prueba
      console.log('\n🧹 Limpiando registro de prueba...');
      const { error: deleteError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', testProfile.id);
        
      if (deleteError) {
        console.log('⚠️  Error al eliminar registro de prueba:', deleteError.message);
      } else {
        console.log('✅ Registro de prueba eliminado correctamente');
      }
      
      return true;
    }
    
  } catch (err) {
    console.error('💥 Error inesperado:', err);
    return false;
  }
}

async function main() {
  const success = await testUserCreation();
  
  console.log('\n🎉 RESUMEN DE PRUEBAS');
  console.log('=====================');
  
  if (success) {
    console.log('✅ ¡TODAS LAS PRUEBAS PASARON!');
    console.log('✅ La creación de perfiles de usuario funciona correctamente');
    console.log('✅ El problema del campo \'phone\' ha sido resuelto');
  } else {
    console.log('❌ ALGUNAS PRUEBAS FALLARON');
    console.log('❌ Revisa los errores anteriores');
  }
}

main();