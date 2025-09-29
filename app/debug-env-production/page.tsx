'use client';

import { useEffect, useState } from 'react';

interface EnvStatus {
  NEXT_PUBLIC_SUPABASE_URL: boolean;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: boolean;
  urlValid: boolean;
  keyValid: boolean;
  middlewareWorking: boolean;
}

export default function DebugEnvProduction() {
  const [envStatus, setEnvStatus] = useState<EnvStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkEnvironment = () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      // Verificar si las variables existen
      const hasUrl = !!supabaseUrl;
      const hasKey = !!supabaseAnonKey;

      // Verificar si la URL es válida
      let urlValid = false;
      if (supabaseUrl) {
        try {
          const url = new URL(supabaseUrl);
          urlValid = url.hostname.includes('supabase.co');
        } catch {
          urlValid = false;
        }
      }

      // Verificar si la key tiene formato JWT válido
      let keyValid = false;
      if (supabaseAnonKey) {
        const parts = supabaseAnonKey.split('.');
        keyValid = parts.length === 3 && parts[0].length > 0;
      }

      // Verificar si el middleware está funcionando
      const middlewareWorking = typeof window !== 'undefined' && 
        window.location.pathname === '/debug-env-production';

      setEnvStatus({
        NEXT_PUBLIC_SUPABASE_URL: hasUrl,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: hasKey,
        urlValid,
        keyValid,
        middlewareWorking
      });
      setLoading(false);
    };

    checkEnvironment();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando configuración...</p>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: boolean) => {
    return status ? '✅' : '❌';
  };

  const getStatusColor = (status: boolean) => {
    return status ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            🔍 Diagnóstico de Variables de Entorno - Producción
          </h1>

          <div className="space-y-6">
            {/* Variables de Entorno Básicas */}
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                📋 Variables de Entorno Básicas
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">NEXT_PUBLIC_SUPABASE_URL</span>
                  <span className={`font-bold ${getStatusColor(envStatus?.NEXT_PUBLIC_SUPABASE_URL || false)}`}>
                    {getStatusIcon(envStatus?.NEXT_PUBLIC_SUPABASE_URL || false)} 
                    {envStatus?.NEXT_PUBLIC_SUPABASE_URL ? 'Configurada' : 'No configurada'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
                  <span className={`font-bold ${getStatusColor(envStatus?.NEXT_PUBLIC_SUPABASE_ANON_KEY || false)}`}>
                    {getStatusIcon(envStatus?.NEXT_PUBLIC_SUPABASE_ANON_KEY || false)} 
                    {envStatus?.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Configurada' : 'No configurada'}
                  </span>
                </div>
              </div>
            </div>

            {/* Validación de Formato */}
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                🔍 Validación de Formato
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">URL de Supabase válida</span>
                  <span className={`font-bold ${getStatusColor(envStatus?.urlValid || false)}`}>
                    {getStatusIcon(envStatus?.urlValid || false)} 
                    {envStatus?.urlValid ? 'Formato correcto' : 'Formato incorrecto'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Clave anónima válida</span>
                  <span className={`font-bold ${getStatusColor(envStatus?.keyValid || false)}`}>
                    {getStatusIcon(envStatus?.keyValid || false)} 
                    {envStatus?.keyValid ? 'Formato JWT correcto' : 'Formato incorrecto'}
                  </span>
                </div>
              </div>
            </div>

            {/* Estado del Middleware */}
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                ⚙️ Estado del Middleware
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Middleware funcionando</span>
                  <span className={`font-bold ${getStatusColor(envStatus?.middlewareWorking || false)}`}>
                    {getStatusIcon(envStatus?.middlewareWorking || false)} 
                    {envStatus?.middlewareWorking ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>

            {/* Información de Debug */}
            <div className="border rounded-lg p-6 bg-gray-50">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                🐛 Información de Debug
              </h2>
              <div className="space-y-2 text-sm font-mono">
                <div>
                  <strong>URL actual:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}
                </div>
                <div>
                  <strong>Timestamp:</strong> {new Date().toISOString()}
                </div>
                <div>
                  <strong>User Agent:</strong> {typeof window !== 'undefined' ? navigator.userAgent.substring(0, 50) + '...' : 'N/A'}
                </div>
              </div>
            </div>

            {/* Instrucciones */}
            <div className="border rounded-lg p-6 bg-blue-50">
              <h2 className="text-xl font-semibold mb-4 text-blue-800">
                📝 Instrucciones para Vercel
              </h2>
              <div className="text-sm text-blue-700 space-y-2">
                <p>Si alguna variable aparece como ❌, sigue estos pasos:</p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Ve a tu dashboard de Vercel</li>
                  <li>Selecciona tu proyecto</li>
                  <li>Ve a Settings → Environment Variables</li>
                  <li>Agrega las variables faltantes:</li>
                  <ul className="list-disc list-inside ml-4 mt-2">
                    <li><code>NEXT_PUBLIC_SUPABASE_URL</code></li>
                    <li><code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code></li>
                    <li><code>SUPABASE_SERVICE_ROLE_KEY</code></li>
                  </ul>
                  <li>Redeploy tu aplicación</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}