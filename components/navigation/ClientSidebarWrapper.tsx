'use client';

import { Suspense, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const LazyIndependentSidebar = dynamic(
  () => import('./IndependentSidebar').then(mod => ({ default: mod.IndependentSidebar })),
  { 
    ssr: false,
    loading: () => <div className="w-64 bg-gray-900 animate-pulse" />
  }
);

export function ClientSidebarWrapper() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className="w-64 bg-gray-900 animate-pulse" />;
  }

  return (
    <Suspense fallback={<div className="w-64 bg-gray-900 animate-pulse" />}>
      <LazyIndependentSidebar />
    </Suspense>
  );
}