'use client';

// =====================================================
// DASHBOARD ADMINISTRATIVO PRINCIPAL
// =====================================================

import { useEffect, useState } from 'react';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { useHasPermission } from '@/hooks/usePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Settings, 
  Database, 
  Shield, 
  Activity, 
  BarChart3,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  HardDrive,
  Cpu,
  Wifi,
  Server,
  Loader2,
  ArrowRight,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalProjects: number;
  activeProjects: number;
  totalInvoices: number;
  pendingInvoices: number;
  systemUptime: string;
  databaseSize: string;
  lastBackup: string;
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  cpu: number;
  memory: number;
  disk: number;
  network: 'connected' | 'disconnected';
  database: 'connected' | 'disconnected';
}

interface RecentActivity {
  id: string;
  type: 'user_login' | 'user_created' | 'project_created' | 'invoice_generated' | 'system_backup';
  description: string;
  user: string;
  timestamp: string;
}

const mockStats: SystemStats = {
  totalUsers: 15,
  activeUsers: 12,
  totalProjects: 8,
  activeProjects: 5,
  totalInvoices: 45,
  pendingInvoices: 7,
  systemUptime: '15 días, 8 horas',
  databaseSize: '2.3 GB',
  lastBackup: '2024-01-15 03:00:00'
};

const mockHealth: SystemHealth = {
  status: 'healthy',
  cpu: 35,
  memory: 68,
  disk: 45,
  network: 'connected',
  database: 'connected'
};

const mockActivity: RecentActivity[] = [
  {
    id: '1',
    type: 'user_login',
    description: 'Inicio de sesión exitoso',
    user: 'Carlos Rodríguez',
    timestamp: '2024-01-15 14:30:00'
  },
  {
    id: '2',
    type: 'project_created',
    description: 'Nuevo proyecto: "Edificio Comercial Plaza"',
    user: 'María González',
    timestamp: '2024-01-15 13:45:00'
  },
  {
    id: '3',
    type: 'invoice_generated',
    description: 'Factura #INV-2024-045 generada',
    user: 'Ana López',
    timestamp: '2024-01-15 12:20:00'
  },
  {
    id: '4',
    type: 'system_backup',
    description: 'Respaldo automático completado',
    user: 'Sistema',
    timestamp: '2024-01-15 03:00:00'
  },
  {
    id: '5',
    type: 'user_created',
    description: 'Nuevo usuario: "Pedro Martínez"',
    user: 'Admin Principal',
    timestamp: '2024-01-14 16:15:00'
  }
];

