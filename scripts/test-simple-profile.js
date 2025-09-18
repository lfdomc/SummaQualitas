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

async function testSimpleProfile() {
  console.log('🧪 PRUEBA SIMPLE DE CREACIÓN DE PERFIL');
  console.log('====================================');
  
  try {
    // Crear un perfil mínimo sin phone
    const testProfile = {
      id: crypto.randomUUID(),
      email: `test-${Date.now()}@example.com`,
      full_name: 'Usuario de Prueba',
      role: 'administrativo'
    };
    
    console.log('📝 Intentando crear perfil básico...');
    console.log('📋 Datos:', testProfile);
    
    const { data, error } = await supabase
      .from('user_profiles')
      .insert(testProfile)
      .select()
      .single();
    
    if (error) {
      console.log('❌ Error:', error.message);
      console.log('📋 Código de error:', error.code);
      
      if (error.message.includes('role_check')) {
        console.log('');
        console.log('🚨 PROBLEMA DETECTADO: El constraint de role aún no está corregido');
        console.log('📝 Necesitas ejecutar el SQL mostrado anteriormente en Supabase SQL Editor');
        console.log('');
        console.log('SQL a ejecutar:');
        console.log('ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;');
        console.log("ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_role_check CHECK (role IN ('gerencia', 'administrativo', 'cliente'));");
      }
      
      return false;
    } else {
      console.log('✅ ¡Perfil creado exitosamente!');
      console.log('📊 Datos creados:', data);
      
      // Limpiar
      await supabase
        .from('user_profiles')
        .delete()
        .eq('id', testProfile.id);
        
      console.log('🧹 Registro de prueba eliminado');
      return true;
    }
    
  } catch (err) {
    console.error('💥 Error inesperado:', err);
    return false;
  }
}

async function main() {
  const success = await testSimpleProfile();
  
  console.log('\n🎯 RESULTADO');
  console.log('============');
  
  if (success) {
    console.log('✅ ¡PRUEBA EXITOSA!');
    console.log('✅ La creación de perfiles funciona correctamente');
    console.log('✅ El sistema está listo para usar');
  } else {
    console.log('❌ PRUEBA FALLÓ');
    console.log('❌ Revisa los errores anteriores');
    console.log('❌ Ejecuta el SQL en Supabase si es necesario');
  }
}

main();