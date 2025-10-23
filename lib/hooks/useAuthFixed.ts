'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { type UserRoleType, type UserProfile } from '@/lib/types';

interface AuthError {
  message: string;
  code?: string;
}

interface SignUpData {
  name: string;
  role?: UserRoleType;
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
  hasRole: (role: UserRoleType) => boolean;
  hasAnyRole: (roles: UserRoleType[]) => boolean;
}

export function useAuthFixed(): UseAuthReturn {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: false, // Empezamos con loading: false
    error: null,
  });

  const supabase = useMemo(() => createClient(), []);

  // Función para obtener/crear el perfil del usuario
  const fetchUserProfile = async (user: User): Promise<UserProfile | null> => {
    try {
      // Seleccionar solo columnas que existen en public.users
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name, role, company, avatar_url, is_active, created_at, updated_at')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.warn('⚠️ [useAuthFixed] Error obteniendo perfil:', error.message);
      }

      // Si el perfil existe, devolverlo
      if (data) {
        return data as UserProfile;
      }

      // Si no existe, pedir al servidor que lo cree de forma segura (service role)
      const res = await fetch('/api/auth/ensure-profile', { method: 'POST' });
      if (!res.ok) {
        const msg = await res.text().catch(() => res.statusText);
        console.warn('⚠️ [useAuthFixed] No se pudo crear perfil automáticamente vía servidor:', msg);
        return null;
      }

      // Re-intentar obtener el perfil
      const { data: createdProfile, error: refetchError } = await supabase
        .from('users')
        .select('id, email, name, role, company, avatar_url, is_active, created_at, updated_at')
        .eq('id', user.id)
        .maybeSingle();

      if (refetchError) {
        console.warn('⚠️ [useAuthFixed] Error tras crear perfil (re-fetch):', refetchError.message);
        return null;
      }

      return (createdProfile as UserProfile) ?? null;
    } catch (err) {
      console.warn('⚠️ [useAuthFixed] Error inesperado obteniendo/creando perfil:', err);
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

      // Obtener o crear perfil del usuario
      const profile = await fetchUserProfile(session.user);

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
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', authState.user.id)
        .select()
        .single();

      if (error) {
        console.error('❌ [useAuthFixed] Error actualizando perfil:', error);
        return { error };
      }

      // Actualizar estado local
      if (data) {
        setAuthState(prev => ({
          ...prev,
          profile: prev.profile ? { ...prev.profile, ...updates } as UserProfile : data as UserProfile,
        }));
      }

      return { error: null };

    } catch (error) {
      console.error('❌ [useAuthFixed] Error inesperado actualizando perfil:', error);
      return { error: { message: error instanceof Error ? error.message : 'Error desconocido' } };
    }
  };

  // Funciones de verificación de roles
  const hasRole = (role: UserRoleType): boolean => {
    return (authState.profile?.role ?? null) === role;
  };

  const hasAnyRole = (roles: UserRoleType[]): boolean => {
    return authState.profile?.role ? roles.includes(authState.profile.role as UserRoleType) : false;
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