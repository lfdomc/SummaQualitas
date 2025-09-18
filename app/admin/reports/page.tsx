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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes del Sistema</h1>
          <p className="text-gray-600 mt-1">
            Genera y descarga reportes detallados del sistema
          </p>
        </div>
        <Button>
          <FileText className="h-4 w-4 mr-2" />
          Nuevo Reporte
        </Button>
      </div>

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Usuarios Totales</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalUsers}</p>
                <p className="text-xs text-green-600 mt-1">
                  {metrics.activeUsers} activos
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Proyectos</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalProjects}</p>
                <p className="text-xs text-green-600 mt-1">
                  {metrics.activeProjects} activos
                </p>
              </div>
              <FolderOpen className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos Mensuales</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${(metrics.monthlyRevenue / 1000).toFixed(0)}K
                </p>
                <p className="text-xs text-green-600 mt-1">
                  +12% vs mes anterior
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Uptime del Sistema</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.systemUptime}%</p>
                <p className="text-xs text-green-600 mt-1">
                  Últimos 30 días
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reports" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
          <TabsTrigger value="analytics">Análisis</TabsTrigger>
          <TabsTrigger value="scheduled">Programados</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reportType">Tipo de Reporte</Label>
                  <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                    <SelectTrigger>
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
                  <Label htmlFor="dateRange">Rango de Fechas</Label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger>
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

                <div className="space-y-2">
                  <Label htmlFor="customDate">Fecha Personalizada</Label>
                  <Input type="date" id="customDate" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Reportes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredReports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(report.type)}
                      <CardTitle className="text-lg">{report.name}</CardTitle>
                    </div>
                    {getStatusBadge(report.status)}
                  </div>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Última generación:</span>
                      <span className="font-medium">{report.lastGenerated}</span>
                    </div>
                    
                    {report.size && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Tamaño:</span>
                        <span className="font-medium">{report.size}</span>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGenerateReport(report.id)}
                        disabled={generatingReport === report.id || report.status === 'generating'}
                        className="flex-1"
                      >
                        {generatingReport === report.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <FileText className="h-4 w-4 mr-2" />
                        )}
                        {generatingReport === report.id ? 'Generando...' : 'Generar'}
                      </Button>
                      
                      {report.status === 'ready' && (
                        <Button
                          size="sm"
                          onClick={() => handleDownloadReport(report.id)}
                          className="flex-1"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Descargar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tendencias Mensuales</CardTitle>
                <CardDescription>Usuarios, proyectos e ingresos por mes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="usuarios" stroke="#3b82f6" strokeWidth={2} />
                      <Line type="monotone" dataKey="proyectos" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estado de Proyectos</CardTitle>
                <CardDescription>Distribución por estado actual</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reportes Programados</CardTitle>
              <CardDescription>
                Configura reportes automáticos que se generen periódicamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Función en Desarrollo
                </h3>
                <p className="text-gray-600 mb-4">
                  La programación automática de reportes estará disponible próximamente.
                </p>
                <Button variant="outline">
                  <Clock className="h-4 w-4 mr-2" />
                  Configurar Programación
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}