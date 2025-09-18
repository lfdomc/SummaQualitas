'use client';

import { useAuthContext } from '@/lib/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { Footer } from '@/components/Footer';

// Rutas públicas donde se debe mostrar el footer
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

export function ConditionalFooter() {
  const { user, loading } = useAuthContext();
  const pathname = usePathname();

  // Debug logs
  console.log('🔍 [ConditionalFooter] Debug:', {
    pathname,
    user: user ? { id: user.id, email: user.email } : null,
    loading,
    isPublicRoute: PUBLIC_ROUTES.has(pathname),
    shouldShowFooter: PUBLIC_ROUTES.has(pathname)
  });

  // Si está cargando, no mostrar footer para evitar parpadeo
  if (loading) {
    return null;
  }

  // Mostrar footer SOLO en rutas públicas
  const shouldShowFooter = PUBLIC_ROUTES.has(pathname);

  if (!shouldShowFooter) {
    return null;
  }

  return <Footer />;
}