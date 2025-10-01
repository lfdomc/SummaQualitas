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

  const startLogin = useCallback((email: string) => {
    setLoginState({
      isLoggingIn: true,
      loginEmail: email,
      shouldPreventRedirects: true,
    });
  }, []);

  const completeLogin = useCallback(() => {
    setLoginState({
      isLoggingIn: false,
      loginEmail: null,
      shouldPreventRedirects: false,
    });
  }, []);

  const cancelLogin = useCallback(() => {
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