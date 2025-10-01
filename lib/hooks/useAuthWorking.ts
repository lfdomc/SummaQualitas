'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  profile: any | null;
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

    getSessionAndProfile();
  }, []);

  return state;
}