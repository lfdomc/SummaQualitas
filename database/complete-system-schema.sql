-- =====================================================
-- ESQUEMA COMPLETO DEL SISTEMA DE GESTIÓN CONSTRUCTORA
-- =====================================================

-- Eliminar tablas existentes si existen (en orden correcto por dependencias)
DROP TABLE IF EXISTS payment_details CASCADE;
DROP TABLE IF EXISTS client_payments CASCADE;
DROP TABLE IF EXISTS supplier_payments CASCADE;
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS project_equipment CASCADE;
DROP TABLE IF EXISTS equipment_rental CASCADE;
DROP TABLE IF EXISTS equipment CASCADE;
DROP TABLE IF EXISTS project_suppliers CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;

-- =====================================================
-- 1. SISTEMA DE USUARIOS Y ROLES
-- =====================================================

-- Tabla de roles de usuario
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de usuarios
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role_id UUID REFERENCES user_roles(id),
    is_active BOOLEAN DEFAULT true,
    is_master BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 2. CLIENTES
-- =====================================================

CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    tax_id VARCHAR(50),
    contact_person VARCHAR(255),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. PROVEEDORES
-- =====================================================

CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    tax_id VARCHAR(50),
    contact_person VARCHAR(255),
    category VARCHAR(100), -- materiales, equipos, servicios, etc.
    payment_terms INTEGER DEFAULT 30, -- días de crédito
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. PROYECTOS (ACTUALIZADO)
-- =====================================================

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    client_id UUID REFERENCES clients(id),
    manager_id UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'planning',
    location TEXT,
    
    -- Fechas
    estimated_start_date DATE,
    estimated_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    
    -- Presupuesto detallado
    presupuesto_inicial DECIMAL(15,2) DEFAULT 0,
    exchange_rate_usd DECIMAL(10,2) DEFAULT 520.00, -- Tipo de cambio USD/CRC al momento del contrato
    total_area DECIMAL(10,2) DEFAULT 0, -- Área total del proyecto en metros cuadrados
    costos_directos_materiales DECIMAL(15,2) DEFAULT 0,
    costos_directos_equipos DECIMAL(15,2) DEFAULT 0,
    costos_indirectos DECIMAL(15,2) DEFAULT 0,
    gastos_administrativos DECIMAL(15,2) DEFAULT 0,
    mano_obra_quincenal DECIMAL(15,2) DEFAULT 0,
    imprevistos DECIMAL(15,2) DEFAULT 0,
    utilidad_esperada DECIMAL(15,2) DEFAULT 0,
    
    -- Totales calculados
    total_budget DECIMAL(15,2) GENERATED ALWAYS AS (
        costos_directos_materiales + costos_directos_equipos + 
        costos_indirectos + gastos_administrativos + 
        mano_obra_quincenal + imprevistos + utilidad_esperada
    ) STORED,
    
    -- Control financiero
    total_invoiced DECIMAL(15,2) DEFAULT 0,
    total_paid DECIMAL(15,2) DEFAULT 0,
    total_expenses DECIMAL(15,2) DEFAULT 0,
    
    -- Metadatos
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. EQUIPOS
-- =====================================================

CREATE TABLE equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- excavadoras, grúas, herramientas, etc.
    brand VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    acquisition_date DATE,
    acquisition_cost DECIMAL(15,2),
    daily_rental_rate DECIMAL(10,2) NOT NULL,
    weekly_rental_rate DECIMAL(10,2),
    monthly_rental_rate DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'available', -- available, rented, maintenance, retired
    condition VARCHAR(50) DEFAULT 'good', -- excellent, good, fair, poor
    location VARCHAR(255),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. ALQUILER DE EQUIPOS
-- =====================================================

