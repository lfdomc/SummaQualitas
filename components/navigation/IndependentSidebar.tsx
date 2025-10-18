'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { 
  Home, 
  FolderOpen, 
  Users, 
  Settings, 
  BarChart3, 
  FileText, 
  DollarSign,
  Package,
  AlertTriangle,
  LogOut,
  Menu,
  X
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

interface Profile {
  id: string;
  name: string;
  role: string;
}

// Hook personalizado para detectar hidratación usando un enfoque más robusto
function useHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Usar requestAnimationFrame para asegurar que se ejecute después del renderizado
    const frame = requestAnimationFrame(() => {
      setHydrated(true);
    });
    
    return () => cancelAnimationFrame(frame);
  }, []);

  return hydrated;
}

export function IndependentSidebar() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const hydrated = useHydrated();
  const pathname = usePathname();

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') {
      return;
    }
    
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        
        // Verificar localStorage primero (solo en el cliente)
        const accessToken = typeof window !== 'undefined' ? localStorage.getItem('sb-localhost-auth-token') : null;
        
        // Verificar sesión
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          setLoading(false);
          return;
        }

        if (!sessionData.session) {
          setLoading(false);
          return;
        }

        const sessionUser = sessionData.session.user;
        
        setUser({
          id: sessionUser.id,
          email: sessionUser.email || '',
          name: sessionUser.user_metadata?.name || sessionUser.email
        });

        // Obtener perfil
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', sessionUser.id)
            .single();

          if (profileError) {
            console.warn('⚠️ [IndependentSidebar] Error al obtener perfil:', profileError);
          } else if (profileData) {
            setProfile(profileData);
            setUser(prev => prev ? { ...prev, role: profileData.role } : null);
          }
        } catch (profileErr) {
          console.warn('⚠️ [IndependentSidebar] Error en consulta de perfil:', profileErr);
        }

      } catch (error) {
        // Error silently handled
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Escuchar cambios de autenticación
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email
        });
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [hydrated]);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      
      // Forzar refresh completo después del logout manual
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.href = '/?reason=manual_logout';
        }, 100);
      }
    } catch (error) {
      // Error silently handled - pero aún así hacer refresh
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.href = '/?reason=manual_logout';
        }, 100);
      }
    }
  };

  // Rutas públicas donde no mostrar el sidebar
  const publicRoutes = ['/login', '/register', '/auth', '/simple-login', '/direct-login', '/debug-session'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // No mostrar sidebar si no está hidratado, está cargando, no hay usuario, o es ruta pública
  if (!hydrated || loading || !user || isPublicRoute) {
    return null;
  }

  const menuItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard' },
    { icon: FolderOpen, label: 'Proyectos', href: '/projects' },
    { icon: Users, label: 'Clientes', href: '/clients' },
    { icon: Package, label: 'Equipos', href: '/equipment' },
    { icon: DollarSign, label: 'Gastos', href: '/expenses' },
    { icon: DollarSign, label: 'Ingresos', href: '/incomes' },
    { icon: FileText, label: 'Reportes', href: '/reports' },
    { icon: BarChart3, label: 'Analytics', href: '/analytics' },
    { icon: AlertTriangle, label: 'Alertas', href: '/alerts' },
    { icon: Settings, label: 'Configuración', href: '/settings' },
  ];

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Botón de menú para móvil */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-blue-600 text-white p-2 rounded-md shadow-lg"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Summa Qualitas</h2>
            <div className="mt-2">
              <p className="text-sm text-gray-600">{user.name || user.email}</p>
              {profile && (
                <p className="text-xs text-blue-600 font-medium">{profile.role}</p>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`
                        flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                        ${isActive 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }
                      `}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 w-full"
            >
              <LogOut size={18} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>

      {/* Espaciador para el contenido principal en desktop */}
      <div className="hidden lg:block w-64 flex-shrink-0" />
    </>
  );
}