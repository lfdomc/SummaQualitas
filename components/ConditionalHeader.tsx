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

  // Debug logs
  console.log('🔍 [ConditionalHeader] Estado:', {
    pathname,
    hasUser: !!user,
    userEmail: user?.email,
    loading,
    isPublicRoute: PUBLIC_ROUTES.has(pathname)
  });

  // Si está cargando, no mostrar nada para evitar parpadeo
  if (loading) {
    console.log('⏳ [ConditionalHeader] Loading - no mostrar header');
    return null;
  }

  // En rutas públicas, SIEMPRE mostrar header público (independientemente del estado de autenticación)
  if (PUBLIC_ROUTES.has(pathname)) {
    console.log('✅ [ConditionalHeader] Ruta pública - mostrar header');
    return (
      <>
        <Header />
        <UserMenu />
      </>
    );
  }

  // En rutas privadas con usuario logueado, no mostrar header (las páginas con sidebar no lo necesitan)
  if (user) {
    console.log('🔒 [ConditionalHeader] Usuario logueado en ruta privada - no mostrar header');
    return null;
  }

  // Si no hay usuario en ruta privada, no mostrar header (se redirigirá al login)
  console.log('❌ [ConditionalHeader] Sin usuario en ruta privada - no mostrar header');
  return null;
}