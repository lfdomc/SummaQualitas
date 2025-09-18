-- Row Level Security (RLS) Policies for Summa Qualitas Construction Management System
-- This script sets up comprehensive RLS policies for all tables

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_orders ENABLE ROW LEVEL SECURITY;

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

-- USERS TABLE POLICIES
-- Users can view their own profile and gerencia can view all
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (
        auth.uid() = id OR get_user_role() = 'gerencia'
    );

-- Only gerencia can insert new users
CREATE POLICY "Gerencia can insert users" ON users
    FOR INSERT WITH CHECK (get_user_role() = 'gerencia');

-- Users can update their own profile, gerencia can update all
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (
        auth.uid() = id OR get_user_role() = 'gerencia'
    );

-- Only gerencia can delete users
CREATE POLICY "Gerencia can delete users" ON users
    FOR DELETE USING (get_user_role() = 'gerencia');

-- CLIENTS TABLE POLICIES
-- All authenticated users can view clients
CREATE POLICY "Authenticated users can view clients" ON clients
    FOR SELECT USING (auth.role() = 'authenticated');

-- Gerencia and administrativo can insert clients
CREATE POLICY "Gerencia and administrativo can insert clients" ON clients
    FOR INSERT WITH CHECK (
        get_user_role() IN ('gerencia', 'administrativo')
    );

-- Gerencia and administrativo can update clients
CREATE POLICY "Gerencia and administrativo can update clients" ON clients
    FOR UPDATE USING (
        get_user_role() IN ('gerencia', 'administrativo')
    );

-- Only gerencia can delete clients
CREATE POLICY "Gerencia can delete clients" ON clients
    FOR DELETE USING (get_user_role() = 'gerencia');

-- PROJECTS TABLE POLICIES
-- All authenticated users can view projects
CREATE POLICY "Authenticated users can view projects" ON projects
    FOR SELECT USING (auth.role() = 'authenticated');

-- Gerencia and administrativo can insert projects
CREATE POLICY "Gerencia and administrativo can insert projects" ON projects
    FOR INSERT WITH CHECK (
        get_user_role() IN ('gerencia', 'administrativo')
    );

-- Project managers and above can update their projects
CREATE POLICY "Project managers can update projects" ON projects
    FOR UPDATE USING (
        get_user_role() IN ('gerencia', 'administrativo') OR 
        manager_id = get_user_id()
    );

-- Only gerencia can delete projects
CREATE POLICY "Gerencia can delete projects" ON projects
    FOR DELETE USING (get_user_role() = 'gerencia');

-- EQUIPMENT TABLE POLICIES
-- All authenticated users can view equipment
CREATE POLICY "Authenticated users can view equipment" ON equipment
    FOR SELECT USING (auth.role() = 'authenticated');

-- Gerencia and administrativo can insert equipment
CREATE POLICY "Gerencia and administrativo can insert equipment" ON equipment
    FOR INSERT WITH CHECK (
        get_user_role() IN ('gerencia', 'administrativo')
    );

-- Gerencia, administrativo, and operativo can update equipment
CREATE POLICY "Users can update equipment" ON equipment
    FOR UPDATE USING (
        get_user_role() IN ('gerencia', 'administrativo', 'operativo')
    );

-- Only gerencia can delete equipment
CREATE POLICY "Gerencia can delete equipment" ON equipment
    FOR DELETE USING (get_user_role() = 'gerencia');

-- EQUIPMENT RENTALS TABLE POLICIES
-- All authenticated users can view equipment rentals
CREATE POLICY "Authenticated users can view equipment rentals" ON equipment_rentals
    FOR SELECT USING (auth.role() = 'authenticated');

-- Gerencia, administrativo, and operativo can insert equipment rentals
CREATE POLICY "Users can insert equipment rentals" ON equipment_rentals
    FOR INSERT WITH CHECK (
        get_user_role() IN ('gerencia', 'administrativo', 'operativo')
    );

-- Users can update equipment rentals they created or if they have permission
CREATE POLICY "Users can update equipment rentals" ON equipment_rentals
    FOR UPDATE USING (
        get_user_role() IN ('gerencia', 'administrativo') OR 
        rented_by = get_user_id()
    );

-- Gerencia and administrativo can delete equipment rentals
CREATE POLICY "Gerencia and administrativo can delete equipment rentals" ON equipment_rentals
    FOR DELETE USING (
        get_user_role() IN ('gerencia', 'administrativo')
    );

-- EXPENSES TABLE POLICIES
-- All authenticated users can view expenses
CREATE POLICY "Authenticated users can view expenses" ON expenses
    FOR SELECT USING (auth.role() = 'authenticated');

-- Gerencia, administrativo, and operativo can insert expenses
CREATE POLICY "Users can insert expenses" ON expenses
    FOR INSERT WITH CHECK (
        get_user_role() IN ('gerencia', 'administrativo', 'operativo')
    );

-- Users can update expenses they created or if they have permission
CREATE POLICY "Users can update expenses" ON expenses
    FOR UPDATE USING (
        get_user_role() IN ('gerencia', 'administrativo') OR 
        created_by = get_user_id()
    );

-- Gerencia and administrativo can delete expenses
CREATE POLICY "Gerencia and administrativo can delete expenses" ON expenses
    FOR DELETE USING (
        get_user_role() IN ('gerencia', 'administrativo')
    );

