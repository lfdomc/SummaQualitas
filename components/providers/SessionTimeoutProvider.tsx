'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { SessionTimeoutWarning } from '@/components/auth/SessionTimeoutWarning';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SessionTimeoutProviderProps {
  children: React.ReactNode;
  timeoutMinutes?: number;
  warningMinutes?: number;
  enabled?: boolean;
}

export function SessionTimeoutProvider({
  children,
  timeoutMinutes = 20,
  warningMinutes = 5,
  enabled = true
}: SessionTimeoutProviderProps) {
  const [showWarning, setShowWarning] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleWarning = useCallback(() => {
    setShowWarning(true);
  }, []);

  const handleTimeout = useCallback(async () => {
    setShowWarning(false);
    
    try {
      await supabase.auth.signOut();
      
      toast({
        title: "Sesión Expirada",
        description: "Tu sesión ha expirado por inactividad. Por favor, inicia sesión nuevamente.",
        variant: "destructive",
      });
      
      router.push('/login?reason=session_timeout');
    } catch (error) {
      console.error('Error al cerrar sesión por timeout:', error);
      router.push('/login?reason=session_timeout');
    }
  }, [supabase, router]);

  const { extendSession, resetTimeout } = useSessionTimeout({
    timeoutMinutes,
    warningMinutes,
    onWarning: handleWarning,
    onTimeout: handleTimeout,
    enabled
  });

  const handleExtendSession = useCallback(() => {
    setShowWarning(false);
    extendSession();
    
    toast({
      title: "Sesión Extendida",
      description: `Tu sesión se ha extendido por ${timeoutMinutes} minutos más.`,
    });
  }, [extendSession, timeoutMinutes]);

  const handleLogoutFromWarning = useCallback(async () => {
    setShowWarning(false);
    
    try {
      await supabase.auth.signOut();
      
      toast({
        title: "Sesión Cerrada",
        description: "Has cerrado sesión exitosamente.",
      });
      
      router.push('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      router.push('/login');
    }
  }, [supabase, router]);

  return (
    <>
      {children}
      <SessionTimeoutWarning
        isOpen={showWarning}
        onExtend={handleExtendSession}
        onLogout={handleLogoutFromWarning}
        warningMinutes={warningMinutes}
      />
    </>
  );
}