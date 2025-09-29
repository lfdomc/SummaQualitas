import { Metadata } from 'next';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Iniciar Sesión | Summa Qualitas',
  description: 'Accede a tu cuenta de gestión de proyectos de construcción',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Summa Qualitas
          </h1>
          <p className="text-gray-600">
            Sistema de Gestión de Proyectos de Construcción
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <LoginForm redirectTo="/proyectos" />
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          © 2024 Summa Qualitas. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}