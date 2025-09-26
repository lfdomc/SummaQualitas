-- SUMMA QUALITAS CONSTRUCTION MANAGEMENT SYSTEM
-- Complete Database Setup Script
-- 
-- This script sets up the complete database for the Summa Qualitas construction management system.
-- It includes all tables, relationships, security policies, functions, triggers, and sample data.
--
-- INSTRUCTIONS:
-- 1. Connect to your Supabase project as a superuser
-- 2. Run this script in the SQL editor
-- 3. Verify all tables and data are created successfully
-- 4. Test the application with the sample data
--
-- IMPORTANT: This script will create a complete database structure.
-- Make sure to backup any existing data before running.

-- =============================================================================
-- STEP 1: CREATE COMPLETE DATABASE STRUCTURE
-- =============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('gerencia', 'administrativo', 'operativo', 'cliente');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
        CREATE TYPE project_status AS ENUM ('planificacion', 'en_progreso', 'pausado', 'completado', 'cancelado');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'equipment_status') THEN
        CREATE TYPE equipment_status AS ENUM ('disponible', 'en_uso', 'mantenimiento', 'fuera_de_servicio');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('pendiente', 'pagado', 'vencido', 'cancelado');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'supplier_type') THEN
        CREATE TYPE supplier_type AS ENUM ('MATERIALES', 'SERVICIOS', 'EQUIPOS', 'SUBCONTRATISTA');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_category') THEN
        CREATE TYPE expense_category AS ENUM ('materiales', 'mano_obra', 'equipos', 'servicios', 'transporte', 'otros');
    END IF;
END $$;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- STEP 2: CREATE ALL TABLES
-- =============================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'operativo',
    phone VARCHAR(50),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CLIENTS TABLE
CREATE TABLE IF NOT EXISTS clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    tax_id VARCHAR(50),
    client_type VARCHAR(50) DEFAULT 'empresa',
    status VARCHAR(20) DEFAULT 'activo' CHECK (status IN ('activo', 'inactivo')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. SUPPLIERS TABLE (Update existing or create new)
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    tax_id VARCHAR(50),
    supplier_type supplier_type NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'ACTIVO' CHECK (status IN ('ACTIVO', 'INACTIVO')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    manager_id UUID REFERENCES users(id),
    status project_status DEFAULT 'planificacion',
    budget DECIMAL(15,2) NOT NULL CHECK (budget > 0),
    currency VARCHAR(3) DEFAULT 'USD',
    start_date DATE,
    end_date DATE,
    estimated_end_date DATE,
    location TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. EQUIPMENT TABLE
CREATE TABLE IF NOT EXISTS equipment (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    brand VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100) UNIQUE,
    purchase_date DATE,
    purchase_price DECIMAL(15,2),
    current_value DECIMAL(15,2),
    status equipment_status DEFAULT 'disponible',
    location VARCHAR(255),
    maintenance_schedule TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. EQUIPMENT RENTALS TABLE
CREATE TABLE IF NOT EXISTS equipment_rentals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    rented_by UUID REFERENCES users(id),
    start_date DATE NOT NULL,
    end_date DATE,
    planned_end_date DATE,
    daily_rate DECIMAL(10,2),
    total_cost DECIMAL(15,2),
    status VARCHAR(20) DEFAULT 'activo' CHECK (status IN ('activo', 'completado', 'cancelado')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id),
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'USD',
    category expense_category NOT NULL,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    invoice_number VARCHAR(100),
    payment_status payment_status DEFAULT 'pendiente',
    payment_date DATE,
    notes TEXT,
    receipt_url TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. CLIENT PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS client_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'USD',
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50),
    reference VARCHAR(100),
    description TEXT,
    status payment_status DEFAULT 'pendiente',
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. SUPPLIER PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS supplier_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'USD',
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50),
    reference VARCHAR(100),
    description TEXT,
    status payment_status DEFAULT 'pendiente',
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. INCOMES TABLE (Update existing or create new)
CREATE TABLE IF NOT EXISTS incomes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    category VARCHAR(50) NOT NULL CHECK (category IN ('pago_proyecto', 'anticipo', 'pago_final', 'pago_parcial', 'otros')),
    status VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'confirmado', 'cancelado')),
    received_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reference VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. PROJECT SUMMARIES TABLE
