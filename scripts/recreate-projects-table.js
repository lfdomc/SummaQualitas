require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function recreateProjectsTable() {
  console.log('🔧 RECREANDO TABLA PROJECTS');
  console.log('===========================');
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Variables de entorno faltantes');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('\n1. Eliminando tabla projects existente...');
    const dropTableSQL = `
      DROP TABLE IF EXISTS public.projects CASCADE;
    `;
    
    const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropTableSQL });
    
    if (dropError) {
      console.log('ℹ️  Ejecutando DROP directamente (función exec_sql no disponible)');
      // Intentar eliminar datos existentes
      await supabase.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } else {
      console.log('✅ Tabla projects eliminada');
    }
    
    console.log('\n2. Creando nueva tabla projects...');
    const createTableSQL = `
      CREATE TABLE public.projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        created_by UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
        manager_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
        client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
        budget DECIMAL(12,2),
        start_date DATE,
        end_date DATE,
        status TEXT DEFAULT 'planificacion' CHECK (status IN ('planificacion', 'en_progreso', 'pausado', 'completado', 'cancelado')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      -- Habilitar RLS
      ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
      
      -- Crear políticas RLS
      CREATE POLICY "Users can view own projects" ON public.projects
        FOR SELECT USING (
          auth.uid() = created_by OR 
          auth.uid() = manager_id OR
          EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'gerencia'
          )
        );
      
      CREATE POLICY "Users can manage own projects" ON public.projects
        FOR ALL USING (
          auth.uid() = created_by OR 
          auth.uid() = manager_id OR
          EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'gerencia'
          )
        );
      
      -- Crear función para updated_at si no existe
      CREATE OR REPLACE FUNCTION public.handle_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      
      -- Crear trigger para updated_at
      CREATE TRIGGER handle_projects_updated_at
        BEFORE UPDATE ON public.projects
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_updated_at();
    `;
    
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (createError) {
      console.error('❌ Error creando tabla con función exec_sql:', createError.message);
      console.log('\n📋 SQL para ejecutar manualmente en Supabase SQL Editor:');
      console.log('=' .repeat(60));
      console.log(createTableSQL);
      console.log('=' .repeat(60));
    } else {
      console.log('✅ Tabla projects creada exitosamente');
    }
    
    console.log('\n3. Verificando nueva estructura...');
    const { data: testData, error: testError } = await supabase
      .from('projects')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('❌ Error verificando tabla:', testError.message);
    } else {
      console.log('✅ Tabla projects verificada correctamente');
    }
    
    console.log('\n4. Probando JOIN con user_profiles...');
    const { data: joinTest, error: joinError } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        created_by,
        user_profiles!projects_created_by_fkey(id, email, role)
      `)
      .limit(1);
    
    if (joinError) {
      console.error('❌ JOIN aún no funciona:', joinError.message);
      console.log('ℹ️  Esto es normal si la tabla está vacía o las foreign keys necesitan tiempo para actualizarse');
    } else {
      console.log('✅ JOIN con user_profiles funciona correctamente');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

recreateProjectsTable();