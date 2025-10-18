'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function DebugSessionPage() {
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('🔍 [DebugSession] Verificando sesión...');
        const supabase = createClient();
        
        // Verificar sesión actual
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }
        
        console.log('📋 [DebugSession] Datos de sesión:', sessionData);
        setSessionInfo(sessionData);
        
        // Verificar usuario actual
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.warn('⚠️ [DebugSession] Error al obtener usuario:', userError);
        } else {
          console.log('👤 [DebugSession] Datos de usuario:', userData);
          setUserInfo(userData);
        }
        
        // Verificar localStorage
        const localStorageAuth = localStorage.getItem('sb-hypravgvtrlfpepslhmc-auth-token');
        console.log('💾 [DebugSession] LocalStorage auth:', localStorageAuth);
        
      } catch (err: unknown) {
        console.error('❌ [DebugSession] Error:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      
      const supabase = createClient();
      
      console.log('🔐 [DebugSession] Ejecutando login...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'lfdomc@gmail.com',
        password: 'Luimorca22'
      });

      if (error) {
        throw error;
      }

      console.log('✅ [DebugSession] Login exitoso:', data);
      
      // Recargar información de sesión
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (err: unknown) {
      console.error('❌ [DebugSession] Error en login:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      console.log('🚪 [DebugSession] Ejecutando logout...');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      console.log('✅ [DebugSession] Logout exitoso');
      
      // Recargar información de sesión
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (err: unknown) {
      console.error('❌ [DebugSession] Error en logout:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔍 Debug Session</h1>
        
        <div className="grid gap-6">
          {/* Controles */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Controles</h2>
            <div className="flex gap-4">
              <button
                onClick={handleLogin}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Cargando...' : 'Login'}
              </button>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Cargando...' : 'Logout'}
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Recargar
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <h3 className="font-semibold text-red-800">Error:</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Información de Sesión */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Información de Sesión</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(sessionInfo, null, 2)}
            </pre>
          </div>

          {/* Información de Usuario */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Información de Usuario</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(userInfo, null, 2)}
            </pre>
          </div>

          {/* Estado de Autenticación */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Estado de Autenticación</h2>
            <div className="space-y-2">
              <p><strong>Tiene Sesión:</strong> {sessionInfo?.session ? '✅ Sí' : '❌ No'}</p>
              <p><strong>Tiene Usuario:</strong> {userInfo?.user ? '✅ Sí' : '❌ No'}</p>
              <p><strong>Email:</strong> {sessionInfo?.session?.user?.email || 'N/A'}</p>
              <p><strong>ID:</strong> {sessionInfo?.session?.user?.id || 'N/A'}</p>
              <p><strong>Expires At:</strong> {sessionInfo?.session?.expires_at ? new Date(sessionInfo.session.expires_at * 1000).toLocaleString() : 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}