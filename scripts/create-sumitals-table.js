const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSumitalsTable() {
  try {
    console.log('Creating sumitals table...');
    
    // Create the table
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
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
            is_approved BOOLEAN DEFAULT NULL,
            observations TEXT,
            approver_name VARCHAR(255),
            review_date DATE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_by UUID REFERENCES auth.users(id),
            updated_by UUID REFERENCES auth.users(id),
            
            UNIQUE(project_id, sumital_number)
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_sumitals_project_id ON sumitals(project_id);
        CREATE INDEX IF NOT EXISTS idx_sumitals_sumital_number ON sumitals(sumital_number);
        CREATE INDEX IF NOT EXISTS idx_sumitals_supplier_name ON sumitals(supplier_name);
        CREATE INDEX IF NOT EXISTS idx_sumitals_is_approved ON sumitals(is_approved);
        CREATE INDEX IF NOT EXISTS idx_sumitals_created_at ON sumitals(created_at);

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

        -- Create trigger function for auto-incrementing sumital number
        CREATE OR REPLACE FUNCTION set_sumital_number()
        RETURNS TRIGGER AS $$
        BEGIN
            IF NEW.sumital_number IS NULL OR NEW.sumital_number = 0 THEN
                NEW.sumital_number := get_next_sumital_number(NEW.project_id);
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        -- Create trigger for auto-incrementing sumital number
        DROP TRIGGER IF EXISTS trigger_set_sumital_number ON sumitals;
        CREATE TRIGGER trigger_set_sumital_number
            BEFORE INSERT ON sumitals
            FOR EACH ROW
            EXECUTE FUNCTION set_sumital_number();

        -- Create trigger function for updated_at
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        -- Create trigger for updated_at
        DROP TRIGGER IF EXISTS trigger_update_sumitals_updated_at ON sumitals;
        CREATE TRIGGER trigger_update_sumitals_updated_at
            BEFORE UPDATE ON sumitals
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();

        -- Enable Row Level Security
        ALTER TABLE sumitals ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies
        DROP POLICY IF EXISTS "Users can view sumitals for their accessible projects" ON sumitals;
        CREATE POLICY "Users can view sumitals for their accessible projects" ON sumitals
            FOR SELECT USING (
                project_id IN (
                    SELECT p.id FROM projects p
                    LEFT JOIN project_members pm ON p.id = pm.project_id
                    WHERE p.created_by = auth.uid()
                    OR pm.user_id = auth.uid()
                    OR EXISTS (
                        SELECT 1 FROM profiles pr
                        WHERE pr.id = auth.uid()
                        AND pr.role IN ('gerencia', 'administrativo')
                    )
                )
            );

        DROP POLICY IF EXISTS "Users can insert sumitals for their accessible projects" ON sumitals;
        CREATE POLICY "Users can insert sumitals for their accessible projects" ON sumitals
            FOR INSERT WITH CHECK (
                project_id IN (
                    SELECT p.id FROM projects p
                    LEFT JOIN project_members pm ON p.id = pm.project_id
                    WHERE p.created_by = auth.uid()
                    OR pm.user_id = auth.uid()
                    OR EXISTS (
                        SELECT 1 FROM profiles pr
                        WHERE pr.id = auth.uid()
                        AND pr.role IN ('gerencia', 'administrativo')
                    )
                )
            );

        DROP POLICY IF EXISTS "Users can update sumitals for their accessible projects" ON sumitals;
        CREATE POLICY "Users can update sumitals for their accessible projects" ON sumitals
            FOR UPDATE USING (
                project_id IN (
                    SELECT p.id FROM projects p
                    LEFT JOIN project_members pm ON p.id = pm.project_id
                    WHERE p.created_by = auth.uid()
                    OR pm.user_id = auth.uid()
                    OR EXISTS (
                        SELECT 1 FROM profiles pr
                        WHERE pr.id = auth.uid()
                        AND pr.role IN ('gerencia', 'administrativo')
                    )
                )
            );

        DROP POLICY IF EXISTS "Users can delete sumitals for their accessible projects" ON sumitals;
        CREATE POLICY "Users can delete sumitals for their accessible projects" ON sumitals
            FOR DELETE USING (
                project_id IN (
                    SELECT p.id FROM projects p
                    LEFT JOIN project_members pm ON p.id = pm.project_id
                    WHERE p.created_by = auth.uid()
                    OR pm.user_id = auth.uid()
                    OR EXISTS (
                        SELECT 1 FROM profiles pr
                        WHERE pr.id = auth.uid()
                        AND pr.role IN ('gerencia', 'administrativo')
                    )
                )
            );
      `
    });

    if (tableError) {
      console.error('Error creating sumitals table:', tableError);
      return;
    }

    console.log('✅ Sumitals table created successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createSumitalsTable();