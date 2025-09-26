-- =====================================================
-- SCRIPT PARA CREAR LA TABLA INCOMES
-- =====================================================

-- 1. CREAR LA TABLA INCOMES
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

-- 2. CREAR ÍNDICES PARA MEJORAR EL RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_incomes_project_id ON incomes(project_id);
CREATE INDEX IF NOT EXISTS idx_incomes_client_id ON incomes(client_id);
CREATE INDEX IF NOT EXISTS idx_incomes_status ON incomes(status);
CREATE INDEX IF NOT EXISTS idx_incomes_category ON incomes(category);
CREATE INDEX IF NOT EXISTS idx_incomes_received_date ON incomes(received_date);
CREATE INDEX IF NOT EXISTS idx_incomes_created_at ON incomes(created_at);

-- 3. CREAR FUNCIÓN PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. CREAR TRIGGER PARA ACTUALIZAR updated_at
CREATE TRIGGER update_incomes_updated_at 
    BEFORE UPDATE ON incomes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 5. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;

-- 6. CREAR POLÍTICAS DE SEGURIDAD
-- Política para ver ingresos (todos los usuarios autenticados)
CREATE POLICY "Authenticated users can view incomes" ON incomes
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política para insertar ingresos (gerencia y administrativo)
CREATE POLICY "Gerencia and administrativo can insert incomes" ON incomes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('gerencia', 'administrativo')
            AND is_active = true
        )
    );

-- Política para actualizar ingresos (gerencia y administrativo)
CREATE POLICY "Gerencia and administrativo can update incomes" ON incomes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('gerencia', 'administrativo')
            AND is_active = true
        )
    );

-- Política para eliminar ingresos (solo gerencia)
CREATE POLICY "Gerencia can delete incomes" ON incomes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'gerencia'
            AND is_active = true
        )
    );

-- 7. COMENTARIOS PARA DOCUMENTACIÓN
COMMENT ON TABLE incomes IS 'Tabla para registrar los ingresos de los proyectos';
COMMENT ON COLUMN incomes.project_id IS 'ID del proyecto al que pertenece el ingreso';
COMMENT ON COLUMN incomes.client_id IS 'ID del cliente que realizó el pago';
COMMENT ON COLUMN incomes.description IS 'Descripción del ingreso';
COMMENT ON COLUMN incomes.amount IS 'Monto del ingreso';
COMMENT ON COLUMN incomes.currency IS 'Moneda del ingreso (USD, CRC, etc.)';
COMMENT ON COLUMN incomes.category IS 'Categoría del ingreso (pago_proyecto, anticipo, etc.)';
COMMENT ON COLUMN incomes.status IS 'Estado del ingreso (pendiente, confirmado, cancelado)';
COMMENT ON COLUMN incomes.received_date IS 'Fecha del ingreso';
COMMENT ON COLUMN incomes.reference IS 'Número de referencia o comprobante';
COMMENT ON COLUMN incomes.notes IS 'Notas adicionales sobre el ingreso';

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que la tabla se creó correctamente
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'incomes' 
ORDER BY ordinal_position;

-- Verificar que los índices se crearon
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'incomes';

-- Verificar que las políticas se crearon
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'incomes';