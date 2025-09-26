const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://eavnuiwjtuzvkyghexfj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhdm51aXdqdHV6dmt5Z2hleGZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTczNzEzMCwiZXhwIjoyMDcxMzEzMTMwfQ.GI_1wtNDYkt9M0gf3hxv-XfrSlnzyyr4-oiJQL-F6d4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkInitialState() {
  console.log('\n=== ESTADO INICIAL DE LA BASE DE DATOS ===');
  
  try {
    // Verificar suppliers
    const { data: suppliers, error: suppliersError } = await supabase
      .from('suppliers')
      .select('*');
    
    if (suppliersError) {
      console.error('Error al obtener suppliers:', suppliersError);
      return null;
    }
    
    console.log(`📦 Suppliers: ${suppliers.length} registros`);
    if (suppliers.length > 0) {
      console.log('Suppliers encontrados:');
      suppliers.forEach(supplier => {
        console.log(`  - ${supplier.name} (${supplier.supplier_type}) - ${supplier.status}`);
      });
    }
    
    // Verificar equipment_rentals
    const { data: equipmentRentals, error: equipmentError } = await supabase
      .from('equipment_rentals')
      .select('*');
    
    if (!equipmentError) {
      console.log(`🏗️ Equipment Rentals: ${equipmentRentals.length} registros`);
    }
    
    // Verificar expenses
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*');
    
    if (!expensesError) {
      console.log(`💰 Expenses: ${expenses.length} registros`);
    }
    
    // Verificar supplier_payments
    const { data: supplierPayments, error: paymentsError } = await supabase
      .from('supplier_payments')
      .select('*');
    
    if (!paymentsError) {
      console.log(`💳 Supplier Payments: ${supplierPayments.length} registros`);
    }
    
    return {
      suppliers: suppliers.length,
      equipmentRentals: equipmentRentals?.length || 0,
      expenses: expenses?.length || 0,
      supplierPayments: supplierPayments?.length || 0
    };
    
  } catch (error) {
    console.error('Error al verificar estado inicial:', error);
    return null;
  }
}

async function deleteSupplierDependencies() {
  console.log('\n=== ELIMINANDO DEPENDENCIAS DE SUPPLIERS ===');
  
  try {
    // 1. Eliminar equipment_rentals que referencian suppliers
    console.log('🏗️ Eliminando equipment_rentals...');
    const { error: equipmentError } = await supabase
      .from('equipment_rentals')
      .delete()
      .not('supplier_id', 'is', null);
    
    if (equipmentError) {
      console.error('Error al eliminar equipment_rentals:', equipmentError);
    } else {
      console.log('✅ Equipment rentals eliminados');
    }
    
    // 2. Eliminar expenses que referencian suppliers
    console.log('💰 Eliminando expenses...');
    const { error: expensesError } = await supabase
      .from('expenses')
      .delete()
      .not('supplier_id', 'is', null);
    
    if (expensesError) {
      console.error('Error al eliminar expenses:', expensesError);
    } else {
      console.log('✅ Expenses eliminados');
    }
    
    // 3. Eliminar supplier_payments (debería eliminarse automáticamente con CASCADE)
    console.log('💳 Eliminando supplier_payments...');
    const { error: paymentsError } = await supabase
      .from('supplier_payments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Eliminar todos
    
    if (paymentsError) {
      console.error('Error al eliminar supplier_payments:', paymentsError);
    } else {
      console.log('✅ Supplier payments eliminados');
    }
    
  } catch (error) {
    console.error('Error al eliminar dependencias:', error);
  }
}

async function deleteAllSuppliers() {
  console.log('\n=== ELIMINANDO SUPPLIERS ===');
  
  try {
    // Eliminar todos los suppliers
    const { error: suppliersError } = await supabase
      .from('suppliers')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Eliminar todos
    
    if (suppliersError) {
      console.error('❌ Error al eliminar suppliers:', suppliersError);
      return false;
    } else {
      console.log('✅ Todos los suppliers eliminados exitosamente');
      return true;
    }
    
  } catch (error) {
    console.error('❌ Error inesperado al eliminar suppliers:', error);
    return false;
  }
}

async function bruteForceCleanup() {
  console.log('\n=== ENFOQUE DE FUERZA BRUTA ===');
  console.log('Eliminando registros de todas las tablas que puedan contener supplier_id...');
  
  const tablesToClean = [
    'equipment_rentals',
    'expenses', 
    'supplier_payments',
    'suppliers'
  ];
  
  for (const table of tablesToClean) {
    try {
      console.log(`🧹 Limpiando tabla: ${table}`);
      const { error } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Eliminar todos los registros
      
      if (error) {
        console.error(`❌ Error al limpiar ${table}:`, error);
      } else {
        console.log(`✅ Tabla ${table} limpiada`);
      }
    } catch (error) {
      console.error(`❌ Error inesperado al limpiar ${table}:`, error);
    }
  }
}

async function checkFinalState() {
  console.log('\n=== ESTADO FINAL DE LA BASE DE DATOS ===');
  
  try {
    const { data: suppliers } = await supabase.from('suppliers').select('*');
    const { data: equipmentRentals } = await supabase.from('equipment_rentals').select('*');
    const { data: expenses } = await supabase.from('expenses').select('*');
    const { data: supplierPayments } = await supabase.from('supplier_payments').select('*');
    
    console.log(`📦 Suppliers: ${suppliers?.length || 0} registros`);
    console.log(`🏗️ Equipment Rentals: ${equipmentRentals?.length || 0} registros`);
    console.log(`💰 Expenses: ${expenses?.length || 0} registros`);
    console.log(`💳 Supplier Payments: ${supplierPayments?.length || 0} registros`);
    
    const allEmpty = (suppliers?.length || 0) === 0 && 
                     (equipmentRentals?.length || 0) === 0 && 
                     (expenses?.length || 0) === 0 && 
                     (supplierPayments?.length || 0) === 0;
    
    if (allEmpty) {
      console.log('\n🎉 ¡ÉXITO! Todas las tablas relacionadas con suppliers están vacías.');
    } else {
      console.log('\n⚠️ Algunas tablas aún contienen registros.');
    }
    
  } catch (error) {
    console.error('Error al verificar estado final:', error);
  }
}

async function main() {
  console.log('🚀 INICIANDO ELIMINACIÓN NUCLEAR DE SUPPLIERS');
  console.log('===============================================');
  
  // 1. Verificar estado inicial
  const initialState = await checkInitialState();
  if (!initialState) {
    console.log('⚠️ No se pudo verificar el estado inicial. Continuando con la eliminación...');
  } else if (initialState.suppliers === 0) {
    console.log('\n✅ No hay suppliers para eliminar. La base de datos ya está limpia.');
    return;
  }
  
  // 2. Enfoque 1: Eliminar dependencias primero
  console.log('\n📋 ENFOQUE 1: Eliminación ordenada de dependencias');
  await deleteSupplierDependencies();
  
  // 3. Enfoque 2: Eliminar suppliers
  console.log('\n📋 ENFOQUE 2: Eliminación de suppliers');
  const suppliersDeleted = await deleteAllSuppliers();
  
  // 4. Enfoque 3: Fuerza bruta si hay problemas
  if (!suppliersDeleted) {
    console.log('\n📋 ENFOQUE 3: Fuerza bruta');
    await bruteForceCleanup();
  }
  
  // 5. Verificar estado final
  await checkFinalState();
  
  console.log('\n🏁 PROCESO COMPLETADO');
}

// Ejecutar el script
main().catch(console.error);