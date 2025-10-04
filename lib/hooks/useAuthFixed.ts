'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { UserRole, UserRoleType } from '@/lib/types';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthError {
  message: string;
  code?: string;
}

interface SignUpData {
  name: string;
  role?: string;
  [key: string]: string | undefined;
}

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

export interface UseAuthReturn extends AuthState {
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, userData: SignUpData) => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: AuthError | null }>;
  refreshAuth: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
}

export function useAuthFixed(): UseAuthReturn {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: false, // Empezamos con loading: false
    error: null,
  });

  const supabase = useMemo(() => createClient(), []);

  // Función para obtener el perfil del usuario
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name, role')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('⚠️ [useAuthFixed] Error obteniendo perfil:', error.message);
        return null;
      }

      return data;
    } catch (err) {
      console.warn('⚠️ [useAuthFixed] Error inesperado obteniendo perfil:', err);
      return null;
    }
  };

  // Función simplificada para verificar autenticación
  const refreshAuth = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ [useAuthFixed] Error obteniendo sesión:', error);
        setAuthState({
          user: null,
          profile: null,
          loading: false,
          error: error.message,
        });
        return;
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

      // Obtener perfil del usuario
      const profile = await fetchUserProfile(session.user.id);

      setAuthState({
        user: session.user,
        profile,
        loading: false,
        error: null,
      });

    } catch (error) {
      console.error('❌ [useAuthFixed] Error inesperado en refreshAuth:', error);
      setAuthState({
        user: null,
        profile: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }, [supabase]);

  // Efecto de inicialización
  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  // Función de login
  const signIn = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ [useAuthFixed] Error de login:', error);
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: error.message,
        }));
        return { error };
      }
      
      // El estado se actualizará automáticamente por el listener
      return { error: null };

    } catch (error) {
      console.error('❌ [useAuthFixed] Error inesperado en login:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { error: { message: errorMessage } };
    }
  };

  // Función de logout
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      // El estado se actualizará automáticamente por el listener
    } catch (error) {
      console.error('❌ [useAuthFixed] Error en logout:', error);
    }
  };

  // Función de registro
  const signUp = async (email: string, password: string, userData: SignUpData) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      });

      if (error) {
        console.error('❌ [useAuthFixed] Error de registro:', error);
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: error.message,
        }));
        return { error };
      }

      setAuthState(prev => ({ ...prev, loading: false }));
      return { error: null };

    } catch (error) {
      console.error('❌ [useAuthFixed] Error inesperado en registro:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { error: { message: errorMessage } };
    }
  };

  // Función de reset de contraseña
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        console.error('❌ [useAuthFixed] Error en reset:', error);
        return { error };
      }

      return { error: null };

    } catch (error) {
      console.error('❌ [useAuthFixed] Error inesperado en reset:', error);
      return { error: { message: error instanceof Error ? error.message : 'Error desconocido' } };
    }
  };

  // Función de actualización de perfil
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!authState.user) {
      return { error: { message: 'No hay usuario autenticado' } };
    }

    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', authState.user.id);

      if (error) {
        console.error('❌ [useAuthFixed] Error actualizando perfil:', error);
        return { error };
      }

      // Actualizar estado local
      setAuthState(prev => ({
        ...prev,
        profile: prev.profile ? { ...prev.profile, ...updates } : null,
      }));

      return { error: null };

    } catch (error) {
      console.error('❌ [useAuthFixed] Error inesperado actualizando perfil:', error);
      return { error: { message: error instanceof Error ? error.message : 'Error desconocido' } };
    }
  };

  // Funciones de verificación de roles
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