CREATE TABLE equipment_rental (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID REFERENCES equipment(id),
    project_id UUID REFERENCES projects(id),
    start_date DATE NOT NULL,
    end_date DATE,
    planned_end_date DATE,
    daily_rate DECIMAL(10,2) NOT NULL,
    total_days INTEGER,
    total_cost DECIMAL(15,2),
    status VARCHAR(50) DEFAULT 'active', -- active, completed, cancelled
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. RELACIÓN PROYECTOS-EQUIPOS
-- =====================================================

CREATE TABLE project_equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    equipment_id UUID REFERENCES equipment(id),
    rental_id UUID REFERENCES equipment_rental(id),
    assigned_date DATE DEFAULT CURRENT_DATE,
    removed_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. RELACIÓN PROYECTOS-PROVEEDORES
-- =====================================================

CREATE TABLE project_suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    supplier_id UUID REFERENCES suppliers(id),
    category VARCHAR(100), -- materiales, servicios, equipos
    contract_amount DECIMAL(15,2),
    paid_amount DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 9. FACTURAS
-- =====================================================

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    project_id UUID REFERENCES projects(id),
    client_id UUID REFERENCES clients(id),
    issue_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    status VARCHAR(50) DEFAULT 'draft', -- draft, sent, paid, overdue, cancelled
    
    -- Montos
    subtotal DECIMAL(15,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 18.00, -- IGV en Perú
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    
    -- Información adicional
    notes TEXT,
    payment_terms VARCHAR(255),
    
    -- Metadatos
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 10. ITEMS DE FACTURA
-- =====================================================

CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    item_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 11. PAGOS DE CLIENTES
-- =====================================================

CREATE TABLE client_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    client_id UUID REFERENCES clients(id),
    invoice_id UUID REFERENCES invoices(id),
    payment_date DATE DEFAULT CURRENT_DATE,
    amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50), -- efectivo, transferencia, cheque, etc.
    reference_number VARCHAR(100),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'confirmed', -- pending, confirmed, cancelled
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 12. PAGOS A PROVEEDORES
-- =====================================================

CREATE TABLE supplier_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    supplier_id UUID REFERENCES suppliers(id),
    payment_date DATE DEFAULT CURRENT_DATE,
    amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50),
    reference_number VARCHAR(100),
    description TEXT,
    category VARCHAR(100), -- materiales, servicios, equipos
    notes TEXT,
    status VARCHAR(50) DEFAULT 'confirmed',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 13. DETALLES DE PAGOS (PARA TRAZABILIDAD)
-- =====================================================

