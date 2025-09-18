'use client';

import { ReportGenerator } from '@/components/reports/ReportGenerator';
import { DetailedProjectReport } from '@/components/reports/DetailedProjectReport';
import { withAuth } from '@/components/auth/withAuth';
import { UserRoleType } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function ReportsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Generador de Reportes</h1>
        <p className="text-gray-600 mt-2">
          Genera reportes detallados de proyectos, equipos y actividades
        </p>
      </div>
      
      <Tabs defaultValue="detailed" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="detailed">Reporte Detallado</TabsTrigger>
          <TabsTrigger value="generator">Generador Personalizado</TabsTrigger>
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