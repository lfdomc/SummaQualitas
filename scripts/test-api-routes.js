const http = require('http');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ ok: res.statusCode === 200, data: jsonData, status: res.statusCode });
        } catch (error) {
          resolve({ ok: false, data: data, status: res.statusCode });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
  });
}

async function testAPIRoutes() {
  console.log('🧪 Probando las nuevas API routes...\n');

  const baseUrl = 'http://localhost:3000';

  try {
    // 1. Probar API de KPIs del dashboard
    console.log('1️⃣ Probando /api/dashboard/kpis...');
    const kpisResponse = await makeRequest(`${baseUrl}/api/dashboard/kpis`);
    
    if (kpisResponse.ok) {
      console.log('✅ API KPIs funcionando');
      console.log('   📊 Datos recibidos:', kpisResponse.data);
    } else {
      console.error('❌ Error en API KPIs:', kpisResponse.data);
    }

    // 2. Probar API de proyectos con resumen
    console.log('\n2️⃣ Probando /api/projects/summary...');
    const projectsResponse = await makeRequest(`${baseUrl}/api/projects/summary?limit=5&offset=0`);
    
    if (projectsResponse.ok) {
      const projectsData = projectsResponse.data;
      console.log('✅ API Proyectos funcionando');
      console.log(`   🏗️ Proyectos recibidos: ${projectsData.length}`);
      projectsData.forEach(project => {
        console.log(`      - ${project.name} (${project.status})`);
        console.log(`        Presupuesto: $${project.total_budget || 0}`);
        console.log(`        Gastos: $${project.total_expenses || 0}`);
        console.log(`        Ingresos: $${project.total_incomes || 0}`);
      });
    } else {
      console.error('❌ Error en API Proyectos:', projectsResponse.data);
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

testAPIRoutes();