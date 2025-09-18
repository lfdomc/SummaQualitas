-- SCRIPT PARA EJECUTAR MANUALMENTE EN SUPABASE SQL EDITOR
-- Este script recreará completamente la tabla user_profiles con políticas RLS corregidas

-- 1. Eliminar políticas RLS existentes
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Gerencia can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Gerencia can insert profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Gerencia can update all profiles" ON public.user_profiles;

-- 2. Eliminar trigger y función (usando CASCADE para eliminar dependencias)
DROP TRIGGER IF EXISTS handle_user_profiles_updated_at ON public.user_profiles;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

-- 3. Eliminar tabla existente
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- 4. Crear nueva tabla con constraint correcto
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('gerencia', 'administrativo', 'cliente')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Habilitar RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 6. Crear políticas RLS SIN RECURSIÓN
-- Política para que los usuarios vean su propio perfil
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Política para que los usuarios actualicen su propio perfil
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Política para insertar perfiles (solo usuarios autenticados)
CREATE POLICY "Authenticated users can insert profiles" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 7. Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Crear trigger para updated_at
CREATE TRIGGER handle_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 9. Recrear triggers para otras tablas que fueron eliminados con CASCADE
-- (Solo si las tablas existen)
DO $$
BEGIN
  -- Trigger para clients
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients' AND table_schema = 'public') THEN
    EXECUTE 'CREATE TRIGGER trigger_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();';
  END IF;
  
  -- Trigger para suppliers
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers' AND table_schema = 'public') THEN
    EXECUTE 'CREATE TRIGGER trigger_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();';
  END IF;
  
  -- Trigger para projects
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects' AND table_schema = 'public') THEN
    EXECUTE 'CREATE TRIGGER trigger_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();';
  END IF;
  
  -- Trigger para equipment
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'equipment' AND table_schema = 'public') THEN
    EXECUTE 'CREATE TRIGGER trigger_equipment_updated_at BEFORE UPDATE ON public.equipment FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();';
  END IF;
  
  -- Trigger para invoices
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices' AND table_schema = 'public') THEN
    EXECUTE 'CREATE TRIGGER trigger_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();';
  END IF;
  
  -- Trigger para reports
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reports' AND table_schema = 'public') THEN
    EXECUTE 'CREATE TRIGGER trigger_reports_updated_at BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();';
  END IF;
END $$;

-- 10. Verificar que la tabla se creó correctamente
SELECT table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 11. Verificar que el constraint de roles funciona
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.user_profiles'::regclass AND contype = 'c';

-- ¡LISTO! La tabla user_profiles ahora debería funcionar correctamente
-- Las políticas RLS han sido simplificadas para evitar recursión infinita
-- Los permisos específicos por rol se manejarán en el código de la aplicación