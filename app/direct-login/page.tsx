'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function DirectLoginPage() {
  const [status, setStatus] = useState<string>('Iniciando...');
  const [details, setDetails] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const performLogin = async () => {
      try {
        console.log('🚀 Iniciando login directo...');
        setStatus('🔑 Ejecutando login...');
        
        const supabase = createClient();
        
        // Intentar login
        const { data, error } = await supabase.auth.signInWithPassword({
          email: 'lfdomc@gmail.com',
          password: 'Luimorca22'
        });

        if (error) {
          throw error;
        }

        console.log('✅ Login exitoso:', data);
        setStatus('✅ Login exitoso! Verificando sesión...');
        setDetails(JSON.stringify(data, null, 2));

        // Verificar sesión
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        console.log('📋 Sesión verificada:', sessionData);
        setStatus('✅ Sesión establecida! Redirigiendo...');
        
        // Esperar un momento para que la sesión se propague
        setTimeout(() => {
          console.log('🔄 Redirigiendo a /projects...');
          router.push('/projects');
        }, 2000);

      } catch (error: any) {
        console.error('❌ Error en login:', error);
        setStatus(`❌ Error: ${error.message}`);
        setDetails(JSON.stringify(error, null, 2));
        setIsLoading(false);
      }
    };

    performLogin();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">🚀 Direct Login</h1>
        
        <div className={`p-4 rounded-md mb-4 ${
          status.includes('Error') 
            ? 'bg-red-50 text-red-700 border border-red-200'
            : status.includes('exitoso') || status.includes('establecida')
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
        }`}>
          <p className="font-medium">{status}</p>
        </div>

        {details && (
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-medium mb-2">Detalles:</h3>
            <pre className="text-xs overflow-auto max-h-40">
              {details}
            </pre>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
    </div>
  );
}