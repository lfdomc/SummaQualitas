// Cargar variables de entorno desde .env.local
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addProjectColumns() {
  console.log('🔧 Agregando columnas a la tabla projects...');
  
  try {
    console.log('📋 Instrucciones para agregar las columnas manualmente:');
    console.log('');
    console.log('1. Ve al SQL Editor de Supabase:');
    console.log('   https://app.supabase.com/project/hypravgvtrlfpepslhmc/sql/new');
    console.log('');
    console.log('2. Copia y pega este SQL:');
    console.log('');
    console.log('-- Agregar columnas básicas');
    console.log('ALTER TABLE public.projects');
    console.log('ADD COLUMN IF NOT EXISTS description TEXT,');
    console.log('ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES auth.users(id),');
    console.log('ADD COLUMN IF NOT EXISTS location VARCHAR(255),');
    console.log('ADD COLUMN IF NOT EXISTS total_area DECIMAL(10,2);');
    console.log('');
    console.log('-- Agregar columnas de presupuesto');
    console.log('ALTER TABLE public.projects');
    console.log('ADD COLUMN IF NOT EXISTS presupuesto_inicial DECIMAL(15,2) DEFAULT 0,');
    console.log('ADD COLUMN IF NOT EXISTS costos_directos DECIMAL(15,2) DEFAULT 0,');
    console.log('ADD COLUMN IF NOT EXISTS costos_indirectos DECIMAL(15,2) DEFAULT 0,');
    console.log('ADD COLUMN IF NOT EXISTS mano_obra DECIMAL(15,2) DEFAULT 0,');
    console.log('ADD COLUMN IF NOT EXISTS administracion DECIMAL(15,2) DEFAULT 0,');
    console.log('ADD COLUMN IF NOT EXISTS imprevistos DECIMAL(15,2) DEFAULT 0,');
    console.log('ADD COLUMN IF NOT EXISTS utilidad DECIMAL(15,2) DEFAULT 0;');
    console.log('');
    console.log('-- Agregar columnas de fechas');
    console.log('ALTER TABLE public.projects');
    console.log('ADD COLUMN IF NOT EXISTS estimated_start_date DATE,');
    console.log('ADD COLUMN IF NOT EXISTS estimated_end_date DATE,');
    console.log('ADD COLUMN IF NOT EXISTS actual_start_date DATE,');
    console.log('ADD COLUMN IF NOT EXISTS actual_end_date DATE;');
    console.log('');
    console.log('-- Hacer client_id opcional');
    console.log('ALTER TABLE public.projects ALTER COLUMN client_id DROP NOT NULL;');
    console.log('');
    console.log('3. Haz clic en "Run" para ejecutar el SQL');
    console.log('');
    console.log('4. Después ejecuta: node check-project-columns.js');
    console.log('');

    return false;

  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

// Ejecutar la función
addProjectColumns()
  .then(success => {
    if (success) {
      console.log('🎉 ¡Columnas agregadas exitosamente!');
    } else {
      console.log('💡 Sigue las instrucciones arriba para agregar las columnas manualmente.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });