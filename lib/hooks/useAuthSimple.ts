'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

export function useAuthSimple() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  console.log('🚀 [useAuthSimple] Hook inicializado');

  useEffect(() => {
    console.log('⚡ [useAuthSimple] useEffect ejecutándose...');
    
    const supabase = createClient();
    
    const checkAuth = async () => {
      try {
        console.log('🔍 [useAuthSimple] Verificando autenticación...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ [useAuthSimple] Error:', error);
          setUser(null);
        } else {
          console.log('✅ [useAuthSimple] Sesión:', session?.user?.email || 'No user');
          setUser(session?.user || null);
        }
      } catch (err) {
        console.error('❌ [useAuthSimple] Error inesperado:', err);
        setUser(null);
      } finally {
        console.log('🏁 [useAuthSimple] Finalizando, loading = false');
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return { user, loading, isAuthenticated: !!user };
}