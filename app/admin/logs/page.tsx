'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Activity,
  Database,
  Shield,
  Eye,
  Calendar,
  FileText
} from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  category: 'auth' | 'database' | 'api' | 'system' | 'user' | 'security';
  message: string;
  userId?: string;
  userName?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
}

interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  resource: string;
  resourceId?: string;
  userId: string;
  userName: string;
  ipAddress: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  success: boolean;
}

const mockLogs: LogEntry[] = [
  {
    id: '1',
    timestamp: '2024-01-15T10:30:00Z',
    level: 'info',
    category: 'auth',
    message: 'Usuario inició sesión exitosamente',
    userId: 'user_123',
    userName: 'Juan Pérez',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  },
  {
    id: '2',
    timestamp: '2024-01-15T10:25:00Z',
    level: 'warning',
    category: 'database',
    message: 'Consulta lenta detectada en tabla projects',
    details: { query_time: '2.5s', table: 'projects', query: 'SELECT * FROM projects WHERE...' }
  },
  {
    id: '3',
    timestamp: '2024-01-15T10:20:00Z',
    level: 'error',
    category: 'api',
    message: 'Error al procesar solicitud de facturación',
    userId: 'user_456',
    userName: 'María García',
    ipAddress: '192.168.1.101',
    details: { error: 'Validation failed', endpoint: '/api/invoices', status: 400 }
  },
  {
    id: '4',
    timestamp: '2024-01-15T10:15:00Z',
    level: 'success',
    category: 'system',
    message: 'Backup automático completado exitosamente',
    details: { backup_size: '125MB', duration: '45s', location: '/backups/2024-01-15.sql' }
  },
  {
    id: '5',
    timestamp: '2024-01-15T10:10:00Z',
    level: 'warning',
    category: 'security',
    message: 'Múltiples intentos de inicio de sesión fallidos',
    ipAddress: '203.0.113.1',
    details: { attempts: 5, username: 'admin', blocked: true }
  }
];

const mockAuditLogs: AuditEntry[] = [
  {
    id: '1',
    timestamp: '2024-01-15T10:30:00Z',
    action: 'UPDATE',
    resource: 'project',
    resourceId: 'proj_123',
    userId: 'user_123',
    userName: 'Juan Pérez',
    ipAddress: '192.168.1.100',
    success: true,
    changes: {
      status: { old: 'in_progress', new: 'completed' },
      progress: { old: 85, new: 100 }
    }
  },
  {
    id: '2',
    timestamp: '2024-01-15T10:25:00Z',
    action: 'CREATE',
    resource: 'user',
    resourceId: 'user_789',
    userId: 'user_456',
    userName: 'María García',
    ipAddress: '192.168.1.101',
    success: true,
    changes: {
      name: { old: null, new: 'Carlos López' },
      role: { old: null, new: 'operador' },
      email: { old: null, new: 'carlos@example.com' }
    }
  },
  {
    id: '3',
    timestamp: '2024-01-15T10:20:00Z',
    action: 'DELETE',
    resource: 'equipment',
    resourceId: 'eq_456',
    userId: 'user_123',
    userName: 'Juan Pérez',
    ipAddress: '192.168.1.100',
    success: false
  }
];

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>(mockLogs);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>(mockAuditLogs);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('today');
  const [loading, setLoading] = useState<boolean>(false);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.ipAddress?.includes(searchTerm);
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
    const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;
    
    return matchesSearch && matchesLevel && matchesCategory;
  });

  const filteredAuditLogs = auditLogs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.userName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const handleRefresh = async (): Promise<void> => {
    setLoading(true);
    // Simular carga de datos
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const handleExport = (type: 'logs' | 'audit'): void => {
    // Implementar exportación
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'info':
        return <Badge className="bg-blue-100 text-blue-800">Info</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Advertencia</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Éxito</Badge>;
      default:
        return <Badge variant="secondary">{level}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'auth':
        return <Shield className="h-4 w-4" />;
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'api':
        return <Activity className="h-4 w-4" />;
      case 'system':
        return <Info className="h-4 w-4" />;
      case 'user':
        return <User className="h-4 w-4" />;
      case 'security':
        return <Shield className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    return format(new Date(timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: es });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Logs y Auditoría</h1>
          <p className="text-gray-600 mt-1">
            Monitoreo de actividad del sistema y auditoría de cambios
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button variant="outline" onClick={() => handleExport('logs')}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar en logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">Nivel</Label>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los niveles</SelectItem>
                  <SelectItem value="info">Información</SelectItem>
                  <SelectItem value="warning">Advertencia</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="success">Éxito</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  <SelectItem value="auth">Autenticación</SelectItem>
                  <SelectItem value="database">Base de Datos</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="system">Sistema</SelectItem>
                  <SelectItem value="user">Usuario</SelectItem>
                  <SelectItem value="security">Seguridad</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar fecha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoy</SelectItem>
                  <SelectItem value="yesterday">Ayer</SelectItem>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="system-logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="system-logs">Logs del Sistema</TabsTrigger>
          <TabsTrigger value="audit-logs">Auditoría</TabsTrigger>
          <TabsTrigger value="security-logs">Seguridad</TabsTrigger>
        </TabsList>

        <TabsContent value="system-logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs del Sistema</CardTitle>
              <CardDescription>
                Registro de eventos y actividades del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="flex items-center space-x-2">
                          {getLevelIcon(log.level)}
                          {getCategoryIcon(log.category)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            {getLevelBadge(log.level)}
                            <Badge variant="outline">{log.category}</Badge>
                            <span className="text-sm text-gray-500">
                              {formatTimestamp(log.timestamp)}
                            </span>
                          </div>
                          <p className="text-gray-900 font-medium mb-2">{log.message}</p>
                          
                          {(log.userName || log.ipAddress) && (
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              {log.userName && (
                                <div className="flex items-center space-x-1">
                                  <User className="h-3 w-3" />
                                  <span>{log.userName}</span>
                                </div>
                              )}
                              {log.ipAddress && (
                                <div className="flex items-center space-x-1">
                                  <Activity className="h-3 w-3" />
                                  <span>{log.ipAddress}</span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {log.details && (
                            <details className="mt-2">
                              <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-800">
                                Ver detalles
                              </summary>
                              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit-logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registro de Auditoría</CardTitle>
              <CardDescription>
                Historial de cambios y acciones realizadas por usuarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha/Hora</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Recurso</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAuditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {formatTimestamp(log.timestamp)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>{log.userName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={
                            log.action === 'CREATE' ? 'bg-green-100 text-green-800' :
                            log.action === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                            log.action === 'DELETE' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }
                        >
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium">{log.resource}</span>
                          {log.resourceId && (
                            <div className="text-xs text-gray-500">{log.resourceId}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.success ? (
                          <Badge className="bg-green-100 text-green-800">Éxito</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">Fallo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.ipAddress}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security-logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Seguridad</CardTitle>
              <CardDescription>
                Eventos relacionados con la seguridad del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Función en Desarrollo
                </h3>
                <p className="text-gray-600 mb-4">
                  Los logs de seguridad detallados estarán disponibles próximamente.
                </p>
                <Button variant="outline">
                  <Shield className="h-4 w-4 mr-2" />
                  Configurar Alertas de Seguridad
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}