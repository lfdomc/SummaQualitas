const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function createUserProfilesTable() {
  console.log('🔧 CREANDO TABLA user_profiles');
  console.log('===============================');
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceKey) {
      console.log('❌ Variables de entorno faltantes');
      console.log('Necesitas NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local');
      return;
    }
    
    const supabase = createClient(supabaseUrl, serviceKey);
    
    // SQL para crear la tabla user_profiles
    const createTableSQL = `
      -- 1. Eliminar tabla existente si existe
      DROP TABLE IF EXISTS public.user_profiles CASCADE;
      
      -- 2. Crear nueva tabla con constraint correcto
      CREATE TABLE public.user_profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT,
        avatar_url TEXT,
        role TEXT NOT NULL CHECK (role IN ('gerencia', 'administrativo', 'cliente')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      -- 3. Habilitar RLS
      ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
      
      -- 4. Crear políticas RLS
      CREATE POLICY "Users can view own profile" ON public.user_profiles
        FOR SELECT USING (auth.uid() = id);
      
      CREATE POLICY "Users can update own profile" ON public.user_profiles
        FOR UPDATE USING (auth.uid() = id);
      
      CREATE POLICY "Authenticated users can insert profiles" ON public.user_profiles
        FOR INSERT WITH CHECK (auth.uid() = id);
      
      -- 5. Crear función para actualizar updated_at
      CREATE OR REPLACE FUNCTION public.handle_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      
      -- 6. Crear trigger para updated_at
      CREATE TRIGGER handle_user_profiles_updated_at
        BEFORE UPDATE ON public.user_profiles
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_updated_at();
    `;
    
    console.log('📝 Ejecutando SQL para crear la tabla...');
    
    // Intentar ejecutar usando rpc si existe
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: createTableSQL });
      
      if (error) {
        console.log('❌ Error ejecutando SQL via RPC:', error.message);
        throw error;
      }
      
      console.log('✅ Tabla creada exitosamente via RPC');
      
    } catch (rpcError) {
      console.log('⚠️  RPC no disponible, mostrando SQL para ejecutar manualmente...');
      console.log('\n🚨 EJECUTA ESTE SQL MANUALMENTE EN SUPABASE SQL EDITOR:');
      console.log('=' .repeat(60));
      console.log(createTableSQL);
      console.log('=' .repeat(60));
      console.log('\n📋 Pasos:');
      console.log('1. Ve a tu dashboard de Supabase');
      console.log('2. Abre el SQL Editor');
      console.log('3. Copia y pega el SQL de arriba');
      console.log('4. Ejecuta el script');
      return;
    }
    
    // Verificar que la tabla se creó correctamente
    console.log('\n🧪 Verificando que la tabla se creó...');
    const { data: testData, error: testError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.log('❌ Error verificando tabla:', testError.message);
    } else {
      console.log('✅ Tabla user_profiles creada y verificada exitosamente');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

createUserProfilesTable();