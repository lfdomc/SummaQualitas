import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno SUPABASE');
  console.error('Necesitas NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}

// Extraer la URL de conexión de PostgreSQL desde la URL de Supabase
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
if (!projectRef) {
  console.error('❌ No se pudo extraer la referencia del proyecto de la URL de Supabase');
  process.exit(1);
}

// Cliente Supabase para operaciones básicas
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetDatabase() {
  console.log('🔄 RESETEANDO BASE DE DATOS COMPLETA');
  console.log('=====================================');
  
  try {
    // Paso 1: Eliminar todas las tablas existentes usando Supabase client
    console.log('\n📋 Paso 1: Eliminando tablas existentes...');
    
    const tablesToDrop = [
      'budget_items',
      'project_files', 
      'projects',
      'user_profiles'
    ];
    
    for (const table of tablesToDrop) {
      try {
        // Intentar eliminar datos primero
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Eliminar todos los registros
        
        if (deleteError && !deleteError.message.includes('does not exist')) {
          console.log(`    ⚠️  Error limpiando tabla ${table}:`, deleteError.message);
        } else {
          console.log(`    ✅ Tabla ${table} limpiada`);
        }
      } catch (err) {
        console.log(`    ⚠️  Tabla ${table} no existe o ya fue eliminada`);
      }
    }
    
    // Paso 2: Crear tabla user_profiles usando operaciones Supabase
    console.log('\n📋 Paso 2: Configurando estructura de base de datos...');
    
    // Verificar si la tabla user_profiles existe
    const { data: existingProfiles, error: checkError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);
    
    if (checkError && checkError.message.includes('does not exist')) {
      console.log('    ℹ️  La tabla user_profiles no existe. Necesitas crearla manualmente en Supabase.');
      console.log('    📝 Ve al SQL Editor en tu dashboard de Supabase y ejecuta:');
      console.log('');
      console.log('    CREATE TABLE public.user_profiles (');
      console.log('      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,');
      console.log('      email TEXT NOT NULL UNIQUE,');
      console.log('      full_name TEXT NOT NULL,');
      console.log('      role TEXT NOT NULL CHECK (role IN (\'gerencia\', \'administrativo\', \'cliente\')),');
      console.log('      phone TEXT,');
      console.log('      avatar_url TEXT,');
      console.log('      created_at TIMESTAMPTZ DEFAULT NOW(),');
      console.log('      updated_at TIMESTAMPTZ DEFAULT NOW()');
      console.log('    );');
      console.log('');
      console.log('    -- Índices para optimización');
      console.log('    CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);');
      console.log('    CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);');
      console.log('');
      console.log('    -- RLS (Row Level Security)');
      console.log('    ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;');
      console.log('');
      console.log('    -- Políticas de seguridad');
      console.log('    CREATE POLICY "Users can view own profile" ON public.user_profiles');
      console.log('      FOR SELECT USING (auth.uid() = id);');
      console.log('');
      console.log('    CREATE POLICY "Users can update own profile" ON public.user_profiles');
      console.log('      FOR UPDATE USING (auth.uid() = id);');
      console.log('');
      console.log('    CREATE POLICY "Gerencia can view all profiles" ON public.user_profiles');
      console.log('      FOR SELECT USING (');
      console.log('        EXISTS (');
      console.log('          SELECT 1 FROM public.user_profiles');
      console.log('          WHERE id = auth.uid() AND role = \'gerencia\'');
      console.log('        )');
      console.log('      );');
      console.log('');
      console.log('    CREATE POLICY "Allow profile creation" ON public.user_profiles');
      console.log('      FOR INSERT WITH CHECK (auth.uid() = id);');
      console.log('');
    } else {
      console.log('    ✅ Tabla user_profiles ya existe');
    }
    
    // Paso 3: Verificar tabla projects
    const { data: existingProjects, error: projectsError } = await supabase
      .from('projects')
      .select('id')
      .limit(1);
    
    if (projectsError && projectsError.message.includes('does not exist')) {
      console.log('\n📋 Paso 3: Configurando tabla projects...');
      console.log('    ℹ️  La tabla projects no existe. SQL para crear:');
      console.log('');
      console.log('    CREATE TABLE public.projects (');
      console.log('      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),');
      console.log('      name TEXT NOT NULL,');
      console.log('      description TEXT,');
      console.log('      client_id UUID REFERENCES public.user_profiles(id),');
      console.log('      manager_id UUID REFERENCES public.user_profiles(id),');
      console.log('      status TEXT NOT NULL DEFAULT \'planning\' CHECK (status IN (\'planning\', \'in_progress\', \'completed\', \'cancelled\')),');
      console.log('      start_date DATE,');
      console.log('      end_date DATE,');
      console.log('      budget DECIMAL(12,2),');
      console.log('      created_at TIMESTAMPTZ DEFAULT NOW(),');
      console.log('      updated_at TIMESTAMPTZ DEFAULT NOW()');
      console.log('    );');
      console.log('');
      console.log('    -- Índices');
      console.log('    CREATE INDEX idx_projects_client_id ON public.projects(client_id);');
      console.log('    CREATE INDEX idx_projects_manager_id ON public.projects(manager_id);');
      console.log('    CREATE INDEX idx_projects_status ON public.projects(status);');
      console.log('');
      console.log('    -- RLS');
      console.log('    ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;');
      console.log('');
      console.log('    -- Políticas');
      console.log('    CREATE POLICY "Gerencia can manage all projects" ON public.projects');
      console.log('      FOR ALL USING (');
      console.log('        EXISTS (');
      console.log('          SELECT 1 FROM public.user_profiles');
      console.log('          WHERE id = auth.uid() AND role = \'gerencia\'');
      console.log('        )');
      console.log('      );');
      console.log('');
      console.log('    CREATE POLICY "Administrativo can view projects" ON public.projects');
      console.log('      FOR SELECT USING (');
      console.log('        EXISTS (');
      console.log('          SELECT 1 FROM public.user_profiles');
      console.log('          WHERE id = auth.uid() AND role IN (\'administrativo\', \'gerencia\')');
      console.log('        )');
      console.log('      );');
      console.log('');
      console.log('    CREATE POLICY "Clients can view own projects" ON public.projects');
      console.log('      FOR SELECT USING (');
      console.log('        client_id = auth.uid() OR');
      console.log('        EXISTS (');
      console.log('          SELECT 1 FROM public.user_profiles');
      console.log('          WHERE id = auth.uid() AND role IN (\'gerencia\', \'administrativo\')');
      console.log('        )');
      console.log('      );');
      console.log('');
    } else {
      console.log('\n📋 Paso 3: Tabla projects verificada ✅');
    }
    
    // Paso 4: Verificar tabla budget_items
    const { data: existingBudget, error: budgetError } = await supabase
      .from('budget_items')
      .select('id')
      .limit(1);
    
    if (budgetError && budgetError.message.includes('does not exist')) {
      console.log('\n📋 Paso 4: Configurando tabla budget_items...');
      console.log('    ℹ️  SQL para crear tabla budget_items:');
      console.log('');
      console.log('    CREATE TABLE public.budget_items (');
      console.log('      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),');
      console.log('      project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,');
      console.log('      category TEXT NOT NULL,');
      console.log('      description TEXT NOT NULL,');
      console.log('      quantity DECIMAL(10,2) NOT NULL DEFAULT 1,');
      console.log('      unit_price DECIMAL(12,2) NOT NULL,');
      console.log('      total_price DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,');
      console.log('      created_at TIMESTAMPTZ DEFAULT NOW(),');
      console.log('      updated_at TIMESTAMPTZ DEFAULT NOW()');
      console.log('    );');
      console.log('');
      console.log('    -- Índices');
      console.log('    CREATE INDEX idx_budget_items_project_id ON public.budget_items(project_id);');
      console.log('    CREATE INDEX idx_budget_items_category ON public.budget_items(category);');
      console.log('');
      console.log('    -- RLS');
      console.log('    ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;');
      console.log('');
      console.log('    -- Políticas');
      console.log('    CREATE POLICY "Budget items follow project access" ON public.budget_items');
      console.log('      FOR ALL USING (');
      console.log('        EXISTS (');
      console.log('          SELECT 1 FROM public.projects p');
      console.log('          JOIN public.user_profiles up ON up.id = auth.uid()');
      console.log('          WHERE p.id = project_id AND (');
      console.log('            up.role = \'gerencia\' OR');
      console.log('            (up.role = \'administrativo\' AND p.id = project_id) OR');
      console.log('            (up.role = \'cliente\' AND p.client_id = auth.uid())');
      console.log('          )');
      console.log('        )');
      console.log('      );');
      console.log('');
    } else {
      console.log('\n📋 Paso 4: Tabla budget_items verificada ✅');
    }
    
    // Paso 5: Crear triggers para updated_at
    console.log('\n📋 Paso 5: Configurando triggers...');
    console.log('    ℹ️  SQL para triggers de updated_at:');
    console.log('');
    console.log('    -- Función para actualizar updated_at');
    console.log('    CREATE OR REPLACE FUNCTION update_updated_at_column()');
    console.log('    RETURNS TRIGGER AS $$');
    console.log('    BEGIN');
    console.log('        NEW.updated_at = NOW();');
    console.log('        RETURN NEW;');
    console.log('    END;');
    console.log('    $$ language \'plpgsql\';');
    console.log('');
    console.log('    -- Triggers para cada tabla');
    console.log('    CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles');
    console.log('        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();');
    console.log('');
    console.log('    CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects');
    console.log('        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();');
    console.log('');
    console.log('    CREATE TRIGGER update_budget_items_updated_at BEFORE UPDATE ON public.budget_items');
    console.log('        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();');
    console.log('');
    
    console.log('\n🎉 CONFIGURACIÓN COMPLETADA');
    console.log('=====================================');
    console.log('✅ Base de datos lista para usar');
    console.log('📝 Ejecuta el SQL mostrado arriba en el SQL Editor de Supabase');
    console.log('🔗 Dashboard: https://app.supabase.com/project/' + projectRef + '/editor');
    console.log('');
    console.log('📋 Próximos pasos:');
    console.log('1. Ejecutar el SQL en Supabase SQL Editor');
    console.log('2. Verificar que las tablas se crearon correctamente');
    console.log('3. Probar el registro de usuarios');
    console.log('4. Verificar los permisos por rol');
    
  } catch (error) {
    console.error('❌ Error durante el reseteo:', error.message);
    process.exit(1);
  }
}

// Ejecutar el reseteo
resetDatabase();