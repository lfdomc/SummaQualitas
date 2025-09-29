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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function insertTestData() {
  console.log('🚀 Insertando datos de prueba...');

  try {
    // 1. Insertar clientes
    console.log('👥 Insertando clientes...');
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .insert([
        {
          name: 'Constructora ABC',
          contact_person: 'Juan Pérez',
          email: 'contacto@abc.com',
          phone: '+52 55 1234 5678',
          address: 'Av. Reforma 123, CDMX'
        },
        {
          name: 'Desarrollos XYZ',
          contact_person: 'María González',
          email: 'info@xyz.com',
          phone: '+52 55 8765 4321',
          address: 'Polanco 456, CDMX'
        }
      ])
      .select();

    if (clientsError) {
      console.error('❌ Error insertando clientes:', clientsError);
      return;
    }
    console.log(`✅ ${clients.length} clientes insertados`);

    // 2. Insertar proveedores
    console.log('🏪 Insertando proveedores...');
    const { data: suppliers, error: suppliersError } = await supabase
      .from('suppliers')
      .insert([
        {
          name: 'Materiales del Norte',
          contact_person: 'Carlos Ruiz',
          email: 'ventas@norte.com',
          phone: '+52 55 1111 2222',
          address: 'Industrial Norte 789',
          supplier_type: 'MATERIALES'
        },
        {
          name: 'Equipos y Herramientas SA',
          contact_person: 'Ana López',
          email: 'contacto@equipos.com',
          phone: '+52 55 3333 4444',
          address: 'Zona Industrial 321',
          supplier_type: 'EQUIPOS'
        },
        {
          name: 'Servicios Especializados',
          contact_person: 'Roberto Silva',
          email: 'info@servicios.com',
          phone: '+52 55 5555 6666',
          address: 'Centro 654',
          supplier_type: 'SERVICIOS'
        }
      ])
      .select();

    if (suppliersError) {
      console.error('❌ Error insertando proveedores:', suppliersError);
      return;
    }
    console.log(`✅ ${suppliers.length} proveedores insertados`);

    // 3. Insertar proyectos
    console.log('🏗️ Insertando proyectos...');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .insert([
        {
          name: 'Torre Residencial Polanco',
          description: 'Construcción de torre residencial de 20 pisos',
          client_id: clients[0].id,
          status: 'en_progreso',
          estimated_start_date: '2024-01-15',
          estimated_end_date: '2024-12-15',
          actual_start_date: '2024-01-20',
          budget: 15000000.00,
          currency: 'USD',
          location: 'Polanco, CDMX'
        },
        {
          name: 'Centro Comercial Santa Fe',
          description: 'Desarrollo de centro comercial con 3 niveles',
          client_id: clients[1].id,
          status: 'planificacion',
          estimated_start_date: '2024-03-01',
          estimated_end_date: '2025-02-28',
          budget: 25000000.00,
          currency: 'USD',
          location: 'Santa Fe, CDMX'
        },
        {
          name: 'Oficinas Corporativas',
          description: 'Edificio de oficinas de 15 pisos',
          client_id: clients[0].id,
          status: 'completado',
          estimated_start_date: '2023-06-01',
          estimated_end_date: '2024-05-31',
          actual_start_date: '2023-06-15',
          actual_end_date: '2024-06-15',
          budget: 12000000.00,
          currency: 'USD',
          location: 'Roma Norte, CDMX'
        }
      ])
      .select();

    if (projectsError) {
      console.error('❌ Error insertando proyectos:', projectsError);
      return;
    }
    console.log(`✅ ${projects.length} proyectos insertados`);

    // 4. Insertar gastos
    console.log('💰 Insertando gastos...');
    const expenses = [];
    const categories = ['costos_directos', 'costos_indirectos', 'mano_obra', 'imprevistos', 'administracion'];
    const directSubcategories = ['subcontratos', 'materiales', 'otros'];
    const indirectSubcategories = ['cargas_sociales', 'alquiler', 'control_calidad', 'servicios_basicos', 'transporte', 'polizas', 'equipos', 'otros'];
    const paymentStatuses = ['pendiente', 'pagado'];
    
    for (let i = 0; i < 50; i++) {
      const randomProject = projects[Math.floor(Math.random() * projects.length)];
      const randomSupplier = suppliers[Math.floor(Math.random() * suppliers.length)];
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      const randomPaymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
      const randomAmount = Math.floor(Math.random() * 100000) + 1000;
      const randomDate = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
      
      const expense = {
        project_id: randomProject.id,
        supplier_id: randomSupplier.id,
        description: `Gasto de ${randomCategory} para ${randomProject.name}`,
        amount: randomAmount,
        category: randomCategory,
        expense_date: randomDate.toISOString().split('T')[0],
        payment_status: randomPaymentStatus
      };

      // Agregar subcategorías según el tipo de costo
      if (randomCategory === 'costos_directos') {
        expense.subcategory_direct = directSubcategories[Math.floor(Math.random() * directSubcategories.length)];
      } else if (randomCategory === 'costos_indirectos') {
        expense.subcategory_indirect = indirectSubcategories[Math.floor(Math.random() * indirectSubcategories.length)];
      }
      
      expenses.push(expense);
    }

    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .insert(expenses)
      .select();

    if (expensesError) {
      console.error('❌ Error insertando gastos:', expensesError);
      return;
    }
    console.log(`✅ ${expensesData.length} gastos insertados`);

    // 5. Insertar ingresos
    console.log('💵 Insertando ingresos...');
    const incomes = [];
    const incomeCategories = ['payment_received', 'advance_payment', 'milestone_payment', 'final_payment'];
    const paymentMethods = ['bank_transfer', 'check', 'cash'];
    const incomeStatuses = ['confirmed', 'pending'];
    
    for (let i = 0; i < 30; i++) {
      const randomProject = projects[Math.floor(Math.random() * projects.length)];
      const randomClient = clients[Math.floor(Math.random() * clients.length)];
      const randomCategory = incomeCategories[Math.floor(Math.random() * incomeCategories.length)];
      const randomPaymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      const randomStatus = incomeStatuses[Math.floor(Math.random() * incomeStatuses.length)];
      const randomAmount = Math.floor(Math.random() * 500000) + 50000;
      const randomDate = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
      
      incomes.push({
        project_id: randomProject.id,
        client_id: randomClient.id,
        description: `Pago por avance de ${randomProject.name}`,
        amount: randomAmount,
        category: randomCategory,
        payment_method: randomPaymentMethod,
        received_date: randomDate.toISOString().split('T')[0],
        status: randomStatus
      });
    }

    const { data: incomesData, error: incomesError } = await supabase
      .from('incomes')
      .insert(incomes)
      .select();

    if (incomesError) {
      console.error('❌ Error insertando ingresos:', incomesError);
      return;
    }
    console.log(`✅ ${incomesData.length} ingresos insertados`);

    console.log('\n🎉 ¡Datos de prueba insertados exitosamente!');
    console.log(`📊 Resumen:`);
    console.log(`   - ${clients.length} clientes`);
    console.log(`   - ${suppliers.length} proveedores`);
    console.log(`   - ${projects.length} proyectos`);
    console.log(`   - ${expensesData.length} gastos`);
    console.log(`   - ${incomesData.length} ingresos`);

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

insertTestData();