const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ Configurada' : '❌ Faltante');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓ Configurada' : '❌ Faltante');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createIncomesTable() {
  console.log('🚀 Creando tabla incomes en Supabase...');
  
  try {
    // SQL para crear la tabla
    const createTableSQL = `
      -- Crear tabla incomes
      CREATE TABLE IF NOT EXISTS public.incomes (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
        client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
        description TEXT NOT NULL,
        amount DECIMAL(15,2) NOT NULL CHECK (amount >= 0),
        currency VARCHAR(3) DEFAULT 'MXN' NOT NULL,
        income_date DATE NOT NULL DEFAULT CURRENT_DATE,
        due_date DATE,
        payment_method VARCHAR(50),
        category VARCHAR(100),
        subcategory VARCHAR(100),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'overdue', 'cancelled')),
        invoice_number VARCHAR(100),
        tax_amount DECIMAL(15,2) DEFAULT 0,
        net_amount DECIMAL(15,2),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (createError) {
      // Si exec_sql no existe, intentamos con una consulta directa
      console.log('⚠️ Función exec_sql no disponible, intentando método alternativo...');
      
      // Intentamos crear la tabla usando una consulta SQL directa
      const { error: directError } = await supabase
        .from('_supabase_migrations')
        .select('*')
        .limit(1);
      
      if (directError) {
        console.log('📝 Necesitas ejecutar el SQL manualmente en Supabase:');
        console.log('\n--- COPIA ESTE SQL EN EL EDITOR DE SUPABASE ---');
        console.log(createTableSQL);
        
        // Agregar índices
        console.log(`
-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_incomes_project_id ON public.incomes(project_id);
CREATE INDEX IF NOT EXISTS idx_incomes_client_id ON public.incomes(client_id);
CREATE INDEX IF NOT EXISTS idx_incomes_status ON public.incomes(status);
CREATE INDEX IF NOT EXISTS idx_incomes_income_date ON public.incomes(income_date);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_incomes_updated_at
    BEFORE UPDATE ON public.incomes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY IF NOT EXISTS "Users can view all incomes" ON public.incomes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Users can insert incomes" ON public.incomes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Users can update incomes" ON public.incomes
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Users can delete incomes" ON public.incomes
  FOR DELETE USING (auth.role() = 'authenticated');
        `);
        console.log('--- FIN DEL SQL ---\n');
        
        console.log('📋 Pasos a seguir:');
        console.log('1. Ve a tu dashboard de Supabase');
        console.log('2. Abre el SQL Editor');
        console.log('3. Copia y pega todo el SQL de arriba');
        console.log('4. Ejecuta el script');
        console.log('5. Recarga tu aplicación Next.js');
        
        return;
      }
    }

    // Verificar si la tabla fue creada
    const { data: tables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'incomes');

    if (checkError) {
      console.error('❌ Error verificando la tabla:', checkError.message);
      return;
    }

    if (tables && tables.length > 0) {
      console.log('✅ Tabla incomes creada exitosamente');
      
      // Verificar que podemos hacer consultas
      const { data: testData, error: testError } = await supabase
        .from('incomes')
        .select('*')
        .limit(1);
      
      if (testError) {
        console.log('⚠️ Tabla creada pero hay problemas de permisos:', testError.message);
      } else {
        console.log('✅ Tabla incomes funcionando correctamente');
      }
    } else {
      console.log('❌ La tabla no fue creada. Ejecuta el SQL manualmente.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createIncomesTable();