'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useLoginState } from '@/lib/contexts/LoginStateContext';
import { UserRole, UserRoleType } from '@/lib/types';

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
  const initialized = useRef(false);



  // Función para verificar autenticación (optimizada para un solo re-render)
  const refreshAuth = async () => {
    console.log('🔄 [useAuthDirect] refreshAuth iniciado');
    
    // Preparar el nuevo estado
    let newAuthState: AuthState = {
      user: null,
      profile: null,
      loading: false,
      error: null,
    };
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      console.log('🔍 [useAuthDirect] Resultado de getSession:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userEmail: session?.user?.email,
        error: error?.message
      });
      
      if (error) {
        console.error('❌ [useAuthDirect] Error obteniendo sesión:', error);
        newAuthState.error = error.message;
      } else if (!session?.user) {
        console.log('❌ [useAuthDirect] No hay sesión o usuario');
        // newAuthState ya está configurado para usuario null
      } else {
        console.log('✅ [useAuthDirect] Usuario autenticado:', session.user.email);
        
        // Obtener el perfil del usuario
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('id, email, name, role')
          .eq('id', session.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('❌ [useAuthDirect] Error obteniendo perfil:', profileError);
        }
        
        // Configurar estado exitoso
        newAuthState.user = session.user;
        newAuthState.profile = profile || null;
      }
      
    } catch (error) {
      console.error('❌ [useAuthDirect] Error inesperado:', error);
      newAuthState.error = error instanceof Error ? error.message : 'Error desconocido';
    }
    
    // Una sola llamada a setAuthState al final
    console.log('🔄 [useAuthDirect] Estableciendo estado final - UN SOLO RE-RENDER');
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
        console.log('🔄 [useAuthDirect] Auth state changed:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          console.log('🔄 [useAuthDirect] Ejecutando refreshAuth debido a:', event);
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
      console.error('❌ [useAuthDirect] Error al cerrar sesión:', error);
      setAuthState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error al cerrar sesión',
      }));
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