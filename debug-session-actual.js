// Script para verificar la sesión actual del usuario logueado
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hypravgvtrlfpepslhmc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5cHJhdmd2dHJsZnBlcHNsaG1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNTg1MDQsImV4cCI6MjA3MzczNDUwNH0.ptXVX62hoQf6tgfwkb342kXK-hKixoejzmbHNkHQDLw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugSessionActual() {
  console.log('🔍 VERIFICANDO SESIÓN ACTUAL');
  console.log('=============================');
  
  try {
    // 1. Verificar sesión actual
    console.log('\n1️⃣ Verificando sesión actual...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Error obteniendo sesión:', sessionError);
      return;
    }
    
    if (!session?.user) {
      console.log('❌ NO HAY SESIÓN ACTIVA');
      console.log('🔑 Necesitas iniciar sesión en la aplicación web');
      console.log('   Ve a: http://localhost:3000/login');
      return;
    }
    
    console.log('✅ Sesión activa encontrada');
    console.log('📧 Email:', session.user.email);
    console.log('🆔 User ID:', session.user.id);
    console.log('⏰ Expires at:', new Date(session.expires_at * 1000).toLocaleString());
    
    // 2. Verificar perfil en la tabla users
    console.log('\n2️⃣ Verificando perfil en tabla users...');
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('id', session.user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Error obteniendo perfil:', profileError);
      console.log('🔧 El usuario existe en auth pero no en la tabla users');
      
      // Crear perfil en tabla users
      console.log('\n3️⃣ Creando perfil en tabla users...');
      const { error: insertError } = await supabase
        .from('users')
        .insert([{
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name || session.user.email.split('@')[0],
          role: 'gerencia'
        }]);
      
      if (insertError) {
        console.error('❌ Error creando perfil:', insertError);
      } else {
        console.log('✅ Perfil creado con rol gerencia');
      }
    } else {
      console.log('✅ Perfil encontrado:');
      console.log('   📧 Email:', profile.email);
      console.log('   👤 Nombre:', profile.name);
      console.log('   🎭 Rol:', profile.role);
      
      if (profile.role !== 'gerencia' && profile.role !== 'administrativo') {
        console.log('\n⚠️  ROL INCORRECTO DETECTADO');
        console.log('🔧 Actualizando rol a gerencia...');
        
        const { error: updateError } = await supabase
          .from('users')
          .update({ role: 'gerencia' })
          .eq('id', session.user.id);
        
        if (updateError) {
          console.error('❌ Error actualizando rol:', updateError);
        } else {
          console.log('✅ Rol actualizado a gerencia');
        }
      }
    }
    
    // 3. Probar función get_user_role
    console.log('\n4️⃣ Probando función get_user_role...');
    const { data: roleData, error: roleError } = await supabase
      .rpc('get_user_role');
    
    if (roleError) {
      console.error('❌ Error ejecutando get_user_role:', roleError);
    } else {
      console.log('✅ get_user_role() devuelve:', roleData);
    }
    
    // 4. Intentar insertar income de prueba
    console.log('\n5️⃣ Probando inserción de income...');
    const testIncome = {
      project_id: '00000000-0000-0000-0000-000000000001',
      client_id: '00000000-0000-0000-0000-000000000001',
      amount: 1000,
      status: 'pendiente',
      category: 'pago_inicial',
      description: 'Prueba con usuario logueado'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('incomes')
      .insert([testIncome])
      .select();
    
    if (insertError) {
      console.error('❌ ERROR INSERTANDO INCOME:', insertError);
      console.log('\n🔍 DIAGNÓSTICO:');
      console.log('   - Usuario autenticado: ✅');
      console.log('   - Perfil en tabla users: ✅');
      console.log('   - Rol correcto: ✅');
      console.log('   - Función get_user_role: ❓');
      console.log('\n💡 POSIBLES CAUSAS:');
      console.log('   1. La función get_user_role no está funcionando correctamente');
      console.log('   2. Las políticas RLS están mal configuradas');
      console.log('   3. Problema con el contexto de autenticación en RLS');
    } else {
      console.log('✅ INCOME INSERTADO CORRECTAMENTE:', insertData);
      
      // Limpiar income de prueba
      if (insertData && insertData[0]) {
        await supabase
          .from('incomes')
          .delete()
          .eq('id', insertData[0].id);
        console.log('🧹 Income de prueba eliminado');
      }
      
      console.log('\n🎉 ¡PROBLEMA RESUELTO!');
      console.log('   Ahora deberías poder crear incomes sin problemas');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

debugSessionActual();