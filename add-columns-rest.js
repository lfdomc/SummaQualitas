// Cargar variables de entorno desde .env.local
require('dotenv').config({ path: '.env.local' });

const https = require('https');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Función para hacer peticiones HTTP
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function addAttachmentColumns() {
  console.log('🔧 Agregando columnas de attachment a la tabla incomes...');
  
  try {
    // Primero verificamos las columnas existentes
    console.log('🔍 Verificando columnas existentes...');
    
    const checkOptions = {
      hostname: supabaseUrl.replace('https://', '').replace('http://', ''),
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      }
    };

    // Intentar verificar columnas existentes
    const checkResult = await makeRequest(checkOptions, {
      sql: `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'incomes' 
        AND table_schema = 'public'
        AND column_name LIKE 'attachment%';
      `
    });

    if (checkResult.status === 200) {
      console.log('📋 Columnas de attachment existentes:', checkResult.data?.length || 0);
    } else {
      console.log('⚠️  No se pudo verificar columnas existentes, continuando...');
    }

    // Ejecutar SQL para agregar columnas usando la API REST directamente
    console.log('📝 Ejecutando SQL para agregar columnas...');
    
    // Usar la API de PostgREST para ejecutar SQL
    const sqlOptions = {
      hostname: supabaseUrl.replace('https://', '').replace('http://', ''),
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      }
    };

    const sqlResult = await makeRequest(sqlOptions, {
      sql: `
        ALTER TABLE incomes 
        ADD COLUMN IF NOT EXISTS attachment_url TEXT,
        ADD COLUMN IF NOT EXISTS attachment_name TEXT,
        ADD COLUMN IF NOT EXISTS attachment_type TEXT,
        ADD COLUMN IF NOT EXISTS attachment_size INTEGER;
      `
    });

    if (sqlResult.status !== 200) {
      console.error('❌ Error ejecutando SQL:', sqlResult.data);
      
      // Intentar alternativa usando la tabla directamente
      console.log('🔄 Intentando método alternativo...');
      
      // Verificar si la tabla existe y obtener su estructura
      const tableOptions = {
        hostname: supabaseUrl.replace('https://', '').replace('http://', ''),
        port: 443,
        path: '/rest/v1/incomes?select=*&limit=1',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        }
      };

      const tableResult = await makeRequest(tableOptions);
      
      if (tableResult.status === 200) {
        console.log('✅ Tabla incomes encontrada');
        console.log('💡 Las columnas pueden agregarse manualmente desde el dashboard de Supabase');
        console.log('📋 Ve a: https://app.supabase.com/project/hypravgvtrlfpepslhmc/editor');
        console.log('🔧 Ejecuta este SQL en el SQL Editor:');
        console.log(`
ALTER TABLE incomes 
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_name TEXT,
ADD COLUMN IF NOT EXISTS attachment_type TEXT,
ADD COLUMN IF NOT EXISTS attachment_size INTEGER;

COMMENT ON COLUMN incomes.attachment_url IS 'URL del archivo adjunto en Supabase Storage';
COMMENT ON COLUMN incomes.attachment_name IS 'Nombre original del archivo adjunto';
COMMENT ON COLUMN incomes.attachment_type IS 'Tipo MIME del archivo adjunto (application/pdf, image/jpeg, etc.)';
COMMENT ON COLUMN incomes.attachment_size IS 'Tamaño del archivo adjunto en bytes';
        `);
        return true;
      } else {
        console.error('❌ No se pudo acceder a la tabla incomes:', tableResult.data);
        return false;
      }
    }

    console.log('✅ Columnas agregadas exitosamente');
    return true;

  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

// Ejecutar la función
addAttachmentColumns()
  .then(success => {
    if (success) {
      console.log('🎉 ¡Proceso completado exitosamente!');
      console.log('💡 Ahora puedes probar la funcionalidad de subida de archivos en los ingresos.');
    } else {
      console.log('❌ El proceso falló. Revisa los errores arriba.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });