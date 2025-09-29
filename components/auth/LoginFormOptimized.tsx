'use client';

import { useState, useCallback, useTransition, memo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Formato de email inválido')
    .transform(email => email.toLowerCase().trim()),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
  className?: string;
}

// Componente de campo de entrada optimizado
const OptimizedInput = memo(({ 
  label, 
  type, 
  placeholder, 
  error, 
  register, 
  showToggle = false,
  onToggle,
  showValue = false,
  ...props 
}: any) => (
  <div className="space-y-2">
    <Label htmlFor={props.id} className="text-sm font-medium text-gray-700">
      {label}
    </Label>
    <div className="relative">
      <Input
        type={showToggle ? (showValue ? 'text' : 'password') : type}
        placeholder={placeholder}
        {...register}
        className={cn(
          'transition-all duration-200 focus:ring-2 focus:ring-blue-500/20',
          error ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500',
          showToggle && 'pr-10'
        )}
        {...props}
      />
      {showToggle && (
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          tabIndex={-1}
        >
          {showValue ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
    {error && (
      <p className="text-sm text-red-600 flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        {error.message}
      </p>
    )}
  </div>
));

OptimizedInput.displayName = 'OptimizedInput';

export const LoginFormOptimized = memo(({ 
  onSuccess, 
  redirectTo = '/projects',
  className 
}: LoginFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string>('');
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const supabase = createClient();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur', // Validar al perder el foco para mejor UX
  });

  // Observar cambios en los campos para limpiar errores
  const watchedFields = watch();

  // Limpiar errores cuando el usuario empiece a escribir
  const clearErrors = useCallback(() => {
    if (loginError) {
      setLoginError('');
    }
  }, [loginError]);

  // Función optimizada de login con mejor manejo de errores
  const onSubmit = useCallback(async (data: LoginFormData) => {
    try {
      setLoginError('');
      setLoginSuccess(false);
      
      const startTime = performance.now();
      
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      
      const endTime = performance.now();
      console.log(`🔐 [LoginFormOptimized] Login completado en ${Math.round(endTime - startTime)}ms`);
      
      if (error) {
        // Mapear errores comunes a mensajes más amigables
        const errorMessages: Record<string, string> = {
          'Invalid login credentials': 'Email o contraseña incorrectos',
          'Email not confirmed': 'Por favor confirma tu email antes de iniciar sesión',
          'Too many requests': 'Demasiados intentos. Intenta de nuevo en unos minutos',
          'User not found': 'No existe una cuenta con este email',
        };
        
        const friendlyMessage = errorMessages[error.message] || error.message;
        setLoginError(friendlyMessage);
        return;
      }

      if (authData.user) {
        setLoginSuccess(true);
        
        // Usar transición para navegación más suave
        startTransition(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            router.push(redirectTo);
          }
        });
      }
    } catch (err) {
      console.error('❌ [LoginFormOptimized] Error inesperado:', err);
      setLoginError('Error de conexión. Verifica tu internet e intenta de nuevo.');
    }
  }, [supabase, onSuccess, redirectTo, router]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const isLoading = isSubmitting || isPending;

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      <div className="bg-white shadow-xl rounded-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg"></div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Bienvenido
          </h2>
          <p className="text-gray-600">
            Accede a tu cuenta de gestión de proyectos
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          <OptimizedInput
            id="email"
            label="Email"
            type="email"
            placeholder="tu@email.com"
            register={register('email', { 
              onChange: clearErrors 
            })}
            error={errors.email}
            autoComplete="email"
            autoFocus
          />

          <OptimizedInput
            id="password"
            label="Contraseña"
            placeholder="••••••••"
            register={register('password', { 
              onChange: clearErrors 
            })}
            error={errors.password}
            showToggle
            onToggle={togglePasswordVisibility}
            showValue={showPassword}
            autoComplete="current-password"
          />

          {/* Indicador de éxito */}
          {loginSuccess && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                ¡Login exitoso! Redirigiendo...
              </AlertDescription>
            </Alert>
          )}

          {/* Error Alert */}
          {loginError && (
            <Alert variant="destructive" className="animate-in slide-in-from-top-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {loginError}
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className={cn(
              "w-full h-12 text-base font-medium transition-all duration-200",
              "hover:shadow-lg active:scale-[0.98]",
              loginSuccess && "bg-green-600 hover:bg-green-700"
            )}
            disabled={isLoading || loginSuccess}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Iniciando sesión...
              </>
            ) : loginSuccess ? (
              <>
                <CheckCircle2 className="mr-2 h-5 w-5" />
                ¡Éxito!
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </Button>

          {/* Información adicional */}
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-500">
              ¿Olvidaste tu contraseña?{' '}
              <button
                type="button"
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                onClick={() => {
                  // Aquí podrías abrir un modal de recuperación de contraseña
                  console.log('Recuperar contraseña');
                }}
              >
                Recupérala aquí
              </button>
            </p>
          </div>
        </form>

        {/* Indicador de rendimiento en desarrollo */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-2 bg-gray-50 rounded text-xs text-gray-500 text-center">
            Modo desarrollo - Optimizaciones activas
          </div>
        )}
      </div>
    </div>
  );
});

LoginFormOptimized.displayName = 'LoginFormOptimized';