'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

interface SimpleLoginFormProps {
  redirectTo?: string;
}

export function SimpleLoginForm({ redirectTo = '/projects' }: SimpleLoginFormProps) {
  const [email, setEmail] = useState('lfdomc@gmail.com'); // Pre-llenar con credenciales conocidas
  const [password, setPassword] = useState('Luimorca22');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoLogin, setAutoLogin] = useState(true);
  const router = useRouter();

  // Auto-login al cargar la página
  useEffect(() => {
    if (autoLogin) {
      console.log('🚀 [SimpleLoginForm] Ejecutando auto-login...');
      handleLogin();
      setAutoLogin(false);
    }
  }, [autoLogin]);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('🔐 [SimpleLoginForm] Iniciando login...');
      const supabase = createClient();
      
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('❌ [SimpleLoginForm] Error de autenticación:', authError.message);
        setError(authError.message);
        return;
      }

      if (data.user) {
        console.log('✅ [SimpleLoginForm] Login exitoso:', data.user.email);
        setSuccess('Login exitoso! Redirigiendo...');
        
        // Esperar un momento para que la sesión se propague
        setTimeout(() => {
          console.log('🔄 [SimpleLoginForm] Redirigiendo a:', redirectTo);
          router.push(redirectTo);
        }, 1500);
      }

    } catch (err: any) {
      console.error('💥 [SimpleLoginForm] Error inesperado:', err);
      setError(err.message || 'Error inesperado durante el login');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleLogin();
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Login Simplificado
          </h2>
          <p className="text-gray-600 mt-2">
            Accede a tu cuenta (versión de prueba)
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <AlertDescription>
                {success}
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={loading || !email || !password}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-500">
          <p>Credenciales de prueba pre-cargadas</p>
        </div>
      </div>
    </div>
  );
}