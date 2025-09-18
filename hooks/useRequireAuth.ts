'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { UserRoleType } from '@/lib/types';

interface UseRequireAuthOptions {
  requiredRoles?: UserRoleType[];
  redirectTo?: string;
}

/**
 * Hook que requiere autenticación y opcionalmente roles específicos
 * Redirige automáticamente si no se cumplen los requisitos
 */
export function useRequireAuth(options: UseRequireAuthOptions = {}) {
  const { requiredRoles, redirectTo = '/login' } = options;
  const router = useRouter();
  const { isAuthenticated, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return; // Esperar a que termine de cargar

    // Si no está autenticado, redirigir al login
    if (!isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    // Si se requieren roles específicos y el usuario no los tiene
    if (requiredRoles && profile && !requiredRoles.includes(profile.role)) {
      router.push('/unauthorized');
      return;
    }
  }, [isAuthenticated, profile, loading, requiredRoles, redirectTo, router]);

  return {
    isAuthenticated,
    profile,
    loading,
    isAuthorized: isAuthenticated && (!requiredRoles || (profile && requiredRoles.includes(profile.role)))
  };
}