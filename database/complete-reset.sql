-- =====================================================
-- RESET COMPLETO DE LA BASE DE DATOS SUPABASE
-- =====================================================
-- Este script elimina todas las tablas existentes y las recrea
-- con un esquema limpio sin problemas de recursión RLS

-- PASO 1: ELIMINAR TODAS LAS TABLAS EXISTENTES
-- =====================================================

DROP TABLE IF EXISTS public.alerts CASCADE;
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.equipment CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.suppliers CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- PASO 2: CREAR ESQUEMA LIMPIO
-- =====================================================

-- Tabla user_profiles con RLS simple
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'cliente' CHECK (role IN ('gerencia', 'administrativo', 'cliente')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS simples para user_profiles (SIN RECURSIÓN)
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Tabla clients
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all clients" ON public.clients
  FOR SELECT USING (true);

CREATE POLICY "Users can manage clients" ON public.clients
  FOR ALL USING (true);

-- Tabla suppliers
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para suppliers
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all suppliers" ON public.suppliers
  FOR SELECT USING (true);

CREATE POLICY "Users can manage suppliers" ON public.suppliers
  FOR ALL USING (true);

-- Tabla projects
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  budget DECIMAL(12,2),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects" ON public.projects
  FOR SELECT USING (auth.uid() = created_by OR auth.uid() = manager_id);

CREATE POLICY "Users can manage own projects" ON public.projects
  FOR ALL USING (auth.uid() = created_by OR auth.uid() = manager_id);

-- Tabla equipment
CREATE TABLE public.equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT,
  model TEXT,
  serial_number TEXT,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'retired')),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  purchase_date DATE,
  purchase_price DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para equipment
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view equipment from own projects" ON public.equipment
  FOR SELECT USING (
    project_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = equipment.project_id 
      AND (projects.created_by = auth.uid() OR projects.manager_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage equipment from own projects" ON public.equipment
  FOR ALL USING (
    project_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = equipment.project_id 
      AND (projects.created_by = auth.uid() OR projects.manager_id = auth.uid())
    )
  );

-- Tabla invoices
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  due_date DATE,
  issue_date DATE DEFAULT CURRENT_DATE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invoices from own projects" ON public.invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = invoices.project_id 
      AND (projects.created_by = auth.uid() OR projects.manager_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage invoices from own projects" ON public.invoices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = invoices.project_id 
      AND (projects.created_by = auth.uid() OR projects.manager_id = auth.uid())
    )
  );

-- Tabla reports
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('financial', 'progress', 'equipment', 'general')),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  content JSONB,
  generated_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reports from own projects" ON public.reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = reports.project_id 
      AND (projects.created_by = auth.uid() OR projects.manager_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage reports from own projects" ON public.reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = reports.project_id 
      AND (projects.created_by = auth.uid() OR projects.manager_id = auth.uid())
    )
  );

-- Tabla alerts
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para alerts
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts" ON public.alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts" ON public.alerts
  FOR UPDATE USING (auth.uid() = user_id);

-- PASO 3: CREAR ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_clients_name ON public.clients(name);
CREATE INDEX idx_suppliers_name ON public.suppliers(name);
CREATE INDEX idx_projects_created_by ON public.projects(created_by);
CREATE INDEX idx_projects_manager_id ON public.projects(manager_id);
CREATE INDEX idx_projects_client_id ON public.projects(client_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_equipment_project_id ON public.equipment(project_id);
CREATE INDEX idx_equipment_status ON public.equipment(status);
CREATE INDEX idx_invoices_project_id ON public.invoices(project_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_reports_project_id ON public.reports(project_id);
CREATE INDEX idx_alerts_user_id ON public.alerts(user_id);
CREATE INDEX idx_alerts_read ON public.alerts(read);

-- PASO 4: CREAR FUNCIONES DE UTILIDAD
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER trigger_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_equipment_updated_at
  BEFORE UPDATE ON public.equipment
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- PASO 5: INSERTAR DATOS DE EJEMPLO (OPCIONAL)
-- =====================================================

-- Nota: Los datos de ejemplo se insertarán automáticamente
-- cuando los usuarios se registren y creen proyectos

-- =====================================================
-- RESET COMPLETADO
-- =====================================================
-- Todas las tablas han sido recreadas con:
-- ✅ RLS habilitado con políticas simples
-- ✅ Sin problemas de recursión
-- ✅ Esquema optimizado con índices
-- ✅ Triggers para updated_at
-- ✅ Constraints de integridad
-- =====================================================