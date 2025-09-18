'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/useAuth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Acceso Requerido
          </h2>
          <p className="text-gray-600 mb-6">
            Debes iniciar sesión para acceder al dashboard.
          </p>
          <Button asChild>
            <Link href="/login">Iniciar Sesión</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
    </>
  );
}