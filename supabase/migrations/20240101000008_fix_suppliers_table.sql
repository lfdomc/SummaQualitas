-- Fix suppliers table structure
-- Drop table if exists and recreate with correct structure
DROP TABLE IF EXISTS suppliers CASCADE;

-- Create suppliers table with correct structure
CREATE TABLE suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255) NOT NULL,
  email VARCHAR(255),
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- Create policies for suppliers table
CREATE POLICY "Enable read access for all users" ON suppliers
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON suppliers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON suppliers
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON suppliers
    FOR DELETE USING (auth.role() = 'authenticated');

-- Insert sample data
INSERT INTO suppliers (name, contact_person, email, phone, address, tax_id, supplier_type, status, notes) VALUES
('Constructora ABC', 'Juan Pérez', 'juan@abc.com', '+1234567890', 'Calle Principal 123', '12345678901', 'MATERIALES', 'ACTIVO', 'Proveedor principal de materiales'),
('Servicios XYZ', 'María García', 'maria@xyz.com', '+0987654321', 'Avenida Central 456', '10987654321', 'SERVICIOS', 'ACTIVO', 'Servicios de consultoría'),
('Equipos DEF', 'Carlos López', 'carlos@def.com', '+1122334455', 'Boulevard Norte 789', '11223344556', 'EQUIPOS', 'ACTIVO', 'Alquiler de maquinaria');