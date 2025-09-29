const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

// Simulación simple del caché en memoria
class SimpleCache {
  constructor() {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      totalRequests: 0
    };
  }

  get(key) {
    this.stats.totalRequests++;
    if (this.cache.has(key)) {
      this.stats.hits++;
      return this.cache.get(key);
    }
    this.stats.misses++;
    return null;
  }

  set(key, value, ttl = 300000) { // 5 minutos por defecto
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl
    });
  }

  clear() {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, totalRequests: 0 };
  }

  getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: this.stats.totalRequests > 0 ? (this.stats.hits / this.stats.totalRequests) * 100 : 0
    };
  }
}

const cache = new SimpleCache();

async function testCachePerformance() {
  console.log('🚀 Iniciando pruebas de rendimiento del caché...\n');

  try {
    // Configurar Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Variables de entorno de Supabase no encontradas');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Función para obtener KPIs con caché
    async function getDashboardKPIsWithCache() {
      const cacheKey = 'dashboard_kpis';
      const cached = cache.get(cacheKey);
      
      if (cached && cached.expires > Date.now()) {
        return cached.value;
      }

      const { data, error } = await supabase.rpc('get_dashboard_kpis');
      if (error) throw error;
      
      cache.set(cacheKey, data);
      return data;
    }

    // Función para obtener proyectos con caché
    async function getProjectsWithCache() {
      const cacheKey = 'projects_summary';
      const cached = cache.get(cacheKey);
      
      if (cached && cached.expires > Date.now()) {
        return cached.value;
      }

      const { data, error } = await supabase.rpc('get_projects_with_summary', {
        p_limit: 10,
        p_offset: 0
      });
      if (error) throw error;
      
      cache.set(cacheKey, data);
      return data;
    }

    // Limpiar caché para empezar desde cero
    cache.clear();
    console.log('🧹 Caché limpiado\n');

    // Test 1: Primera carga (sin caché)
    console.log('📊 Test 1: Primera carga de KPIs (sin caché)');
    const start1 = Date.now();
    const kpis1 = await getDashboardKPIsWithCache();
    const time1 = Date.now() - start1;
    console.log(`   ⏱️  Tiempo: ${time1}ms`);
    console.log(`   📈 KPIs obtenidos: ${kpis1 ? 'Sí' : 'No'}\n`);

    // Test 2: Segunda carga (con caché)
    console.log('📊 Test 2: Segunda carga de KPIs (con caché)');
    const start2 = Date.now();
    const kpis2 = await getDashboardKPIsWithCache();
    const time2 = Date.now() - start2;
    console.log(`   ⏱️  Tiempo: ${time2}ms`);
    console.log(`   🚀 Mejora: ${time1 > 0 ? ((time1 - time2) / time1 * 100).toFixed(1) : 0}%\n`);

    // Test 3: Múltiples consultas simultáneas
    console.log('📊 Test 3: Múltiples consultas simultáneas');
    const start3 = Date.now();
    const promises = [
      getDashboardKPIsWithCache(),
      getProjectsWithCache(),
      getDashboardKPIsWithCache(), // Repetida para probar caché
      getProjectsWithCache(), // Repetida para probar caché
    ];
    
    const results = await Promise.all(promises);
    const time3 = Date.now() - start3;
    console.log(`   ⏱️  Tiempo total: ${time3}ms`);
    console.log(`   ✅ Consultas exitosas: ${results.filter(r => r !== null).length}/4\n`);

    // Test 4: Estadísticas del caché
    console.log('📊 Test 4: Estadísticas del caché');
    const stats = cache.getStats();
    console.log(`   📦 Elementos en caché: ${stats.size}`);
    console.log(`   🎯 Tasa de aciertos: ${stats.hitRate.toFixed(1)}%`);
    console.log(`   📈 Total de solicitudes: ${stats.totalRequests}`);
    console.log(`   ✅ Aciertos: ${stats.hits}`);
    console.log(`   ❌ Fallos: ${stats.misses}\n`);

    // Test 5: Invalidación de caché
    console.log('📊 Test 5: Invalidación de caché');
    cache.clear();
    
    const start5 = Date.now();
    const kpis5 = await getDashboardKPIsWithCache();
    const time5 = Date.now() - start5;
    console.log(`   ⏱️  Tiempo después de invalidación: ${time5}ms`);
    console.log(`   🔄 Caché invalidado correctamente: ${time5 > time2 ? 'Sí' : 'No'}\n`);

    // Estadísticas finales
    console.log('📊 Estadísticas finales del caché:');
    const finalStats = cache.getStats();
    console.log(`   📦 Elementos en caché: ${finalStats.size}`);
    console.log(`   🎯 Tasa de aciertos: ${finalStats.hitRate.toFixed(1)}%`);
    console.log(`   📈 Total de solicitudes: ${finalStats.totalRequests}`);
    console.log(`   ✅ Aciertos: ${finalStats.hits}`);
    console.log(`   ❌ Fallos: ${finalStats.misses}`);

    console.log('\n🎉 Pruebas de rendimiento completadas exitosamente!');
    
    // Resumen de mejoras
    console.log('\n📈 Resumen de mejoras:');
    if (time1 > 0) {
      console.log(`   🚀 Mejora en consultas repetidas: ${((time1 - time2) / time1 * 100).toFixed(1)}%`);
      console.log(`   ⚡ Tiempo promedio con caché: ${time2}ms vs ${time1}ms sin caché`);
    }
    console.log(`   💾 Eficiencia del caché: ${finalStats.hitRate.toFixed(1)}% de aciertos`);

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
    process.exit(1);
  }
}

// Ejecutar las pruebas
testCachePerformance()
  .then(() => {
    console.log('\n✅ Todas las pruebas completadas');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Error fatal:', error.message);
    process.exit(1);
  });