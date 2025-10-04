'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  FileText,
  Download,
  Calendar,
  Users,
  FolderOpen,
  Receipt,
  Wrench,
  DollarSign,
  TrendingUp,
  BarChart3,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar, Pie, Cell } from 'recharts';
import { LazyLineChart, LazyBarChart, LazyPieChart } from '@/components/ui/lazy-chart';

interface ReportData {
  id: string;
  name: string;
  type: 'users' | 'projects' | 'financial' | 'equipment' | 'system';
  description: string;
  lastGenerated: string;
  status: 'ready' | 'generating' | 'error';
  size?: string;
}

interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  totalProjects: number;
  activeProjects: number;
  totalRevenue: number;
  monthlyRevenue: number;
  equipmentUtilization: number;
  systemUptime: number;
}

const mockReports: ReportData[] = [
  {
    id: '1',
    name: 'Reporte de Usuarios',
    type: 'users',
    description: 'Análisis completo de usuarios activos, roles y actividad',
    lastGenerated: '2024-01-15 10:30:00',
    status: 'ready',
    size: '2.3 MB'
  },
  {
    id: '2',
    name: 'Reporte Financiero Mensual',
    type: 'financial',
    description: 'Ingresos, gastos y rentabilidad del mes actual',
    lastGenerated: '2024-01-14 15:45:00',
    status: 'ready',
    size: '5.1 MB'
  },
  {
    id: '3',
    name: 'Estado de Proyectos',
    type: 'projects',
    description: 'Progreso y estado de todos los proyectos activos',
    lastGenerated: '2024-01-13 09:15:00',
    status: 'generating'
  },
  {
    id: '4',
    name: 'Utilización de Equipos',
    type: 'equipment',
    description: 'Análisis de uso y disponibilidad de equipos',
    lastGenerated: '2024-01-12 14:20:00',
    status: 'ready',
    size: '1.8 MB'
  },
  {
    id: '5',
    name: 'Reporte del Sistema',
    type: 'system',
    description: 'Métricas de rendimiento y salud del sistema',
    lastGenerated: '2024-01-11 08:00:00',
    status: 'error'
  }
];

const mockMetrics: SystemMetrics = {
  totalUsers: 45,
  activeUsers: 38,
  totalProjects: 23,
  activeProjects: 15,
  totalRevenue: 2450000,
  monthlyRevenue: 185000,
  equipmentUtilization: 78,
  systemUptime: 99.8
};

const chartData = [
  { month: 'Ene', usuarios: 32, proyectos: 12, ingresos: 145000 },
  { month: 'Feb', usuarios: 35, proyectos: 15, ingresos: 162000 },
  { month: 'Mar', usuarios: 38, proyectos: 18, ingresos: 178000 },
  { month: 'Abr', usuarios: 42, proyectos: 20, ingresos: 195000 },
  { month: 'May', usuarios: 45, proyectos: 23, ingresos: 185000 }
];

const pieData = [
  { name: 'Activos', value: 15, color: '#10b981' },
  { name: 'En Pausa', value: 5, color: '#f59e0b' },
  { name: 'Completados', value: 3, color: '#3b82f6' }
];