export default function AdminDashboardPage() {
  const { profile: user, loading } = useAuthContext();
  const canAccessAdmin = useHasPermission('canAccessAdmin');
  const [stats, setStats] = useState<SystemStats>(mockStats);
  const [health, setHealth] = useState<SystemHealth>(mockHealth);
  const [activity, setActivity] = useState<RecentActivity[]>(mockActivity);
  const [loadingData, setLoadingData] = useState(true);

  // Verificar permisos de acceso
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div></div>;
  }

  if (!canAccessAdmin) {
    return <div className="flex items-center justify-center min-h-screen"><div className="text-center"><h2 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h2><p className="text-gray-600">No tienes permisos para acceder a esta página.</p></div></div>;
  }

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoadingData(true);
        // Simular carga de datos
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Aquí se cargarían los datos reales desde la API
        setStats(mockStats);
        setHealth(mockHealth);
        setActivity(mockActivity);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        // toast.error('Error al cargar datos del dashboard');
      } finally {
        setLoadingData(false);
      }
    };

    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'user_login': return <Users className="h-4 w-4 text-blue-600" />;
      case 'user_created': return <Users className="h-4 w-4 text-green-600" />;
      case 'project_created': return <FileText className="h-4 w-4 text-purple-600" />;
      case 'invoice_generated': return <BarChart3 className="h-4 w-4 text-orange-600" />;
      case 'system_backup': return <Database className="h-4 w-4 text-gray-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getHealthStatusColor = (status: SystemHealth['status']) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthStatusIcon = (status: SystemHealth['status']) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Cargando dashboard administrativo...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
        <p className="text-gray-600 mt-2">
          Panel de control para la administración del sistema SummaQualitas
        </p>
      </div>

      {/* System Health Status */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getHealthStatusIcon(health.status)}
              <CardTitle>Estado del Sistema</CardTitle>
            </div>
            <Badge 
              variant={health.status === 'healthy' ? 'default' : health.status === 'warning' ? 'secondary' : 'destructive'}
            >
              {health.status === 'healthy' ? 'Saludable' : 
               health.status === 'warning' ? 'Advertencia' : 'Crítico'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <Cpu className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-sm text-gray-600">CPU</p>
              <p className="text-lg font-semibold">{health.cpu}%</p>
            </div>
            <div className="text-center">
              <HardDrive className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-sm text-gray-600">Memoria</p>
              <p className="text-lg font-semibold">{health.memory}%</p>
            </div>
            <div className="text-center">
              <Database className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="text-sm text-gray-600">Disco</p>
              <p className="text-lg font-semibold">{health.disk}%</p>
            </div>
            <div className="text-center">
              <Wifi className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <p className="text-sm text-gray-600">Red</p>
              <p className="text-lg font-semibold">
                {health.network === 'connected' ? 'Conectado' : 'Desconectado'}
              </p>
            </div>
            <div className="text-center">
              <Server className="h-8 w-8 mx-auto mb-2 text-red-600" />
              <p className="text-sm text-gray-600">Base de Datos</p>
              <p className="text-lg font-semibold">
                {health.database === 'connected' ? 'Conectado' : 'Desconectado'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                {stats.activeUsers} activos
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proyectos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-blue-600 flex items-center">
                <Activity className="h-3 w-3 mr-1" />
                {stats.activeProjects} en progreso
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facturas</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInvoices}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-orange-600 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {stats.pendingInvoices} pendientes
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Activo</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{stats.systemUptime}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <CheckCircle className="h-3 w-3 mr-1" />
                Sistema estable
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Herramientas de administración más utilizadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/admin/users">
              <Button variant="outline" className="w-full justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Gestionar Usuarios</span>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            
            <Link href="/admin/system">
              <Button variant="outline" className="w-full justify-between">
                <div className="flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>Configuración del Sistema</span>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            
            <Link href="/admin/database">
              <Button variant="outline" className="w-full justify-between">
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4" />
                  <span>Gestión de Base de Datos</span>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            
            <Link href="/admin/security">
              <Button variant="outline" className="w-full justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>Seguridad y Permisos</span>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            
            <Link href="/reports">
              <Button variant="outline" className="w-full justify-between">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Reportes del Sistema</span>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>
              Últimas acciones realizadas en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activity.map((item) => (
                <div key={item.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {item.description}
                    </p>
                    <p className="text-sm text-gray-500">
                      Por {item.user}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(item.timestamp).toLocaleString('es-ES')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <Link href="/admin/activity">
                <Button variant="outline" className="w-full">
                  Ver toda la actividad
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Información del Sistema</CardTitle>
          <CardDescription>
            Detalles técnicos y estadísticas del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Base de Datos</h4>
              <p className="text-sm text-gray-600">Tamaño: {stats.databaseSize}</p>
              <p className="text-sm text-gray-600">
                Último respaldo: {new Date(stats.lastBackup).toLocaleString('es-ES')}
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Rendimiento</h4>
              <p className="text-sm text-gray-600">CPU: {health.cpu}% utilizado</p>
              <p className="text-sm text-gray-600">Memoria: {health.memory}% utilizada</p>
              <p className="text-sm text-gray-600">Disco: {health.disk}% utilizado</p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Conectividad</h4>
              <p className="text-sm text-gray-600">
                Red: {health.network === 'connected' ? 'Conectado' : 'Desconectado'}
              </p>
              <p className="text-sm text-gray-600">
                Base de datos: {health.database === 'connected' ? 'Conectado' : 'Desconectado'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}