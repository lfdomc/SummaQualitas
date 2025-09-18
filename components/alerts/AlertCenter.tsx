'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { SystemAlert, AlertSettings, Project } from '@/lib/types';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { alertService } from '@/lib/services/alertService';
import { toast } from 'sonner';
// Removed date-fns imports due to TypeScript issues
// import format from 'date-fns/format';
// import es from 'date-fns/locale/es';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Calendar,
  TrendingDown,
  TrendingUp,
  Users,
  Settings,
  Mail,
  Smartphone,
  Eye,
  EyeOff,
  Trash2,
  Filter,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertCenterProps {
  className?: string;
}

// Mapeo de nombres de proyectos (se actualizará dinámicamente)
let PROJECT_NAMES: Record<string, string> = {};

const MOCK_SETTINGS: AlertSettings = {
  id: '1',
  user_id: 'user-1',
  alert_type: 'general',
  is_enabled: true,
  email_notifications: true,
  sms_notifications: false,
  push_notifications: true,
  budget_threshold: 10,
  deadline_warning_days: 7,
  quality_alerts: true,
  payment_alerts: true,
  resource_alerts: true,
  daily_summary: true,
  weekly_report: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-02-01T00:00:00Z'
};



export function AlertCenter({ className }: AlertCenterProps) {
  const { user } = useAuthContext();
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [settings, setSettings] = useState<AlertSettings>(MOCK_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showResolved, setShowResolved] = useState(false);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        
        // Generar alertas basadas en datos reales de proyectos
        const generatedAlerts = await alertService.generateProjectAlerts({
          budgetThreshold: settings.budget_threshold || 10,
          deadlineWarningDays: settings.deadline_warning_days || 7,
          checkPaymentOverdue: settings.payment_alerts
        });
        
        // Obtener alertas existentes (si las hubiera)
        const existingAlerts = await alertService.getExistingAlerts();
        
        // Combinar alertas generadas y existentes
        const allAlerts = [...generatedAlerts, ...existingAlerts];
        
        // Actualizar mapeo de nombres de proyectos
        const projectIds = [...new Set(allAlerts.map(alert => alert.project_id).filter(Boolean))];
        if (projectIds.length > 0) {
          const { data: projects } = await alertService['supabase']
            .from('projects')
            .select('id, name')
            .in('id', projectIds);
          
          if (projects) {
            PROJECT_NAMES = projects.reduce((acc, project) => {
              acc[project.id] = project.name;
              return acc;
            }, {} as Record<string, string>);
          }
        }
        
        setAlerts(allAlerts);
        
        if (allAlerts.length === 0) {
          toast.info('No se encontraron alertas activas');
        } else {
          const unreadCount = allAlerts.filter(alert => !alert.is_read && !alert.is_resolved).length;
          if (unreadCount > 0) {
            toast.info(`Se encontraron ${unreadCount} alerta${unreadCount !== 1 ? 's' : ''} sin leer`);
          }
        }
      } catch (error) {
        console.error('Error fetching alerts:', error);
        toast.error('Error al cargar las alertas');
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [settings.budget_threshold, settings.deadline_warning_days, settings.payment_alerts]);

  const filteredAlerts = alerts.filter(alert => {
    const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'read' && alert.is_read) ||
      (filterStatus === 'unread' && !alert.is_read) ||
      (filterStatus === 'resolved' && alert.is_resolved) ||
      (filterStatus === 'unresolved' && !alert.is_resolved);
    const matchesResolved = showResolved || !alert.is_resolved;
    
    return matchesSeverity && matchesStatus && matchesResolved;
  });

  const getSeverityIcon = (severity: SystemAlert['severity']) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'low':
        return <Bell className="h-4 w-4 text-blue-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: SystemAlert['severity']) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityLabel = (severity: SystemAlert['severity']) => {
    switch (severity) {
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Media';
      case 'low':
        return 'Baja';
      default:
        return severity;
    }
  };

  const getTypeIcon = (type: SystemAlert['type']) => {
    switch (type) {
      case 'budget_overrun':
        return <DollarSign className="h-4 w-4" />;
      case 'deadline_approaching':
        return <Calendar className="h-4 w-4" />;
      case 'payment_overdue':
        return <Clock className="h-4 w-4" />;
      case 'quality_issue':
        return <AlertTriangle className="h-4 w-4" />;
      case 'resource_shortage':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: SystemAlert['type']) => {
    switch (type) {
      case 'budget_overrun':
        return 'Sobrecosto';
      case 'deadline_approaching':
        return 'Fecha límite';
      case 'payment_overdue':
        return 'Pago vencido';
      case 'quality_issue':
        return 'Calidad';
      case 'resource_shortage':
        return 'Recursos';
      default:
        return type;
    }
  };

  const handleMarkAsRead = async (alertId: string) => {
    try {
      await alertService.markAsRead(alertId);
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, is_read: true, updated_at: new Date().toISOString() }
          : alert
      ));
      toast.success('Alerta marcada como leída');
    } catch (error) {
      console.error('Error marking alert as read:', error);
      toast.error('Error al marcar la alerta como leída');
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      await alertService.resolveAlert(alertId);
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, is_resolved: true, updated_at: new Date().toISOString() }
          : alert
      ));
      toast.success('Alerta resuelta');
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast.error('Error al resolver la alerta');
    }
  };

  const handleDelete = async (alertId: string) => {
    try {
      await alertService.deleteAlert(alertId);
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      toast.success('Alerta eliminada');
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast.error('Error al eliminar la alerta');
    }
  };

  const handleUpdateSettings = async (newSettings: Partial<AlertSettings>) => {
    try {
      setSettings(prev => ({ ...prev, ...newSettings, updated_at: new Date().toISOString() }));
      toast.success('Configuración actualizada');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Error al actualizar la configuración');
    }
  };

  const unreadCount = alerts.filter(alert => !alert.is_read && !alert.is_resolved).length;
  const highPriorityCount = alerts.filter(alert => alert.severity === 'high' && !alert.is_resolved).length;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Resumen de Alertas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Alertas</p>
                <p className="text-2xl font-bold">{alerts.length}</p>
              </div>
              <Bell className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">No Leídas</p>
                <p className="text-2xl font-bold text-orange-600">{unreadCount}</p>
              </div>
              <Eye className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Alta Prioridad</p>
                <p className="text-2xl font-bold text-red-600">{highPriorityCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resueltas</p>
                <p className="text-2xl font-bold text-green-600">
                  {alerts.filter(a => a.is_resolved).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="alerts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="alerts">Alertas Activas</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-6">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Severidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="low">Baja</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="unread">No leídas</SelectItem>
                    <SelectItem value="read">Leídas</SelectItem>
                    <SelectItem value="unresolved">Sin resolver</SelectItem>
                    <SelectItem value="resolved">Resueltas</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-resolved"
                    checked={showResolved}
                    onCheckedChange={setShowResolved}
                  />
                  <Label htmlFor="show-resolved">Mostrar resueltas</Label>
                </div>

                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualizar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Alertas */}
          <Card>
            <CardHeader>
              <CardTitle>Alertas del Sistema</CardTitle>
              <CardDescription>
                {filteredAlerts.length} alerta(s) encontrada(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 border rounded animate-pulse">
                      <div className="h-10 w-10 bg-gray-200 rounded" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay alertas</h3>
                  <p className="text-gray-600">
                    {showResolved 
                      ? 'No se encontraron alertas que coincidan con los filtros aplicados.'
                      : 'No hay alertas activas en este momento.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={cn(
                        "flex items-start space-x-4 p-4 border rounded-lg transition-colors",
                        !alert.is_read && "bg-blue-50 border-blue-200",
                        alert.is_resolved && "opacity-60"
                      )}
                    >
                      <div className="flex-shrink-0">
                        {getSeverityIcon(alert.severity)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-medium text-gray-900">
                                {alert.title}
                              </h4>
                              {!alert.is_read && (
                                <div className="h-2 w-2 bg-blue-600 rounded-full" />
                              )}
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-2">
                              {alert.message}
                            </p>
                            
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Badge className={getSeverityColor(alert.severity)}>
                                {getSeverityLabel(alert.severity)}
                              </Badge>
                              <Badge variant="outline">
                                {getTypeIcon(alert.type)}
                                <span className="ml-1">{getTypeLabel(alert.type)}</span>
                              </Badge>
                              {alert.project_id && (
                                <Badge variant="outline">
                                  {PROJECT_NAMES[alert.project_id] || 'Proyecto'}
                                </Badge>
                              )}
                              <span>
                                {new Date(alert.created_at).toLocaleDateString('es-ES', { 
                              year: 'numeric', 
                              month: '2-digit', 
                              day: '2-digit', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 ml-4">
                            {!alert.is_read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsRead(alert.id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            
                            {!alert.is_resolved && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResolve(alert.id)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(alert.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {/* Configuración de Notificaciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración de Alertas
              </CardTitle>
              <CardDescription>
                Personaliza cómo y cuándo recibir notificaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Canales de Notificación */}
              <div>
                <h4 className="font-medium mb-4">Canales de Notificación</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-gray-600" />
                      <div>
                        <Label htmlFor="email-notifications">Notificaciones por Email</Label>
                        <p className="text-sm text-gray-600">Recibir alertas por correo electrónico</p>
                      </div>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={settings.email_notifications}
                      onCheckedChange={(checked) => 
                        handleUpdateSettings({ email_notifications: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Smartphone className="h-5 w-5 text-gray-600" />
                      <div>
                        <Label htmlFor="push-notifications">Notificaciones Push</Label>
                        <p className="text-sm text-gray-600">Recibir alertas en tiempo real</p>
                      </div>
                    </div>
                    <Switch
                      id="push-notifications"
                      checked={settings.push_notifications}
                      onCheckedChange={(checked) => 
                        handleUpdateSettings({ push_notifications: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Umbrales de Alerta */}
              <div>
                <h4 className="font-medium mb-4">Umbrales de Alerta</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget-threshold">Umbral de Presupuesto (%)</Label>
                    <Input
                      id="budget-threshold"
                      type="number"
                      value={settings.budget_threshold}
                      onChange={(e) => 
                        handleUpdateSettings({ budget_threshold: parseInt(e.target.value) })
                      }
                      min="1"
                      max="100"
                    />
                    <p className="text-xs text-gray-600">
                      Alertar cuando el gasto exceda este porcentaje del presupuesto
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deadline-warning">Días de Aviso de Fecha Límite</Label>
                    <Input
                      id="deadline-warning"
                      type="number"
                      value={settings.deadline_warning_days}
                      onChange={(e) => 
                        handleUpdateSettings({ deadline_warning_days: parseInt(e.target.value) })
                      }
                      min="1"
                      max="30"
                    />
                    <p className="text-xs text-gray-600">
                      Alertar con esta anticipación antes de las fechas límite
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Tipos de Alerta */}
              <div>
                <h4 className="font-medium mb-4">Tipos de Alerta</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-5 w-5 text-gray-600" />
                      <div>
                        <Label htmlFor="quality-alerts">Alertas de Calidad</Label>
                        <p className="text-sm text-gray-600">Problemas de calidad y control</p>
                      </div>
                    </div>
                    <Switch
                      id="quality-alerts"
                      checked={settings.quality_alerts}
                      onCheckedChange={(checked) => 
                        handleUpdateSettings({ quality_alerts: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <DollarSign className="h-5 w-5 text-gray-600" />
                      <div>
                        <Label htmlFor="payment-alerts">Alertas de Pagos</Label>
                        <p className="text-sm text-gray-600">Pagos vencidos y próximos a vencer</p>
                      </div>
                    </div>
                    <Switch
                      id="payment-alerts"
                      checked={settings.payment_alerts}
                      onCheckedChange={(checked) => 
                        handleUpdateSettings({ payment_alerts: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <TrendingDown className="h-5 w-5 text-gray-600" />
                      <div>
                        <Label htmlFor="resource-alerts">Alertas de Recursos</Label>
                        <p className="text-sm text-gray-600">Escasez de materiales y equipos</p>
                      </div>
                    </div>
                    <Switch
                      id="resource-alerts"
                      checked={settings.resource_alerts}
                      onCheckedChange={(checked) => 
                        handleUpdateSettings({ resource_alerts: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Reportes Automáticos */}
              <div>
                <h4 className="font-medium mb-4">Reportes Automáticos</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="daily-summary">Resumen Diario</Label>
                      <p className="text-sm text-gray-600">Recibir resumen diario de alertas</p>
                    </div>
                    <Switch
                      id="daily-summary"
                      checked={settings.daily_summary}
                      onCheckedChange={(checked) => 
                        handleUpdateSettings({ daily_summary: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="weekly-report">Reporte Semanal</Label>
                      <p className="text-sm text-gray-600">Recibir reporte semanal de actividad</p>
                    </div>
                    <Switch
                      id="weekly-report"
                      checked={settings.weekly_report}
                      onCheckedChange={(checked) => 
                        handleUpdateSettings({ weekly_report: checked })
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}