-- CLIENT PAYMENTS TABLE POLICIES
-- All authenticated users can view client payments
CREATE POLICY "Authenticated users can view client payments" ON client_payments
    FOR SELECT USING (auth.role() = 'authenticated');

-- Gerencia and administrativo can insert client payments
CREATE POLICY "Gerencia and administrativo can insert client payments" ON client_payments
    FOR INSERT WITH CHECK (
        get_user_role() IN ('gerencia', 'administrativo')
    );

-- Gerencia and administrativo can update client payments
CREATE POLICY "Gerencia and administrativo can update client payments" ON client_payments
    FOR UPDATE USING (
        get_user_role() IN ('gerencia', 'administrativo')
    );

-- Only gerencia can delete client payments
CREATE POLICY "Gerencia can delete client payments" ON client_payments
    FOR DELETE USING (get_user_role() = 'gerencia');

-- SUPPLIER PAYMENTS TABLE POLICIES
-- All authenticated users can view supplier payments
CREATE POLICY "Authenticated users can view supplier payments" ON supplier_payments
    FOR SELECT USING (auth.role() = 'authenticated');

-- Gerencia and administrativo can insert supplier payments
CREATE POLICY "Gerencia and administrativo can insert supplier payments" ON supplier_payments
    FOR INSERT WITH CHECK (
        get_user_role() IN ('gerencia', 'administrativo')
    );

-- Gerencia and administrativo can update supplier payments
CREATE POLICY "Gerencia and administrativo can update supplier payments" ON supplier_payments
    FOR UPDATE USING (
        get_user_role() IN ('gerencia', 'administrativo')
    );

-- Only gerencia can delete supplier payments
CREATE POLICY "Gerencia can delete supplier payments" ON supplier_payments
    FOR DELETE USING (get_user_role() = 'gerencia');

-- PROJECT SUMMARIES TABLE POLICIES
-- All authenticated users can view project summaries
CREATE POLICY "Authenticated users can view project summaries" ON project_summaries
    FOR SELECT USING (auth.role() = 'authenticated');

-- System can insert/update project summaries (for automated calculations)
CREATE POLICY "System can manage project summaries" ON project_summaries
    FOR ALL USING (true);

-- CHANGE ORDERS TABLE POLICIES
-- All authenticated users can view change orders
CREATE POLICY "Authenticated users can view change orders" ON change_orders
    FOR SELECT USING (auth.role() = 'authenticated');

-- Gerencia, administrativo, and operativo can insert change orders
CREATE POLICY "Users can insert change orders" ON change_orders
    FOR INSERT WITH CHECK (
        get_user_role() IN ('gerencia', 'administrativo', 'operativo')
    );

-- Users can update change orders they requested or if they have permission
CREATE POLICY "Users can update change orders" ON change_orders
    FOR UPDATE USING (
        get_user_role() IN ('gerencia', 'administrativo') OR 
        requested_by = get_user_id()
    );

-- Gerencia and administrativo can delete change orders
CREATE POLICY "Gerencia and administrativo can delete change orders" ON change_orders
    FOR DELETE USING (
        get_user_role() IN ('gerencia', 'administrativo')
    );

-- SUPPLIERS TABLE POLICIES (updating existing policies to be consistent)
DROP POLICY IF EXISTS "Enable read access for all users" ON suppliers;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON suppliers;
DROP POLICY IF EXISTS "Users can view suppliers" ON suppliers;
DROP POLICY IF EXISTS "Gerencia and administrativo can insert suppliers" ON suppliers;
DROP POLICY IF EXISTS "Gerencia and administrativo can update suppliers" ON suppliers;

-- All authenticated users can view suppliers
CREATE POLICY "Authenticated users can view suppliers" ON suppliers
    FOR SELECT USING (auth.role() = 'authenticated');

-- Gerencia and administrativo can insert suppliers
CREATE POLICY "Gerencia and administrativo can insert suppliers" ON suppliers
    FOR INSERT WITH CHECK (
        get_user_role() IN ('gerencia', 'administrativo')
    );

-- Gerencia and administrativo can update suppliers
CREATE POLICY "Gerencia and administrativo can update suppliers" ON suppliers
    FOR UPDATE USING (
        get_user_role() IN ('gerencia', 'administrativo')
    );

-- Only gerencia can delete suppliers
CREATE POLICY "Gerencia can delete suppliers" ON suppliers
    FOR DELETE USING (get_user_role() = 'gerencia');

-- INCOMES TABLE POLICIES (updating existing policies to be consistent)
DROP POLICY IF EXISTS "Users can view all incomes" ON incomes;
DROP POLICY IF EXISTS "Users can insert incomes" ON incomes;
DROP POLICY IF EXISTS "Users can update incomes" ON incomes;

-- All authenticated users can view incomes
CREATE POLICY "Authenticated users can view incomes" ON incomes
    FOR SELECT USING (auth.role() = 'authenticated');

-- Gerencia and administrativo can insert incomes
CREATE POLICY "Gerencia and administrativo can insert incomes" ON incomes
    FOR INSERT WITH CHECK (
        get_user_role() IN ('gerencia', 'administrativo')
    );

-- Gerencia and administrativo can update incomes
CREATE POLICY "Gerencia and administrativo can update incomes" ON incomes
    FOR UPDATE USING (
        get_user_role() IN ('gerencia', 'administrativo')
    );

-- Only gerencia can delete incomes
CREATE POLICY "Gerencia can delete incomes" ON incomes
    FOR DELETE USING (get_user_role() = 'gerencia');