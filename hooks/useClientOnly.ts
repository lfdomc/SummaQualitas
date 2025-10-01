'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * Hook personalizado para detectar cuando estamos completamente en el cliente
 * Compatible con Next.js 15 que ejecuta componentes client en el servidor
 */
export function useClientOnly(): boolean {
  // Usar una función de inicialización que detecte el entorno
  const [isClient, setIsClient] = useState(() => {
    // En Next.js 15, esto se ejecuta tanto en servidor como cliente
    const hasWindow = typeof window !== 'undefined';
    const hasDocument = typeof document !== 'undefined';
    
    console.log('🎯 [useClientOnly] Inicialización:', {
      hasWindow,
      hasDocument,
      environment: hasWindow ? 'Cliente' : 'Servidor'
    });
    
    // Solo retornar true si estamos definitivamente en el cliente
    return hasWindow && hasDocument;
  });

  const mountedRef = useRef(false);

  useEffect(() => {
    console.log('🔄 [useClientOnly] useEffect ejecutándose');
    mountedRef.current = true;
    
    // Forzar actualización después del montaje
    const forceUpdate = () => {
      if (mountedRef.current) {
        const hasWindow = typeof window !== 'undefined';
        const hasDocument = typeof document !== 'undefined';
        const hasNavigator = typeof navigator !== 'undefined';
        
        console.log('🔍 [useClientOnly] Verificaciones en useEffect:', {
          hasWindow,
          hasDocument,
          hasNavigator,
          readyState: hasDocument ? document.readyState : 'undefined',
          mounted: mountedRef.current
        });
        
        if (hasWindow && hasDocument && hasNavigator) {
          console.log('✅ [useClientOnly] Cliente detectado, estableciendo isClient = true');
          setIsClient(true);
        } else {
          console.log('❌ [useClientOnly] Cliente no detectado aún');
          // Reintentar después de un breve delay
          setTimeout(forceUpdate, 50);
        }
      }
    };

    // Ejecutar inmediatamente y también después de un delay
    forceUpdate();
    
    // Cleanup
    return () => {
      mountedRef.current = false;
    };
  }, []);

  console.log('🎯 [useClientOnly] Retornando isClient:', isClient, 'mounted:', mountedRef.current);
  return isClient;
}