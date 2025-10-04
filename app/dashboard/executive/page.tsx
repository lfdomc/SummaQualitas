'use client';

import ExecutiveDashboard from '@/components/dashboard/ExecutiveDashboard';
import { withAuth } from '@/components/auth/withAuth';
import { UserRole, UserRoleType } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileText, BarChart3, ArrowLeft } from 'lucide-react';

function ExecutiveDashboardPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="px-2 sm:px-3">
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Volver al Dashboard</span>
                <span className="sm:hidden">Volver</span>
              </Button>
            </Link>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Link href="/reports" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto px-3 sm:px-4">
                <FileText className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="text-xs sm:text-sm">Generar Reporte</span>
              </Button>
            </Link>
            <Link href="/analytics" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto px-3 sm:px-4">
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="text-xs sm:text-sm">Análisis Detallado</span>
              </Button>
            </Link>
          </div>
        </div>
        
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Dashboard Ejecutivo</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">
          Visión general de todos los proyectos con métricas clave y tendencias financieras
        </p>
      </div>
      
      <ExecutiveDashboard />
    </div>
  );
}

export default withAuth(ExecutiveDashboardPage, ['gerencia', 'administrativo'] as UserRoleType[]);