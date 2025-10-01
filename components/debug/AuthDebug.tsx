'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function AuthDebug() {
  useEffect(() => {
    console.log('🔍 [AuthDebug] Componente montado');
    
    const checkAuth = async () => {
      console.log('🔍 [AuthDebug] Verificando autenticación...');
      
      try {
        const supabase = createClient();
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('🔍 [AuthDebug] Sesión:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userEmail: session?.user?.email,
          sessionError: error?.message
        });
        
      } catch (err) {
        console.error('❌ [AuthDebug] Error:', err);
      }
    };

    checkAuth();
  }, []);

  return (
    <div className="p-4 bg-blue-100 border border-blue-400 rounded mb-4">
      <h3 className="font-bold mb-2">Debug de Autenticación</h3>
      <p className="text-sm">Revisa la consola para ver los logs de autenticación</p>
    </div>
  );
}