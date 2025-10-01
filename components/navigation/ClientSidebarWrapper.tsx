'use client';

import { Suspense, lazy, useState, useEffect } from 'react';

// Lazy load del sidebar para forzar carga solo en el cliente
const LazyIndependentSidebar = lazy(() => 
  import('./IndependentSidebar').then(module => {
    console.log('🚀 [LazyIndependentSidebar] Módulo cargado dinámicamente');
    return { default: module.IndependentSidebar };
  })
);

/**
 * Wrapper que usa React.lazy para cargar el sidebar solo en el cliente
 * Usa un patrón de hidratación consistente para evitar errores
 */
export function ClientSidebarWrapper() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  console.log('🎯 [ClientSidebarWrapper] Renderizado:', {
    isClient,
    isServer: typeof window === 'undefined'
  });

  // Renderizar el mismo elemento tanto en servidor como en cliente inicialmente
  if (!isClient) {
    console.log('🔄 [ClientSidebarWrapper] Hidratación pendiente - renderizando placeholder');
    return <div style={{ display: 'none' }} />;
  }

  console.log('✅ [ClientSidebarWrapper] Cliente hidratado - renderizando LazyIndependentSidebar');
  
  return (
    <Suspense fallback={
      <div style={{ display: 'none' }}>
        {console.log('⏳ [ClientSidebarWrapper] Suspense fallback - cargando sidebar')}
      </div>
    }>
      <LazyIndependentSidebar />
    </Suspense>
  );
}