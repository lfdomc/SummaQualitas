-- Create sumitals table for project materials, products and equipment
CREATE TABLE IF NOT EXISTS sumitals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sumital_number INTEGER NOT NULL,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    project_date DATE NOT NULL DEFAULT CURRENT_DATE,
    equipment_description TEXT NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    supplier_phone VARCHAR(50),
    country_of_origin VARCHAR(100),
    brand VARCHAR(100),
    model VARCHAR(100),
    warranty_period VARCHAR(100),
    useful_life VARCHAR(100),
    total_price DECIMAL(15,2) NOT NULL DEFAULT 0,
    maintenance TEXT,
    training TEXT,
    attached_documents JSONB DEFAULT '[]'::jsonb,
    is_approved BOOLEAN DEFAULT NULL, -- NULL = pending, true = approved, false = rejected
    observations TEXT,
    approver_name VARCHAR(255),
    review_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Ensure unique sumital number per project
    UNIQUE(project_id, sumital_number)
);

-- Create indexes for better performance
CREATE INDEX idx_sumitals_project_id ON sumitals(project_id);
CREATE INDEX idx_sumitals_sumital_number ON sumitals(sumital_number);
CREATE INDEX idx_sumitals_supplier_name ON sumitals(supplier_name);
CREATE INDEX idx_sumitals_is_approved ON sumitals(is_approved);
CREATE INDEX idx_sumitals_created_at ON sumitals(created_at);

-- Create function to auto-increment sumital number per project
CREATE OR REPLACE FUNCTION get_next_sumital_number(p_project_id UUID)
RETURNS INTEGER AS $$
DECLARE
    next_number INTEGER;
BEGIN
    SELECT COALESCE(MAX(sumital_number), 0) + 1
    INTO next_number
    FROM sumitals
    WHERE project_id = p_project_id;
    
    RETURN next_number;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-set sumital number if not provided
CREATE OR REPLACE FUNCTION set_sumital_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.sumital_number IS NULL OR NEW.sumital_number = 0 THEN
        NEW.sumital_number := get_next_sumital_number(NEW.project_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_sumital_number
    BEFORE INSERT ON sumitals
    FOR EACH ROW
    EXECUTE FUNCTION set_sumital_number();

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sumitals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sumitals_updated_at
    BEFORE UPDATE ON sumitals
    FOR EACH ROW
    EXECUTE FUNCTION update_sumitals_updated_at();

-- Enable Row Level Security
ALTER TABLE sumitals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view sumitals from their organization projects" ON sumitals
    FOR SELECT USING (
        project_id IN (
            SELECT p.id FROM projects p
            JOIN user_organizations uo ON p.organization_id = uo.organization_id
            WHERE uo.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert sumitals for their organization projects" ON sumitals
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT p.id FROM projects p
            JOIN user_organizations uo ON p.organization_id = uo.organization_id
            WHERE uo.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update sumitals from their organization projects" ON sumitals
    FOR UPDATE USING (
        project_id IN (
            SELECT p.id FROM projects p
            JOIN user_organizations uo ON p.organization_id = uo.organization_id
            WHERE uo.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete sumitals from their organization projects" ON sumitals
    FOR DELETE USING (
        project_id IN (
            SELECT p.id FROM projects p
            JOIN user_organizations uo ON p.organization_id = uo.organization_id
            WHERE uo.user_id = auth.uid()
        )
    );

-- Grant permissions
GRANT ALL ON sumitals TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;