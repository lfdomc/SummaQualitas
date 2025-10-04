'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export function useAuthWorking(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    isAuthenticated: false
  });

  useEffect(() => {
    const supabase = createClient();
    
    // Función para obtener la sesión y perfil
    const getSessionAndProfile = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          setState({
            user: null,
            profile: null,
            loading: false,
            isAuthenticated: false
          });
          return;
        }

        if (!session?.user) {
          setState({
            user: null,
            profile: null,
            loading: false,
            isAuthenticated: false
          });
          return;
        }

        // Obtener perfil
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('id, email, name, role')
          .eq('id', session.user.id)
          .single();

        setState({
          user: session.user,
          profile: profile || null,
          loading: false,
          isAuthenticated: true
        });
      } catch (error) {
        setState({
          user: null,
          profile: null,
          loading: false,
          isAuthenticated: false
        });
      }
    };

    // Cargar sesión inicial
    getSessionAndProfile();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 [useAuthWorking] Auth state change:', event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session?.user) {
        // Usuario se ha logueado
        try {
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('id, email, name, role')
            .eq('id', session.user.id)
            .single();

          setState({
            user: session.user,
            profile: profile || null,
            loading: false,
            isAuthenticated: true
          });
        } catch (error) {
          setState({
            user: session.user,
            profile: null,
            loading: false,
            isAuthenticated: true
          });
        }
      } else if (event === 'SIGNED_OUT') {
        // Usuario se ha deslogueado
        setState({
          user: null,
          profile: null,
          loading: false,
          isAuthenticated: false
        });
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Token renovado, mantener estado actual pero actualizar usuario
        setState(prevState => ({
          ...prevState,
          user: session.user,
          isAuthenticated: true
        }));
      }
    });

    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return state;
}