CREATE TABLE payment_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID, -- puede ser client_payment_id o supplier_payment_id
    payment_type VARCHAR(20) NOT NULL, -- 'client' o 'supplier'
    concept VARCHAR(255),
    amount DECIMAL(15,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INSERTAR DATOS INICIALES
-- =====================================================

-- Roles iniciales
INSERT INTO user_roles (name, description, permissions) VALUES
('master', 'Usuario Maestro - Acceso completo al sistema', '{"all": true}'),
('admin', 'Administrador - Gestión completa excepto usuarios maestros', '{"projects": true, "invoices": true, "equipment": true, "payments": true, "reports": true}'),
('project_manager', 'Gerente de Proyecto - Gestión de proyectos asignados', '{"projects": true, "equipment": true, "reports": "limited"}'),
('accountant', 'Contador - Gestión financiera y facturación', '{"invoices": true, "payments": true, "reports": true}'),
('operator', 'Operador - Acceso limitado a consultas', '{"projects": "read", "equipment": "read"}');

-- Usuario maestro inicial (password: admin123)
INSERT INTO users (email, password_hash, first_name, last_name, role_id, is_master, is_active) 
SELECT 
    'admin@summaqualitas.com',
    '$2b$10$rQZ9QmjKjKjKjKjKjKjKjOeRv7QmjKjKjKjKjKjKjKjKjKjKjKjKj', -- hash de 'admin123'
    'Usuario',
    'Maestro',
    id,
    true,
    true
FROM user_roles WHERE name = 'master';

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para usuarios
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_active ON users(is_active);

-- Índices para proyectos
CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_manager ON projects(manager_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_dates ON projects(estimated_start_date, estimated_end_date);

-- Índices para equipos
CREATE INDEX idx_equipment_status ON equipment(status);
CREATE INDEX idx_equipment_category ON equipment(category);

-- Índices para alquiler de equipos
CREATE INDEX idx_equipment_rental_project ON equipment_rental(project_id);
CREATE INDEX idx_equipment_rental_equipment ON equipment_rental(equipment_id);
CREATE INDEX idx_equipment_rental_dates ON equipment_rental(start_date, end_date);

-- Índices para facturas
CREATE INDEX idx_invoices_project ON invoices(project_id);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_dates ON invoices(issue_date, due_date);

-- Índices para pagos
CREATE INDEX idx_client_payments_project ON client_payments(project_id);
CREATE INDEX idx_client_payments_invoice ON client_payments(invoice_id);
CREATE INDEX idx_supplier_payments_project ON supplier_payments(project_id);
CREATE INDEX idx_supplier_payments_supplier ON supplier_payments(supplier_id);

-- =====================================================
-- TRIGGERS PARA ACTUALIZACIÓN AUTOMÁTICA
-- =====================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a todas las tablas con updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipment_rental_updated_at BEFORE UPDATE ON equipment_rental FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_payments_updated_at BEFORE UPDATE ON client_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_supplier_payments_updated_at BEFORE UPDATE ON supplier_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCIONES PARA CÁLCULOS AUTOMÁTICOS
-- =====================================================

-- Función para actualizar totales de factura
CREATE OR REPLACE FUNCTION update_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE invoices 
    SET 
        subtotal = (SELECT COALESCE(SUM(total_price), 0) FROM invoice_items WHERE invoice_id = NEW.invoice_id),
        tax_amount = subtotal * (tax_rate / 100),
        total_amount = subtotal + tax_amount
    WHERE id = NEW.invoice_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar totales cuando se modifican items
CREATE TRIGGER update_invoice_totals_trigger 
    AFTER INSERT OR UPDATE OR DELETE ON invoice_items 
    FOR EACH ROW EXECUTE FUNCTION update_invoice_totals();

-- Función para actualizar totales de proyecto
CREATE OR REPLACE FUNCTION update_project_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar total facturado
    UPDATE projects 
    SET total_invoiced = (
        SELECT COALESCE(SUM(total_amount), 0) 
        FROM invoices 
        WHERE project_id = NEW.project_id AND status != 'cancelled'
    )
    WHERE id = NEW.project_id;
    
    -- Actualizar total pagado por clientes
    UPDATE projects 
    SET total_paid = (
        SELECT COALESCE(SUM(amount), 0) 
        FROM client_payments 
        WHERE project_id = NEW.project_id AND status = 'confirmed'
    )
    WHERE id = NEW.project_id;
    
    -- Actualizar total de gastos (pagos a proveedores)
    UPDATE projects 
    SET total_expenses = (
        SELECT COALESCE(SUM(amount), 0) 
        FROM supplier_payments 
        WHERE project_id = NEW.project_id AND status = 'confirmed'
    )
    WHERE id = NEW.project_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar totales de proyecto
CREATE TRIGGER update_project_totals_invoices 
    AFTER INSERT OR UPDATE OR DELETE ON invoices 
    FOR EACH ROW EXECUTE FUNCTION update_project_totals();
    
CREATE TRIGGER update_project_totals_client_payments 
    AFTER INSERT OR UPDATE OR DELETE ON client_payments 
    FOR EACH ROW EXECUTE FUNCTION update_project_totals();
    
CREATE TRIGGER update_project_totals_supplier_payments 
    AFTER INSERT OR UPDATE OR DELETE ON supplier_payments 
    FOR EACH ROW EXECUTE FUNCTION update_project_totals();

-- =====================================================
-- VISTAS PARA REPORTES
-- =====================================================

-- Vista de resumen de proyectos
CREATE VIEW project_summary AS
SELECT 
    p.id,
    p.name,
    p.status,
    c.name as client_name,
    u.first_name || ' ' || u.last_name as manager_name,
    p.total_budget,
    p.total_invoiced,
    p.total_paid,
    p.total_expenses,
    (p.total_budget - p.total_expenses) as estimated_profit,
    (p.total_paid - p.total_expenses) as actual_profit,
    CASE 
        WHEN p.total_budget > 0 THEN (p.total_paid / p.total_budget * 100)
        ELSE 0 
    END as payment_percentage,
    p.estimated_start_date,
    p.estimated_end_date,
    p.actual_start_date,
    p.actual_end_date
FROM projects p
LEFT JOIN clients c ON p.client_id = c.id
LEFT JOIN users u ON p.manager_id = u.id;

-- Vista de equipos en alquiler
CREATE VIEW equipment_rental_summary AS
SELECT 
    er.id,
    e.name as equipment_name,
    e.category,
    p.name as project_name,
    er.start_date,
    er.end_date,
    er.daily_rate,
    er.total_days,
    er.total_cost,
    er.status
FROM equipment_rental er
JOIN equipment e ON er.equipment_id = e.id
JOIN projects p ON er.project_id = p.id;

-- Vista de estado financiero por proyecto
CREATE VIEW project_financial_status AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    p.total_budget,
    COALESCE(SUM(CASE WHEN i.status != 'cancelled' THEN i.total_amount ELSE 0 END), 0) as total_invoiced,
    COALESCE(SUM(cp.amount), 0) as total_received,
    COALESCE(SUM(sp.amount), 0) as total_expenses,
    (p.total_budget - COALESCE(SUM(sp.amount), 0)) as estimated_profit,
    (COALESCE(SUM(cp.amount), 0) - COALESCE(SUM(sp.amount), 0)) as actual_profit
FROM projects p
LEFT JOIN invoices i ON p.id = i.project_id
LEFT JOIN client_payments cp ON p.id = cp.project_id AND cp.status = 'confirmed'
LEFT JOIN supplier_payments sp ON p.id = sp.project_id AND sp.status = 'confirmed'
GROUP BY p.id, p.name, p.total_budget;

COMMIT;