"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Lock, Loader2, CheckCircle } from "lucide-react";

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = [];
    if (pwd.length < 8) errors.push("Mínimo 8 caracteres");
    if (!/[A-Z]/.test(pwd)) errors.push("Una letra mayúscula");
    if (!/[a-z]/.test(pwd)) errors.push("Una letra minúscula");
    if (!/\d/.test(pwd)) errors.push("Un número");
    return errors;
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // Validate password strength
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      setError(`La contraseña debe tener: ${passwordErrors.join(", ")}`);
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });
      if (error) throw error;
      
      setSuccess("Contraseña actualizada exitosamente");
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ocurrió un error inesperado");
    } finally {
      setIsLoading(false);
    }
  };

  const passwordErrors = validatePassword(password);
  const isPasswordValid = passwordErrors.length === 0 && password.length > 0;
  const isFormValid = isPasswordValid && password === confirmPassword;

  return (
    <div className={cn("flex flex-col gap-4 sm:gap-6 w-full max-w-md mx-auto", className)} {...props}>
      <Card className="border-0 sm:border shadow-none sm:shadow-md">
        <CardHeader className="space-y-2 sm:space-y-4 px-4 sm:px-6 pt-4 sm:pt-6">
          <CardTitle className="text-xl sm:text-2xl text-center font-semibold">
            Actualizar contraseña
          </CardTitle>
          <CardDescription className="text-center text-sm sm:text-base text-muted-foreground">
            Crea una nueva contraseña segura para tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          <form onSubmit={handleUpdatePassword} className="space-y-4 sm:space-y-6">
            {/* New Password Field */}
            <div className="space-y-2">
              <Label 
                htmlFor="password" 
                className="text-sm font-medium text-foreground"
              >
                Nueva contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-12 h-12 text-base mobile-padding focus:ring-2 focus:ring-primary/20"
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent min-h-touch min-w-touch"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="sr-only">
                    {showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  </span>
                </Button>
              </div>
              
              {/* Password Requirements */}
              {password.length > 0 && (
                <div className="space-y-1 text-xs">
                  <p className="text-muted-foreground font-medium">Requisitos de contraseña:</p>
                  <div className="grid grid-cols-1 gap-1">
                    {[
                      { check: password.length >= 8, text: "Mínimo 8 caracteres" },
                      { check: /[A-Z]/.test(password), text: "Una letra mayúscula" },
                      { check: /[a-z]/.test(password), text: "Una letra minúscula" },
                      { check: /\d/.test(password), text: "Un número" },
                    ].map((req, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle 
                          className={`h-3 w-3 ${
                            req.check ? "text-green-500" : "text-muted-foreground"
                          }`} 
                        />
                        <span className={req.check ? "text-green-600" : "text-muted-foreground"}>
                          {req.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label 
                htmlFor="confirmPassword" 
                className="text-sm font-medium text-foreground"
              >
                Confirmar contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-12 h-12 text-base mobile-padding focus:ring-2 focus:ring-primary/20"
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent min-h-touch min-w-touch"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="sr-only">
                    {showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  </span>
                </Button>
              </div>
              
              {/* Password Match Indicator */}
              {confirmPassword.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle 
                    className={`h-3 w-3 ${
                      password === confirmPassword ? "text-green-500" : "text-red-500"
                    }`} 
                  />
                  <span className={password === confirmPassword ? "text-green-600" : "text-red-500"}>
                    {password === confirmPassword ? "Las contraseñas coinciden" : "Las contraseñas no coinciden"}
                  </span>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-3 rounded-md bg-green-50 border border-green-200">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <p className="text-sm text-green-700 font-medium">{success}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-medium min-h-touch transition-all duration-200 hover:scale-[0.98] active:scale-[0.96]" 
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Actualizando...
                </>
              ) : (
                "Actualizar contraseña"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
