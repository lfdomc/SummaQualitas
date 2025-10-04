'use client';

import { ReportGenerator } from '@/components/reports/ReportGenerator';
import { DetailedProjectReport } from '@/components/reports/DetailedProjectReport';
import { withAuth } from '@/components/auth/withAuth';
import { UserRoleType } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function ReportsPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          <span className="hidden sm:inline">Generador de Reportes</span>
          <span className="sm:hidden">Reportes</span>
        </h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">
          <span className="hidden sm:inline">Genera reportes detallados de proyectos, equipos y actividades</span>
          <span className="sm:hidden">Genera reportes detallados</span>
        </p>
      </div>
      
      <Tabs defaultValue="detailed" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2 h-10 sm:h-auto">
          <TabsTrigger value="detailed" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Reporte Detallado</span>
            <span className="sm:hidden">Detallado</span>
          </TabsTrigger>
          <TabsTrigger value="generator" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Generador Personalizado</span>
            <span className="sm:hidden">Personalizado</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="detailed" className="space-y-6">
          <DetailedProjectReport />
        </TabsContent>
        
        <TabsContent value="generator" className="space-y-6">
          <ReportGenerator />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default withAuth(ReportsPage, ['gerencia', 'administrativo', 'cliente'] as UserRoleType[]);