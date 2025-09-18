'use client';

// =====================================================
// PROVEEDOR DE AUTENTICACIÓN
// =====================================================

import { AuthProvider as AuthContextProvider } from '@/lib/contexts/AuthContext';
import { ReactNode } from 'react';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <AuthContextProvider>
      {children}
    </AuthContextProvider>
  );
}

export default AuthProvider;