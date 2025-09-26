const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ixqjqjqjqjqjqjqjqjqj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxanFqcWpxanFqcWpxanFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5NzI0NzEsImV4cCI6MjA1MjU0ODQ3MX0.example';

async function debugRLSIncomes() {
  console.log('🔍 Diagnosticando RLS para incomes...\n');

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Verificar usuario actual
    console.log('1. Verificando usuario actual...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Error obteniendo usuario:', userError);
      return;
    }
    
    if (!user) {
      console.log('❌ No hay usuario autenticado');
      return;
    }
    
    console.log('✅ Usuario autenticado:', user.id);
    console.log('📧 Email:', user.email);

    // 2. Verificar rol del usuario
    console.log('\n2. Verificando rol del usuario...');
    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (roleError) {
      console.error('❌ Error obteniendo rol:', roleError);
    } else {
      console.log('✅ Rol del usuario:', userData?.role || 'Sin rol');
    }

    // 3. Verificar proyectos disponibles
    console.log('\n3. Verificando proyectos disponibles...');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, manager_id')
      .limit(5);

    if (projectsError) {
      console.error('❌ Error obteniendo proyectos:', projectsError);
    } else {
      console.log('✅ Proyectos encontrados:', projects?.length || 0);
      projects?.forEach(p => {
        console.log(`  - ${p.name} (ID: ${p.id}, Manager: ${p.manager_id})`);
        console.log(`    ¿Es manager? ${p.manager_id === user.id ? 'SÍ' : 'NO'}`);
      });
    }

    // 4. Probar inserción directa con SQL
    console.log('\n4. Probando inserción con SQL directo...');
    const testProject = projects?.[0];
    
    if (testProject) {
      const { data: sqlResult, error: sqlError } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT 
            auth.uid() as current_user_id,
            EXISTS (
              SELECT 1 FROM public.projects p
              WHERE p.id = '${testProject.id}'
              AND (
                p.manager_id = auth.uid()
                OR EXISTS (
                  SELECT 1 FROM public.users u
                  WHERE u.id = auth.uid()
                  AND u.role IN ('gerencia', 'administrativo')
                )
              )
            ) as can_insert_income;
        `
      });

      if (sqlError) {
        console.error('❌ Error en consulta SQL:', sqlError);
      } else {
        console.log('✅ Resultado SQL:', sqlResult);
      }
    }

    // 5. Intentar insertar un income de prueba
    console.log('\n5. Intentando insertar income de prueba...');
    if (testProject) {
      const testIncome = {
        project_id: testProject.id,
        description: 'Test income for RLS debugging',
        amount: 1000,
        currency: 'CRC',
        category: 'payment',
        status: 'pending'
      };

      const { data: incomeData, error: incomeError } = await supabase
        .from('incomes')
        .insert(testIncome)
        .select()
        .single();

      if (incomeError) {
        console.error('❌ Error insertando income:', incomeError);
        console.log('Código de error:', incomeError.code);
        console.log('Mensaje:', incomeError.message);
        console.log('Detalles:', incomeError.details);
      } else {
        console.log('✅ Income insertado exitosamente:', incomeData);
        
        // Limpiar - eliminar el income de prueba
        await supabase.from('incomes').delete().eq('id', incomeData.id);
        console.log('🧹 Income de prueba eliminado');
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

debugRLSIncomes();