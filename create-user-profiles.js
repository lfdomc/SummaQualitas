require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function createUserProfilesTable() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceKey) {
      console.log('Missing environment variables');
      return;
    }
    
    const supabase = createClient(supabaseUrl, serviceKey);
    
    // Drop existing table
    console.log('Dropping existing table...');
    const { error: dropError } = await supabase
      .from('user_profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Create the table using raw SQL
    const createTableSQL = `
      DROP TABLE IF EXISTS public.user_profiles CASCADE;
      
      CREATE TABLE public.user_profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT,
        avatar_url TEXT,
        role TEXT NOT NULL CHECK (role IN ('gerencia', 'administrativo', 'cliente')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
    `;
    
    console.log('Creating user_profiles table...');
    
    // Since we can't execute raw SQL directly, let's try a different approach
    // Let's check if the table exists first
    const { data: existingData, error: checkError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
      
    if (checkError && checkError.code === 'PGRST205') {
      console.log('Table does not exist, this is expected');
    } else {
      console.log('Table check result:', { existingData, checkError });
    }
    
    // Let's try to insert a test user profile to see what happens
    console.log('Attempting to create a test profile...');
    
    // First, let's check if we have any users in auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    console.log('Auth users:', authUsers?.users?.length || 0, 'Error:', authError);
    
    if (authUsers?.users?.length > 0) {
      const testUser = authUsers.users.find(u => u.email === 'lfdomc@gmail.com');
      if (testUser) {
        console.log('Found user lfdomc@gmail.com:', testUser.id);
        
        // Try to insert profile
        const { data: insertData, error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            id: testUser.id,
            email: testUser.email,
            full_name: testUser.user_metadata?.full_name || 'Luis Fernando',
            role: 'gerencia'
          });
          
        console.log('Insert result:', { insertData, insertError });
      }
    }
    
  } catch (err) {
    console.log('Exception:', err.message);
  }
}

createUserProfilesTable();