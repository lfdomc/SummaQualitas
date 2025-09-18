require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkDatabaseStructure() {
  console.log('🔍 VERIFICANDO ESTRUCTURA DE BASE DE DATOS');
  console.log('==========================================');
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Variables de entorno faltantes:');
      console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
      console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseKey);
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('\n1. Verificando tabla projects...');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, created_by, manager_id')
      .limit(1);
    
    if (projectsError) {
      console.error('❌ Error en tabla projects:', projectsError.message);
    } else {
      console.log('✅ Tabla projects existe');
      console.log('   Columnas encontradas:', Object.keys(projects[0] || {}));
    }
    
    console.log('\n2. Verificando tabla user_profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, email, role')
      .limit(1);
    
    if (profilesError) {
      console.error('❌ Error en tabla user_profiles:', profilesError.message);
    } else {
      console.log('✅ Tabla user_profiles existe');
      console.log('   Columnas encontradas:', Object.keys(profiles[0] || {}));
    }
    
    console.log('\n3. Probando consulta con JOIN...');
    const { data: joinData, error: joinError } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        created_by,
        user_profiles!projects_created_by_fkey(id, email, role)
      `)
      .limit(1);
    
    if (joinError) {
      console.error('❌ Error en JOIN con foreign key específica:', joinError.message);
      
      // Intentar JOIN alternativo
      console.log('\n4. Probando JOIN alternativo...');
      const { data: altJoinData, error: altJoinError } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          created_by,
          user_profiles!inner(id, email, role)
        `)
        .eq('user_profiles.id', 'projects.created_by')
        .limit(1);
      
      if (altJoinError) {
        console.error('❌ Error en JOIN alternativo:', altJoinError.message);
      } else {
        console.log('✅ JOIN alternativo funciona');
      }
    } else {
      console.log('✅ JOIN con foreign key funciona');
    }
    
    console.log('\n5. Verificando foreign keys en la base de datos...');
    const { data: fkData, error: fkError } = await supabase
      .rpc('get_foreign_keys', { table_name: 'projects' })
      .single();
    
    if (fkError) {
      console.log('ℹ️  No se pudo obtener información de foreign keys (función personalizada no existe)');
    } else {
      console.log('✅ Foreign keys encontradas:', fkData);
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

checkDatabaseStructure();