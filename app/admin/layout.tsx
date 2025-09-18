'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  Settings,
  Users,
  Shield,
  Database,
  Activity,
  AlertTriangle,
  ChevronRight,
  Home,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminNavigationItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge?: string;
}

const adminNavigation: AdminNavigationItem[] = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: Activity,
    description: 'Panel principal administrativo'
  },
  {
    title: 'Gestión de Usuarios',
    href: '/admin/users',
    icon: Users,
    description: 'Administrar usuarios y roles'
  },
  {
    title: 'Configuración del Sistema',
    href: '/admin/system',
    icon: Settings,
    description: 'Configuraciones generales'
  },
  {
    title: 'Reportes del Sistema',
    href: '/admin/reports',
    icon: FileText,
    description: 'Generación y análisis de reportes'
  },
  {
    title: 'Logs y Auditoría',
    href: '/admin/logs',
    icon: Activity,
    description: 'Monitoreo de actividad y auditoría'
  },
  {
    title: 'Seguridad',
    href: '/admin/security',
    icon: Shield,
    description: 'Configuraciones de seguridad',
    badge: 'Próximamente'
  },
  {
    title: 'Base de Datos',
    href: '/admin/database',
    icon: Database,
    description: 'Gestión de base de datos',
    badge: 'Próximamente'
  }
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    // Verificar si el usuario tiene permisos de administrador
    const hasAdminAccess = user?.role === 'maestro' || user?.role === 'admin';
    setIsAuthorized(hasAdminAccess);
    setLoading(false);
  }, [isAuthenticated, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Acceso Requerido
              </h2>
              <p className="text-gray-600 mb-6">
                Debes iniciar sesión para acceder al panel administrativo.
              </p>
              <Button asChild className="w-full">
                <Link href="/login">Iniciar Sesión</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Acceso Denegado
              </h2>
              <p className="text-gray-600 mb-6">
                No tienes permisos para acceder al panel administrativo.
              </p>
              <div className="space-y-2">
                <Button asChild className="w-full">
                  <Link href="/dashboard">Ir al Dashboard</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/">Ir al Inicio</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center text-muted-foreground hover:text-foreground">
                <Home className="h-4 w-4 mr-1" />
                Dashboard
              </Link>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground font-medium">Administración</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {user?.role === 'maestro' ? 'Usuario Maestro' : 'Administrador'}
              </Badge>
              <span className="text-sm text-muted-foreground">{user?.email}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-card border-r border-border min-h-screen">
          <nav className="p-4">
            <h2 className="text-lg font-semibold text-card-foreground mb-4">Panel Administrativo</h2>
            <ul className="space-y-2">
              {adminNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                const isDisabled = !!item.badge;
                
                return (
                  <li key={item.href}>
                    {isDisabled ? (
                      <div className={cn(
                        "flex items-center px-3 py-2 text-sm rounded-md cursor-not-allowed opacity-50",
                        "text-muted-foreground bg-muted"
                      )}>
                        <Icon className="h-4 w-4 mr-3" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span>{item.title}</span>
                            {item.badge && (
                              <Badge variant="secondary" className="text-xs">
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                        </div>
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center px-3 py-2 text-sm rounded-md transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary border-r-2 border-primary"
                            : "text-card-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4 mr-3" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span>{item.title}</span>
                            {item.badge && (
                              <Badge variant="secondary" className="text-xs">
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                        </div>
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}