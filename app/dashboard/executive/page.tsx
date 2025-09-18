'use client';

import ExecutiveDashboard from '@/components/dashboard/ExecutiveDashboard';
import { withAuth } from '@/components/auth/withAuth';
import { UserRole, UserRoleType } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileText, BarChart3, ArrowLeft } from 'lucide-react';



function ExecutiveDashboardPage() {
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
          
          <div className="flex gap-2">
            <Link href="/reports">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Generar Reporte
              </Button>
            </Link>
            <Link href="/analytics">
              <Button>
                <BarChart3 className="h-4 w-4 mr-2" />
                Análisis Detallado
              </Button>
            </Link>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Ejecutivo</h1>
        <p className="text-gray-600 mt-2">
          Visión general de todos los proyectos con métricas clave y tendencias financieras
        </p>
      </div>
      
      <ExecutiveDashboard />
    </div>
  );
}

export default withAuth(ExecutiveDashboardPage, ['gerencia', 'administrativo'] as UserRoleType[]);