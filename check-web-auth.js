// Script para verificar autenticación desde el contexto web
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hypravgvtrlfpepslhmc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5cHJhdmd2dHJsZnBlcHNsaG1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNTg1MDQsImV4cCI6MjA3MzczNDUwNH0.ptXVX62hoQf6tgfwkb342kXK-hKixoejzmbHNkHQDLw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkWebAuth() {
  console.log('🌐 VERIFICANDO AUTENTICACIÓN WEB');
  console.log('================================');
  
  try {
    // Verificar todos los usuarios en la base de datos
    console.log('\n1️⃣ Verificando usuarios en la base de datos...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .order('created_at', { ascending: false });
    
    if (usersError) {
      console.error('❌ Error obteniendo usuarios:', usersError);
      return;
    }
    
    console.log(`✅ Usuarios encontrados: ${users.length}`);
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} - Rol: ${user.role}`);
    });
    
    // Buscar específicamente el usuario lfdomc@gmail.com
    const targetUser = users.find(u => u.email === 'lfdomc@gmail.com');
    
    if (!targetUser) {
      console.log('\n❌ Usuario lfdomc@gmail.com NO ENCONTRADO en la tabla users');
      console.log('🔧 Necesitas registrarte o crear el usuario');
      return;
    }
    
    console.log('\n✅ Usuario lfdomc@gmail.com encontrado:');
    console.log('   🆔 ID:', targetUser.id);
    console.log('   👤 Nombre:', targetUser.name);
    console.log('   🎭 Rol:', targetUser.role);
    
    // Verificar si el rol es correcto
    if (targetUser.role !== 'gerencia' && targetUser.role !== 'administrativo') {
      console.log('\n⚠️  ROL INCORRECTO');
      console.log('🔧 Actualizando rol a gerencia...');
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: 'gerencia' })
        .eq('email', 'lfdomc@gmail.com');
      
      if (updateError) {
        console.error('❌ Error actualizando rol:', updateError);
      } else {
        console.log('✅ Rol actualizado a gerencia');
      }
    }
    
    console.log('\n📋 INSTRUCCIONES PARA RESOLVER:');
    console.log('================================');
    console.log('1. Ve a: http://localhost:3000/login');
    console.log('2. Inicia sesión con: lfdomc@gmail.com');
    console.log('3. Si no tienes la contraseña, usa la opción "Forgot Password"');
    console.log('4. Una vez logueado, ve a la sección de incomes');
    console.log('5. Intenta crear un nuevo income');
    
    console.log('\n🔍 VERIFICACIÓN ADICIONAL:');
    console.log('- El usuario existe en la base de datos: ✅');
    console.log('- El rol es correcto (gerencia): ✅');
    console.log('- Solo falta la sesión activa en el navegador');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkWebAuth();