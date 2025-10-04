'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRole } from '@/lib/types';
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
        roles: ['cliente', 'gerencia', 'administrativo'],
      },
      {
        title: 'Órdenes de Cambio',
        href: '/change-orders',
        icon: FileEdit,
        roles: ['gerencia', 'administrativo'],
      },
      {
        title: 'Análisis y KPIs',
        href: '/analytics',
        icon: BarChart3,
        roles: ['cliente', 'gerencia', 'administrativo'],
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
        roles: ['cliente', 'gerencia', 'administrativo'],
      },
      {
        title: 'Gastos',
        href: '/expenses',
        icon: DollarSign,
        roles: ['cliente', 'gerencia', 'administrativo'],
      },
      {
        title: 'Proveedores',
        href: '/suppliers',
        icon: Truck,
        roles: ['cliente', 'gerencia', 'administrativo'],
      },
      {
        title: 'Equipos',
        href: '/equipment',
        icon: Wrench,
        roles: ['cliente', 'gerencia', 'administrativo'],
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
        roles: ['cliente', 'gerencia', 'administrativo'],
      },
      {
        title: 'Historial de Reportes',
        href: '/reports/history',
        icon: PieChart,
        roles: ['cliente', 'gerencia', 'administrativo'],
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
        roles: ['cliente', 'gerencia', 'administrativo'],
      },
      {
        title: 'Configuración',
        href: '/settings',
        icon: Settings,
        roles: ['cliente', 'gerencia', 'administrativo'],
      },
    ],
  },
];

interface MobileMenuProps {
  userRole: string;
  userName?: string;
  onLogout: () => void;
}

export function MobileMenu({ userRole, userName, onLogout }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cerrar menú al navegar
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevenir scroll cuando el menú está abierto
  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isMobile]);

  // Filtrar navegación por rol
  const filteredNavigationGroups = navigationGroups.map(group => ({
    ...group,
    items: group.items.filter(item => 
      !item.roles || item.roles.includes(userRole)
    )
  })).filter(group => group.items.length > 0);

  const toggleMenu = () => {
    console.log('Toggle menu clicked, current state:', isOpen);
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    console.log('Close menu called');
    setIsOpen(false);
  };

  // Solo mostrar en móvil
  if (!isMobile) {
    return null;
  }

  return (
    <>
      {/* Botón hamburguesa */}
      <button
        onClick={toggleMenu}
        className="fixed top-4 left-4 z-50 p-3 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
        aria-label="Abrir menú"
      >
        <div className="relative w-6 h-6">
          <span className={`
            absolute top-1 left-0 w-6 h-0.5 bg-gray-600 dark:bg-gray-300 transition-all duration-300 origin-center
            ${isOpen ? 'rotate-45 translate-y-2' : ''}
          `} />
          <span className={`
            absolute top-3 left-0 w-6 h-0.5 bg-gray-600 dark:bg-gray-300 transition-all duration-300
            ${isOpen ? 'opacity-0' : ''}
          `} />
          <span className={`
            absolute top-5 left-0 w-6 h-0.5 bg-gray-600 dark:bg-gray-300 transition-all duration-300 origin-center
            ${isOpen ? '-rotate-45 -translate-y-2' : ''}
          `} />
        </div>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={closeMenu}
        />
      )}

      {/* Sidebar móvil */}
      <div className={`
        fixed top-0 left-0 h-full w-80 bg-white dark:bg-gray-900 z-50 
        transform transition-transform duration-300 ease-in-out shadow-2xl
        flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header fijo */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SQ</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">
              Summa Qualitas
            </span>
          </div>
          <button
            onClick={closeMenu}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        
        {/* Navegación con scroll */}
        <nav className="flex-1 overflow-y-auto p-4 mobile-menu-scroll">
          <div className="space-y-6">
            {filteredNavigationGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  {group.label}
                </h3>
                <div className="space-y-1">
                  {group.items.map((item, itemIndex) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    
                    return (
                      <Link
                        key={itemIndex}
                        href={item.href}
                        className={`
                          flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200
                          ${isActive 
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-l-4 border-blue-600' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }
                        `}
                        onClick={closeMenu}
                      >
                        <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                        <span className="font-medium">{item.title}</span>
                        {item.badge && (
                          <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>
        
        {/* Footer fijo */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex-shrink-0">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <Users className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {userName || 'Usuario'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {userRole === 'gerencia' ? 'Gerencia' :
                 userRole === 'administrativo' ? 'Administrativo' : 'Cliente'}
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </>
  );
}