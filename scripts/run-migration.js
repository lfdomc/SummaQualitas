const fs = require('fs');
const path = require('path');

// Script para crear la tabla equipment_monthly_expenses

try {
  // Leer el archivo de migración
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250131000001_create_equipment_monthly_expenses.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Error: No se encontró el archivo de migración');
    console.error('Ruta esperada:', migrationPath);
    process.exit(1);
  }
  
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  // Para crear la tabla equipment_monthly_expenses:
  // 1. Ve a tu dashboard de Supabase
  // 2. Navega a SQL Editor
  // 3. Copia y pega el siguiente SQL:
  
  console.log('='.repeat(80));
  console.log(migrationSQL);
  console.log('='.repeat(80));
  
  // 4. Ejecuta el SQL
  // 5. Verifica que la tabla se creó correctamente
  // Una vez ejecutado, el error de equipment_monthly_expenses debería resolverse
  
} catch (error) {
  console.error('❌ Error leyendo el archivo de migración:', error);
}