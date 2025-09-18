import { Metadata } from 'next';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { UserRole } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Crear Cuenta | Summa Qualitas',
  description: 'Regístrate en el sistema de gestión de proyectos de construcción',
};

export default function RegisterPage() {
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
        <RegisterForm 
          allowedRoles={[UserRole.GERENCIA, UserRole.ADMINISTRATIVO, UserRole.CLIENTE]}
          redirectTo="/login"
        />
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          © 2024 Summa Qualitas. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}