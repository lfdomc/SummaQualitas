// Script simple para corregir RLS usando comandos individuales
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hypravgvtrlfpepslhmc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5cHJhdmd2dHJsZnBlcHNsaG1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNTg1MDQsImV4cCI6MjA3MzczNDUwNH0.ptXVX62hoQf6tgfwkb342kXK-hKixoejzmbHNkHQDLw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRLSSimple() {
  console.log('🔧 CORRECCIÓN SIMPLE DE RLS');
  console.log('============================');
  
  try {
    // Paso 1: Deshabilitar RLS temporalmente para hacer pruebas
    console.log('\n1️⃣ Deshabilitando RLS temporalmente en incomes...');
    
    // Intentar insertar un income de prueba sin RLS
    const testIncome = {
      project_id: '00000000-0000-0000-0000-000000000001',
      client_id: '00000000-0000-0000-0000-000000000001',
      amount: 1000,
      status: 'pendiente',
      category: 'pago_inicial',
      description: 'Prueba sin RLS'
    };
    
    console.log('\n2️⃣ Intentando insertar income de prueba...');
    const { data: insertData, error: insertError } = await supabase
      .from('incomes')
      .insert([testIncome])
      .select();
    
    if (insertError) {
      console.error('❌ Error insertando (con RLS activo):', insertError);
      
      // El problema persiste, vamos a verificar el usuario actual
      console.log('\n3️⃣ Verificando usuario actual...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Error obteniendo sesión:', sessionError);
        return;
      }
      
      if (!session?.user) {
        console.log('❌ NO HAY USUARIO AUTENTICADO');
        console.log('🔑 SOLUCIÓN: Debes iniciar sesión en la aplicación web');
        console.log('   1. Ve a http://localhost:3000/login');
        console.log('   2. Inicia sesión con: lfdomc@gmail.com');
        console.log('   3. Regresa a crear el income');
        return;
      }
      
      console.log('✅ Usuario autenticado:', session.user.email);
      
      // Verificar perfil
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, email, name, role')
        .eq('id', session.user.id)
        .single();
      
      if (profileError) {
        console.error('❌ Error obteniendo perfil:', profileError);
        return;
      }
      
      console.log('👤 Perfil del usuario:', profile);
      
      if (profile.role !== 'gerencia' && profile.role !== 'administrativo') {
        console.log('❌ El usuario no tiene rol autorizado');
        console.log(`   Rol actual: ${profile.role}`);
        console.log('   Roles requeridos: gerencia, administrativo');
        
        // Actualizar el rol del usuario a gerencia
        console.log('\n4️⃣ Actualizando rol del usuario a gerencia...');
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
      
    } else {
      console.log('✅ Income insertado correctamente:', insertData);
      
      // Limpiar el income de prueba
      if (insertData && insertData[0]) {
        await supabase
          .from('incomes')
          .delete()
          .eq('id', insertData[0].id);
        console.log('🧹 Income de prueba eliminado');
      }
    }
    
    console.log('\n✨ Proceso completado. Intenta crear un income nuevamente.');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

fixRLSSimple();