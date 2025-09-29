/**
 * Script de diagnóstico para problemas de rendimiento en el login
 * Identifica posibles cuellos de botella y problemas de configuración
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno desde .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Función para medir tiempo de ejecución
 */
function measureTime(label) {
  const start = Date.now();
  return {
    end: () => {
      const duration = Date.now() - start;
      console.log(`⏱️  ${label}: ${duration}ms`);
      return duration;
    }
  };
}

/**
 * Test de conectividad con Supabase
 */
async function testSupabaseConnection() {
  console.log('\n🔍 === TEST DE CONECTIVIDAD SUPABASE ===');
  
  const timer = measureTime('Conexión a Supabase');
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    timer.end();
    
    if (error) {
      console.log('❌ Error de conexión:', error.message);
      return false;
    }
    
    console.log('✅ Conexión exitosa a Supabase');
    return true;
  } catch (err) {
    timer.end();
    console.log('❌ Error de conexión:', err.message);
    return false;
  }
}

/**
 * Test de autenticación
 */
async function testAuthentication() {
  console.log('\n🔍 === TEST DE AUTENTICACIÓN ===');
  
  // Test de obtener sesión actual
  const sessionTimer = measureTime('Obtener sesión actual');
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    sessionTimer.end();
    
    if (sessionError) {
      console.log('❌ Error obteniendo sesión:', sessionError.message);
    } else {
      console.log('✅ Sesión obtenida correctamente');
      console.log('📋 Estado de sesión:', {
        hasSession: !!sessionData.session,
        user: sessionData.session?.user?.email || 'No autenticado'
      });
    }
  } catch (err) {
    sessionTimer.end();
    console.log('❌ Error inesperado obteniendo sesión:', err.message);
  }

  // Test de obtener usuario actual
  const userTimer = measureTime('Obtener usuario actual');
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    userTimer.end();
    
    if (userError) {
      console.log('❌ Error obteniendo usuario:', userError.message);
    } else {
      console.log('✅ Usuario obtenido correctamente');
      console.log('👤 Usuario:', userData.user?.email || 'No autenticado');
    }
  } catch (err) {
    userTimer.end();
    console.log('❌ Error inesperado obteniendo usuario:', err.message);
  }
}

/**
 * Test de consultas a la base de datos
 */
async function testDatabaseQueries() {
  console.log('\n🔍 === TEST DE CONSULTAS A BASE DE DATOS ===');
  
  const tables = ['users', 'projects', 'expenses', 'equipment', 'suppliers'];
  
  for (const table of tables) {
    const timer = measureTime(`Consulta a tabla ${table}`);
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      timer.end();
      
      if (error) {
        console.log(`❌ Error en tabla ${table}:`, error.message);
      } else {
        console.log(`✅ Tabla ${table} accesible`);
      }
    } catch (err) {
      timer.end();
      console.log(`❌ Error inesperado en tabla ${table}:`, err.message);
    }
  }
}

/**
 * Test de funciones optimizadas
 */
async function testOptimizedFunctions() {
  console.log('\n🔍 === TEST DE FUNCIONES OPTIMIZADAS ===');
  
  const functions = [
    'get_dashboard_kpis',
    'get_projects_with_summary',
    'get_recent_expenses',
    'get_equipment_summary',
    'get_expenses_paginated',
    'get_expenses_by_category_period'
  ];
  
  for (const func of functions) {
    const timer = measureTime(`Función ${func}`);
    try {
      const { data, error } = await supabase.rpc(func, {});
      timer.end();
      
      if (error) {
        console.log(`❌ Error en función ${func}:`, error.message);
      } else {
        console.log(`✅ Función ${func} ejecutada correctamente`);
        console.log(`📊 Resultados: ${Array.isArray(data) ? data.length : 'N/A'} registros`);
      }
    } catch (err) {
      timer.end();
      console.log(`❌ Error inesperado en función ${func}:`, err.message);
    }
  }
}

/**
 * Test de rendimiento de red
 */
async function testNetworkPerformance() {
  console.log('\n🔍 === TEST DE RENDIMIENTO DE RED ===');
  
  const iterations = 5;
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const timer = measureTime(`Ping ${i + 1}`);
    try {
      await supabase.from('users').select('count').limit(1);
      const time = timer.end();
      times.push(time);
    } catch (err) {
      timer.end();
      console.log(`❌ Error en ping ${i + 1}:`, err.message);
    }
  }
  
  if (times.length > 0) {
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    console.log('📊 Estadísticas de red:');
    console.log(`   Tiempo promedio: ${avgTime.toFixed(2)}ms`);
    console.log(`   Tiempo mínimo: ${minTime}ms`);
    console.log(`   Tiempo máximo: ${maxTime}ms`);
    
    if (avgTime > 1000) {
      console.log('⚠️  ADVERTENCIA: Latencia alta detectada (>1s)');
    } else if (avgTime > 500) {
      console.log('⚠️  ADVERTENCIA: Latencia moderada detectada (>500ms)');
    } else {
      console.log('✅ Latencia de red aceptable');
    }
  }
}

/**
 * Función principal
 */
async function runDiagnostics() {
  console.log('🚀 === DIAGNÓSTICO DE RENDIMIENTO DE LOGIN ===');
  console.log('Fecha:', new Date().toLocaleString());
  console.log('URL Supabase:', supabaseUrl);
  
  try {
    // Tests secuenciales
    const connectionOk = await testSupabaseConnection();
    
    if (connectionOk) {
      await testAuthentication();
      await testDatabaseQueries();
      await testOptimizedFunctions();
      await testNetworkPerformance();
    }
    
    console.log('\n✅ === DIAGNÓSTICO COMPLETADO ===');
    console.log('Revisa los resultados arriba para identificar problemas de rendimiento.');
    
  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
  }
}

// Ejecutar diagnóstico
runDiagnostics().catch(console.error);