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
  console.log('🚀🚀🚀 [useAuthWorking] Hook ejecutándose...');
  
  const [state, setState] = useState<AuthState>(() => {
    console.log('🔧 [useAuthWorking] Inicializando estado...');
    
    // Ejecutar autenticación inmediatamente
    const supabase = createClient();
    console.log('🔍 [useAuthWorking] Cliente Supabase creado');
    
    // Intentar obtener sesión de forma síncrona si es posible
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('🔍 [useAuthWorking] Resultado de sesión:', { hasSession: !!session, error: error?.message });
      
      if (error) {
        console.error('❌ [useAuthWorking] Error:', error.message);
        setState({
          user: null,
          profile: null,
          loading: false,
          isAuthenticated: false
        });
        return;
      }

      if (!session?.user) {
        console.log('ℹ️ [useAuthWorking] No hay sesión activa');
        setState({
          user: null,
          profile: null,
          loading: false,
          isAuthenticated: false
        });
        return;
      }

      console.log('✅ [useAuthWorking] Usuario encontrado:', session.user.email);

      // Obtener perfil
      supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()
        .then(({ data: profile, error: profileError }) => {
          if (profileError) {
            console.error('❌ [useAuthWorking] Error obteniendo perfil:', profileError.message);
          } else {
            console.log('✅ [useAuthWorking] Perfil obtenido:', profile?.email, profile?.role);
          }

          setState({
            user: session.user,
            profile: profile || null,
            loading: false,
            isAuthenticated: true
          });
        });
    });
    
    return {
      user: null,
      profile: null,
      loading: true,
      isAuthenticated: false
    };
  });

  console.log('📊 [useAuthWorking] Estado actual:', {
    hasUser: !!state.user,
    hasProfile: !!state.profile,
    loading: state.loading,
    isAuthenticated: state.isAuthenticated,
    userEmail: state.user?.email,
    profileRole: state.profile?.role
  });

  return state;
}