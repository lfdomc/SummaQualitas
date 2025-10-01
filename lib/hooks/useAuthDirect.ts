'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useLoginState } from '@/lib/contexts/LoginStateContext';
import { UserRole, UserRoleType } from '@/lib/types';
import { useRouter } from 'next/navigation';

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
  refreshAuth: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
}

export function useAuthDirect(): UseAuthReturn {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true, // Iniciar con loading true para evitar redirecciones prematuras
    error: null,
  });

  const supabase = createClient();
  const { isLoginInProgress } = useLoginState();
  const router = useRouter();
  const initialized = useRef(false);



  // Función para verificar autenticación (optimizada para un solo re-render)
  const refreshAuth = async () => {
    // Preparar el nuevo estado
    let newAuthState: AuthState = {
      user: null,
      profile: null,
      loading: false,
      error: null,
    };
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        newAuthState.error = error.message;
      } else if (!session?.user) {
        // newAuthState ya está configurado para usuario null
      } else {
        // Obtener el perfil del usuario
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('id, email, name, role')
          .eq('id', session.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          // Error obteniendo perfil
        }
        
        // Configurar estado exitoso
        newAuthState.user = session.user;
        newAuthState.profile = profile || null;
      }
      
    } catch (error) {
      newAuthState.error = error instanceof Error ? error.message : 'Error desconocido';
    }
    
    // Una sola llamada a setAuthState al final
    setAuthState(newAuthState);
  };

  // Ejecutar verificación inicial y configurar listener
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      refreshAuth();
    }

    // Configurar listener para cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          await refreshAuth();
        }
      }
    );

    // Cleanup function
    return () => {
      subscription.unsubscribe();
    };
  }, []); // Solo ejecutar una vez al montar el componente

  const signIn = async (email: string, password: string) => {
    return { error: { message: 'Usar formulario de login' } };
  };

  const signUp = async (email: string, password: string, userData: any) => {
    return { error: { message: 'Usar formulario de registro' } };
  };

  const signOut = async () => {
    try {
      // Verificar si hay una sesión activa antes de intentar cerrarla
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (!session) {
        // No hay sesión activa, solo limpiar el estado local
        setAuthState({
          user: null,
          profile: null,
          loading: false,
          error: null,
        });
        router.push('/');
        return;
      }

      // Hay una sesión activa, proceder con el cierre normal
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        // Si el error es que la sesión no existe, no es un error crítico
        if (!error.message.includes('Auth session missing') && !error.message.includes('session_not_found')) {
          throw error;
        }
      }
      
      // Limpiar estado local independientemente del resultado
      setAuthState({
        user: null,
        profile: null,
        loading: false,
        error: null,
      });

      // Redirigir a la página principal
      router.push('/');
    } catch (error) {
      // Incluso si hay error, limpiar el estado local y redirigir
      // porque el usuario quiere cerrar sesión
      setAuthState({
        user: null,
        profile: null,
        loading: false,
        error: null,
      });
      
      // Redirigir de todas formas
      router.push('/');
    }
  };

  const resetPassword = async (email: string) => {
    return { error: { message: 'Usar formulario de reset' } };
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    return { error: { message: 'Usar formulario de perfil' } };
  };

  const hasRole = (role: UserRole): boolean => {
    return authState.profile?.role === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return authState.profile ? roles.includes(authState.profile.role as UserRole) : false;
  };

  return {
    ...authState,
    isAuthenticated: !!authState.user,
    signIn,
    signOut,
    signUp,
    resetPassword,
    updateProfile,
    refreshAuth,
    hasRole,
    hasAnyRole,
  };
}