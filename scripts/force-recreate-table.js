import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function forceRecreateTable() {
  console.log('🔄 FORZANDO RECREACIÓN DE TABLA user_profiles');
  console.log('==============================================');
  
  try {
    console.log('\n1️⃣ Eliminando tabla existente...');
    
    // Primero eliminar todas las políticas RLS
    const policies = [
      'Users can view own profile',
      'Users can update own profile', 
      'Gerencia can view all profiles',
      'Gerencia can insert profiles',
      'Gerencia can update all profiles'
    ];
    
    for (const policy of policies) {
      try {
        await supabase.rpc('exec_sql', {
          sql: `DROP POLICY IF EXISTS "${policy}" ON public.user_profiles;`
        });
      } catch (err) {
        // Ignorar errores de políticas que no existen
      }
    }
    
    // Eliminar trigger y función
    try {
      await supabase.rpc('exec_sql', {
        sql: 'DROP TRIGGER IF EXISTS handle_user_profiles_updated_at ON public.user_profiles;'
      });
      await supabase.rpc('exec_sql', {
        sql: 'DROP FUNCTION IF EXISTS public.handle_updated_at();'
      });
    } catch (err) {
      // Ignorar errores
    }
    
    // Eliminar tabla
    await supabase.rpc('exec_sql', {
      sql: 'DROP TABLE IF EXISTS public.user_profiles CASCADE;'
    });
    
    console.log('✅ Tabla eliminada');
    
    console.log('\n2️⃣ Creando nueva tabla...');
    
    // Crear tabla nueva
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE public.user_profiles (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          email TEXT UNIQUE NOT NULL,
          full_name TEXT,
          avatar_url TEXT,
          role TEXT NOT NULL CHECK (role IN ('gerencia', 'administrativo', 'cliente')),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });
    
    console.log('✅ Tabla creada');
    
    console.log('\n3️⃣ Configurando RLS...');
    
    // Habilitar RLS
    await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;'
    });
    
    // Crear políticas
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Users can view own profile" ON public.user_profiles
          FOR SELECT USING (auth.uid() = id);
      `
    });
    
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Users can update own profile" ON public.user_profiles
          FOR UPDATE USING (auth.uid() = id);
      `
    });
    
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Gerencia can view all profiles" ON public.user_profiles
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM public.user_profiles
              WHERE id = auth.uid() AND role = 'gerencia'
            )
          );
      `
    });
    
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Gerencia can insert profiles" ON public.user_profiles
          FOR INSERT WITH CHECK (
            EXISTS (
              SELECT 1 FROM public.user_profiles
              WHERE id = auth.uid() AND role = 'gerencia'
            )
          );
      `
    });
    
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Gerencia can update all profiles" ON public.user_profiles
          FOR UPDATE USING (
            EXISTS (
              SELECT 1 FROM public.user_profiles
              WHERE id = auth.uid() AND role = 'gerencia'
            )
          );
      `
    });
    
    console.log('✅ RLS configurado');
    
    console.log('\n4️⃣ Creando función y trigger...');
    
    // Crear función para updated_at
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION public.handle_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `
    });
    
    // Crear trigger
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TRIGGER handle_user_profiles_updated_at
          BEFORE UPDATE ON public.user_profiles
          FOR EACH ROW
          EXECUTE FUNCTION public.handle_updated_at();
      `
    });
    
    console.log('✅ Función y trigger creados');
    
    console.log('\n5️⃣ Probando inserción...');
    
    // Probar inserción
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        id: '00000000-0000-0000-0000-000000000001',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'administrativo'
      })
      .select();
      
    if (error) {
      console.error('❌ Error en prueba:', error);
    } else {
      console.log('✅ Inserción exitosa:', data);
      
      // Limpiar
      await supabase
        .from('user_profiles')
        .delete()
        .eq('id', '00000000-0000-0000-0000-000000000001');
        
      console.log('✅ Registro de prueba eliminado');
    }
    
    console.log('\n🎉 ¡Tabla recreada exitosamente!');
    
  } catch (err) {
    console.error('❌ Error general:', err);
  }
}

forceRecreateTable();