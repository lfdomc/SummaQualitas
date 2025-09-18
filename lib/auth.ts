// =====================================================
// SISTEMA DE AUTENTICACIÓN Y AUTORIZACIÓN
// =====================================================

import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { User, UserRole } from '@/types/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// =====================================================
// CONFIGURACIÓN
// =====================================================

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '7d';

// =====================================================
// CLIENTE SUPABASE
// =====================================================

export const createSupabaseClient = () => {
  return createClientComponentClient();
};

export const createSupabaseServerClient = () => {
  const cookieStore = cookies();
  return createServerComponentClient({ cookies: () => cookieStore });
};

// =====================================================
// FUNCIONES DE AUTENTICACIÓN
// =====================================================

/**
 * Hashea una contraseña
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Verifica una contraseña
 */
export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * Genera un token JWT
 */
export const generateToken = (userId: string, email: string, role: string): string => {
  return jwt.sign(
    { userId, email, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Verifica un token JWT
 */
export const verifyToken = (token: string): { userId: string; email: string; role: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
  } catch (error) {
    return null;
  }
};

// =====================================================
// FUNCIONES DE USUARIO
// =====================================================

/**
 * Obtiene el usuario actual desde el servidor
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const supabase = createSupabaseServerClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Obtener datos completos del usuario desde nuestra tabla
    const { data: userData, error } = await supabase
      .from('users')
      .select(`
        *,
        role:user_roles(*)
      `)
      .eq('email', user.email)
      .single();

    if (error || !userData) {
      console.error('Error fetching user data:', error);
      return null;
    }

    return userData as User;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Obtiene el usuario actual desde el cliente
 */
export const getCurrentUserClient = async (): Promise<User | null> => {
  try {
    const supabase = createSupabaseClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Obtener datos completos del usuario desde nuestra tabla
    const { data: userData, error } = await supabase
      .from('users')
      .select(`
        *,
        role:user_roles(*)
      `)
      .eq('email', user.email)
      .single();

    if (error || !userData) {
      console.error('Error fetching user data:', error);
      return null;
    }

    return userData as User;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Verifica si el usuario tiene un permiso específico
 */
export const hasPermission = (user: User, permission: string): boolean => {
  if (!user.role) return false;
  
  // Usuario maestro tiene todos los permisos
  if (user.is_master) return true;
  
  // Verificar permisos específicos
  const permissions = user.role.permissions as Record<string, boolean | string>;
  
  // Si tiene permiso 'all', puede hacer todo
  if (permissions.all === true) return true;
  
  // Verificar permiso específico
  const hasSpecificPermission = permissions[permission];
  return hasSpecificPermission === true || hasSpecificPermission === 'true';
};

/**
 * Verifica si el usuario puede acceder a un recurso específico
 */
export const canAccessResource = (user: User, resource: string, action: 'read' | 'write' | 'delete' = 'read'): boolean => {
  if (!user.role) return false;
  
  // Usuario maestro tiene acceso completo
  if (user.is_master) return true;
  
  const permissions = user.role.permissions as Record<string, boolean | string>;
  
  // Si tiene permiso 'all', puede acceder a todo
  if (permissions.all === true) return true;
  
  // Verificar permiso del recurso
  const resourcePermission = permissions[resource];
  
  if (resourcePermission === true) return true;
  if (resourcePermission === 'read' && action === 'read') return true;
  if (resourcePermission === 'limited' && action === 'read') return true;
  
  return false;
};

/**
 * Verifica si el usuario es administrador o superior
 */
export const isAdmin = (user: User): boolean => {
  return user.is_master || user.role?.name === 'admin';
};

/**
 * Verifica si el usuario es maestro
 */
export const isMaster = (user: User): boolean => {
  return user.is_master;
};

// =====================================================
// MIDDLEWARE DE AUTENTICACIÓN
// =====================================================

/**
 * Middleware para verificar autenticación
 */
export const authMiddleware = async (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  
  // Rutas públicas que no requieren autenticación
  const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  try {
    // Verificar token de autenticación
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Agregar información del usuario a los headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', decoded.userId);
    requestHeaders.set('x-user-email', decoded.email);
    requestHeaders.set('x-user-role', decoded.role);
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
};

/**
 * Middleware para verificar permisos específicos
 */
export const requirePermission = (permission: string) => {
  return async (request: NextRequest) => {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    if (!hasPermission(user, permission)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    
    return NextResponse.next();
  };
};

/**
 * Middleware para verificar rol de administrador
 */
export const requireAdmin = async (request: NextRequest) => {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  if (!isAdmin(user)) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
  
  return NextResponse.next();
};

/**
 * Middleware para verificar rol de maestro
 */
export const requireMaster = async (request: NextRequest) => {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  if (!isMaster(user)) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
  
  return NextResponse.next();
};

// =====================================================
// HOOKS PARA COMPONENTES
// =====================================================

/**
 * Hook para obtener el usuario actual en componentes cliente
 */
export const useCurrentUser = () => {
  // Este hook se implementará en un archivo separado para componentes cliente
  // debido a las restricciones de Next.js 13+ con server/client components
};

// =====================================================
// UTILIDADES DE SESIÓN
// =====================================================

/**
 * Inicia sesión de usuario
 */
export const signIn = async (email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
  try {
    const supabase = createSupabaseClient();
    
    // Verificar credenciales en nuestra tabla de usuarios
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        role:user_roles(*)
      `)
      .eq('email', email)
      .eq('is_active', true)
      .single();
    
    if (userError || !userData) {
      return { success: false, error: 'Usuario no encontrado o inactivo' };
    }
    
    // Verificar contraseña
    if (!userData.password_hash) {
      return { success: false, error: 'Usuario sin contraseña configurada' };
    }
    
    const isValidPassword = await verifyPassword(password, userData.password_hash);
    if (!isValidPassword) {
      return { success: false, error: 'Contraseña incorrecta' };
    }
    
    // Actualizar último login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userData.id);
    
    // Generar token JWT
    const token = generateToken(userData.id, userData.email, userData.role?.name || 'operator');
    
    // Establecer cookie de autenticación
    document.cookie = `auth-token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict`;
    
    return { success: true, user: userData as User };
  } catch (error) {
    console.error('Sign in error:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
};

/**
 * Cierra sesión de usuario
 */
export const signOut = async (): Promise<void> => {
  try {
    const supabase = createSupabaseClient();
    
    // Cerrar sesión en Supabase
    await supabase.auth.signOut();
    
    // Eliminar cookie de autenticación
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    // Redirigir a login
    window.location.href = '/login';
  } catch (error) {
    console.error('Sign out error:', error);
  }
};

/**
 * Registra un nuevo usuario (solo para administradores)
 */
export const registerUser = async (userData: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role_id: string;
}): Promise<{ success: boolean; user?: User; error?: string }> => {
  try {
    const supabase = createSupabaseClient();
    
    // Verificar que el email no esté en uso
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', userData.email)
      .single();
    
    if (existingUser) {
      return { success: false, error: 'El email ya está en uso' };
    }
    
    // Hashear contraseña
    const hashedPassword = await hashPassword(userData.password);
    
    // Crear usuario
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email: userData.email,
        password_hash: hashedPassword,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone,
        role_id: userData.role_id,
        is_active: true,
        is_master: false
      })
      .select(`
        *,
        role:user_roles(*)
      `)
      .single();
    
    if (error) {
      console.error('Error creating user:', error);
      return { success: false, error: 'Error al crear el usuario' };
    }
    
    return { success: true, user: newUser as User };
  } catch (error) {
    console.error('Register user error:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
};