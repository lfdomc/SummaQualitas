'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { type UserRoleType, type UserProfile } from '@/lib/types';

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

interface AuthError {
  message: string;
  code?: string;
}

interface SignUpData {
  name: string;
  role?: UserRoleType;
  [key: string]: string | undefined;
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

// Cache para el perfil del usuario
const profileCache = new Map<string, { profile: UserProfile; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export function useAuthOptimized(): UseAuthReturn {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
  });

  const supabase = createClient();
  const initialized = useRef(false);
  const lastSessionCheck = useRef<number>(0);
  const SESSION_CHECK_INTERVAL = 30 * 1000; // 30 segundos

  // Función optimizada para obtener perfil con caché
  const getProfileFromCache = useCallback(async (userId: string): Promise<UserProfile | null> => {
    const cached = profileCache.get(userId);
    const now = Date.now();

    // Si hay caché válido, usarlo
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      return cached.profile;
    }

    try {
      // Obtener perfil de la base de datos
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, email, name, role, company, avatar_url, is_active, created_at, updated_at, bio, address, department')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('❌ [useAuthOptimized] Error obteniendo perfil:', profileError);
        return null;
      }

      if (profile) {
        // Actualizar caché
        profileCache.set(userId, { profile: profile as UserProfile, timestamp: now });
        return profile as UserProfile;
      }

      return null;
    } catch (error) {
      console.error('❌ [useAuthOptimized] Error inesperado obteniendo perfil:', error);
      return null;
    }
  }, [supabase]);

  // Función optimizada para verificar autenticación
  const refreshAuth = useCallback(async (force = false) => {
    const now = Date.now();
    
    // Evitar verificaciones muy frecuentes a menos que sea forzado
    if (!force && (now - lastSessionCheck.current) < SESSION_CHECK_INTERVAL) {
      return;
    }

    lastSessionCheck.current = now;

    try {
      setAuthState(prev => ({ ...prev, loading: true }));

      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ [useAuthOptimized] Error obteniendo sesión:', error);
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

      // Obtener perfil con caché
      const profile = await getProfileFromCache(session.user.id);
      
      setAuthState({
        user: session.user,
        profile,
        loading: false,
        error: null,
      });

    } catch (error) {
      console.error('❌ [useAuthOptimized] Error inesperado:', error);
      setAuthState({
        user: null,
        profile: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }, [supabase, getProfileFromCache]);

  // Función de login optimizada
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
        return { error };
      }

      if (data.user) {
        // Obtener perfil inmediatamente después del login
        const profile = await getProfileFromCache(data.user.id);
        
        setAuthState({
          user: data.user,
          profile,
          loading: false,
          error: null,
        });
      }

      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return { error: { message: errorMessage } };
    }
  }, [supabase, getProfileFromCache]);

  // Función de logout optimizada
  const signOut = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));

      // Limpiar caché del usuario actual
      if (authState.user?.id) {
        profileCache.delete(authState.user.id);
      }

      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ [useAuthOptimized] Error en signOut:', error);
      }

      setAuthState({
        user: null,
        profile: null,
        loading: false,
        error: null,
      });

      // Forzar refresh completo después del logout manual
      // Usar un pequeño delay para permitir que se complete el signOut
      setTimeout(() => {
        window.location.href = '/?reason=manual_logout';
      }, 100);

    } catch (error) {
      console.error('❌ [useAuthOptimized] Error inesperado en signOut:', error);
      setAuthState({
        user: null,
        profile: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
      
      // Forzar refresh incluso si hay error
      setTimeout(() => {
        window.location.href = '/?reason=manual_logout';
      }, 100);
    }
  }, [supabase, authState.user?.id]);

  // Función de registro
  const signUp = useCallback(async (email: string, password: string, userData: SignUpData) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      });

      if (error) {
        setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
        return { error };
      }

      setAuthState(prev => ({ ...prev, loading: false }));
      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return { error: { message: errorMessage } };
    }
  }, [supabase]);

  // Función para resetear contraseña
  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return { error };
    } catch (error) {
      return { error: { message: error instanceof Error ? error.message : 'Error desconocido' } };
    }
  }, [supabase]);

  // Función para actualizar perfil
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    try {
      if (!authState.user?.id) {
        return { error: { message: 'Usuario no autenticado' } };
      }

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', authState.user.id)
        .select()
        .single();

      if (error) {
        return { error: { message: error.message } };
      }

      // Actualizar caché y estado
      if (data) {
        profileCache.set(authState.user.id, { profile: data as UserProfile, timestamp: Date.now() });
        setAuthState(prev => ({ ...prev, profile: data as UserProfile }));
      }

      return { error: null };
    } catch (error) {
      return { error: { message: error instanceof Error ? error.message : 'Error desconocido' } };
    }
  }, [supabase, authState.user?.id]);

  // Funciones de verificación de roles
  const hasRole = useCallback((role: UserRoleType): boolean => {
    return (authState.profile?.role ?? null) === role;
  }, [authState.profile?.role]);

  const hasAnyRole = useCallback((roles: UserRoleType[]): boolean => {
    return authState.profile?.role ? roles.includes(authState.profile.role as UserRoleType) : false;
  }, [authState.profile?.role]);

  // Ejecutar verificación inicial y configurar listener
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      refreshAuth(true); // Forzar verificación inicial
    }

    // Configurar listener para cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          // Limpiar caché al cerrar sesión
          profileCache.clear();
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            error: null,
          });
        } else if (event === 'SIGNED_IN' && session?.user) {
          // Obtener perfil al iniciar sesión
          const profile = await getProfileFromCache(session.user.id);
          setAuthState({
            user: session.user,
            profile,
            loading: false,
            error: null,
          });
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Mantener el perfil actual al refrescar token
          setAuthState(prev => ({
            ...prev,
            user: session.user,
            loading: false,
          }));
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshAuth, getProfileFromCache, supabase]);

  return {
    ...authState,
    isAuthenticated: !!authState.user,
    signIn,
    signOut,
    signUp,
    resetPassword,
    updateProfile,
    refreshAuth: () => refreshAuth(true),
    hasRole,
    hasAnyRole,
  };
}