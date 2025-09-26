/**
 * Script para agregar columnas de comprobante de referencia a la tabla expenses
 * Ejecutar con: node add-reference-columns-manual.js
 * 
 * Asegúrate de tener las variables de entorno configuradas:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (clave de servicio, no la pública)
 */

require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Variables de entorno faltantes');
  console.log('Asegúrate de tener configuradas:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const SQL_SCRIPT = `
-- Agregar columnas de adjunto de referencia si no existen
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS reference_attachment_url TEXT,
ADD COLUMN IF NOT EXISTS reference_attachment_name TEXT,
ADD COLUMN IF NOT EXISTS reference_attachment_type TEXT,
ADD COLUMN IF NOT EXISTS reference_attachment_size INTEGER;

-- Agregar comentarios para documentar las columnas
COMMENT ON COLUMN expenses.reference_attachment_url IS 'URL del archivo adjunto del comprobante de referencia en Supabase Storage';
COMMENT ON COLUMN expenses.reference_attachment_name IS 'Nombre original del archivo adjunto del comprobante de referencia';
COMMENT ON COLUMN expenses.reference_attachment_type IS 'Tipo MIME del archivo adjunto del comprobante de referencia';
COMMENT ON COLUMN expenses.reference_attachment_size IS 'Tamaño del archivo adjunto del comprobante de referencia en bytes';
`;

async function addReferenceColumns() {
  try {
    console.log('🔄 Agregando columnas de comprobante de referencia...');
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY
      },
      body: JSON.stringify({
        sql: SQL_SCRIPT
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('✅ Columnas agregadas exitosamente');
    
    // Verificar las columnas
    await verifyColumns();
    
  } catch (error) {
    console.error('❌ Error al agregar columnas:', error.message);
    console.log('\n📝 Instrucciones alternativas:');
    console.log('1. Ve al Dashboard de Supabase');
    console.log('2. Navega a SQL Editor');
    console.log('3. Ejecuta el archivo add-reference-attachment-columns.sql');
  }
}

async function verifyColumns() {
  try {
    console.log('\n🔍 Verificando columnas agregadas...');
    
    const verifySQL = `
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'expenses' 
        AND table_schema = 'public'
        AND column_name LIKE '%reference_attachment%'
      ORDER BY column_name;
    `;

    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY
      },
      body: JSON.stringify({
        sql: verifySQL
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('📊 Columnas encontradas:', result);
    }
    
  } catch (error) {
    console.log('⚠️  No se pudo verificar automáticamente las columnas');
  }
}

// Ejecutar el script
addReferenceColumns();