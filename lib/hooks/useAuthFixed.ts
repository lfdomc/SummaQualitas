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

export function useAuthFixed(): UseAuthReturn {
  console.log('🎯 [useAuthFixed] HOOK EJECUTÁNDOSE - Inicio del hook');
  
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: false, // Empezamos con loading: false
    error: null,
  });

  console.log('🔍 [useAuthFixed] Estado actual:', {
    user: !!authState.user,
    profile: !!authState.profile,
    loading: authState.loading,
    userEmail: authState.user?.email,
    profileRole: authState.profile?.role
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
    console.log('🔄 [useAuthFixed] Iniciando refreshAuth...');
    
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
        console.log('ℹ️ [useAuthFixed] No hay usuario autenticado');
        setAuthState({
          user: null,
          profile: null,
          loading: false,
          error: null,
        });
        return;
      }

      console.log('✅ [useAuthFixed] Usuario encontrado:', session.user.email);

      // Obtener perfil del usuario
      const profile = await fetchUserProfile(session.user.id);

      setAuthState({
        user: session.user,
        profile,
        loading: false,
        error: null,
      });

      console.log('✅ [useAuthFixed] Estado actualizado exitosamente');

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
    console.log('🚀🚀🚀 [useAuthFixed] USEEFFECT EJECUTÁNDOSE - Inicializando...');
    refreshAuth();
  }, [refreshAuth]);

  // Función de login
  const signIn = async (email: string, password: string) => {
    console.log('🔐 [useAuthFixed] Intento de login:', email);
    
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

      console.log('✅ [useAuthFixed] Login exitoso');
      
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
    console.log('👋 [useAuthFixed] Cerrando sesión...');
    
    try {
      await supabase.auth.signOut();
      // El estado se actualizará automáticamente por el listener
    } catch (error) {
      console.error('❌ [useAuthFixed] Error en logout:', error);
    }
  };

  // Función de registro
  const signUp = async (email: string, password: string, userData: any) => {
    console.log('📝 [useAuthFixed] Intento de registro:', email);
    
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

      console.log('✅ [useAuthFixed] Registro exitoso');
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
    console.log('🔑 [useAuthFixed] Reset de contraseña:', email);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        console.error('❌ [useAuthFixed] Error en reset:', error);
        return { error };
      }

      console.log('✅ [useAuthFixed] Reset enviado');
      return { error: null };

    } catch (error) {
      console.error('❌ [useAuthFixed] Error inesperado en reset:', error);
      return { error: { message: error instanceof Error ? error.message : 'Error desconocido' } };
    }
  };

  // Función de actualización de perfil
  const updateProfile = async (updates: Partial<UserProfile>) => {
    console.log('📝 [useAuthFixed] Actualizando perfil...');
    
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

      console.log('✅ [useAuthFixed] Perfil actualizado');
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