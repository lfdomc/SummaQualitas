const fs = require('fs');
const path = require('path');

console.log('🔧 Script para crear la tabla equipment_monthly_expenses');
console.log('');

try {
  // Leer el archivo de migración
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250131000001_create_equipment_monthly_expenses.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Error: No se encontró el archivo de migración');
    console.error('Ruta esperada:', migrationPath);
    process.exit(1);
  }
  
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  console.log('📋 Para crear la tabla equipment_monthly_expenses:');
  console.log('');
  console.log('1. Ve a tu dashboard de Supabase');
  console.log('2. Navega a SQL Editor');
  console.log('3. Copia y pega el siguiente SQL:');
  console.log('');
  console.log('='.repeat(80));
  console.log(migrationSQL);
  console.log('='.repeat(80));
  console.log('');
  console.log('4. Ejecuta el SQL');
  console.log('5. Verifica que la tabla se creó correctamente');
  console.log('');
  console.log('✅ Una vez ejecutado, el error de equipment_monthly_expenses debería resolverse');
  
} catch (error) {
  console.error('❌ Error leyendo el archivo de migración:', error);
}