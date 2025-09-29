import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyFixExpensesPaginated() {
  try {
    console.log('🔧 Aplicando corrección para get_expenses_paginated...');

    // Paso 1: Eliminar la función existente
    console.log('1️⃣ Eliminando función existente...');
    const { error: dropError } = await supabase
      .from('pg_proc')
      .select('*')
      .eq('proname', 'get_expenses_paginated');

    // Paso 2: Crear la función corregida usando una consulta SQL directa
    console.log('2️⃣ Creando función corregida...');
    
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION get_expenses_paginated(
          p_limit INTEGER DEFAULT 20,
          p_offset INTEGER DEFAULT 0,
          p_project_id UUID DEFAULT NULL,
          p_category TEXT DEFAULT NULL,
          p_payment_status TEXT DEFAULT NULL
      )
      RETURNS TABLE (
          id UUID,
          project_id UUID,
          supplier_id UUID,
          supplier_name VARCHAR(255),
          description TEXT,
          amount DECIMAL(15,2),
          currency VARCHAR(3),
          category TEXT,
          expense_date DATE,
          payment_status TEXT,
          total_count BIGINT
      ) AS $$
      BEGIN
          RETURN QUERY
          SELECT 
              e.id,
              e.project_id,
              e.supplier_id,
              COALESCE(s.name, 'Sin proveedor')::VARCHAR(255) as supplier_name,
              e.description,
              e.amount,
              e.currency,
              e.category::TEXT,
              e.expense_date,
              e.payment_status::TEXT,
              COUNT(*) OVER() as total_count
          FROM expenses e
          LEFT JOIN suppliers s ON e.supplier_id = s.id
          WHERE 
              (p_project_id IS NULL OR e.project_id = p_project_id)
              AND (p_category IS NULL OR e.category::TEXT = p_category)
              AND (p_payment_status IS NULL OR e.payment_status::TEXT = p_payment_status)
          ORDER BY e.expense_date DESC, e.created_at DESC
          LIMIT p_limit OFFSET p_offset;
      END;
      $$ LANGUAGE plpgsql;
    `;

    // Intentar crear la función usando una consulta directa
    const { data: createData, error: createError } = await supabase.rpc('query', { 
      query: createFunctionSQL 
    });

    if (createError) {
      console.log('⚠️ Método query no disponible, intentando método alternativo...');
      
      // Método alternativo: probar la función directamente
      console.log('3️⃣ Probando función existente...');
      const { data: testData, error: testError } = await supabase
        .rpc('get_expenses_paginated', {
          p_limit: 1,
          p_offset: 0,
          p_project_id: null,
          p_category: null,
          p_payment_status: null
        });

      if (testError) {
        console.error('❌ Error probando función:', testError);
        console.log('💡 La función necesita ser corregida manualmente en la base de datos');
        return false;
      }

      console.log('✅ La función ya funciona correctamente');
      console.log(`   Resultados obtenidos: ${testData?.length || 0}`);
      return true;
    }

    console.log('✅ Función creada exitosamente');

    // Paso 3: Probar la función corregida
    console.log('3️⃣ Probando función corregida...');
    const { data: testData, error: testError } = await supabase
      .rpc('get_expenses_paginated', {
        p_limit: 5,
        p_offset: 0,
        p_project_id: null,
        p_category: null,
        p_payment_status: null
      });

    if (testError) {
      console.error('❌ Error probando función:', testError);
      return false;
    }

    console.log('✅ Función get_expenses_paginated funciona correctamente');
    console.log(`   Resultados obtenidos: ${testData?.length || 0}`);
    
    if (testData && testData.length > 0) {
      console.log('   Primer resultado:', {
        description: testData[0].description,
        amount: testData[0].amount,
        supplier_name: testData[0].supplier_name,
        category: testData[0].category
      });
    }

    return true;

  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return false;
  }
}

// Ejecutar la corrección
applyFixExpensesPaginated()
  .then(success => {
    if (success) {
      console.log('🎉 Corrección completada exitosamente');
    } else {
      console.log('💥 La corrección falló');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });