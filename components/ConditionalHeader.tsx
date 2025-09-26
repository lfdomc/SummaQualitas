'use client';

import { useAuthContext } from '@/lib/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/Header';
import { UserMenu } from '@/components/UserMenu';

// Rutas públicas donde se debe mostrar el header público
const PUBLIC_ROUTES = new Set([
  '/',
  '/login',
  '/register',
  '/auth/sign-up',
  '/auth/forgot-password',
  '/auth/confirm',
  '/auth/error',
  '/auth/sign-up-success',
  '/auth/update-password',
  '/about',
  '/nosotros',
  '/contact',
  '/contacto',
  '/services',
  '/servicios',
  '/cotizacion',
  '/proyectos',
]);

export function ConditionalHeader() {
  const { user, loading } = useAuthContext();
  const pathname = usePathname();



  // Si está cargando, no mostrar nada para evitar parpadeo
  if (loading) {
    return null;
  }

  // En rutas públicas, mostrar header público
  if (PUBLIC_ROUTES.has(pathname)) {
    return (
      <>
        <Header />
        <UserMenu />
      </>
    );
  }

  // En rutas privadas, no mostrar nada (las páginas con sidebar no necesitan UserMenu)
  if (user) {
    return null;
  }

  // Si no hay usuario en ruta privada, no mostrar header
  return null;
}