'use client';

import dynamic from 'next/dynamic';

// Dynamic import del IndependentSidebar con ssr: false para forzar renderizado solo en cliente
const DynamicIndependentSidebar = dynamic(
  () => import('./IndependentSidebar').then(mod => ({ default: mod.IndependentSidebar })),
  { 
    ssr: false,
    loading: () => <div className="w-64 bg-gray-100 animate-pulse" /> // Loading placeholder
  }
);

export function ClientIndependentSidebar() {
  return <DynamicIndependentSidebar />;
}