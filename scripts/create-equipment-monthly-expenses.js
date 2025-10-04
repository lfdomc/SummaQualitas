const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno desde .env.local
require('dotenv').config({ path: '.env.local' });

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno de Supabase no encontradas');
  console.error('Asegúrate de que NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY estén configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createEquipmentMonthlyExpensesTable() {
  try {
    console.log('🔧 Creando tabla equipment_monthly_expenses...');
    
    // Crear la tabla directamente
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.equipment_monthly_expenses (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
          project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
          year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
          month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
          total_days INTEGER NOT NULL DEFAULT 0 CHECK (total_days >= 0),
          daily_rate DECIMAL(10,2) NOT NULL CHECK (daily_rate >= 0),
          total_amount DECIMAL(15,2) NOT NULL CHECK (total_amount >= 0),
          notes TEXT,
          created_by UUID REFERENCES auth.users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    const { error: createError } = await supabase.rpc('exec', { sql: createTableSQL });
    
    if (createError) {
      console.error('❌ Error creando tabla:', createError);
      return;
    }
    
    console.log('✅ Tabla equipment_monthly_expenses creada exitosamente');
    
    // Verificar que la tabla se creó correctamente
    const { data: tableInfo, error: tableError } = await supabase
      .from('equipment_monthly_expenses')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Error verificando la tabla:', tableError);
    } else {
      console.log('✅ Tabla verificada correctamente');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar el script
createEquipmentMonthlyExpensesTable();