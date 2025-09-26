// Script para aplicar la corrección de RLS de forma definitiva
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://hypravgvtrlfpepslhmc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5cHJhdmd2dHJsZnBlcHNsaG1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNTg1MDQsImV4cCI6MjA3MzczNDUwNH0.ptXVX62hoQf6tgfwkb342kXK-hKixoejzmbHNkHQDLw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyRLSFix() {
  console.log('🔧 APLICANDO CORRECCIÓN DEFINITIVA DE RLS');
  console.log('==========================================');
  
  try {
    // Leer el archivo SQL
    console.log('\n📖 Leyendo script de corrección...');
    const sqlScript = readFileSync('./fix-rls-definitivo.sql', 'utf8');
    
    // Dividir el script en comandos individuales
    const commands = sqlScript
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`✅ Script leído. ${commands.length} comandos a ejecutar.`);
    
    // Ejecutar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      if (command.includes('SELECT ') && command.includes('status')) {
        // Comando de confirmación final
        console.log(`\n${i + 1}/${commands.length} Ejecutando confirmación...`);
        const { data, error } = await supabase.rpc('sql', { query: command });
        
        if (error) {
          console.error(`❌ Error en confirmación:`, error);
        } else {
          console.log(`✅ ${data?.[0]?.status || 'Confirmación ejecutada'}`);
        }
      } else if (command.includes('CREATE OR REPLACE FUNCTION')) {
        // Función
        const functionName = command.match(/FUNCTION\s+(\w+)/)?.[1] || 'función';
        console.log(`\n${i + 1}/${commands.length} Creando función ${functionName}...`);
        
        const { error } = await supabase.rpc('sql', { query: command });
        
        if (error) {
          console.error(`❌ Error creando función ${functionName}:`, error);
        } else {
          console.log(`✅ Función ${functionName} creada correctamente`);
        }
      } else if (command.includes('DROP POLICY')) {
        // Eliminar política
        const policyMatch = command.match(/DROP POLICY IF EXISTS "([^"]+)"/);
        const policyName = policyMatch?.[1] || 'política';
        console.log(`\n${i + 1}/${commands.length} Eliminando política "${policyName}"...`);
        
        const { error } = await supabase.rpc('sql', { query: command });
        
        if (error && !error.message.includes('does not exist')) {
          console.error(`❌ Error eliminando política "${policyName}":`, error);
        } else {
          console.log(`✅ Política "${policyName}" eliminada`);
        }
      } else if (command.includes('CREATE POLICY')) {
        // Crear política
        const policyMatch = command.match(/CREATE POLICY "([^"]+)"/);
        const policyName = policyMatch?.[1] || 'política';
        console.log(`\n${i + 1}/${commands.length} Creando política "${policyName}"...`);
        
        const { error } = await supabase.rpc('sql', { query: command });
        
        if (error) {
          console.error(`❌ Error creando política "${policyName}":`, error);
        } else {
          console.log(`✅ Política "${policyName}" creada correctamente`);
        }
      } else if (command.includes('ALTER TABLE')) {
        // Alterar tabla
        console.log(`\n${i + 1}/${commands.length} Habilitando RLS en tabla incomes...`);
        
        const { error } = await supabase.rpc('sql', { query: command });
        
        if (error) {
          console.error(`❌ Error habilitando RLS:`, error);
        } else {
          console.log(`✅ RLS habilitado en tabla incomes`);
        }
      }
    }
    
    console.log('\n🎉 CORRECCIÓN APLICADA EXITOSAMENTE');
    console.log('===================================');
    
    // Probar la función corregida
    console.log('\n🧪 Probando función get_user_role()...');
    const { data: roleTest, error: roleError } = await supabase.rpc('test_current_user_role');
    
    if (roleError) {
      console.error('❌ Error probando función:', roleError);
    } else {
      console.log('✅ Función funcionando:', roleTest);
    }
    
    console.log('\n✨ La corrección se ha aplicado correctamente.');
    console.log('   Ahora deberías poder crear incomes sin problemas de RLS.');
    
  } catch (error) {
    console.error('❌ Error general aplicando corrección:', error);
  }
}

applyRLSFix();