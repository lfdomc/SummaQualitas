'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Loader2, Building2, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useLoginState } from '@/lib/contexts/LoginStateContext';
import { logBrowserDiagnostics, checkChromeCompatibility } from '@/lib/utils/chrome-diagnostics';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Formato de email inválido'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export function LoginForm({ onSuccess, redirectTo = '/projects' }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { startLogin, completeLogin, cancelLogin } = useLoginState();
  
  // useRef para mantener el estado del login a través de re-renders
  const loginProcessRef = useRef<{
    isProcessing: boolean;
    shouldContinue: boolean;
  }>({
    isProcessing: false,
    shouldContinue: false
  });
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // useEffect para limpiar el proceso si el componente se desmonta
  useEffect(() => {
    console.log('🔄 [LoginForm] Componente montado');
    
    // TEMPORALMENTE DESACTIVADO: Ejecutar diagnósticos de navegador
    // logBrowserDiagnostics();
    // const compatibility = checkChromeCompatibility();
    
    // if (!compatibility.isCompatible) {
    //   console.warn('⚠️ [LoginForm] Problemas de compatibilidad detectados:', compatibility.issues);
    // }
    
    return () => {
      console.log('🔄 [LoginForm] Componente desmontado');
      // Cancelar cualquier proceso pendiente al desmontar
      loginProcessRef.current.shouldContinue = false;
      loginProcessRef.current.isProcessing = false;
    };
  }, []);

  // useEffect para manejar la redirección después del login exitoso
  useEffect(() => {
    console.log('🔄 [LoginForm] useEffect redirección ejecutado - shouldRedirect:', shouldRedirect);
    
    if (shouldRedirect) {
      console.log('🔄 [LoginForm] useEffect detectó shouldRedirect=true, iniciando redirección...');
      console.log('🔄 [LoginForm] redirectTo:', redirectTo);
      console.log('🔄 [LoginForm] onSuccess:', !!onSuccess);
      
      const handleRedirection = async () => {
        try {
          console.log('🔄 [LoginForm] Verificando sesión de autenticación...');
          
          // Verificar que el usuario esté autenticado
          const { data: { session }, error } = await supabase.auth.getSession();
          
          console.log('🔄 [LoginForm] Resultado de getSession:', {
            hasSession: !!session,
            hasUser: !!session?.user,
            userEmail: session?.user?.email,
            error: error
          });
          
          if (session?.user) {
            console.log('✅ [LoginForm] Usuario autenticado confirmado, redirigiendo a:', redirectTo);
            
            if (onSuccess) {
              console.log('✅ [LoginForm] Llamando onSuccess callback');
              onSuccess();
            } else {
              console.log('🔄 [LoginForm] Ejecutando redirección con window.location.href a:', redirectTo);
              window.location.href = redirectTo;
            }
          } else {
            console.log('⚠️ [LoginForm] No se encontró sesión activa, no se puede redirigir');
            console.log('⚠️ [LoginForm] Reseteando estados...');
            setLoading(false);
            setShouldRedirect(false);
          }
        } catch (error) {
          console.error('❌ [LoginForm] Error durante la redirección:', error);
          setLoading(false);
          setShouldRedirect(false);
        }
      };

      // Pequeño delay para asegurar que el estado de autenticación se haya actualizado
      console.log('🔄 [LoginForm] Programando redirección en 100ms...');
      const timeoutId = setTimeout(handleRedirection, 100);
      
      return () => {
        console.log('🔄 [LoginForm] Limpiando timeout de redirección');
        clearTimeout(timeoutId);
      };
    }
  }, [shouldRedirect, redirectTo, onSuccess]);

  const onSubmit = async (data: LoginFormData) => {
    console.log('🚀 [LoginForm] INICIO DE onSubmit - Función iniciada');
    
    try {
      // Prevenir múltiples submissions
      if (loginProcessRef.current.isProcessing) {
        console.log('⚠️ [LoginForm] Login ya en progreso, ignorando nueva submission');
        return;
      }

      console.log('🔐 [LoginForm] Iniciando login con:', data.email);
    
    // Marcar el inicio del proceso de login en el contexto global
    startLogin(data.email);
    
    try {
      setLoading(true);
      setLoginError('');
      setShouldRedirect(false); // Reset del flag
      
      // Marcar que el proceso de login está en curso
      loginProcessRef.current.isProcessing = true;
      loginProcessRef.current.shouldContinue = false;
      
      console.log('🔐 [LoginForm] Haciendo petición de login...');
      
      let result;
      try {
        console.log('🔄 [LoginForm] Ejecutando supabase.auth.signInWithPassword...');
        result = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        console.log('✅ [LoginForm] POST request completado exitosamente');
        console.log('🚀 [LoginForm] CHECKPOINT 1: Después del POST request');
        
        // Verificar inmediatamente si result existe
        if (!result) {
          console.error('❌ [LoginForm] CRÍTICO: result es null o undefined');
          throw new Error('Resultado del login es null');
        }
        console.log('🚀 [LoginForm] CHECKPOINT 2: result existe');
        console.log('🔍 [LoginForm] Tipo de resultado:', typeof result);
        console.log('🔍 [LoginForm] Resultado tiene data:', !!result?.data);
        console.log('🔍 [LoginForm] Resultado tiene error:', !!result?.error);
      } catch (authError) {
        console.error('❌ [LoginForm] Error en la petición de autenticación:', authError);
        console.error('❌ [LoginForm] Stack trace:', authError?.stack);
        console.error('❌ [LoginForm] Error completo:', JSON.stringify(authError, null, 2));
        setLoginError('Error de conexión durante el login');
        setLoading(false);
        loginProcessRef.current.isProcessing = false;
        cancelLogin();
        return;
      }

      console.log('🎯 [LoginForm] POST completado, iniciando análisis del resultado...');
      try {
        console.log('✅ [LoginForm] Analizando resultado del login...');
        console.log('📊 [LoginForm] Resultado completo de signInWithPassword:', {
          user: result.data.user?.email,
          hasSession: !!result.data.session,
          sessionId: result.data.session?.access_token?.substring(0, 20) + '...',
          error: result.error,
          fullResult: result
        });

        if (result.error) {
          console.error('❌ [LoginForm] Error en login:', result.error);
          setLoginError(result.error.message);
          setLoading(false);
          loginProcessRef.current.isProcessing = false;
          cancelLogin();
          return;
        }

        if (!result.data.user) {
          console.error('❌ [LoginForm] No se recibió usuario en la respuesta');
          setLoginError('Error inesperado: no se recibió información del usuario');
          setLoading(false);
          loginProcessRef.current.isProcessing = false;
          cancelLogin();
          return;
        }

        console.log('🎉 [LoginForm] Validaciones pasadas, usuario y sesión confirmados');

        // Login exitoso
        console.log('✅ [LoginForm] Login exitoso para:', result.data.user?.email);
        
        try {
          // Completar inmediatamente el contexto de login
          console.log('🔄 [LoginForm] Completando contexto de login...');
          completeLogin();
          
          // Finalizar el estado de loading
          console.log('🔄 [LoginForm] Finalizando estado de loading...');
          setLoading(false);
          loginProcessRef.current.isProcessing = false;
          
          // Marcar que debemos redirigir (esto persistirá a través de re-renders)
          console.log('🔄 [LoginForm] Activando redirección inmediatamente...');
          setShouldRedirect(true);
          
          // También intentar redirección directa como backup
          console.log('🔄 [LoginForm] Programando redirección de backup...');
          setTimeout(() => {
            try {
              console.log('🔄 [LoginForm] Backup: verificando si necesitamos redirigir manualmente...');
              console.log('🔄 [LoginForm] Backup: ubicación actual:', window.location.pathname);
              if (window.location.pathname === '/login') {
                console.log('🔄 [LoginForm] Backup: aún en login, redirigiendo manualmente a:', redirectTo);
                window.location.href = redirectTo;
              } else {
                console.log('✅ [LoginForm] Backup: ya no estamos en login, redirección exitosa');
              }
            } catch (backupError) {
              console.error('❌ [LoginForm] Error en redirección de backup:', backupError);
            }
          }, 1000);
          
        } catch (postLoginError) {
          console.error('❌ [LoginForm] Error en proceso post-login:', postLoginError);
          setLoginError('Error procesando el login exitoso');
        }
        
      } catch (processingError) {
        console.error('❌ [LoginForm] Error procesando resultado del login:', processingError);
        console.error('❌ [LoginForm] Stack trace del error de procesamiento:', processingError?.stack);
        console.error('❌ [LoginForm] Error de procesamiento completo:', JSON.stringify(processingError, null, 2));
        setLoginError('Error procesando la respuesta del servidor');
        setLoading(false);
        loginProcessRef.current.isProcessing = false;
        cancelLogin();
      }
      
    } catch (err) {
      console.error('❌ [LoginForm] Error inesperado:', err);
      setLoginError('Error inesperado al iniciar sesión');
      setLoading(false);
      loginProcessRef.current.isProcessing = false;
      // Cancelar el login en el contexto
      cancelLogin();
    }
    
    } catch (globalError) {
      console.error('🚨 [LoginForm] ERROR GLOBAL CAPTURADO:', globalError);
      console.error('🚨 [LoginForm] Stack trace global:', globalError?.stack);
      console.error('🚨 [LoginForm] Error global completo:', JSON.stringify(globalError, null, 2));
      setLoginError('Error crítico en el proceso de login');
      setLoading(false);
      loginProcessRef.current.isProcessing = false;
      cancelLogin();
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              {...register('email')}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('password')}
                className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          {/* Error Alert */}
          {(errors.root || loginError) && (
            <Alert variant="destructive">
              <AlertDescription>
                {errors.root?.message || loginError}
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || loading}
          >
            {isSubmitting || loading ? (
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