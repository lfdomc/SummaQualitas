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

async function recreateUserProfiles() {
  console.log('🔧 RECREANDO TABLA user_profiles');
  console.log('==================================');
  
  try {
    // SQL para recrear la tabla con el constraint correcto
    const recreateTableSQL = `
      -- Eliminar la tabla existente si existe
      DROP TABLE IF EXISTS public.user_profiles CASCADE;
      
      -- Crear la tabla user_profiles con la estructura correcta
      CREATE TABLE public.user_profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        avatar_url TEXT,
        role TEXT NOT NULL CHECK (role IN ('gerencia', 'administrativo', 'cliente')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      -- Habilitar RLS
      ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
      
      -- Crear políticas RLS
      CREATE POLICY "Users can view own profile" ON public.user_profiles
        FOR SELECT USING (auth.uid() = id);
      
      CREATE POLICY "Users can update own profile" ON public.user_profiles
        FOR UPDATE USING (auth.uid() = id);
      
      CREATE POLICY "Gerencia can view all profiles" ON public.user_profiles
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role = 'gerencia'
          )
        );
      
      CREATE POLICY "Gerencia can insert profiles" ON public.user_profiles
        FOR INSERT WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role = 'gerencia'
          )
        );
      
      CREATE POLICY "Gerencia can update all profiles" ON public.user_profiles
        FOR UPDATE USING (
          EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role = 'gerencia'
          )
        );
      
      -- Crear función para actualizar updated_at
      CREATE OR REPLACE FUNCTION public.handle_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      
      -- Crear trigger para updated_at
      CREATE TRIGGER handle_user_profiles_updated_at
        BEFORE UPDATE ON public.user_profiles
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_updated_at();
    `;
    
    console.log('📝 Ejecutando SQL para recrear la tabla...');
    
    // Ejecutar el SQL usando rpc
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: recreateTableSQL });
    
    if (error) {
      console.log('❌ Error ejecutando SQL via RPC:', error.message);
      console.log('📋 Detalles:', error);
      
      console.log('\n🚨 EJECUTA ESTE SQL MANUALMENTE EN SUPABASE SQL EDITOR:');
      console.log('=' .repeat(60));
      console.log(recreateTableSQL);
      console.log('=' .repeat(60));
      
      return;
    }
    
    console.log('✅ Tabla recreada exitosamente');
    
    // Probar insertar un perfil de prueba
    console.log('\n🧪 Probando insertar perfil de prueba...');
    const testProfile = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'test@example.com',
      full_name: 'Test User',
      role: 'administrativo'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('user_profiles')
      .insert(testProfile)
      .select();
    
    if (insertError) {
      console.log('❌ Error al insertar perfil de prueba:', insertError.message);
      console.log('📋 Detalles:', insertError);
    } else {
      console.log('✅ Perfil de prueba insertado exitosamente');
      
      // Limpiar el perfil de prueba
      await supabase
        .from('user_profiles')
        .delete()
        .eq('id', '00000000-0000-0000-0000-000000000001');
      
      console.log('🧹 Perfil de prueba eliminado');
    }
    
  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

recreateUserProfiles();