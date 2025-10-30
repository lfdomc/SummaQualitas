'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useMobileClasses } from '@/hooks/useMobileState';
import { MobileMenu } from '@/components/MobileMenu';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  DashboardSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/dashboard/DashboardSidebar';
import {
  LayoutDashboard,
  FolderOpen,
  Receipt,
  Wrench,
  BarChart3,
  FileText,
  Bell,
  Settings,
  Users,
  LogOut,
  Building,
  TrendingUp,
  PieChart,
  DollarSign,
  Truck,
  FileEdit,
  Menu,
  Package,
} from 'lucide-react';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface NavigationItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  roles?: string[];
}

interface NavigationGroup {
  label: string;
  items: NavigationItem[];
}

const navigationGroups: NavigationGroup[] = [
  {
    label: 'Principal',
    items: [
      {
        title: 'Dashboard Ejecutivo',
        href: '/dashboard/executive',
        icon: TrendingUp,
        roles: ['gerencia'],
      },
    ],
  },
  {
    label: 'Gestión de Proyectos',
    items: [
      {
        title: 'Proyectos',
        href: '/projects',
        icon: FolderOpen,
        roles: ['cliente', 'gerencia', 'administrativo', 'operativo'],
      },
      {
        title: 'Órdenes de Cambio',
        href: '/change-orders',
        icon: FileEdit,
        roles: ['gerencia', 'administrativo', 'operativo'],
      },
      {
        title: 'Análisis y KPIs',
        href: '/analytics',
        icon: BarChart3,
        roles: ['cliente', 'gerencia', 'administrativo', 'operativo'],
      },
    ],
  },
  {
    label: 'Operaciones',
    items: [
      {
        title: 'Ingresos',
        href: '/incomes',
        icon: Receipt,
        roles: ['cliente', 'gerencia', 'administrativo', 'operativo'],
      },
      {
        title: 'Gastos',
        href: '/expenses',
        icon: DollarSign,
        roles: ['cliente', 'gerencia', 'administrativo', 'operativo'],
      },
      {
        title: 'Proveedores',
        href: '/suppliers',
        icon: Truck,
        roles: ['cliente', 'gerencia', 'administrativo', 'operativo'],
      },
      {
        title: 'Equipos',
        href: '/equipment',
        icon: Wrench,
        roles: ['cliente', 'gerencia', 'administrativo', 'operativo'],
      },
      {
        title: 'Sumitals',
        href: '/sumitals',
        icon: Package,
        roles: ['cliente', 'gerencia', 'administrativo', 'operativo'],
      },
    ],
  },
  {
    label: 'Reportes y Análisis',
    items: [
      {
        title: 'Generador de Reportes',
        href: '/reports',
        icon: FileText,
        roles: ['cliente', 'gerencia', 'administrativo', 'operativo'],
      },
      {
        title: 'Historial de Reportes',
        href: '/reports/history',
        icon: PieChart,
        roles: ['cliente', 'gerencia', 'administrativo', 'operativo'],
      },
    ],
  },
  {
    label: 'Sistema',
    items: [
      {
        title: 'Centro de Alertas',
        href: '/alerts',
        icon: Bell,
        roles: ['cliente', 'gerencia', 'administrativo', 'operativo'],
      },
      {
        title: 'Configuración',
        href: '/settings',
        icon: Settings,
        roles: ['cliente', 'gerencia', 'administrativo', 'operativo'],
      },
    ],
  },
];

// Rutas públicas donde no se debe mostrar el sidebar
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

interface GlobalSidebarProps {
  children: React.ReactNode;
}

