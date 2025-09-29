const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkFunctions() {
  try {
    console.log('🔍 Probando funciones optimizadas...\n');

    const functions = [
      { name: 'get_dashboard_kpis', params: {} },
      { name: 'get_expenses_paginated', params: { p_limit: 5, p_offset: 0 } },
      { name: 'get_projects_with_summary', params: { p_limit: 5, p_offset: 0 } },
      { name: 'get_incomes_with_project_info', params: { p_limit: 5, p_offset: 0 } },
      { name: 'search_expenses_fulltext', params: { p_search_term: 'test', p_limit: 5, p_offset: 0 } },
      { name: 'get_expenses_by_category_period', params: { p_start_date: '2024-01-01', p_end_date: '2024-12-31' } }
    ];

    for (const func of functions) {
      console.log(`🧪 Probando ${func.name}...`);
      try {
        const { data, error } = await supabase.rpc(func.name, func.params);
        
        if (error) {
          console.error(`❌ Error en ${func.name}:`, error.message);
        } else {
          console.log(`✅ ${func.name} funciona correctamente - ${Array.isArray(data) ? data.length : 1} resultados`);
        }
      } catch (err) {
        console.error(`❌ Excepción en ${func.name}:`, err.message);
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkFunctions();