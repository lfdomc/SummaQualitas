/**
 * Servicio de caché para autenticación
 * Optimiza las operaciones de autenticación reduciendo llamadas innecesarias a la API
 */

import { User } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface CachedSession {
  user: User;
  profile: UserProfile | null;
  timestamp: number;
  expiresAt: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  totalRequests: number;
  hitRate: number;
}

class AuthCacheService {
  private cache = new Map<string, CachedSession>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    totalRequests: 0,
    hitRate: 0,
  };

  // Configuración de caché
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
  private readonly MAX_CACHE_SIZE = 100; // Máximo 100 entradas
  private readonly CLEANUP_INTERVAL = 10 * 60 * 1000; // Limpiar cada 10 minutos

  constructor() {
    // Configurar limpieza automática del caché
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.cleanup();
      }, this.CLEANUP_INTERVAL);
    }
  }

  /**
   * Obtiene una sesión del caché
   */
  getSession(userId: string): CachedSession | null {
    this.stats.totalRequests++;

    const cached = this.cache.get(userId);
    const now = Date.now();

    if (cached && now < cached.expiresAt) {
      this.stats.hits++;
      this.updateHitRate();
      
      // Actualizar timestamp de último acceso
      cached.timestamp = now;
      
      return cached;
    }

    this.stats.misses++;
    this.updateHitRate();

    // Limpiar entrada expirada
    if (cached) {
      this.cache.delete(userId);
    }

    return null;
  }

  /**
   * Almacena una sesión en el caché
   */
  setSession(userId: string, user: User, profile: UserProfile | null): void {
    const now = Date.now();
    
    // Verificar límite de tamaño del caché
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictOldest();
    }

    const cachedSession: CachedSession = {
      user,
      profile,
      timestamp: now,
      expiresAt: now + this.CACHE_DURATION,
    };

    this.cache.set(userId, cachedSession);
  }

  /**
   * Actualiza el perfil de un usuario en el caché
   */
  updateProfile(userId: string, profile: UserProfile): boolean {
    const cached = this.cache.get(userId);
    
    if (cached && Date.now() < cached.expiresAt) {
      cached.profile = profile;
      cached.timestamp = Date.now();
      return true;
    }

    return false;
  }

  /**
   * Elimina una sesión específica del caché
   */
  removeSession(userId: string): void {
    this.cache.delete(userId);
  }

  /**
   * Limpia todo el caché
   */
  clearAll(): void {
    this.cache.clear();
    this.resetStats();
  }

  /**
   * Verifica si una sesión está en caché y es válida
   */
  hasValidSession(userId: string): boolean {
    const cached = this.cache.get(userId);
    return cached ? Date.now() < cached.expiresAt : false;
  }

  /**
   * Obtiene estadísticas del caché
   */
  getStats(): CacheStats & { cacheSize: number; memoryUsage: string } {
    return {
      ...this.stats,
      cacheSize: this.cache.size,
      memoryUsage: this.getMemoryUsage(),
    };
  }

  /**
   * Extiende la expiración de una sesión
   */
  extendSession(userId: string, additionalTime = this.CACHE_DURATION): boolean {
    const cached = this.cache.get(userId);
    
    if (cached) {
      cached.expiresAt = Math.max(cached.expiresAt, Date.now() + additionalTime);
      return true;
    }

    return false;
  }

  /**
   * Obtiene todas las sesiones activas (para debugging)
   */
  getActiveSessions(): Array<{ userId: string; email: string; expiresIn: number }> {
    const now = Date.now();
    const active: Array<{ userId: string; email: string; expiresIn: number }> = [];

    this.cache.forEach((session, userId) => {
      if (now < session.expiresAt) {
        active.push({
          userId,
          email: session.user.email || 'unknown',
          expiresIn: Math.round((session.expiresAt - now) / 1000),
        });
      }
    });

    return active;
  }

  /**
   * Limpia entradas expiradas del caché
   */
  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    this.cache.forEach((session, userId) => {
      if (now >= session.expiresAt) {
        toDelete.push(userId);
      }
    });

    toDelete.forEach(userId => {
      this.cache.delete(userId);
    });

    // Sesiones expiradas limpiadas silenciosamente
  }

  /**
   * Elimina la entrada más antigua cuando se alcanza el límite
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();

    this.cache.forEach((session, userId) => {
      if (session.timestamp < oldestTimestamp) {
        oldestTimestamp = session.timestamp;
        oldestKey = userId;
      }
    });

    if (oldestKey) {
      this.cache.delete(oldestKey);
      console.log(`🗑️ [AuthCache] Eliminada sesión más antigua: ${oldestKey}`);
    }
  }

  /**
   * Actualiza la tasa de aciertos del caché
   */
  private updateHitRate(): void {
    this.stats.hitRate = this.stats.totalRequests > 0 
      ? (this.stats.hits / this.stats.totalRequests) * 100 
      : 0;
  }

  /**
   * Resetea las estadísticas
   */
  private resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
      hitRate: 0,
    };
  }

  /**
   * Calcula el uso aproximado de memoria
   */
  private getMemoryUsage(): string {
    const bytesPerEntry = 1024; // Estimación aproximada
    const totalBytes = this.cache.size * bytesPerEntry;
    
    if (totalBytes < 1024) {
      return `${totalBytes} B`;
    } else if (totalBytes < 1024 * 1024) {
      return `${Math.round(totalBytes / 1024)} KB`;
    } else {
      return `${Math.round(totalBytes / (1024 * 1024))} MB`;
    }
  }

  /**
   * Precargar sesiones (útil para usuarios frecuentes)
   */
  preloadSession(userId: string, user: User, profile: UserProfile | null): void {
    // Solo precargar si no existe o está próximo a expirar
    const cached = this.cache.get(userId);
    const now = Date.now();
    
    if (!cached || (cached.expiresAt - now) < (this.CACHE_DURATION * 0.2)) {
      this.setSession(userId, user, profile);
    }
  }

  /**
   * Invalida caché por rol (útil cuando cambian permisos)
   */
  invalidateByRole(role: string): number {
    let invalidated = 0;
    const toDelete: string[] = [];

    this.cache.forEach((session, userId) => {
      if (session.profile?.role === role) {
        toDelete.push(userId);
        invalidated++;
      }
    });

    toDelete.forEach(userId => {
      this.cache.delete(userId);
    });

    return invalidated;
  }
}

// Exportar instancia singleton
export const authCacheService = new AuthCacheService();

// Exportar tipos para uso externo
export type { CachedSession, CacheStats, UserProfile };