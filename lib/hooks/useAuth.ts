'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { UserProfile } from '@/lib/types/auth';

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
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    const fetchAuthStatus = async () => {
      try {
        console.log('🔍 [useAuth] Obteniendo estado de autenticación desde API...');
        
        const response = await fetch('/api/auth/status', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        console.log('🔍 [useAuth] Respuesta de API:', data);
        
        if (mounted) {
          setAuthState({
            user: data.user,
            profile: data.profile,
            loading: false,
            error: data.error,
          });
        }
      } catch (error) {
        console.error('❌ [useAuth] Error al obtener estado:', error);
        if (mounted) {
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
          });
        }
      }
    };

    // Ejecutar inmediatamente
    fetchAuthStatus();

    // Configurar polling cada 30 segundos para mantener sincronizado
    const interval = setInterval(fetchAuthStatus, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

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
      // Llamar a API de logout
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        setAuthState({
          user: null,
          profile: null,
          loading: false,
          error: null,
        });
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
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