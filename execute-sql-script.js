const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQLScript() {
  console.log('🚀 Ejecutando script SQL para agregar columnas a la tabla projects...\n');
  
  try {
    // Leer el archivo SQL
    const sqlFilePath = path.join(__dirname, 'add-project-columns.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📄 Archivo SQL leído exitosamente');
    console.log('📏 Tamaño del script:', sqlContent.length, 'caracteres\n');
    
    // Dividir el script en comandos individuales (separados por ';')
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && cmd !== 'BEGIN' && cmd !== 'COMMIT');
    
    console.log('🔧 Comandos SQL a ejecutar:', commands.length);
    
    // Ejecutar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      if (command.includes('SELECT') && command.includes('information_schema.columns')) {
        // Este es el comando final para mostrar el esquema, lo ejecutamos por separado
        console.log('\n📋 Obteniendo esquema final de la tabla...');
        
        const { data, error } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable, column_default')
          .eq('table_name', 'projects')
          .eq('table_schema', 'public')
          .order('ordinal_position');
        
        if (error) {
          console.error('❌ Error al obtener esquema final:', error);
        } else {
          console.log('\n✅ Esquema final de la tabla projects:');
          console.log('================================================');
          data.forEach((col, index) => {
            const nullable = col.is_nullable === 'YES' ? ' - NULL' : ' - NOT NULL';
            const defaultVal = col.column_default ? ` (default: ${col.column_default})` : '';
            console.log(`${index + 1}. ${col.column_name} (${col.data_type})${nullable}${defaultVal}`);
          });
        }
        continue;
      }
      
      if (command.trim().length === 0) continue;
      
      console.log(`\n⚡ Ejecutando comando ${i + 1}/${commands.length}...`);
      console.log('📝 Comando:', command.substring(0, 100) + (command.length > 100 ? '...' : ''));
      
      try {
        // Para comandos DDL (ALTER TABLE, CREATE TYPE, etc.), usamos rpc
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql: command 
        }).catch(async () => {
          // Si rpc no funciona, intentar con una consulta directa para algunos comandos
          if (command.includes('ALTER TABLE') || command.includes('CREATE')) {
            throw new Error('No se puede ejecutar comando DDL sin función RPC');
          }
          return { data: null, error: null };
        });
        
        if (error) {
          console.error(`❌ Error en comando ${i + 1}:`, error);
          // Continuar con el siguiente comando en lugar de fallar completamente
        } else {
          console.log(`✅ Comando ${i + 1} ejecutado exitosamente`);
        }
      } catch (err) {
        console.error(`❌ Error al ejecutar comando ${i + 1}:`, err.message);
        // Continuar con el siguiente comando
      }
    }
    
    console.log('\n🎉 Script SQL ejecutado completamente');
    console.log('📝 Nota: Algunos comandos pueden haber fallado si las columnas ya existían');
    
  } catch (error) {
    console.error('❌ Error general al ejecutar script:', error);
  }
}

// Función alternativa para ejecutar comandos uno por uno manualmente
async function executeManualCommands() {
  console.log('\n🔧 Ejecutando comandos manualmente...\n');
  
  const commands = [
    // Columnas básicas
    "ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS description TEXT",
    "ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS manager_id UUID",
    "ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS location VARCHAR(255)",
    "ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS total_area DECIMAL(10,2)",
    
    // Columnas de presupuesto
    "ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS presupuesto_inicial DECIMAL(15,2) DEFAULT 0",
    "ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS costos_directos DECIMAL(15,2) DEFAULT 0",
    "ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS costos_indirectos DECIMAL(15,2) DEFAULT 0",
    "ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS mano_obra DECIMAL(15,2) DEFAULT 0",
    "ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS administracion DECIMAL(15,2) DEFAULT 0",
    "ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS imprevistos DECIMAL(15,2) DEFAULT 0",
    "ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS utilidad DECIMAL(15,2) DEFAULT 0",
    
    // Columnas de fechas
    "ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS estimated_start_date DATE",
    "ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS estimated_end_date DATE",
    "ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS actual_start_date DATE",
    "ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS actual_end_date DATE",
    
    // Hacer client_id opcional
    "ALTER TABLE public.projects ALTER COLUMN client_id DROP NOT NULL"
  ];
  
  for (let i = 0; i < commands.length; i++) {
    const command = commands[i];
    console.log(`⚡ Ejecutando: ${command}`);
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: command });
      
      if (error) {
        console.error(`❌ Error:`, error.message);
      } else {
        console.log(`✅ Exitoso`);
      }
    } catch (err) {
      console.error(`❌ Error:`, err.message);
    }
    
    console.log(''); // Línea en blanco
  }
}

// Ejecutar el script
console.log('🎯 Selecciona el método de ejecución:');
console.log('1. Script completo (recomendado)');
console.log('2. Comandos manuales (alternativo)\n');

// Por defecto, ejecutar comandos manuales que es más confiable
executeManualCommands().catch(console.error);