CREATE TABLE IF NOT EXISTS project_summaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    total_expenses DECIMAL(15,2) DEFAULT 0,
    total_income DECIMAL(15,2) DEFAULT 0,
    profit_loss DECIMAL(15,2) DEFAULT 0,
    expense_percentage DECIMAL(5,2) DEFAULT 0,
    last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id)
);

-- 12. CHANGE ORDERS TABLE
CREATE TABLE IF NOT EXISTS change_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'aprobado', 'rechazado', 'implementado')),
    requested_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    request_date DATE DEFAULT CURRENT_DATE,
    approval_date DATE,
    implementation_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- STEP 3: CREATE INDEXES
-- =============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_email_active ON users(email, is_active);
CREATE INDEX IF NOT EXISTS idx_users_role_active ON users(role, is_active);

-- Clients indexes
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);

-- Suppliers indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_email ON suppliers(email);
CREATE INDEX IF NOT EXISTS idx_suppliers_type ON suppliers(supplier_type);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_created_at ON suppliers(created_at);

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_manager_id ON projects(manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_start_date ON projects(start_date);
CREATE INDEX IF NOT EXISTS idx_projects_end_date ON projects(end_date);

-- Equipment indexes
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(category);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_serial_number ON equipment(serial_number);

-- Equipment rentals indexes
CREATE INDEX IF NOT EXISTS idx_equipment_rentals_equipment_id ON equipment_rentals(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_rentals_project_id ON equipment_rentals(project_id);
CREATE INDEX IF NOT EXISTS idx_equipment_rentals_start_date ON equipment_rentals(start_date);
CREATE INDEX IF NOT EXISTS idx_equipment_rentals_status ON equipment_rentals(status);

-- Expenses indexes
CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_supplier_id ON expenses(supplier_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_payment_status ON expenses(payment_status);

-- Client payments indexes
CREATE INDEX IF NOT EXISTS idx_client_payments_project_id ON client_payments(project_id);
CREATE INDEX IF NOT EXISTS idx_client_payments_client_id ON client_payments(client_id);
CREATE INDEX IF NOT EXISTS idx_client_payments_payment_date ON client_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_client_payments_status ON client_payments(status);

-- Supplier payments indexes
CREATE INDEX IF NOT EXISTS idx_supplier_payments_supplier_id ON supplier_payments(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_project_id ON supplier_payments(project_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_payment_date ON supplier_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_status ON supplier_payments(status);

-- Incomes indexes
CREATE INDEX IF NOT EXISTS idx_incomes_project_id ON incomes(project_id);
CREATE INDEX IF NOT EXISTS idx_incomes_client_id ON incomes(client_id);
CREATE INDEX IF NOT EXISTS idx_incomes_status ON incomes(status);
CREATE INDEX IF NOT EXISTS idx_incomes_category ON incomes(category);
CREATE INDEX IF NOT EXISTS idx_incomes_received_date ON incomes(received_date);
CREATE INDEX IF NOT EXISTS idx_incomes_created_at ON incomes(created_at);

-- Project summaries indexes
CREATE INDEX IF NOT EXISTS idx_project_summaries_project_id ON project_summaries(project_id);
CREATE INDEX IF NOT EXISTS idx_project_summaries_last_calculated ON project_summaries(last_calculated);

-- Change orders indexes
CREATE INDEX IF NOT EXISTS idx_change_orders_project_id ON change_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_change_orders_status ON change_orders(status);
CREATE INDEX IF NOT EXISTS idx_change_orders_request_date ON change_orders(request_date);

-- =============================================================================
-- STEP 4: CREATE TRIGGERS FOR UPDATED_AT
-- =============================================================================

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipment_rentals_updated_at BEFORE UPDATE ON equipment_rentals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_payments_updated_at BEFORE UPDATE ON client_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_supplier_payments_updated_at BEFORE UPDATE ON supplier_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_incomes_updated_at BEFORE UPDATE ON incomes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_summaries_updated_at BEFORE UPDATE ON project_summaries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_change_orders_updated_at BEFORE UPDATE ON change_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- STEP 5: ENABLE ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_orders ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- STEP 6: CREATE HELPER FUNCTIONS
-- =============================================================================

-- Helper function to get user role from JWT
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(auth.jwt() ->> 'role', 'operativo');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user ID from JWT
CREATE OR REPLACE FUNCTION get_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::UUID);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- STEP 7: CREATE RLS POLICIES
-- =============================================================================

-- Drop existing policies if they exist
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename;
    END LOOP;
END $$;

-- USERS TABLE POLICIES
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id OR get_user_role() = 'gerencia');
CREATE POLICY "Gerencia can insert users" ON users FOR INSERT WITH CHECK (get_user_role() = 'gerencia');
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id OR get_user_role() = 'gerencia');
CREATE POLICY "Gerencia can delete users" ON users FOR DELETE USING (get_user_role() = 'gerencia');

-- CLIENTS TABLE POLICIES
CREATE POLICY "Authenticated users can view clients" ON clients FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Gerencia and administrativo can insert clients" ON clients FOR INSERT WITH CHECK (get_user_role() IN ('gerencia', 'administrativo'));
CREATE POLICY "Gerencia and administrativo can update clients" ON clients FOR UPDATE USING (get_user_role() IN ('gerencia', 'administrativo'));
CREATE POLICY "Gerencia can delete clients" ON clients FOR DELETE USING (get_user_role() = 'gerencia');

-- SUPPLIERS TABLE POLICIES
CREATE POLICY "Authenticated users can view suppliers" ON suppliers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Gerencia and administrativo can insert suppliers" ON suppliers FOR INSERT WITH CHECK (get_user_role() IN ('gerencia', 'administrativo'));
CREATE POLICY "Gerencia and administrativo can update suppliers" ON suppliers FOR UPDATE USING (get_user_role() IN ('gerencia', 'administrativo'));
CREATE POLICY "Gerencia can delete suppliers" ON suppliers FOR DELETE USING (get_user_role() = 'gerencia');

-- PROJECTS TABLE POLICIES
CREATE POLICY "Authenticated users can view projects" ON projects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Gerencia and administrativo can insert projects" ON projects FOR INSERT WITH CHECK (get_user_role() IN ('gerencia', 'administrativo'));
CREATE POLICY "Project managers can update projects" ON projects FOR UPDATE USING (get_user_role() IN ('gerencia', 'administrativo') OR manager_id = get_user_id());
CREATE POLICY "Gerencia can delete projects" ON projects FOR DELETE USING (get_user_role() = 'gerencia');

-- EQUIPMENT TABLE POLICIES
CREATE POLICY "Authenticated users can view equipment" ON equipment FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Gerencia and administrativo can insert equipment" ON equipment FOR INSERT WITH CHECK (get_user_role() IN ('gerencia', 'administrativo'));
CREATE POLICY "Users can update equipment" ON equipment FOR UPDATE USING (get_user_role() IN ('gerencia', 'administrativo', 'operativo'));
CREATE POLICY "Gerencia can delete equipment" ON equipment FOR DELETE USING (get_user_role() = 'gerencia');

-- EQUIPMENT RENTALS TABLE POLICIES
CREATE POLICY "Authenticated users can view equipment rentals" ON equipment_rentals FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert equipment rentals" ON equipment_rentals FOR INSERT WITH CHECK (get_user_role() IN ('gerencia', 'administrativo', 'operativo'));
CREATE POLICY "Users can update equipment rentals" ON equipment_rentals FOR UPDATE USING (get_user_role() IN ('gerencia', 'administrativo') OR rented_by = get_user_id());
CREATE POLICY "Gerencia and administrativo can delete equipment rentals" ON equipment_rentals FOR DELETE USING (get_user_role() IN ('gerencia', 'administrativo'));

-- EXPENSES TABLE POLICIES
CREATE POLICY "Authenticated users can view expenses" ON expenses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert expenses" ON expenses FOR INSERT WITH CHECK (get_user_role() IN ('gerencia', 'administrativo', 'operativo'));
CREATE POLICY "Users can update expenses" ON expenses FOR UPDATE USING (get_user_role() IN ('gerencia', 'administrativo') OR created_by = get_user_id());
CREATE POLICY "Gerencia and administrativo can delete expenses" ON expenses FOR DELETE USING (get_user_role() IN ('gerencia', 'administrativo'));

-- CLIENT PAYMENTS TABLE POLICIES
CREATE POLICY "Authenticated users can view client payments" ON client_payments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Gerencia and administrativo can insert client payments" ON client_payments FOR INSERT WITH CHECK (get_user_role() IN ('gerencia', 'administrativo'));
CREATE POLICY "Gerencia and administrativo can update client payments" ON client_payments FOR UPDATE USING (get_user_role() IN ('gerencia', 'administrativo'));
CREATE POLICY "Gerencia can delete client payments" ON client_payments FOR DELETE USING (get_user_role() = 'gerencia');

-- SUPPLIER PAYMENTS TABLE POLICIES
CREATE POLICY "Authenticated users can view supplier payments" ON supplier_payments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Gerencia and administrativo can insert supplier payments" ON supplier_payments FOR INSERT WITH CHECK (get_user_role() IN ('gerencia', 'administrativo'));
CREATE POLICY "Gerencia and administrativo can update supplier payments" ON supplier_payments FOR UPDATE USING (get_user_role() IN ('gerencia', 'administrativo'));
CREATE POLICY "Gerencia can delete supplier payments" ON supplier_payments FOR DELETE USING (get_user_role() = 'gerencia');

-- INCOMES TABLE POLICIES
CREATE POLICY "Authenticated users can view incomes" ON incomes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Gerencia and administrativo can insert incomes" ON incomes FOR INSERT WITH CHECK (get_user_role() IN ('gerencia', 'administrativo'));
CREATE POLICY "Gerencia and administrativo can update incomes" ON incomes FOR UPDATE USING (get_user_role() IN ('gerencia', 'administrativo'));
CREATE POLICY "Gerencia can delete incomes" ON incomes FOR DELETE USING (get_user_role() = 'gerencia');

-- PROJECT SUMMARIES TABLE POLICIES
CREATE POLICY "Authenticated users can view project summaries" ON project_summaries FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "System can manage project summaries" ON project_summaries FOR ALL USING (true);

-- CHANGE ORDERS TABLE POLICIES
CREATE POLICY "Authenticated users can view change orders" ON change_orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert change orders" ON change_orders FOR INSERT WITH CHECK (get_user_role() IN ('gerencia', 'administrativo', 'operativo'));
CREATE POLICY "Users can update change orders" ON change_orders FOR UPDATE USING (get_user_role() IN ('gerencia', 'administrativo') OR requested_by = get_user_id());
CREATE POLICY "Gerencia and administrativo can delete change orders" ON change_orders FOR DELETE USING (get_user_role() IN ('gerencia', 'administrativo'));

-- =============================================================================
-- STEP 8: CREATE BUSINESS LOGIC FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to calculate project summary statistics
CREATE OR REPLACE FUNCTION calculate_project_summary(project_uuid UUID)
RETURNS VOID AS $$
DECLARE
    total_exp DECIMAL(15,2) := 0;
    total_inc DECIMAL(15,2) := 0;
    profit_loss_calc DECIMAL(15,2) := 0;
    expense_perc DECIMAL(5,2) := 0;
    project_budget DECIMAL(15,2) := 0;
BEGIN
    SELECT budget INTO project_budget FROM projects WHERE id = project_uuid;
    
    SELECT COALESCE(SUM(amount), 0) INTO total_exp FROM expenses WHERE project_id = project_uuid AND payment_status != 'cancelado';
    SELECT COALESCE(SUM(amount), 0) INTO total_inc FROM client_payments WHERE project_id = project_uuid AND status != 'cancelado';
    
    profit_loss_calc := total_inc - total_exp;
    
    IF project_budget > 0 THEN
        expense_perc := (total_exp / project_budget) * 100;
    END IF;
    
    INSERT INTO project_summaries (project_id, total_expenses, total_income, profit_loss, expense_percentage, last_calculated)
    VALUES (project_uuid, total_exp, total_inc, profit_loss_calc, expense_perc, NOW())
    ON CONFLICT (project_id) 
    DO UPDATE SET
        total_expenses = EXCLUDED.total_expenses,
        total_income = EXCLUDED.total_income,
        profit_loss = EXCLUDED.profit_loss,
        expense_percentage = EXCLUDED.expense_percentage,
        last_calculated = EXCLUDED.last_calculated,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic project summary calculation
CREATE OR REPLACE FUNCTION trigger_recalculate_summary()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM calculate_project_summary(COALESCE(NEW.project_id, OLD.project_id));
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_recalculate_summary_on_expense_change ON expenses;
CREATE TRIGGER trigger_recalculate_summary_on_expense_change
    AFTER INSERT OR UPDATE OR DELETE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION trigger_recalculate_summary();

DROP TRIGGER IF EXISTS trigger_recalculate_summary_on_payment_change ON client_payments;
CREATE TRIGGER trigger_recalculate_summary_on_payment_change
    AFTER INSERT OR UPDATE OR DELETE ON client_payments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_recalculate_summary();

-- =============================================================================
-- STEP 9: GRANT PERMISSIONS
-- =============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =============================================================================
-- STEP 10: INSERT SAMPLE DATA (OPTIONAL - COMMENT OUT IF NOT NEEDED)
-- =============================================================================

-- Uncomment the following section if you want to insert sample data for testing

/*
-- Insert sample users
INSERT INTO users (id, email, name, role, phone, is_active) VALUES
('11111111-1111-1111-1111-111111111111', 'gerente@summaqualitas.com', 'Juan Carlos Pérez', 'gerencia', '+1-555-0101', true),
('22222222-2222-2222-2222-222222222222', 'admin@summaqualitas.com', 'María González', 'administrativo', '+1-555-0102', true),
('33333333-3333-3333-3333-333333333333', 'operador1@summaqualitas.com', 'Carlos Rodríguez', 'operativo', '+1-555-0103', true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample clients
INSERT INTO clients (id, name, contact_person, email, phone, address, tax_id, client_type, status) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Constructora ABC S.A.', 'Roberto Silva', 'contacto@constructoraabc.com', '+1-555-0201', '123 Calle Principal, Ciudad', 'RFC123456789', 'empresa', 'activo')
ON CONFLICT (id) DO NOTHING;

-- Insert sample suppliers
INSERT INTO suppliers (id, name, contact_person, email, phone, address, tax_id, supplier_type, status) VALUES
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Materiales de Construcción López', 'Pedro López', 'ventas@materialeslopez.com', '+1-555-0301', '100 Zona Industrial, Ciudad', 'RFC111222333', 'MATERIALES', 'ACTIVO')
ON CONFLICT (id) DO NOTHING;

-- Insert sample projects
INSERT INTO projects (id, name, description, client_id, manager_id, status, budget, start_date, estimated_end_date, location) VALUES
('aaaabbbb-cccc-dddd-eeee-ffffgggghhh1', 'Edificio Residencial Torre Norte', 'Construcción de edificio residencial de 15 pisos', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'en_progreso', 2500000.00, '2024-01-15', '2024-12-15', 'Zona Norte, Ciudad')
ON CONFLICT (id) DO NOTHING;
*/

-- =============================================================================
-- SETUP COMPLETE
-- =============================================================================

-- Display completion message
DO $$
BEGIN
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'SUMMA QUALITAS DATABASE SETUP COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'Database structure created with:';
    RAISE NOTICE '- 12 main tables with proper relationships including suppliers';
    RAISE NOTICE '- Row Level Security (RLS) policies';
    RAISE NOTICE '- Automated triggers for data integrity';
    RAISE NOTICE '- Business logic functions';
    RAISE NOTICE '- Performance indexes';
    RAISE NOTICE '- TypeScript-compatible types';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Update your .env.local with the correct Supabase credentials';
    RAISE NOTICE '2. Test the connection from your Next.js application';
    RAISE NOTICE '3. Verify all CRUD operations work correctly';
    RAISE NOTICE '4. Add sample data if needed for testing';
    RAISE NOTICE '=============================================================================';
END $$;