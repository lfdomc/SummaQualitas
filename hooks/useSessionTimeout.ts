'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface UseSessionTimeoutOptions {
  timeoutMinutes?: number;
  warningMinutes?: number;
  onWarning?: () => void;
  onTimeout?: () => void;
  enabled?: boolean;
}

export function useSessionTimeout({
  timeoutMinutes = 20,
  warningMinutes = 5,
  onWarning,
  onTimeout,
  enabled = true
}: UseSessionTimeoutOptions = {}) {
  const router = useRouter();
  const supabase = createClient();
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Función para cerrar sesión
  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      
      // Limpiar localStorage
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] + '-auth-token');
      
      // Ejecutar callback personalizado si existe
      if (onTimeout) {
        onTimeout();
      }
      
      // Redirigir al login
      router.push('/login?reason=session_timeout');
    } catch (error) {
      console.error('Error al cerrar sesión por timeout:', error);
      // Forzar redirección incluso si hay error
      router.push('/login?reason=session_timeout');
    }
  }, [supabase, router, onTimeout]);

  // Función para mostrar advertencia
  const handleWarning = useCallback(() => {
    if (onWarning) {
      onWarning();
    } else {
      // Advertencia por defecto
      const shouldContinue = window.confirm(
        `Tu sesión expirará en ${warningMinutes} minutos por inactividad. ¿Deseas continuar?`
      );
      
      if (shouldContinue) {
        resetTimeout();
      } else {
        handleLogout();
      }
    }
  }, [onWarning, warningMinutes]);

  // Función para reiniciar el timeout
  const resetTimeout = useCallback(() => {
    if (!enabled) return;

    // Limpiar timeouts existentes
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
    }

    // Actualizar última actividad
    lastActivityRef.current = Date.now();

    // Configurar nuevo timeout para advertencia
    const warningTime = (timeoutMinutes - warningMinutes) * 60 * 1000;
    warningRef.current = setTimeout(handleWarning, warningTime);

    // Configurar nuevo timeout para logout
    const timeoutTime = timeoutMinutes * 60 * 1000;
    timeoutRef.current = setTimeout(handleLogout, timeoutTime);
  }, [enabled, timeoutMinutes, warningMinutes, handleWarning, handleLogout]);

  // Función para verificar si la sesión está activa
  const checkSession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // No hay sesión, redirigir al login
        router.push('/login?reason=no_session');
        return false;
      }

      // Verificar si el token está próximo a expirar
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = session.expires_at || 0;
      const timeUntilExpiry = expiresAt - now;

      // Si queda menos de 5 minutos, intentar renovar
      if (timeUntilExpiry < 300) {
        const { data: { session: newSession }, error } = await supabase.auth.refreshSession();
        
        if (error || !newSession) {
          console.warn('No se pudo renovar la sesión:', error);
          router.push('/login?reason=session_expired');
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error verificando sesión:', error);
      return false;
    }
  }, [supabase, router]);

  // Eventos que reinician el timeout
  const activityEvents = [
    'mousedown',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart',
    'click',
    'focus'
  ];

  // Manejador de eventos de actividad
  const handleActivity = useCallback(() => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;
    
    // Solo reiniciar si han pasado al menos 30 segundos desde la última actividad
    // Esto evita reiniciar el timeout constantemente
    if (timeSinceLastActivity > 30000) {
      resetTimeout();
    }
  }, [resetTimeout]);

  useEffect(() => {
    if (!enabled) return;

    // Verificar sesión inicial
    checkSession();

    // Configurar timeout inicial
    resetTimeout();

    // Agregar event listeners para actividad del usuario
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Verificar sesión periódicamente (cada 5 minutos)
    const sessionCheckInterval = setInterval(checkSession, 5 * 60 * 1000);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningRef.current) {
        clearTimeout(warningRef.current);
      }
      
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      clearInterval(sessionCheckInterval);
    };
  }, [enabled, resetTimeout, handleActivity, checkSession]);

  // Función para extender la sesión manualmente
  const extendSession = useCallback(() => {
    resetTimeout();
  }, [resetTimeout]);

  // Función para obtener tiempo restante
  const getTimeRemaining = useCallback(() => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;
    const timeoutMs = timeoutMinutes * 60 * 1000;
    const remaining = timeoutMs - timeSinceLastActivity;
    
    return Math.max(0, Math.floor(remaining / 1000));
  }, [timeoutMinutes]);

  return {
    extendSession,
    getTimeRemaining,
    resetTimeout
  };
}