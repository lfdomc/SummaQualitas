'use client';

import { AlertCenter } from '@/components/alerts/AlertCenter';
import { withAuth } from '@/components/auth/withAuth';
import { UserRole, UserRoleType } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Bell, Settings, ArrowLeft } from 'lucide-react';



function AlertsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Dashboard
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="flex items-center gap-3 mb-2">
          <Bell className="h-8 w-8 text-orange-600" />
          <h1 className="text-3xl font-bold text-gray-900">Centro de Alertas</h1>
        </div>
        <p className="text-gray-600">
          Gestiona alertas automáticas, notificaciones y configuraciones del sistema de monitoreo
        </p>
      </div>
      
      <AlertCenter />
    </div>
  );
}

export default withAuth(AlertsPage, ['gerencia', 'administrativo', 'cliente'] as UserRoleType[]);