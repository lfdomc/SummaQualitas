/**
 * Servicio de caché para optimizar consultas frecuentes
 * Implementa caché en memoria con TTL (Time To Live)
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live en milisegundos
}

interface CacheStats {
  hits: number;
  misses: number;
  totalRequests: number;
  hitRate: number;
}

class CacheService {
  private cache = new Map<string, CacheItem<any>>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    totalRequests: 0,
    hitRate: 0
  };

  // TTL por defecto: 5 minutos
  private readonly DEFAULT_TTL = 5 * 60 * 1000;

  /**
   * Genera una clave de caché basada en la función y parámetros
   */
  private generateKey(functionName: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {} as Record<string, any>);
    
    return `${functionName}:${JSON.stringify(sortedParams)}`;
  }

  /**
   * Verifica si un elemento del caché ha expirado
   */
  private isExpired(item: CacheItem<any>): boolean {
    return Date.now() - item.timestamp > item.ttl;
  }

  /**
   * Obtiene un valor del caché
   */
  get<T>(functionName: string, params: Record<string, any>): T | null {
    this.stats.totalRequests++;
    
    const key = this.generateKey(functionName, params);
    const item = this.cache.get(key);

    if (!item || this.isExpired(item)) {
      this.stats.misses++;
      if (item) {
        this.cache.delete(key); // Limpiar elemento expirado
      }
      this.updateHitRate();
      return null;
    }

    this.stats.hits++;
    this.updateHitRate();
    return item.data as T;
  }

  /**
   * Almacena un valor en el caché
   */
  set<T>(
    functionName: string, 
    params: Record<string, any>, 
    data: T, 
    ttl: number = this.DEFAULT_TTL
  ): void {
    const key = this.generateKey(functionName, params);
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl
    };

    this.cache.set(key, item);
  }

  /**
   * Invalida el caché para una función específica
   */
  invalidateFunction(functionName: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${functionName}:`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Invalida todo el caché relacionado con un proyecto
   */
  invalidateProject(projectId: string): void {
    const keysToDelete: string[] = [];
    
    for (const [key, item] of this.cache.entries()) {
      const keyData = key.split(':')[1];
      if (keyData && keyData.includes(projectId)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Limpia elementos expirados del caché
   */
  cleanup(): void {
    const keysToDelete: string[] = [];
    
    for (const [key, item] of this.cache.entries()) {
      if (this.isExpired(item)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Limpia todo el caché
   */
  clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
      hitRate: 0
    };
  }

  /**
   * Obtiene estadísticas del caché
   */
  getStats(): CacheStats & { size: number } {
    return {
      ...this.stats,
      size: this.cache.size
    };
  }

  /**
   * Actualiza la tasa de aciertos
   */
  private updateHitRate(): void {
    this.stats.hitRate = this.stats.totalRequests > 0 
      ? (this.stats.hits / this.stats.totalRequests) * 100 
      : 0;
  }

  /**
   * Wrapper para funciones con caché automático
   */
  async withCache<T>(
    functionName: string,
    params: Record<string, any>,
    fetchFunction: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Intentar obtener del caché
    const cached = this.get<T>(functionName, params);
    if (cached !== null) {
      return cached;
    }

    // Si no está en caché, ejecutar la función
    const result = await fetchFunction();
    
    // Almacenar en caché
    this.set(functionName, params, result, ttl);
    
    return result;
  }
}

// Instancia singleton del servicio de caché
export const cacheService = new CacheService();

// Configurar limpieza automática cada 10 minutos
if (typeof window === 'undefined') { // Solo en el servidor
  setInterval(() => {
    cacheService.cleanup();
  }, 10 * 60 * 1000);
}

export default cacheService;