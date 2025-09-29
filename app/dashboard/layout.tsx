'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { useEffect, useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, profile, error } = useAuthContext();
  const [timeoutReached, setTimeoutReached] = useState(false);
  const isAuthenticated = !!user;

  // Debug logs para entender el estado
  useEffect(() => {
    console.log('🏠 [DashboardLayout] Estado actual:', {
      loading,
      hasUser: !!user,
      userEmail: user?.email,
      hasProfile: !!profile,
      profileRole: profile?.role,
      error,
      isAuthenticated,
      timeoutReached
    });
  }, [loading, user, profile, error, isAuthenticated, timeoutReached]);

  // Timeout de seguridad para evitar loading infinito
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ [DashboardLayout] Timeout alcanzado - forzando fin de loading');
        setTimeoutReached(true);
      }
    }, 10000); // 10 segundos

    return () => clearTimeout(timer);
  }, [loading]);

  // Mostrar loading mientras se verifica la autenticación (con timeout de seguridad)
  if (loading && !timeoutReached) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
          <p className="text-xs text-gray-400 mt-2">
            {error ? `Error: ${error}` : 'Conectando con el servidor...'}
          </p>
        </div>
      </div>
    );
  }

  // Si se alcanzó el timeout, mostrar mensaje de error
  if (timeoutReached) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Timeout de Autenticación
          </h2>
          <p className="text-gray-600 mb-6">
            La verificación de autenticación está tomando demasiado tiempo.
          </p>
          <div className="space-x-4">
            <Button onClick={() => window.location.reload()}>
              Reintentar
            </Button>
            <Button variant="outline" asChild>
              <Link href="/login">Ir a Login</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Acceso Requerido
          </h2>
          <p className="text-gray-600 mb-6">
            Debes iniciar sesión para acceder al dashboard.
          </p>
          <Button asChild>
            <Link href="/login">Iniciar Sesión</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
    </>
  );
}