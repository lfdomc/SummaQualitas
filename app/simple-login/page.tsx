import { SimpleLoginForm } from '@/components/auth/SimpleLoginForm';

export default function SimpleLoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Summa Qualitas - Login Simple
          </h1>
          <p className="text-gray-600">
            Versión simplificada para pruebas
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <SimpleLoginForm redirectTo="/projects" />
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          © 2024 Summa Qualitas. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}