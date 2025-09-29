'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface SimpleLoginFormProps {
  redirectTo?: string;
}

export default function SimpleLoginForm({ redirectTo = '/proyectos' }: SimpleLoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSignOut, setLoadingSignOut] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    setLoadingSignOut(true);
    setError('');
    
    try {
      console.log('🚪 [SimpleLogin] Cerrando sesión...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ [SimpleLogin] Error al cerrar sesión:', error);
        setError('Error al cerrar sesión: ' + error.message);
      } else {
        console.log('✅ [SimpleLogin] Sesión cerrada exitosamente');
        setError('');
        // Limpiar formulario
        setEmail('');
        setPassword('');
      }
    } catch (err) {
      console.error('❌ [SimpleLogin] Error inesperado:', err);
      setError('Error inesperado al cerrar sesión');
    } finally {
      setLoadingSignOut(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 [SimpleLogin] Iniciando login básico');
    console.log('📧 [SimpleLogin] Email:', email);
    
    setLoading(true);
    setError('');
    
    // Declarar originalFetch fuera del try para que esté disponible en finally
    let originalFetch: typeof window.fetch;
    
    try {
      // PASO 1: Limpiar cualquier sesión previa
      console.log('🧹 [SimpleLogin] Limpiando sesión previa...');
      const signOutResult = await supabase.auth.signOut();
      console.log('✅ [SimpleLogin] Sesión limpiada:', signOutResult);
      
      // PASO 2: Esperar un momento para evitar conflictos
      console.log('🔄 [SimpleLogin] Esperando 500ms...');
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('⏰ [SimpleLogin] Delay completado, continuando...');
      
      console.log('✅ [SimpleLogin] Sesión previa limpiada');
      
      // Debug de configuración de Supabase
      console.log('🔧 [SimpleLogin] SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log('🔧 [SimpleLogin] SUPABASE_ANON_KEY existe:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      console.log('🔧 [SimpleLogin] SUPABASE_ANON_KEY primeros 20 chars:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20));
      
      // Verificar el cliente de Supabase
      console.log('🔧 [SimpleLogin] Cliente Supabase:', supabase);
      console.log('🔧 [SimpleLogin] Cliente Supabase auth:', supabase.auth);
    
    // Interceptor de red para debug
      originalFetch = window.fetch;
      window.fetch = async (...args) => {
        const [url, options] = args;
        console.log('🌐 [SimpleLogin] Interceptando fetch:', url);
        console.log('🌐 [SimpleLogin] Headers:', options?.headers);
        console.log('🌐 [SimpleLogin] Body:', options?.body);
        
        const response = await originalFetch(...args);
        console.log('🌐 [SimpleLogin] Response status:', response.status);
        console.log('🌐 [SimpleLogin] Response headers:', Object.fromEntries(response.headers.entries()));
        
        return response;
      };
      
      // PASO 2: Realizar el login con sesión limpia
      console.log('🔄 [SimpleLogin] Llamando a signInWithPassword...');
      
      // Timeout de seguridad para evitar cuelgues
      const loginPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: Login tardó más de 15 segundos')), 15000)
      );
      
      const result = await Promise.race([loginPromise, timeoutPromise]);
      
      console.log('✅ [SimpleLogin] Respuesta recibida');
      console.log('📊 [SimpleLogin] Result:', result);
      
      // Nota: fetch se restaurará en el bloque finally
      
      if (result.error) {
        console.error('❌ [SimpleLogin] Error en login:', result.error);
        setError(result.error.message);
        return;
      }
      
      if (result.data.user) {
        console.log('✅ [SimpleLogin] Usuario logueado:', result.data.user.email);
        console.log('🔄 [SimpleLogin] Redirigiendo a:', redirectTo);
        
        // Redirección simple
        window.location.href = redirectTo;
      } else {
        console.error('❌ [SimpleLogin] No se recibió usuario');
        setError('Error: No se pudo obtener información del usuario');
      }
      
    } catch (err) {
      console.error('❌ [SimpleLogin] Error capturado:', err);
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      // Restaurar fetch original en todos los casos
      if (typeof originalFetch !== 'undefined') {
        window.fetch = originalFetch;
      }
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Login Básico
          </h2>
          <p className="text-gray-600 mt-2">
            Versión simplificada para testing
          </p>
          
          {/* Botón de cerrar sesión */}
          <div className="mt-4">
            <button
              type="button"
              onClick={handleSignOut}
              disabled={loadingSignOut || loading}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              {loadingSignOut ? 'Cerrando sesión...' : '🚪 Cerrar Sesión Previa'}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}