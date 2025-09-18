'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth, UseAuthReturn } from '@/lib/hooks/useAuth';

const AuthContext = createContext<UseAuthReturn | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const authState = useAuth();

  console.log('🔍 [AuthContext] Estado actual:', {
    user: authState.user ? { id: authState.user.id, email: authState.user.email } : null,
    profile: authState.profile,
    loading: authState.loading,
    error: authState.error,
    isAuthenticated: authState.isAuthenticated
  });

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): UseAuthReturn {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext debe ser usado dentro de un AuthProvider');
  }
  return context;
}

// HOC para proteger rutas
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredRoles?: string[]
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, profile, loading } = useAuthContext();

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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
              Debes iniciar sesión para acceder a esta página.
            </p>
            <a
              href="/login"
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Iniciar Sesión
            </a>
          </div>
        </div>
      );
    }

    if (requiredRoles && profile && !requiredRoles.includes(profile.role)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Acceso Denegado
            </h2>
            <p className="text-gray-600">
              No tienes permisos para acceder a esta página.
            </p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

// Componente para proteger contenido basado en roles
interface ProtectedContentProps {
  children: ReactNode;
  roles?: string[];
  fallback?: ReactNode;
}

export function ProtectedContent({ 
  children, 
  roles, 
  fallback = null 
}: ProtectedContentProps) {
  const { profile, isAuthenticated } = useAuthContext();

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  if (roles && profile && !roles.includes(profile.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}