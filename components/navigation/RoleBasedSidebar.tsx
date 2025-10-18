'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Home, 
  FolderOpen, 
  Users, 
  Settings, 
  FileText, 
  BarChart3, 
  AlertTriangle,
  Menu,
  Building,
  CreditCard,
  Wrench
} from 'lucide-react';
import { useAuthContext } from '@/lib/contexts/AuthContext';

interface NavigationItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[]; // e.g., 'admin', 'project_manager', 'accountant', 'operator', 'master'
  description?: string;
}

const navigationItems: NavigationItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    roles: ['master', 'admin', 'project_manager', 'accountant', 'operator'],
    description: 'Panel principal'
  },
  {
    title: 'Proyectos',
    href: '/projects',
    icon: FolderOpen,
    roles: ['master', 'admin', 'project_manager', 'accountant', 'operator'],
    description: 'Gestión de proyectos'
  },
  {
    title: 'Nuevo Proyecto',
    href: '/projects/new',
    icon: Building,
    roles: ['master', 'admin', 'project_manager'],
    description: 'Crear nuevo proyecto'
  },
  {
    title: 'Usuarios',
    href: '/users',
    icon: Users,
    roles: ['master', 'admin'],
    description: 'Gestión de usuarios'
  },
  {
    title: 'Equipos',
    href: '/equipment',
    icon: Wrench,
    roles: ['master', 'admin', 'project_manager'],
    description: 'Gestión de equipos'
  },
  {
    title: 'Gastos',
    href: '/invoices',
    icon: CreditCard,
    roles: ['master', 'admin', 'project_manager', 'accountant'],
    description: 'Gestión de gastos'
  },
  {
    title: 'Reportes',
    href: '/reports',
    icon: BarChart3,
    roles: ['master', 'admin', 'project_manager', 'accountant'],
    description: 'Informes y análisis'
  },
  {
    title: 'Alertas',
    href: '/alerts',
    icon: AlertTriangle,
    roles: ['master', 'admin', 'project_manager', 'accountant'],
    description: 'Notificaciones del sistema'
  },
  {
    title: 'Configuración',
    href: '/settings',
    icon: Settings,
    roles: ['master', 'admin'],
    description: 'Configuración del sistema'
  }
];

interface SidebarContentProps {
  userRole: string | null;
  onItemClick?: () => void;
}

function SidebarContent({ userRole, onItemClick }: SidebarContentProps) {
  const pathname = usePathname();
  
  // Filtrar elementos de navegación según el rol del usuario
  const allowedItems = navigationItems.filter(item => 
    userRole && item.roles.includes(userRole)
  );
  
  if (!userRole) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Cargando navegación...</p>
        </div>
      </div>
    );
  }
  
  return (
    <ScrollArea className="h-full py-6">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
          Navegación
        </h2>
        <div className="space-y-1">
          {allowedItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (onItemClick) {
                    onItemClick();
                  }
                }}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground",
                  isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </div>
        
        {/* Información del rol */}
        <div className="mt-8 px-4">
          <div className="rounded-lg bg-muted p-3">
            <h3 className="text-sm font-medium mb-1">Tu Rol</h3>
            <p className="text-xs text-muted-foreground capitalize">
              {userRole?.toLowerCase()}
            </p>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

interface RoleBasedSidebarProps {
  className?: string;
}

export function RoleBasedSidebar({ className }: RoleBasedSidebarProps) {
  const { profile } = useAuthContext();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  const userRole = profile?.role || null;
  
  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col">
          <SidebarContent 
            userRole={userRole} 
            onItemClick={() => setIsMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>
      
      {/* Desktop Sidebar */}
      <div className={cn("hidden border-r bg-muted/40 md:block", className)}>
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Building className="h-6 w-6" />
              <span>Summa Qualitas</span>
            </Link>
          </div>
          <SidebarContent userRole={userRole} />
        </div>
      </div>
    </>
  );
}

export default RoleBasedSidebar;