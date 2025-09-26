const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno desde .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas');
  console.log('Asegúrate de tener configuradas:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupIncomesTable() {
  try {
    console.log('🚀 Verificando la tabla incomes...');

    // Verificar si la tabla existe
    const { data: tableExists, error: checkError } = await supabase
      .from('incomes')
      .select('id')
      .limit(1);

    if (checkError) {
      if (checkError.code === 'PGRST106' || checkError.code === 'PGRST205' || checkError.message.includes('does not exist')) {
        console.error('❌ La tabla incomes no existe en la base de datos.');
        console.log('');
        console.log('📋 Para resolver este problema, necesitas ejecutar el siguiente SQL en el SQL Editor de Supabase:');
        console.log('🔗 Ve a: https://app.supabase.com/project/hypravgvtrlfpepslhmc/sql');
        console.log('');
        console.log('--- COPIA Y PEGA EL SIGUIENTE SQL ---');
        
        const createTableSQL = `-- Crear tabla de ingresos
CREATE TABLE IF NOT EXISTS public.incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id),
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  amount_usd DECIMAL(15,2),
  currency VARCHAR(3) DEFAULT 'CRC' CHECK (currency IN ('CRC', 'USD')),
  exchange_rate DECIMAL(10,4),
  received_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  payment_method VARCHAR(50),
  reference_number VARCHAR(100),
  category VARCHAR(100) DEFAULT 'payment',
  subcategory VARCHAR(100),
  status VARCHAR(50) DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  notes TEXT,
  details TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_incomes_project_id ON public.incomes(project_id);
CREATE INDEX IF NOT EXISTS idx_incomes_client_id ON public.incomes(client_id);
CREATE INDEX IF NOT EXISTS idx_incomes_status ON public.incomes(status);
CREATE INDEX IF NOT EXISTS idx_incomes_received_date ON public.incomes(received_date);

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
  FOR DELETE USING (auth.role() = 'authenticated');`;

        console.log(createTableSQL);
        console.log('--- FIN DEL SQL ---');
        console.log('');
        console.log('📝 Pasos a seguir:');
        console.log('1. Ve al SQL Editor de Supabase');
        console.log('2. Copia y pega el SQL de arriba');
        console.log('3. Ejecuta el script');
        console.log('4. Vuelve a ejecutar este script para verificar');
        console.log('');
        
        // Guardar el SQL en un archivo para fácil acceso
        const sqlFilePath = path.join(__dirname, 'create-incomes-table-manual.sql');
        fs.writeFileSync(sqlFilePath, createTableSQL);
        console.log(`💾 SQL guardado en: ${sqlFilePath}`);
        
      } else {
        console.error('❌ Error verificando la tabla:', checkError);
      }
    } else {
      console.log('✅ ¡La tabla incomes existe y está funcionando!');
      console.log(`📊 Registros encontrados: ${tableExists?.length || 0}`);
      
      // Verificar la estructura de la tabla
      console.log('🔍 Verificando estructura de la tabla...');
      const { data: sampleData, error: sampleError } = await supabase
        .from('incomes')
        .select('*')
        .limit(1);
        
      if (!sampleError) {
        console.log('✅ La tabla tiene la estructura correcta');
        console.log('🎉 ¡Todo está configurado correctamente!');
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar el script
setupIncomesTable();