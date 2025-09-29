'use client';

export default function DebugEnvPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">🔍 Diagnóstico de Variables de Entorno</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h2 className="font-semibold text-lg mb-2">NEXT_PUBLIC_SUPABASE_URL</h2>
          <p className="text-sm text-gray-600 mb-2">Estado:</p>
          {supabaseUrl ? (
            <div>
              <span className="text-green-600">✅ Configurada</span>
              <p className="text-sm mt-1 font-mono bg-gray-100 p-2 rounded">{supabaseUrl}</p>
            </div>
          ) : (
            <span className="text-red-600">❌ No configurada</span>
          )}
        </div>

        <div className="p-4 border rounded-lg">
          <h2 className="font-semibold text-lg mb-2">NEXT_PUBLIC_SUPABASE_ANON_KEY</h2>
          <p className="text-sm text-gray-600 mb-2">Estado:</p>
          {supabaseAnonKey ? (
            <div>
              <span className="text-green-600">✅ Configurada</span>
              <p className="text-sm mt-1 font-mono bg-gray-100 p-2 rounded">
                {supabaseAnonKey.substring(0, 20)}...{supabaseAnonKey.substring(supabaseAnonKey.length - 10)}
              </p>
            </div>
          ) : (
            <span className="text-red-600">❌ No configurada</span>
          )}
        </div>

        <div className="p-4 border rounded-lg">
          <h2 className="font-semibold text-lg mb-2">Test de Conexión</h2>
          <button 
            onClick={async () => {
              try {
                const { createClient } = await import('@/lib/supabase/client');
                const supabase = createClient();
                console.log('🔗 Cliente de Supabase creado:', supabase);
                
                // Test básico de conexión
                const { data, error } = await supabase.auth.getSession();
                console.log('📋 Sesión actual:', { data, error });
                
                alert('Test completado. Revisa la consola para más detalles.');
              } catch (error) {
                console.error('❌ Error en test de conexión:', error);
                alert('Error en test de conexión. Revisa la consola.');
              }
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Probar Conexión
          </button>
        </div>

        <div className="p-4 border rounded-lg bg-yellow-50">
          <h2 className="font-semibold text-lg mb-2">💡 Instrucciones</h2>
          <ul className="text-sm space-y-1">
            <li>• Si las variables no están configuradas, verifica que el archivo <code>.env.local</code> existe</li>
            <li>• Asegúrate de que el servidor de desarrollo se reinició después de cambiar las variables</li>
            <li>• Las variables deben empezar con <code>NEXT_PUBLIC_</code> para estar disponibles en el frontend</li>
          </ul>
        </div>
      </div>
    </div>
  );
}