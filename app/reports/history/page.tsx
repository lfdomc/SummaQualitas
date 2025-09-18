'use client';

import { ReportHistory } from '@/components/reports/ReportHistory';
import { withAuth } from '@/components/auth/withAuth';
import { UserRoleType } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';



function ReportHistoryPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/reports">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Generador
            </Button>
          </Link>
          <Link href="/reports">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Reporte
            </Button>
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900">Historial de Reportes</h1>
        <p className="text-gray-600 mt-2">
          Visualiza, descarga y gestiona todos los reportes generados
        </p>
      </div>
      
      <ReportHistory />
    </div>
  );
}

export default withAuth(ReportHistoryPage, ['gerencia', 'administrativo'] as UserRoleType[]);