'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { useLoginState } from '@/lib/contexts/LoginStateContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

interface LoginFormProps {
  redirectTo?: string;
}

export function LoginForm({ redirectTo = '/projects' }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const router = useRouter();
  const { signIn, loading: authLoading, error: authError, user, isAuthenticated } = useAuthContext();
  const { startLogin } = useLoginState();

  // Verificar si ya hay una sesión activa y redirigir automáticamente
  useEffect(() => {
    if (user && isAuthenticated) {
      router.push(redirectTo);
    }
  }, [user, isAuthenticated, router, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setLocalError('Por favor completa todos los campos');
      return;
    }

    setLocalLoading(true);
    setLocalError('');

    try {
      // Guardar email para mostrarlo inmediatamente en el sidebar
      startLogin(email);

      const { error } = await signIn(email, password);

      if (error) {
        setLocalError(error.message || 'Error durante el login');
        return;
      }
      
      // Navegación de cliente para mantener el contexto y mostrar datos inmediatamente
      router.push(redirectTo);
      
    } catch (err) {
      setLocalError('Error inesperado. Por favor intenta de nuevo.');
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Iniciar Sesión
          </h2>
          <p className="text-gray-600 mt-2">
            Accede a tu cuenta de gestión de proyectos
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
              disabled={localLoading || authLoading}
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
                disabled={localLoading || authLoading}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                disabled={localLoading || authLoading}
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
          {(localError || authError) && (
            <Alert variant="destructive">
              <AlertDescription>
                {localError || authError}
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={localLoading || authLoading || !email || !password}
          >
            {(localLoading || authLoading) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}