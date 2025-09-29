'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

interface LoginState {
  isLoggingIn: boolean;
  loginEmail: string | null;
  shouldPreventRedirects: boolean;
}

interface LoginStateContextType {
  loginState: LoginState;
  startLogin: (email: string) => void;
  completeLogin: () => void;
  cancelLogin: () => void;
  isLoginInProgress: () => boolean;
}

const LoginStateContext = createContext<LoginStateContextType | undefined>(undefined);

interface LoginStateProviderProps {
  children: ReactNode;
}

export function LoginStateProvider({ children }: LoginStateProviderProps) {
  const [loginState, setLoginState] = useState<LoginState>({
    isLoggingIn: false,
    loginEmail: null,
    shouldPreventRedirects: false,
  });

  // TEMPORALMENTE DESACTIVADO: Verificación específica para Chrome
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
      if (isChrome) {
        console.log('🌐 [LoginStateContext] Navegador Chrome detectado - Optimizaciones DESACTIVADAS temporalmente');
      }
    }
  }, []);

  const startLogin = useCallback((email: string) => {
    console.log('🔐 [LoginStateContext] Iniciando proceso de login para:', email);
    setLoginState({
      isLoggingIn: true,
      loginEmail: email,
      shouldPreventRedirects: true,
    });
  }, []);

  const completeLogin = useCallback(() => {
    console.log('✅ [LoginStateContext] Completando proceso de login');
    setLoginState({
      isLoggingIn: false,
      loginEmail: null,
      shouldPreventRedirects: false,
    });
  }, []);

  const cancelLogin = useCallback(() => {
    console.log('❌ [LoginStateContext] Cancelando proceso de login');
    setLoginState({
      isLoggingIn: false,
      loginEmail: null,
      shouldPreventRedirects: false,
    });
  }, []);

  const isLoginInProgress = useCallback(() => {
    return loginState.isLoggingIn;
  }, [loginState.isLoggingIn]);

  const value: LoginStateContextType = {
    loginState,
    startLogin,
    completeLogin,
    cancelLogin,
    isLoginInProgress,
  };

  return (
    <LoginStateContext.Provider value={value}>
      {children}
    </LoginStateContext.Provider>
  );
}

export function useLoginState(): LoginStateContextType {
  const context = useContext(LoginStateContext);
  if (context === undefined) {
    throw new Error('useLoginState must be used within a LoginStateProvider');
  }
  return context;
}