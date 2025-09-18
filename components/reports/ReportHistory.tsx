'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Report } from '@/lib/types';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { toast } from 'sonner';

import {
  Download,
  FileText,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Trash2,
  Calendar,
  User,
  FileType,
  HardDrive,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReportHistoryProps {
  className?: string;
}

// Datos simulados para demostración
const MOCK_REPORTS: Report[] = [
  {
    id: '1',
    title: 'Reporte Ejecutivo Mensual - Enero 2024',
    description: 'Resumen ejecutivo de todos los proyectos activos',
    type: 'executive',
    report_type: 'executive',
    content: {},
    is_approved: true,
    is_client_visible: true,
    generated_by: 'user-1',
    generated_at: '2024-01-31T10:30:00Z',
    file_url: '/reports/executive_jan_2024.pdf',
    file_size: 2456789,
    parameters: JSON.stringify({
      dateRange: { from: '2024-01-01', to: '2024-01-31' },
      projects: ['proj-1', 'proj-2', 'proj-3'],
      format: 'pdf'
    }),
    status: 'completado',
    created_at: '2024-01-31T10:25:00Z',
    updated_at: '2024-01-31T10:30:00Z'
  },
  {
    id: '2',
    title: 'Análisis Financiero Q4 2023',
    description: 'Análisis detallado de costos y rentabilidad del cuarto trimestre',
    type: 'financial',
    report_type: 'financial',
    content: {},
    is_approved: true,
    is_client_visible: false,
    generated_by: 'user-2',
    generated_at: '2024-01-15T14:20:00Z',
    file_url: '/reports/financial_q4_2023.xlsx',
    file_size: 1234567,
    parameters: JSON.stringify({
      dateRange: { from: '2023-10-01', to: '2023-12-31' },
      projects: ['proj-1', 'proj-4'],
      format: 'excel'
    }),
    status: 'completed',
    created_at: '2024-01-15T14:15:00Z',
    updated_at: '2024-01-15T14:20:00Z'
  },
  {
    id: '3',
    title: 'Seguimiento de Progreso - Proyecto Torre Central',
    description: 'Estado de avance y cronograma del proyecto Torre Central',
    type: 'progress',
    report_type: 'progress',
    content: {},
    is_approved: true,
    is_client_visible: true,
    generated_by: 'user-1',
    generated_at: '2024-01-28T09:45:00Z',
    file_url: '/reports/progress_torre_central.pdf',
    file_size: 3456789,
    parameters: JSON.stringify({
      dateRange: { from: '2024-01-01', to: '2024-01-28' },
      projects: ['proj-1'],
      format: 'pdf'
    }),
    status: 'completed',
    created_at: '2024-01-28T09:40:00Z',
    updated_at: '2024-01-28T09:45:00Z'
  },
  {
    id: '4',
    title: 'Análisis de Rendimiento KPIs',
    description: 'Métricas de rendimiento y análisis EVM de todos los proyectos',
    type: 'performance',
    report_type: 'performance',
    content: {},
    is_approved: false,
    is_client_visible: false,
    generated_by: 'user-3',
    generated_at: '2024-01-30T15:30:00Z',
    file_url: undefined,
    file_size: undefined,
    parameters: JSON.stringify({
      dateRange: { from: '2024-01-01', to: '2024-01-31' },
      projects: ['proj-1', 'proj-2', 'proj-3', 'proj-4'],
      format: 'pdf'
    }),
    status: 'generating',
    created_at: '2024-02-01T08:30:00Z',
    updated_at: '2024-02-01T08:30:00Z'
  },
  {
    id: '5',
    title: 'Reporte Personalizado - Costos de Materiales',
    description: 'Análisis detallado de costos de materiales por proyecto',
    type: 'custom',
    report_type: 'custom',
    content: {},
    is_approved: false,
    is_client_visible: false,
    generated_by: 'user-2',
    generated_at: '2024-01-30T16:20:00Z',
    file_url: undefined,
    file_size: undefined,
    parameters: JSON.stringify({
      dateRange: { from: '2024-01-01', to: '2024-01-31' },
      projects: ['proj-2'],
      format: 'excel'
    }),
    status: 'failed',
    created_at: '2024-01-30T16:20:00Z',
    updated_at: '2024-01-30T16:25:00Z'
  }
];

const USER_NAMES: Record<string, string> = {
  'user-1': 'María González',
  'user-2': 'Carlos Rodríguez',
  'user-3': 'Ana Martínez'
};

export function ReportHistory({ className }: ReportHistoryProps) {
  const { user } = useAuthContext();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        // Simular carga de datos
        await new Promise(resolve => setTimeout(resolve, 1000));
        setReports(MOCK_REPORTS);
      } catch (error) {
        console.error('Error fetching reports:', error);
        toast.error('Error al cargar el historial de reportes');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesType = typeFilter === 'all' || report.type === typeFilter || report.report_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusIcon = (status: Report['status']) => {
    switch (status) {
      case 'completado':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'generating':
        return <Loader className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusLabel = (status: Report['status']) => {
    switch (status) {
      case 'completado':
        return 'Completado';
      case 'generating':
        return 'Generando';
      case 'failed':
        return 'Error';
      default:
        return 'Pendiente';
    }
  };

  const getStatusColor = (status: Report['status']) => {
    switch (status) {
      case 'completado':
        return 'bg-green-100 text-green-800';
      case 'generating':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getTypeLabel = (type: Report['type']) => {
    switch (type) {
      case 'executive':
        return 'Ejecutivo';
      case 'financial':
        return 'Financiero';
      case 'progress':
        return 'Progreso';
      case 'performance':
        return 'Rendimiento';
      case 'custom':
        return 'Personalizado';
      default:
        return type;
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileExtension = (url: string | null) => {
    if (!url) return '';
    return url.split('.').pop()?.toUpperCase() || '';
  };

  const handleDownload = (report: Report) => {
    if (report.status !== 'completado' || !report.file_url) {
      toast.error('El reporte no está disponible para descarga');
      return;
    }

    // Simular descarga
    const link = document.createElement('a');
    link.href = report.file_url;
    link.download = report.title.replace(/\s+/g, '_') + '.' + getFileExtension(report.file_url).toLowerCase();
    link.click();
    
    toast.success('Descarga iniciada');
  };

  const handleDelete = async (reportId: string) => {
    try {
      // Simular eliminación
      await new Promise(resolve => setTimeout(resolve, 500));
      setReports(prev => prev.filter(r => r.id !== reportId));
      toast.success('Reporte eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Error al eliminar el reporte');
    }
  };

  const handleRetry = async (reportId: string) => {
    try {
      // Simular reintento
      setReports(prev => prev.map(r => 
        r.id === reportId 
          ? { ...r, status: 'generating' as const }
          : r
      ));
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setReports(prev => prev.map(r => 
        r.id === reportId 
          ? { 
              ...r, 
              status: 'completado' as const,
              generated_at: new Date().toISOString(),
              file_url: `/reports/retry_${reportId}.pdf`,
              file_size: Math.floor(Math.random() * 5000000) + 1000000
            }
          : r
      ));
      
      toast.success('Reporte regenerado exitosamente');
    } catch (error) {
      console.error('Error retrying report:', error);
      toast.error('Error al regenerar el reporte');
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Filtros y Búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Historial de Reportes
          </CardTitle>
          <CardDescription>
            Visualiza y gestiona todos los reportes generados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar reportes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="completado">Completado</SelectItem>
                <SelectItem value="generating">Generando</SelectItem>
                <SelectItem value="failed">Error</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="executive">Ejecutivo</SelectItem>
                <SelectItem value="financial">Financiero</SelectItem>
                <SelectItem value="progress">Progreso</SelectItem>
                <SelectItem value="performance">Rendimiento</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Reportes */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <Loader className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Cargando historial de reportes...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay reportes</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'No se encontraron reportes que coincidan con los filtros aplicados.'
                  : 'Aún no se han generado reportes. Crea tu primer reporte para comenzar.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reporte</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Generado por</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tamaño</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{report.title}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {report.description || 'Sin descripción'}
                        </div>
                        {report.file_url && (
                          <div className="flex items-center gap-1 mt-1">
                            <FileType className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {getFileExtension(report.file_url)}
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getTypeLabel(report.type || report.report_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(report.status)}
                        <Badge className={getStatusColor(report.status)}>
                          {getStatusLabel(report.status)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {USER_NAMES[report.generated_by] || 'Usuario desconocido'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div className="text-sm">
                          {report.generated_at ? (
                            <>
                              <div>{new Date(report.generated_at).toLocaleDateString('es-ES')}</div>
                               <div className="text-xs text-gray-500">
                                 {new Date(report.generated_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                               </div>
                            </>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {formatFileSize(report.file_size ?? 0)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {report.status === 'completado' && (
                            <>
                              <DropdownMenuItem onClick={() => handleDownload(report)}>
                                <Download className="h-4 w-4 mr-2" />
                                Descargar
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                Vista Previa
                              </DropdownMenuItem>
                            </>
                          )}
                          {report.status === 'failed' && (
                            <DropdownMenuItem onClick={() => handleRetry(report.id)}>
                              <Clock className="h-4 w-4 mr-2" />
                              Reintentar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => handleDelete(report.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Resumen */}
      {!loading && filteredReports.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {filteredReports.length}
                </div>
                <div className="text-sm text-gray-600">Total Reportes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {filteredReports.filter(r => r.status === 'completado').length}
                </div>
                <div className="text-sm text-gray-600">Completados</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {filteredReports.filter(r => r.status === 'generating').length}
                </div>
                <div className="text-sm text-gray-600">En Proceso</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {filteredReports.filter(r => r.status === 'failed').length}
                </div>
                <div className="text-sm text-gray-600">Con Error</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}