export default function AdminReportsPage() {
  const [selectedReportType, setSelectedReportType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('30');
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<SystemMetrics>(mockMetrics);

  const filteredReports = selectedReportType === 'all' 
    ? mockReports 
    : mockReports.filter(report => report.type === selectedReportType);

  const handleGenerateReport = async (reportId: string): Promise<void> => {
    setGeneratingReport(reportId);
    // Simular generación de reporte
    setTimeout(() => {
      setGeneratingReport(null);
      // Aquí se actualizaría el estado del reporte
    }, 3000);
  };

  const handleDownloadReport = (reportId: string): void => {
    // Implementar descarga de reporte
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'generating':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return <Badge className="bg-green-100 text-green-800">Listo</Badge>;
      case 'generating':
        return <Badge className="bg-blue-100 text-blue-800">Generando</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      default:
        return <Badge variant="secondary">Pendiente</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'users':
        return <Users className="h-4 w-4" />;
      case 'projects':
        return <FolderOpen className="h-4 w-4" />;
      case 'financial':
        return <DollarSign className="h-4 w-4" />;
      case 'equipment':
        return <Wrench className="h-4 w-4" />;
      case 'system':
        return <BarChart3 className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            <span className="hidden sm:inline">Reportes del Sistema</span>
            <span className="sm:hidden">Reportes</span>
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            <span className="hidden sm:inline">Genera y descarga reportes detallados del sistema</span>
            <span className="sm:hidden">Genera y descarga reportes</span>
          </p>
        </div>
        <Button className="w-full sm:w-auto">
          <FileText className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Nuevo Reporte</span>
          <span className="sm:hidden">Nuevo</span>
        </Button>
      </div>

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  <span className="hidden sm:inline">Usuarios Totales</span>
                  <span className="sm:hidden">Usuarios</span>
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{metrics.totalUsers}</p>
                <p className="text-xs text-green-600 mt-1">
                  {metrics.activeUsers} activos
                </p>
              </div>
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Proyectos</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{metrics.totalProjects}</p>
                <p className="text-xs text-green-600 mt-1">
                  {metrics.activeProjects} activos
                </p>
              </div>
              <FolderOpen className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  <span className="hidden sm:inline">Ingresos Mensuales</span>
                  <span className="sm:hidden">Ingresos</span>
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  ${(metrics.monthlyRevenue / 1000).toFixed(0)}K
                </p>
                <p className="text-xs text-green-600 mt-1">
                  <span className="hidden sm:inline">+12% vs mes anterior</span>
                  <span className="sm:hidden">+12%</span>
                </p>
              </div>
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  <span className="hidden sm:inline">Uptime del Sistema</span>
                  <span className="sm:hidden">Uptime</span>
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{metrics.systemUptime}%</p>
                <p className="text-xs text-green-600 mt-1">
                  <span className="hidden sm:inline">Últimos 30 días</span>
                  <span className="sm:hidden">30 días</span>
                </p>
              </div>
              <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reports" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 h-10 sm:h-auto">
          <TabsTrigger value="reports" className="text-xs sm:text-sm">Reportes</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm">Análisis</TabsTrigger>
          <TabsTrigger value="scheduled" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Programados</span>
            <span className="sm:hidden">Program.</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reportType" className="text-sm">
                    <span className="hidden sm:inline">Tipo de Reporte</span>
                    <span className="sm:hidden">Tipo</span>
                  </Label>
                  <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                    <SelectTrigger className="h-9 sm:h-10">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los tipos</SelectItem>
                      <SelectItem value="users">Usuarios</SelectItem>
                      <SelectItem value="projects">Proyectos</SelectItem>
                      <SelectItem value="financial">Financiero</SelectItem>
                      <SelectItem value="equipment">Equipos</SelectItem>
                      <SelectItem value="system">Sistema</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateRange" className="text-sm">
                    <span className="hidden sm:inline">Rango de Fechas</span>
                    <span className="sm:hidden">Rango</span>
                  </Label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="h-9 sm:h-10">
                      <SelectValue placeholder="Seleccionar rango" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Últimos 7 días</SelectItem>
                      <SelectItem value="30">Últimos 30 días</SelectItem>
                      <SelectItem value="90">Últimos 3 meses</SelectItem>
                      <SelectItem value="365">Último año</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                  <Label htmlFor="customDate" className="text-sm">
                    <span className="hidden sm:inline">Fecha Personalizada</span>
                    <span className="sm:hidden">Fecha</span>
                  </Label>
                  <Input type="date" id="customDate" className="h-9 sm:h-10" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Reportes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            {filteredReports.map((report) => (
              <Card key={report.id}>
                <CardHeader className="pb-3 sm:pb-6">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <div className="flex-shrink-0">
                        {getTypeIcon(report.type)}
                      </div>
                      <CardTitle className="text-base sm:text-lg truncate">{report.name}</CardTitle>
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusBadge(report.status)}
                    </div>
                  </div>
                  <CardDescription className="text-sm line-clamp-2">{report.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-gray-600">
                        <span className="hidden sm:inline">Última generación:</span>
                        <span className="sm:hidden">Última:</span>
                      </span>
                      <span className="font-medium text-right">{report.lastGenerated}</span>
                    </div>
                    
                    {report.size && (
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-gray-600">Tamaño:</span>
                        <span className="font-medium">{report.size}</span>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 sm:gap-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGenerateReport(report.id)}
                        disabled={generatingReport === report.id || report.status === 'generating'}
                        className="flex-1 h-8 sm:h-9"
                      >
                        {generatingReport === report.id ? (
                          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                        ) : (
                          <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        )}
                        <span className="text-xs sm:text-sm">
                          {generatingReport === report.id ? 'Generando...' : 'Generar'}
                        </span>
                      </Button>
                      
                      {report.status === 'ready' && (
                        <Button
                          size="sm"
                          onClick={() => handleDownloadReport(report.id)}
                          className="flex-1 h-8 sm:h-9"
                        >
                          <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          <span className="text-xs sm:text-sm">Descargar</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-base sm:text-lg">
                  <span className="hidden sm:inline">Tendencias Mensuales</span>
                  <span className="sm:hidden">Tendencias</span>
                </CardTitle>
                <CardDescription className="text-sm">
                  <span className="hidden sm:inline">Usuarios, proyectos e ingresos por mes</span>
                  <span className="sm:hidden">Usuarios y proyectos</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LazyLineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Line type="monotone" dataKey="usuarios" stroke="#3b82f6" strokeWidth={2} />
                      <Line type="monotone" dataKey="proyectos" stroke="#10b981" strokeWidth={2} />
                    </LazyLineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-base sm:text-lg">
                  <span className="hidden sm:inline">Estado de Proyectos</span>
                  <span className="sm:hidden">Estados</span>
                </CardTitle>
                <CardDescription className="text-sm">
                  <span className="hidden sm:inline">Distribución por estado actual</span>
                  <span className="sm:hidden">Distribución actual</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LazyPieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={window.innerWidth < 640 ? 60 : 80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </LazyPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-3 sm:space-y-4">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">
                <span className="hidden sm:inline">Reportes Programados</span>
                <span className="sm:hidden">Programados</span>
              </CardTitle>
              <CardDescription className="text-sm">
                <span className="hidden sm:inline">Configura reportes automáticos que se generen periódicamente</span>
                <span className="sm:hidden">Reportes automáticos</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6 sm:py-8">
                <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                  <span className="hidden sm:inline">Función en Desarrollo</span>
                  <span className="sm:hidden">En Desarrollo</span>
                </h3>
                <p className="text-sm text-gray-600 mb-3 sm:mb-4 px-4">
                  <span className="hidden sm:inline">La programación automática de reportes estará disponible próximamente.</span>
                  <span className="sm:hidden">Próximamente disponible</span>
                </p>
                <Button variant="outline" size="sm" className="h-8 sm:h-9">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="text-xs sm:text-sm">
                    <span className="hidden sm:inline">Configurar Programación</span>
                    <span className="sm:hidden">Configurar</span>
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}