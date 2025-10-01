'use client';

import dynamic from 'next/dynamic';

const TestSidebar = dynamic(() => import("./TestSidebar").then(mod => ({ default: mod.TestSidebar })), {
  ssr: false,
  loading: () => <div className="fixed top-0 right-0 bg-blue-500 text-white p-2 z-50">Loading test...</div>
});

export function ClientTestSidebar() {
  return <TestSidebar />;
}