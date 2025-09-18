require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDuplicateProfiles() {
  console.log('🔍 VERIFICANDO REGISTROS DUPLICADOS EN USER_PROFILES');
  console.log('==================================================');
  
  try {
    // Obtener todos los perfiles
    console.log('\n📋 Obteniendo todos los perfiles...');
    const { data: allProfiles, error: allError } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at');
      
    if (allError) {
      console.log('❌ Error obteniendo perfiles:', allError.message);
      return;
    }
    
    console.log(`✅ Total de perfiles encontrados: ${allProfiles?.length || 0}`);
    
    if (!allProfiles || allProfiles.length === 0) {
      console.log('ℹ️  No hay perfiles en la base de datos');
      return;
    }
    
    // Verificar duplicados por ID
    const idCounts = {};
    const emailCounts = {};
    
    allProfiles.forEach(profile => {
      // Contar por ID
      idCounts[profile.id] = (idCounts[profile.id] || 0) + 1;
      
      // Contar por email si existe
      if (profile.email) {
        emailCounts[profile.email] = (emailCounts[profile.email] || 0) + 1;
      }
    });
    
    // Buscar IDs duplicados
    const duplicateIds = Object.entries(idCounts)
      .filter(([id, count]) => count > 1)
      .map(([id, count]) => ({ id, count }));
      
    // Buscar emails duplicados
    const duplicateEmails = Object.entries(emailCounts)
      .filter(([email, count]) => count > 1)
      .map(([email, count]) => ({ email, count }));
    
    console.log('\n🔍 RESULTADOS DE LA VERIFICACIÓN:');
    console.log('================================');
    
    if (duplicateIds.length > 0) {
      console.log('\n❌ REGISTROS DUPLICADOS POR ID ENCONTRADOS:');
      duplicateIds.forEach(({ id, count }) => {
        console.log(`   ID: ${id} - Aparece ${count} veces`);
        
        // Mostrar detalles de los registros duplicados
        const duplicates = allProfiles.filter(p => p.id === id);
        duplicates.forEach((profile, index) => {
          console.log(`     Registro ${index + 1}:`, {
            email: profile.email,
            full_name: profile.full_name,
            role: profile.role,
            created_at: profile.created_at
          });
        });
      });
    } else {
      console.log('✅ No se encontraron registros duplicados por ID');
    }
    
    if (duplicateEmails.length > 0) {
      console.log('\n⚠️  EMAILS DUPLICADOS ENCONTRADOS:');
      duplicateEmails.forEach(({ email, count }) => {
        console.log(`   Email: ${email} - Aparece ${count} veces`);
      });
    } else {
      console.log('✅ No se encontraron emails duplicados');
    }
    
    // Intentar reproducir el error específico
    console.log('\n🧪 PROBANDO CONSULTA ESPECÍFICA QUE FALLA...');
    
    // Obtener el primer perfil para probar
    if (allProfiles.length > 0) {
      const testUserId = allProfiles[0].id;
      console.log(`Probando getUserProfile con ID: ${testUserId}`);
      
      try {
        const { data: singleProfile, error: singleError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', testUserId)
          .single();
          
        if (singleError) {
          console.log('❌ Error en consulta .single():', singleError.message);
          console.log('   Código de error:', singleError.code);
          
          // Intentar sin .single() para ver cuántos registros devuelve
          const { data: multipleProfiles, error: multipleError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', testUserId);
            
          if (!multipleError && multipleProfiles) {
            console.log(`   Sin .single() devuelve ${multipleProfiles.length} registros`);
          }
        } else {
          console.log('✅ Consulta .single() funcionó correctamente');
        }
      } catch (error) {
        console.log('❌ Error inesperado en consulta:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

checkDuplicateProfiles()
  .then(() => {
    console.log('\n✅ Verificación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });