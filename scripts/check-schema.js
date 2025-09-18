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

async function checkSchema() {
  console.log('🔍 VERIFICANDO ESQUEMA DE user_profiles');
  console.log('=========================================');
  
  try {
    // Intentar insertar un registro de prueba para ver qué columnas acepta
    const testProfile = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'test@example.com',
      full_name: 'Test User',
      role: 'administrativo',
      avatar_url: null
    };
    
    console.log('📝 Intentando insertar perfil de prueba...');
    const { data, error } = await supabase
      .from('user_profiles')
      .insert(testProfile)
      .select();
    
    if (error) {
      console.log('❌ Error al insertar:', error.message);
      console.log('📋 Detalles del error:', error);
      
      // Si el error es sobre columnas faltantes, mostrar qué columnas están disponibles
      if (error.message.includes('column') || error.message.includes('schema cache')) {
        console.log('\n🔍 Intentando obtener estructura de la tabla...');
        
        // Intentar una consulta simple para ver qué columnas existen
        const { data: existingData, error: selectError } = await supabase
          .from('user_profiles')
          .select('*')
          .limit(1);
          
        if (selectError) {
          console.log('❌ Error en SELECT:', selectError.message);
        } else {
          console.log('✅ La tabla existe y se puede consultar');
          console.log('📊 Datos existentes:', existingData);
        }
      }
    } else {
      console.log('✅ Inserción exitosa!');
      console.log('📊 Datos insertados:', data);
      
      // Limpiar el registro de prueba
      await supabase
        .from('user_profiles')
        .delete()
        .eq('id', '00000000-0000-0000-0000-000000000001');
      console.log('🧹 Registro de prueba eliminado');
    }
    
  } catch (err) {
    console.error('💥 Error inesperado:', err);
  }
}

checkSchema();