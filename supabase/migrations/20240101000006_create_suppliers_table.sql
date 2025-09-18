-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255) NOT NULL,
  email VARCHAR(255), -- Made optional
  phone VARCHAR(50),
  address TEXT,
  tax_id VARCHAR(50),
  supplier_type VARCHAR(20) NOT NULL CHECK (supplier_type IN ('MATERIALES', 'SERVICIOS', 'EQUIPOS', 'SUBCONTRATISTA')),
  status VARCHAR(10) NOT NULL DEFAULT 'ACTIVO' CHECK (status IN ('ACTIVO', 'INACTIVO')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_email ON suppliers(email);
CREATE INDEX IF NOT EXISTS idx_suppliers_type ON suppliers(supplier_type);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_created_at ON suppliers(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Users can view suppliers" ON suppliers
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Gerencia and administrativo can insert suppliers" ON suppliers
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' IN ('gerencia', 'administrativo')
    );

CREATE POLICY "Gerencia and administrativo can update suppliers" ON suppliers
    FOR UPDATE USING (
        auth.jwt() ->> 'role' IN ('gerencia', 'administrativo')
    );

CREATE POLICY "Only gerencia can delete suppliers" ON suppliers
    FOR DELETE USING (
        auth.jwt() ->> 'role' = 'gerencia'
    );

-- Insert some sample data
INSERT INTO suppliers (name, contact_person, email, phone, address, tax_id, supplier_type, status, notes) VALUES
('Ferretería Central S.A.', 'Juan Pérez', 'ventas@ferreteriacentral.com', '2234-5678', 'San José, Costa Rica', '3-101-123456', 'MATERIALES', 'ACTIVO', 'Proveedor principal de materiales de construcción'),
('Constructora del Valle', 'María González', 'info@constructoradelvalle.com', '2567-8901', 'Cartago, Costa Rica', '3-101-789012', 'SUBCONTRATISTA', 'ACTIVO', 'Especialistas en obra civil'),
('Equipos y Maquinaria S.A.', 'Carlos Rodríguez', 'alquiler@equiposymaquinaria.com', '2345-6789', 'Alajuela, Costa Rica', '3-101-345678', 'EQUIPOS', 'ACTIVO', 'Alquiler de maquinaria pesada'),
('Servicios Técnicos Profesionales', 'Ana Jiménez', 'contacto@serviciotecnico.com', '2456-7890', 'Heredia, Costa Rica', '3-101-456789', 'SERVICIOS', 'ACTIVO', 'Servicios de ingeniería y consultoría');