// Componente interno que maneja el cierre automático del menú móvil
function SidebarContentWithAutoClose({ 
  filteredNavigationGroups, 
  pathname, 
  profile, 
  handleLogout, 
  isLoggingOut 
}: {
  filteredNavigationGroups: NavigationGroup[];
  pathname: string;
  profile: { role?: string; name?: string; email?: string } | null;
  handleLogout: () => void;
  isLoggingOut: boolean;
}) {
  const { isMobile, setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    // Cerrar el menú móvil cuando se hace clic en un enlace
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <Building className="h-6 w-6 text-blue-600" />
          <div className="flex flex-col">
            <span className="font-semibold text-sm">Summa Qualitas</span>
            <span className="text-xs text-muted-foreground">Sistema de Gestión</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        {filteredNavigationGroups.map((group, groupIndex) => (
          <SidebarGroup key={groupIndex}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item, itemIndex) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  
                  return (
                    <SidebarMenuItem key={itemIndex}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.href} onClick={handleLinkClick}>
                          <Icon className="h-4 w-4" />
                          <span>{item.title}</span>
                          {item.badge && (
                            <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 ml-auto">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-1 text-sm">
              <Users className="h-4 w-4" />
              <div className="flex flex-col">
                <span className="font-medium">{profile?.name || 'Usuario'}</span>
                <span className="text-xs text-muted-foreground">
                  {profile?.role === 'gerencia' ? 'Gerencia' :
                   profile?.role === 'administrativo' ? 'Administrativo' :
                   profile?.role === 'operativo' ? 'Operativo' : 'Cliente'}
                </span>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              <span>{isLoggingOut ? 'Cerrando...' : 'Cerrar Sesión'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}

export function GlobalSidebar({ children }: GlobalSidebarProps) {
  const { user, profile, loading, isAuthenticated } = useAuthContext();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { containerClass, textClass, paddingClass } = useMobileClasses();
  
  // El componente MobileMenu maneja su propio estado y cierre automático

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }
    
    setIsLoggingOut(true);
    
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast.error('Error al cerrar sesión');
        setIsLoggingOut(false);
        return;
      }
      
      toast.success('Sesión cerrada exitosamente');
      
      // Forzar refresh completo después del logout manual
      setTimeout(() => {
        window.location.href = '/?reason=manual_logout';
      }, 1000); // Dar tiempo para que se muestre el toast
      
    } catch (error) {
      toast.error('Error inesperado al cerrar sesión');
      setIsLoggingOut(false);
      
      // Forzar refresh incluso si hay error
      setTimeout(() => {
        window.location.href = '/?reason=manual_logout';
      }, 1000);
    }
  };

  // Filtrar elementos de navegación basado en roles
  const getFilteredNavigationGroups = () => {
    if (!profile) {
      return navigationGroups;
    }
    
    return navigationGroups.map(group => ({
      ...group,
      items: group.items.filter(item => {
        if (!item.roles || item.roles.length === 0) {
          return true;
        }
        return item.roles.includes(profile.role || '');
      })
    })).filter(group => group.items.length > 0);
  };

  // Redirigir usuarios autenticados desde la página principal al dashboard
  useEffect(() => {
    if (user && !loading && pathname === '/') {
      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, loading, pathname, router]);

  // No mostrar sidebar en rutas públicas
  if (PUBLIC_ROUTES.has(pathname)) {
    return <>{children}</>;
  }

  // Fallback: mostrar siempre la barra superior con el botón de menú, incluso si
  // el usuario no está autenticado o el estado está en loading, para una UX consistente
  if (!user || loading) {
    return (
      <SidebarProvider>
        <div className="relative flex min-h-screen w-full flex-1 overflow-hidden">
          <SidebarInset className="flex flex-col min-h-0 flex-1">
            <header className="flex h-14 sm:h-16 shrink-0 items-center gap-2 border-b px-4 min-w-0 flex-wrap">
              <SidebarTrigger className="-ml-1" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                <Building className="h-4 w-4 shrink-0" />
                {/* Ocultar texto largo en pantallas ultra pequeñas para evitar overflow horizontal */}
                <span className="max-[350px]:hidden">Sistema de Gestión de Construcción</span>
                <span className="hidden sm:inline text-xs">(menú disponible tras iniciar sesión)</span>
              </div>
            </header>
            <main className="flex-1 overflow-auto min-h-0 p-2 sm:p-4">
              {children}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  const filteredNavigationGroups = getFilteredNavigationGroups();

  // Renderizado del sidebar (funciona tanto en móvil como desktop)
  return (
    <SidebarProvider>
      <div className="relative flex min-h-screen w-full flex-1 overflow-hidden">
        <DashboardSidebar variant="inset">
          <SidebarContentWithAutoClose
            filteredNavigationGroups={filteredNavigationGroups}
            pathname={pathname}
            profile={profile}
            handleLogout={handleLogout}
            isLoggingOut={isLoggingOut}
          />
          <SidebarRail />
        </DashboardSidebar>
        
        <SidebarInset className="flex flex-col min-h-0 flex-1">
          {/* Header interno del sidebar - siempre visible para usuarios autenticados */}
          <header className="flex h-14 sm:h-16 shrink-0 items-center gap-2 border-b px-4 min-w-0 flex-wrap">
            <SidebarTrigger className="-ml-1" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
              <Building className="h-4 w-4 shrink-0" />
              {/* Ocultar texto largo en pantallas ultra pequeñas para evitar overflow horizontal */}
              <span className="max-[350px]:hidden">Sistema de Gestión de Construcción</span>
            </div>
          </header>
          
          <main className="flex-1 overflow-auto min-h-0 p-2 sm:p-4">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}