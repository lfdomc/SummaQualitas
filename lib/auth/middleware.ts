import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { UserRole } from '@/lib/types';

interface UserProfile {
  id: string;
  role: UserRole;
  email: string;
  name: string;
}

// Rutas que requieren autenticación
const protectedRoutes = [
  '/dashboard',
  '/projects',
  '/profile',
  '/settings',
  '/equipment',
  '/invoices',
  '/reports',
  '/alerts',
  '/analytics',
  '/users',
  '/incomes',
  '/expenses',
  '/payments'
];

// Rutas públicas que no requieren autenticación
const publicRoutes = [
  '/',
  '/auth/login',
  '/auth/sign-up',
  '/auth/forgot-password',
  '/auth/confirm',
  '/auth/error',
  '/register',
  '/nosotros',
  '/servicios',
  '/contacto'
];

// Rutas que requieren roles específicos
const roleBasedRoutes: Record<string, UserRole[]> = {
  // Solo gerencia
  '/settings': [UserRole.GERENCIA],
  '/users': [UserRole.GERENCIA],
  '/projects/new': [UserRole.GERENCIA],
  '/projects/*/edit': [UserRole.GERENCIA, UserRole.ADMINISTRATIVO], // Rutas de edición de proyectos
  
  // Gerencia y administrativo
  '/analytics': [UserRole.GERENCIA, UserRole.ADMINISTRATIVO],
  '/reports': [UserRole.GERENCIA, UserRole.ADMINISTRATIVO],
  '/equipment': [UserRole.GERENCIA, UserRole.ADMINISTRATIVO],
  '/alerts': [UserRole.GERENCIA, UserRole.ADMINISTRATIVO],
  '/incomes': [UserRole.GERENCIA, UserRole.ADMINISTRATIVO],
  '/expenses': [UserRole.GERENCIA, UserRole.ADMINISTRATIVO],
  '/payments': [UserRole.GERENCIA, UserRole.ADMINISTRATIVO],
  
  // Todos los roles (pero con diferentes permisos internos)
  '/dashboard': [UserRole.GERENCIA, UserRole.ADMINISTRATIVO, UserRole.CLIENTE],
  '/projects': [UserRole.GERENCIA, UserRole.ADMINISTRATIVO, UserRole.CLIENTE],
  '/invoices': [UserRole.GERENCIA, UserRole.ADMINISTRATIVO, UserRole.CLIENTE],
  '/profile': [UserRole.GERENCIA, UserRole.ADMINISTRATIVO, UserRole.CLIENTE]
};

const PUBLIC_ROUTES = new Set([
  '/',
  '/login',
  '/register',
  '/auth/login',
  '/auth/sign-up',
  '/auth/forgot-password',
  '/auth/update-password',
  '/auth/error',
  '/auth/sign-up-success',
  '/about',
  '/contact',
  '/servicios',
  '/proyectos',
  '/nosotros',
  '/contacto',
  '/cotizacion',
  '/protected',
]);

const AUTH_ROUTES = new Set(['/login', '/register', '/auth/login', '/auth/sign-up']);

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Check if the route is public
  const isPublicRoute = PUBLIC_ROUTES.has(pathname) || 
    Array.from(PUBLIC_ROUTES).some(route => pathname.startsWith(`${route}/`));

  // Check if the route is an auth route
  const isAuthRoute = AUTH_ROUTES.has(pathname);

  // If user is authenticated and trying to access auth routes, redirect to dashboard
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // If route is public, allow access
  if (isPublicRoute) {
    return supabaseResponse;
  }

  // Verificar si es una ruta protegida
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Si la ruta es protegida y el usuario no está autenticado
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/', request.url);
    redirectUrl.searchParams.set('reason', 'authentication_required');
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Si la ruta es protegida y el usuario está autenticado, verificar permisos
  if (isProtectedRoute && user) {
    // Verificar permisos para rutas específicas
    const matchedRoute = Object.keys(roleBasedRoutes).find(route => {
      if (route.endsWith('/*')) {
        return pathname.startsWith(route.slice(0, -2));
      }
      if (route.includes('*/')) {
        // Manejar rutas con patrones dinámicos como /projects/*/edit
        const routePattern = route.replace('*', '[^/]+');
        const regex = new RegExp(`^${routePattern}$`);
        return regex.test(pathname);
      }
      return pathname === route || pathname.startsWith(route + '/');
    });

    if (matchedRoute) {
      const allowedRoles = roleBasedRoutes[matchedRoute];
      
      // Evitar redirección infinita: si ya estamos en dashboard, permitir acceso
      if (pathname === '/dashboard') {
        return supabaseResponse;
      }
      
      // Verificar permisos del usuario
      const hasPermission = await checkUserPermission(user.id, allowedRoles, supabase);
      if (!hasPermission) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}

// Optimización: cache simple para permisos de usuario
const userPermissionCache = new Map<string, { role: UserRole; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Helper function to check user permissions con cache
export async function checkUserPermission(
  userId: string,
  requiredRoles: UserRole[],
  supabaseClient?: any
): Promise<boolean> {
  try {
    // Verificar cache primero
    const cached = userPermissionCache.get(userId);
    const now = Date.now();
    
    let userRole: UserRole;
    
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      userRole = cached.role;
    } else {
      // Usar service role key para el middleware para evitar problemas de RLS
      const supabase = supabaseClient || createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            getAll() {
              return [];
            },
            setAll() {
              // No-op for server-side usage
            },
          },
        }
      );
      
      const { data: profile, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .limit(1)
        .maybeSingle();

      if (error || !profile) {
        // Si hay error en la consulta, denegar acceso por seguridad
        console.warn('Error fetching user profile, denying access:', {
          error: error?.message,
          userId: userId
        });
        return false;
      }
      
      userRole = profile.role as UserRole;
      
      // Actualizar cache
      userPermissionCache.set(userId, { role: userRole, timestamp: now });
    }

    // Si el usuario es gerencia, permitir acceso a todo
    if (userRole === UserRole.GERENCIA) {
      return true;
    }

    return requiredRoles.includes(userRole);
  } catch (error) {
    // En caso de error, denegar acceso por seguridad
    console.error('Error in checkUserPermission, denying access:', error);
    return false;
  }
}