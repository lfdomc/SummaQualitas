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

async function fixRoleConstraint() {
  console.log('🔧 CORRIGIENDO CONSTRAINT DEL CAMPO ROLE');
  console.log('=======================================');
  
  try {
    console.log('📝 Ejecutando SQL para corregir el constraint...');
    console.log('');
    console.log('🚨 IMPORTANTE: Necesitas ejecutar este SQL en el SQL Editor de Supabase:');
    console.log('');
    console.log('-- Eliminar el constraint existente si existe');
    console.log('ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;');
    console.log('');
    console.log('-- Crear el nuevo constraint con los valores correctos');
    console.log("ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_role_check CHECK (role IN ('gerencia', 'administrativo', 'cliente'));");
    console.log('');
    console.log('-- Verificar la estructura de la tabla');
    console.log('SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = \'user_profiles\' AND table_schema = \'public\';');
    console.log('');
    console.log('-- Verificar los constraints');
    console.log('SELECT conname, consrc FROM pg_constraint WHERE conrelid = \'public.user_profiles\'::regclass;');
    console.log('');
    
    // Intentar una consulta simple para verificar el estado actual
    console.log('🔍 Verificando estado actual de la tabla...');
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error consultando la tabla:', error.message);
    } else {
      console.log('✅ La tabla user_profiles es accesible');
      console.log('📊 Registros encontrados:', data.length);
    }
    
    // Probar inserción después de que el usuario ejecute el SQL
    console.log('');
    console.log('⏳ Después de ejecutar el SQL anterior, ejecuta este script nuevamente para probar:');
    console.log('   node scripts/test-user-creation.js');
    
  } catch (err) {
    console.error('💥 Error inesperado:', err);
  }
}

fixRoleConstraint();