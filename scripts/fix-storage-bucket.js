/**
 * Script: fix-storage-bucket.js
 * Objetivo:
 * - Asegurar que el bucket de Storage 'sumitals' existe y está configurado.
 * - Probar upload/remove usando Service Role (bypassa RLS del Storage).
 *
 * Uso:
 * 1) Copia tu NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY a .env.local
 *    NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
 *    SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
 * 2) Ejecuta: node scripts/fix-storage-bucket.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Faltan variables de entorno necesarias.');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? 'OK' : 'MISSING');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY:', SERVICE_ROLE_KEY ? 'OK' : 'MISSING');
  console.error('\nSolución: configura estas variables en .env.local y vuelve a ejecutar.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BUCKET_ID = 'sumitals';
const allowedMimeTypes = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain'
];

async function ensureBucket() {
  console.log('🔎 Verificando bucket:', BUCKET_ID);
  const { data: existing, error: getError } = await supabase.storage.getBucket(BUCKET_ID);
  if (getError && !/does not exist|not found/i.test(getError.message || '')) {
    console.warn('⚠️ Error al obtener bucket (continuamos):', getError.message);
  }

  if (!existing) {
    console.log('🪣 Bucket no existe, creando...');
    const { error: createError } = await supabase.storage.createBucket(BUCKET_ID, {
      public: false,
      fileSizeLimit: String(50 * 1024 * 1024), // 50MB en bytes (string según API)
      allowedMimeTypes,
    });
    if (createError) {
      console.error('❌ Error creando bucket:', createError.message);
      process.exit(1);
    }
    console.log('✅ Bucket creado');
  } else {
    console.log('✅ Bucket existe');
    console.log('🔧 Actualizando configuración del bucket...');
    const { error: updateError } = await supabase.storage.updateBucket(BUCKET_ID, {
      public: false,
      fileSizeLimit: String(50 * 1024 * 1024),
      allowedMimeTypes,
    });
    if (updateError) {
      console.warn('⚠️ No se pudo actualizar bucket (posible falta de soporte en plan):', updateError.message);
    } else {
      console.log('✅ Configuración de bucket actualizada');
    }
  }
}

async function testUpload() {
  console.log('📤 Probando upload con Service Role (bypassa RLS de Storage)...');
  const path = `diagnostic/test_${Date.now()}.txt`;
  const content = 'Hola mundo desde script de diagnóstico';
  const { data, error } = await supabase.storage.from(BUCKET_ID).upload(path, content, {
    contentType: 'text/plain',
    upsert: true,
  });
  if (error) {
    console.error('❌ Error en upload:', error.message);
    return { ok: false, path };
  }
  console.log('✅ Upload OK:', data?.path || path);

  console.log('🗑️ Probando remove...');
  const { error: removeError } = await supabase.storage.from(BUCKET_ID).remove([path]);
  if (removeError) {
    console.warn('⚠️ Error eliminando archivo de prueba:', removeError.message);
  } else {
    console.log('✅ Remove OK');
  }
  return { ok: true, path };
}

async function main() {
  try {
    await ensureBucket();
    const result = await testUpload();
    console.log('==============================================');
    console.log('Resumen:');
    console.log(' - Bucket:', BUCKET_ID, 'OK');
    console.log(' - Upload/Remove de prueba:', result.ok ? 'OK' : 'FALLÓ');
    console.log('==============================================');
    console.log('\nSiguientes pasos:');
    console.log(' 1) Asegúrate de que en Vercel esté configurado SUPABASE_SERVICE_ROLE_KEY.');
    console.log(' 2) El endpoint /api/sumitals/attachments ya usa Service Role para Storage.');
    console.log(' 3) Prueba subir adjuntos desde la app.');
    console.log(' 4) Si hay error, revisa https://summa-qualitas.vercel.app/api/debug/env y comparte el JSON.');
  } catch (e) {
    console.error('❌ Error general:', e?.message || e);
    process.exit(1);
  }
}

main();