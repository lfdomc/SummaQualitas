const puppeteer = require('puppeteer');

async function testBrowserLogin() {
  let browser;
  
  try {
    console.log('🚀 Iniciando prueba de login en el navegador...');
    
    browser = await puppeteer.launch({ 
      headless: false,
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Escuchar logs de la consola
    page.on('console', msg => {
      console.log('🖥️ [Browser Console]:', msg.text());
    });
    
    // Escuchar errores
    page.on('pageerror', error => {
      console.error('❌ [Browser Error]:', error.message);
    });
    
    console.log('📱 Navegando a la página de login...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
    
    console.log('🔍 Esperando que aparezca el formulario...');
    await page.waitForSelector('form', { timeout: 10000 });
    
    console.log('📝 Llenando el formulario...');
    await page.type('input[type="email"]', 'lfdomc@gmail.com');
    await page.type('input[type="password"]', 'admin123');
    
    console.log('🔐 Enviando formulario...');
    await page.click('button[type="submit"]');
    
    // Esperar a que se procese el login
    console.log('⏳ Esperando respuesta del login...');
    await page.waitForTimeout(3000);
    
    // Verificar si hay redirección o cambios en la página
    const currentUrl = page.url();
    console.log('🌐 URL actual:', currentUrl);
    
    // Verificar si hay cookies de sesión
    const cookies = await page.cookies();
    const sessionCookies = cookies.filter(cookie => 
      cookie.name.includes('supabase') || 
      cookie.name.includes('session') ||
      cookie.name.includes('auth')
    );
    
    console.log('🍪 Cookies de sesión encontradas:', sessionCookies.length);
    sessionCookies.forEach(cookie => {
      console.log(`   - ${cookie.name}: ${cookie.value.substring(0, 50)}...`);
    });
    
    // Verificar el estado de autenticación en la página
    const authState = await page.evaluate(() => {
      // Intentar acceder al estado global si existe
      return window.authState || 'No disponible';
    });
    
    console.log('🔍 Estado de autenticación:', authState);
    
    // Esperar un poco más para ver si hay cambios
    await page.waitForTimeout(2000);
    
    console.log('✅ Prueba completada');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testBrowserLogin();