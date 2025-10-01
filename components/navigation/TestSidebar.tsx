'use client';

import { useEffect, useState } from 'react';

export function TestSidebar() {
  const [mounted, setMounted] = useState(false);
  
  console.log('🧪 [TestSidebar] Componente renderizado, mounted:', mounted);

  useEffect(() => {
    console.log('🧪 [TestSidebar] useEffect ejecutándose...');
    setMounted(true);
    
    const testFunction = () => {
      console.log('🧪 [TestSidebar] Función de prueba ejecutada');
    };
    
    testFunction();
  }, []);

  // Solo renderizar en el cliente
  if (!mounted) {
    console.log('🧪 [TestSidebar] No montado aún, no renderizando');
    return null;
  }

  console.log('🧪 [TestSidebar] Montado, renderizando contenido');

  return (
    <div className="fixed top-0 right-0 bg-red-500 text-white p-4 z-50">
      <p>Test Sidebar - Mounted</p>
    </div>
  );
}