'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface SimpleLoginFormProps {
  redirectTo?: string;
}

export default function SimpleLoginForm({ redirectTo = '/dashboard' }: SimpleLoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 [SimpleLogin] Iniciando login básico');
    console.log('📧 [SimpleLogin] Email:', email);
    
    // Debug de configuración de Supabase
    console.log('🔧 [SimpleLogin] SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('🔧 [SimpleLogin] SUPABASE_ANON_KEY existe:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    console.log('🔧 [SimpleLogin] SUPABASE_ANON_KEY primeros 20 chars:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20));
    
    // Verificar el cliente de Supabase
    console.log('🔧 [SimpleLogin] Cliente Supabase:', supabase);
    console.log('🔧 [SimpleLogin] Cliente Supabase auth:', supabase.auth);
    
    // Interceptor de red para debug
    const originalFetch = window.fetch;
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
    
    setLoading(true);
    setError('');
    
    try {
      console.log('🔄 [SimpleLogin] Llamando a signInWithPassword...');
      
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log('✅ [SimpleLogin] Respuesta recibida');
      console.log('📊 [SimpleLogin] Result:', result);
      
      // Restaurar fetch original
      window.fetch = originalFetch;
      
      if (result.error) {
        console.error('❌ [SimpleLogin] Error en login:', result.error);
        setError(result.error.message);
        setLoading(false);
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
      setError('Error de conexión');
      // Restaurar fetch original en caso de error también
      window.fetch = originalFetch;
    } finally {
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