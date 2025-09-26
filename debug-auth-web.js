// Script para verificar autenticación desde el contexto web
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hypravgvtrlfpepslhmc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5cHJhdmd2dHJsZnBlcHNsaG1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNTg1MDQsImV4cCI6MjA3MzczNDUwNH0.ptXVX62hoQf6tgfwkb342kXK-hKixoejzmbHNkHQDLw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAuthWeb() {
  console.log('🔍 DIAGNÓSTICO DE AUTENTICACIÓN WEB');
  console.log('=====================================');
  
  try {
    // 1. Verificar sesión actual
    console.log('\n1️⃣ Verificando sesión actual...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Error obteniendo sesión:', sessionError);
      return;
    }
    
    if (!session?.user) {
      console.log('❌ NO HAY USUARIO AUTENTICADO');
      console.log('📝 Necesitas iniciar sesión en la aplicación web');
      
      // Verificar si hay usuarios en la base de datos
      console.log('\n2️⃣ Verificando usuarios existentes...');
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, name, role')
        .limit(10);
        
      if (usersError) {
        console.error('❌ Error obteniendo usuarios:', usersError);
      } else {
        console.log(`✅ Usuarios encontrados: ${users?.length || 0}`);
        if (users && users.length > 0) {
          console.log('\n👥 USUARIOS DISPONIBLES:');
          users.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.email} - Rol: ${user.role}`);
          });
          console.log('\n💡 Puedes usar cualquiera de estos usuarios para iniciar sesión');
        } else {
          console.log('❌ No hay usuarios registrados en la base de datos');
        }
      }
      return;
    }
    
    console.log('✅ Usuario autenticado:', session.user.email);
    console.log('🆔 User ID:', session.user.id);
    
    // 2. Verificar perfil del usuario
    console.log('\n2️⃣ Verificando perfil del usuario...');
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('id', session.user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Error obteniendo perfil:', profileError);
      console.log('⚠️  El usuario autenticado no tiene perfil en la tabla users');
      return;
    }
    
    console.log('✅ Perfil encontrado:', profile);
    
    // 3. Verificar función get_user_role()
    console.log('\n3️⃣ Verificando función get_user_role()...');
    const { data: roleData, error: roleError } = await supabase
      .rpc('get_user_role');
    
    if (roleError) {
      console.error('❌ Error ejecutando get_user_role():', roleError);
    } else {
      console.log('✅ Resultado de get_user_role():', roleData);
    }
    
    // 4. Verificar políticas RLS para incomes
    console.log('\n4️⃣ Verificando permisos para insertar incomes...');
    
    if (profile.role === 'gerencia' || profile.role === 'administrativo') {
      console.log('✅ El usuario tiene rol autorizado para insertar incomes');
      
      // Intentar una inserción de prueba
      console.log('\n5️⃣ Probando inserción de income...');
      const testIncome = {
        project_id: '00000000-0000-0000-0000-000000000001', // ID de prueba
        client_id: '00000000-0000-0000-0000-000000000001',   // ID de prueba
        amount: 1000,
        status: 'pendiente',
        category: 'pago_inicial',
        description: 'Prueba de inserción'
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('incomes')
        .insert([testIncome])
        .select();
      
      if (insertError) {
        console.error('❌ Error insertando income de prueba:', insertError);
        console.log('🔍 Detalles del error:', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        });
      } else {
        console.log('✅ Income de prueba insertado correctamente:', insertData);
        
        // Limpiar el income de prueba
        if (insertData && insertData[0]) {
          await supabase
            .from('incomes')
            .delete()
            .eq('id', insertData[0].id);
          console.log('🧹 Income de prueba eliminado');
        }
      }
    } else {
      console.log('❌ El usuario NO tiene rol autorizado para insertar incomes');
      console.log(`   Rol actual: ${profile.role}`);
      console.log('   Roles requeridos: gerencia, administrativo');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

debugAuthWeb();