'use client';

import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

export interface UseAuthReturn extends AuthState {
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: any }>;
}

export function useAuth(): UseAuthReturn {
  const supabase = createClient();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
  });

  const fetchAuthStatus = useCallback(async () => {
    try {
      // Usar directamente el cliente de Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session?.user) {
        setAuthState({
          user: null,
          profile: null,
          loading: false,
          error: null,
        });
        return;
      }

      // Obtener el perfil del usuario
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, email, name, role')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Error obteniendo perfil:', profileError);
      }

      const newState = {
        user: session.user,
        profile: profile || null,
        loading: false,
        error: null,
      };

      setAuthState(newState);
    } catch (error) {
      console.error('Error al obtener estado de autenticación:', error);
      setAuthState({
        user: null,
        profile: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }, [supabase]);

  useEffect(() => {
    // Ejecutar fetchAuthStatus de forma inmediata
    (async () => {
      try {
        await fetchAuthStatus();
      } catch (error) {
        console.error('Error en fetchAuthStatus:', error);
      }
    })();
    
    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        
        if (session?.user) {
          // Obtener el perfil cuando hay una sesión
          const { data: profile } = await supabase
            .from('users')
            .select('id, email, name, role')
            .eq('id', session.user.id)
            .single();

          setAuthState({
            user: session.user,
            profile: profile || null,
            loading: false,
            error: null,
          });
        } else {
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            error: null,
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchAuthStatus, supabase]);

  const signIn = async (email: string, password: string) => {
    // Implementación simplificada - redirigir a API
    return { error: { message: 'Usar formulario de login' } };
  };

  const signUp = async (email: string, password: string, userData: any) => {
    // Implementación simplificada - redirigir a API
    return { error: { message: 'Usar formulario de registro' } };
  };

  const signOut = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      setAuthState({
        user: null,
        profile: null,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      setAuthState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error al cerrar sesión',
      }));
    }
  };

  const resetPassword = async (email: string) => {
    // Implementación simplificada
    return { error: { message: 'Usar formulario de reset' } };
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    // Implementación simplificada
    return { error: { message: 'Usar formulario de perfil' } };
  };

  return {
    ...authState,
    isAuthenticated: !!authState.user,
    signIn,
    signOut,
    signUp,
    resetPassword,
    updateProfile,
  };
}