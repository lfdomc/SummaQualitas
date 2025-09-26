'use client';

import { useEffect, useState } from 'react';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  FileText,
  BarChart3,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Plus,
  ArrowRight,
  Calendar,
  MapPin,
  Clock,
  Wrench,
  CreditCard,
  Eye,
  Settings,
  LogOut,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalInvoices: number;
  pendingPayments: number;
  availableEquipment: number;
  totalUsers: number;
  totalBudget: number;
  totalExpenses: number;
}

export default function DashboardPage() {
  const { user, profile, loading, signOut } = useAuthContext();
  const permissions = usePermissions();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeProjects: 0,
    totalInvoices: 0,
    pendingPayments: 0,
    availableEquipment: 0,
    totalUsers: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Cargar estadísticas del dashboard
  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoadingStats(true);
        
        // Importar el cliente de Supabase
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        
        // Obtener datos reales de proyectos
        const { data: projects, error: projectsError } = await supabase
          .from('projects')
          .select('id, status, budget');
        
        if (projectsError) {
          console.error('Error loading projects:', projectsError);
        }
        
        // Obtener datos reales de gastos
        const { data: expenses, error: expensesError } = await supabase
          .from('expenses')
          .select('id, amount');
        
        if (expensesError) {
          console.error('Error loading expenses:', expensesError);
        }
        
        // Obtener datos reales de equipos
        const { data: equipment, error: equipmentError } = await supabase
          .from('equipment')
          .select('id, status');
        
        if (equipmentError) {
          console.error('Error loading equipment:', equipmentError);
        }
        
        // Calcular estadísticas reales
        const totalProjects = projects?.length || 0;
        const activeProjects = projects?.filter(p => 
          p.status === 'active' || p.status === 'en_progreso'
        ).length || 0;
        const totalExpenses = expenses?.length || 0;
        const availableEquipment = equipment?.filter(e => 
          e.status === 'available' || e.status === 'disponible'
        ).length || 0;
        const totalBudgetAmount = projects?.reduce((sum, project) => sum + (project.budget || 0), 0) || 0;
        const totalExpensesAmount = expenses?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0;
        
        setStats({
          totalProjects,
          activeProjects,
          totalInvoices: 0, // Por ahora 0 hasta que se implemente la tabla invoices
          pendingPayments: 0, // Por ahora 0 hasta que se implemente
          availableEquipment,
          totalUsers: 1, // Por ahora 1 (el usuario actual)
          totalBudget: totalBudgetAmount,
          totalExpenses: totalExpensesAmount
        });
      } catch (error) {
        console.error('Error loading stats:', error);
        // En caso de error, usar valores por defecto
        setStats({
          totalProjects: 0,
          activeProjects: 0,
          totalInvoices: 0,
          pendingPayments: 0,
          availableEquipment: 0,
          totalUsers: 1,
          totalBudget: 0,
          totalExpenses: 0
        });
      } finally {
        setLoadingStats(false);
      }
    };

    if (user) {
      loadStats();
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Cargando dashboard...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // El useEffect se encargará de la redirección
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-foreground">SummaQualitas</h1>
                <p className="text-sm text-muted-foreground">Sistema de Gestión</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {profile?.name || user?.email}
                </p>
                <div className="flex items-center space-x-2">
                  <Badge variant={profile?.role === 'gerencia' ? 'default' : 'secondary'}>
                    {profile?.role === 'gerencia' ? 'Gerencia' :
                     profile?.role === 'administrativo' ? 'Administrativo' : 'Cliente'}
                  </Badge>
                  {profile?.role === 'gerencia' && (
                    <Badge variant="outline" className="text-xs">
                      Administrador
                    </Badge>
                  )}
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Salir</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Bienvenido, {profile?.name?.split(' ')[0] || user?.email?.split('@')[0]}
          </h2>
          <p className="text-muted-foreground">
            Aquí tienes un resumen de tu sistema de gestión de construcción.
          </p>
        </div>
      
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Proyectos */}
          {permissions.canViewAllProjects && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Proyectos</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingStats ? '...' : stats.totalProjects}
                </div>
                <p className="text-xs text-muted-foreground">
                  {loadingStats ? '...' : stats.activeProjects} activos
                </p>
              </CardContent>
            </Card>
          )}

          {/* Facturas */}
          {permissions.canViewFinancials && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Facturas</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingStats ? '...' : stats.totalInvoices}
                </div>
                <p className="text-xs text-muted-foreground">
                  {loadingStats ? '...' : stats.pendingPayments} pendientes
                </p>
              </CardContent>
            </Card>
          )}

          {/* Equipos */}
          {permissions.canEditEquipment && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Equipos</CardTitle>
                <Wrench className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingStats ? '...' : stats.availableEquipment}
                </div>
                <p className="text-xs text-muted-foreground">
                  Disponibles
                </p>
              </CardContent>
            </Card>
          )}

          {/* Presupuesto Total */}
          {permissions.canViewFinancials && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Presupuesto Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingStats ? '...' : `$${(stats.totalBudget / 1000000).toFixed(1)}M`}
                </div>
                <p className="text-xs text-muted-foreground">
                  Todos los proyectos
                </p>
              </CardContent>
            </Card>
          )}

          {/* Gastos Totales */}
          {permissions.canViewFinancials && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingStats ? '...' : `$${stats.totalExpenses.toLocaleString()}`}
                </div>
                <p className="text-xs text-muted-foreground">
                  Gastos registrados
                </p>
              </CardContent>
            </Card>
          )}

          {/* Usuarios (solo para admins) */}
          {permissions.canEditUsers && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingStats ? '...' : stats.totalUsers}
                </div>
                <p className="text-xs text-muted-foreground">
                  Activos
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Acciones Principales */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
              <CardDescription>
                Accede rápidamente a las funciones principales del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Proyectos */}
              {permissions.canViewAllProjects && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Proyectos</p>
                      <p className="text-sm text-gray-500">Gestionar proyectos de construcción</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Link href="/projects">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    </Link>
                    {permissions.canCreateProjects && (
                      <Link href="/projects/new">
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          Nuevo
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              )}



              {/* Equipos */}
              {permissions.canEditEquipment && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Wrench className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-medium">Equipos</p>
                      <p className="text-sm text-gray-500">Gestionar alquiler de equipos</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Link href="/equipment">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    </Link>
                    {permissions.canCreateEquipment && (
                      <Link href="/equipment/new">
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          Nuevo
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* Pagos */}
              {permissions.canManagePayments && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Pagos</p>
                      <p className="text-sm text-gray-500">Gestionar pagos de clientes y proveedores</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Link href="/payments">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    </Link>
                    {permissions.canManagePayments && (
                      <Link href="/payments/new">
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          Nuevo
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Administración */}
          <Card>
            <CardHeader>
              <CardTitle>Administración</CardTitle>
              <CardDescription>
                Herramientas de administración y configuración
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Usuarios */}
              {permissions.canEditUsers && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Usuarios</p>
                      <p className="text-sm text-gray-500">Gestionar usuarios del sistema</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Link href="/admin/users">
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-1" />
                        Gestionar
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Reportes */}
              {permissions.canViewReports && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Reportes</p>
                      <p className="text-sm text-gray-500">Ver reportes y estadísticas</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Link href="/reports">
                      <Button variant="outline" size="sm">
                        <BarChart3 className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Configuración */}
              {permissions.canAccessAdmin && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Settings className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium">Configuración</p>
                      <p className="text-sm text-gray-500">Configuración del sistema</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Link href="/admin/settings">
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-1" />
                        Configurar
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </main>
    </div>
  );
}