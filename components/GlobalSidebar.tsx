'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/lib/types';
import { useMobileMenu, useMobileClasses } from '@/hooks/useMobileState';
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
  X,
  Menu,
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

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
        roles: ['cliente', 'gerencia', 'administrativo'], // Disponible para todos los usuarios
      },
      {
        title: 'Órdenes de Cambio',
        href: '/change-orders',
        icon: FileEdit,
        roles: ['gerencia', 'administrativo'], // Solo gerencia y administrativo
      },
      {
        title: 'Análisis y KPIs',
        href: '/analytics',
        icon: BarChart3,
        roles: ['cliente', 'gerencia', 'administrativo'], // Disponible para todos los usuarios
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
        roles: ['cliente', 'gerencia', 'administrativo'], // Disponible para todos los usuarios
      },
      {
        title: 'Gastos',
        href: '/expenses',
        icon: DollarSign,
        roles: ['cliente', 'gerencia', 'administrativo'], // Disponible para todos los usuarios
      },
      {
        title: 'Proveedores',
        href: '/suppliers',
        icon: Truck,
        roles: ['cliente', 'gerencia', 'administrativo'], // Disponible para todos los usuarios
      },
      {
        title: 'Equipos',
        href: '/equipment',
        icon: Wrench,
        roles: ['cliente', 'gerencia', 'administrativo'], // Disponible para todos los usuarios
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
        roles: ['cliente', 'gerencia', 'administrativo'], // Disponible para todos los usuarios
      },
      {
        title: 'Historial de Reportes',
        href: '/reports/history',
        icon: PieChart,
        roles: ['cliente', 'gerencia', 'administrativo'], // Disponible para todos los usuarios
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
        roles: ['cliente', 'gerencia', 'administrativo'], // Disponible para todos los usuarios
      },
      {
        title: 'Configuración',
        href: '/settings',
        icon: Settings,
        roles: ['cliente', 'gerencia', 'administrativo'], // Disponible para todos los usuarios
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

export function GlobalSidebar({ children }: GlobalSidebarProps) {
  const { user, profile, loading } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const mobileMenu = useMobileMenu(false);
  const { isMobile, containerClass, textClass, paddingClass } = useMobileClasses();
  
  // Cerrar menú móvil al navegar
  useEffect(() => {
    if (isMobile && mobileMenu.isOpen) {
      mobileMenu.close();
    }
  }, [pathname, isMobile, mobileMenu]);

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
        return;
      }
      
      toast.success('Sesión cerrada exitosamente');
      router.push('/login');
    } catch (error) {
      toast.error('Error inesperado al cerrar sesión');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Filtrar elementos de navegación basado en roles
  const getFilteredNavigationGroups = () => {
    // Si no hay perfil, mostrar todos los elementos (modo fallback)
    if (!profile) {
      return navigationGroups;
    }
    
    return navigationGroups.map(group => ({
      ...group,
      items: group.items.filter(item => {
        // Si no hay roles especificados, el item es accesible para todos
        if (!item.roles || item.roles.length === 0) {
          return true;
        }
        // Verificar si el rol del usuario está en la lista de roles permitidos
        return item.roles.includes(profile.role || '');
      })
    })).filter(group => group.items.length > 0);
  };

  // Redirigir usuarios autenticados desde la página principal al dashboard
  useEffect(() => {
    if (user && !loading && pathname === '/') {
      router.push('/dashboard');
    }
  }, [user, loading, pathname, router]);

  // No mostrar sidebar en rutas públicas o si el usuario no está logueado
  // Excepción: si el usuario está autenticado y está en '/', se redirige al dashboard
  if (!user || loading || (PUBLIC_ROUTES.has(pathname) && pathname !== '/')) {
    return <>{children}</>;
  }

  // Si el usuario está autenticado pero está en '/', no renderizar nada 
  // porque se está redirigiendo al dashboard
  if (user && pathname === '/') {
    return <>{children}</>;
  }

  const filteredNavigationGroups = getFilteredNavigationGroups();

  return (
    <SidebarProvider>
      {/* Mobile overlay */}
      {isMobile && mobileMenu.isOpen && (
        <div 
          className="mobile-overlay fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => mobileMenu.close()}
          aria-hidden="true"
        />
      )}
      
      <div className="relative flex min-h-screen w-full flex-1 overflow-hidden">
        <DashboardSidebar 
          variant="inset"
          className={`
            ${isMobile ? 'mobile-sidebar-mobile fixed left-0 top-0 z-50 h-full w-64 transform transition-transform duration-300 ease-in-out' : 'mobile-sidebar-desktop'}
            ${isMobile && !mobileMenu.isOpen ? '-translate-x-full' : 'translate-x-0'}
            ${isMobile ? 'lg:relative lg:translate-x-0 lg:w-auto' : ''}
          `}
        >
          <SidebarHeader>
            <div className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-2">
                <Building className="h-6 w-6 text-blue-600" />
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">Summa Qualitas</span>
                  <span className="text-xs text-muted-foreground">Sistema de Gestión</span>
                </div>
              </div>
              {/* Botón cerrar en móvil */}
              {isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => mobileMenu.close()}
                  className="mobile-close-btn h-8 w-8 p-0 lg:hidden touch-manipulation"
                  aria-label="Cerrar menú"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            {filteredNavigationGroups.map((group, groupIndex) => (
              <div key={groupIndex} data-sidebar="group" className="relative flex w-full min-w-0 flex-col p-2">
                <div data-sidebar="group-label" className="duration-200 flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-[margin,opa] ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0 group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0">
                  {group.label}
                </div>
                <div data-sidebar="group-content" className="w-full text-sm">
                  <ul data-sidebar="menu" className="flex w-full min-w-0 flex-col gap-1">
                    {group.items.map((item, itemIndex) => {
                      const Icon = item.icon;
                      return (
                        <li key={itemIndex} data-sidebar="menu-item" className="group/menu-item relative">
                          <Link 
                            className="peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left outline-none ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-10 text-sm flex items-center gap-2 touch-manipulation min-h-touch" 
                            data-sidebar="menu-button" 
                            data-size="default" 
                            data-active={pathname === item.href ? 'true' : 'false'} 
                            data-state="closed" 
                            href={item.href}
                            onClick={(e) => {
                              // Cerrar menú móvil al navegar
                              if (isMobile) {
                                mobileMenu.close();
                              }
                            }}
                          >
                            <Icon className="h-4 w-4" />
                            <span>{item.title}</span>
                            {item.badge && (
                              <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            ))}
          </SidebarContent>
          
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <div className="px-2 py-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="font-medium">{profile?.name || 'Usuario'}</span>
                      <span className="text-xs text-muted-foreground">
                        {profile?.role === UserRole.GERENCIA ? 'Gerencia' :
               profile?.role === UserRole.ADMINISTRATIVO ? 'Administrativo' : 'Cliente'}
                      </span>
                    </div>
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
          
          <SidebarRail />
        </DashboardSidebar>
        
        <SidebarInset className="flex flex-col min-h-0 flex-1">
          <header className="flex h-14 sm:h-16 shrink-0 items-center gap-2 border-b px-4 safe-area-inset">
            {/* Botón menú móvil */}
            {isMobile ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => mobileMenu.open()}
                className="mobile-menu-btn h-8 w-8 p-0 lg:hidden touch-manipulation"
                aria-label="Abrir menú"
              >
                <Menu className="h-4 w-4" />
              </Button>
            ) : (
              <SidebarTrigger className="-ml-1" />
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building className="h-4 w-4" />
              <span className="hidden sm:inline">Sistema de Gestión de Construcción</span>
              <span className="sm:hidden">SummaQualitas</span>
            </div>
          </header>
          
          <main className="flex-1 overflow-auto p-2 sm:p-4 min-h-0 safe-area-inset">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}