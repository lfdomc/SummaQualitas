'use client';

// =====================================================
// PÁGINA DE CONFIGURACIÓN DEL SISTEMA
// =====================================================

import { useEffect, useState } from 'react';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { useHasPermission } from '@/hooks/usePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Database, 
  Mail, 
  Bell, 
  Shield, 
  Globe, 
  Palette, 
  Clock,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Download,
  Upload,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface SystemConfig {
  // Configuración general
  siteName: string;
  siteDescription: string;
  adminEmail: string;
  timezone: string;
  language: string;
  currency: string;
  
  // Configuración de seguridad
  sessionTimeout: number;
  passwordMinLength: number;
  requireTwoFactor: boolean;
  allowRegistration: boolean;
  
  // Configuración de notificaciones
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  notificationEmail: string;
  
  // Configuración de base de datos
  autoBackup: boolean;
  backupFrequency: string;
  backupRetention: number;
  
  // Configuración de tema
  defaultTheme: string;
  allowThemeChange: boolean;
  customLogo: string;
  primaryColor: string;
}

const defaultConfig: SystemConfig = {
  siteName: 'SummaQualitas',
  siteDescription: 'Sistema de Gestión de Construcción',
  adminEmail: 'admin@summaqualitas.com',
  timezone: 'America/Mexico_City',
  language: 'es',
  currency: 'MXN',
  sessionTimeout: 30,
  passwordMinLength: 8,
  requireTwoFactor: false,
  allowRegistration: false,
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
  notificationEmail: 'notifications@summaqualitas.com',
  autoBackup: true,
  backupFrequency: 'daily',
  backupRetention: 30,
  defaultTheme: 'light',
  allowThemeChange: true,
  customLogo: '',
  primaryColor: '#3b82f6'
};

const timezones = [
  { value: 'America/Mexico_City', label: 'Ciudad de México (GMT-6)' },
  { value: 'America/New_York', label: 'Nueva York (GMT-5)' },
  { value: 'America/Los_Angeles', label: 'Los Ángeles (GMT-8)' },
  { value: 'Europe/Madrid', label: 'Madrid (GMT+1)' },
  { value: 'UTC', label: 'UTC (GMT+0)' }
];

const languages = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' }
];

const currencies = [
  { value: 'MXN', label: 'Peso Mexicano (MXN)' },
  { value: 'USD', label: 'Dólar Americano (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' }
];

const backupFrequencies = [
  { value: 'hourly', label: 'Cada hora' },
  { value: 'daily', label: 'Diario' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensual' }
];

const themes = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
  { value: 'auto', label: 'Automático' }
];

export default function SystemConfigPage() {
  const { user, loading } = useAuthContext();
  const canAccessAdmin = useHasPermission('canAccessAdmin');
  const [config, setConfig] = useState<SystemConfig>(defaultConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsLoading(true);
        // Simular carga de configuración
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Aquí se cargaría la configuración real desde la API
        setConfig(defaultConfig);
      } catch (error) {
        console.error('Error loading config:', error);
        toast.error('Error al cargar la configuración');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadConfig();
    }
  }, [user]);

  const handleSaveConfig = async () => {
    try {
      setIsSaving(true);
      
      // Validaciones básicas
      if (!config.siteName.trim()) {
        toast.error('El nombre del sitio es obligatorio');
        return;
      }
      
      if (!config.adminEmail.trim()) {
        toast.error('El email del administrador es obligatorio');
        return;
      }
      
      if (config.passwordMinLength < 6) {
        toast.error('La longitud mínima de contraseña debe ser al menos 6 caracteres');
        return;
      }
      
      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Aquí se guardaría la configuración real en la API
      setLastSaved(new Date());
      toast.success('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetConfig = () => {
    if (confirm('¿Estás seguro de que quieres restaurar la configuración por defecto?')) {
      setConfig(defaultConfig);
      toast.success('Configuración restaurada');
    }
  };

  const handleExportConfig = () => {
    const dataStr = JSON.stringify(config, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `summaqualitas-config-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Configuración exportada');
  };

  const handleImportConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedConfig = JSON.parse(e.target?.result as string);
        setConfig({ ...defaultConfig, ...importedConfig });
        toast.success('Configuración importada exitosamente');
      } catch (error) {
        toast.error('Error al importar configuración: archivo inválido');
      }
    };
    reader.readAsText(file);
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Cargando configuración del sistema...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
          <p className="text-gray-600 mt-2">
            Administra la configuración global del sistema SummaQualitas
          </p>
          {lastSaved && (
            <div className="flex items-center space-x-2 mt-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">
                Última actualización: {lastSaved.toLocaleString('es-ES')}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Link href="/admin">
            <Button variant="outline">
              Volver al Dashboard
            </Button>
          </Link>
          
          <Button 
            onClick={handleSaveConfig} 
            disabled={isSaving}
            className="flex items-center space-x-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Guardar Cambios</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Seguridad</TabsTrigger>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
          <TabsTrigger value="database">Base de Datos</TabsTrigger>
          <TabsTrigger value="appearance">Apariencia</TabsTrigger>
        </TabsList>

        {/* Configuración General */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Configuración General</span>
              </CardTitle>
              <CardDescription>
                Configuración básica del sistema y localización
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Nombre del Sitio</Label>
                  <Input
                    id="siteName"
                    value={config.siteName}
                    onChange={(e) => setConfig(prev => ({ ...prev, siteName: e.target.value }))}
                    placeholder="SummaQualitas"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Email del Administrador</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={config.adminEmail}
                    onChange={(e) => setConfig(prev => ({ ...prev, adminEmail: e.target.value }))}
                    placeholder="admin@summaqualitas.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="siteDescription">Descripción del Sitio</Label>
                <Textarea
                  id="siteDescription"
                  value={config.siteDescription}
                  onChange={(e) => setConfig(prev => ({ ...prev, siteDescription: e.target.value }))}
                  placeholder="Sistema de Gestión de Construcción"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Zona Horaria</Label>
                  <Select 
                    value={config.timezone} 
                    onValueChange={(value) => setConfig(prev => ({ ...prev, timezone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="language">Idioma</Label>
                  <Select 
                    value={config.language} 
                    onValueChange={(value) => setConfig(prev => ({ ...prev, language: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currency">Moneda</Label>
                  <Select 
                    value={config.currency} 
                    onValueChange={(value) => setConfig(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((curr) => (
                        <SelectItem key={curr.value} value={curr.value}>
                          {curr.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuración de Seguridad */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Configuración de Seguridad</span>
              </CardTitle>
              <CardDescription>
                Configuración de autenticación y políticas de seguridad
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Tiempo de Sesión (minutos)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    min="5"
                    max="480"
                    value={config.sessionTimeout}
                    onChange={(e) => setConfig(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) || 30 }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">Longitud Mínima de Contraseña</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    min="6"
                    max="32"
                    value={config.passwordMinLength}
                    onChange={(e) => setConfig(prev => ({ ...prev, passwordMinLength: parseInt(e.target.value) || 8 }))}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Autenticación de Dos Factores</Label>
                    <p className="text-sm text-gray-600">
                      Requiere verificación adicional para todos los usuarios
                    </p>
                  </div>
                  <Switch
                    checked={config.requireTwoFactor}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, requireTwoFactor: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Permitir Registro de Usuarios</Label>
                    <p className="text-sm text-gray-600">
                      Permite que nuevos usuarios se registren en el sistema
                    </p>
                  </div>
                  <Switch
                    checked={config.allowRegistration}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, allowRegistration: checked }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuración de Notificaciones */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Configuración de Notificaciones</span>
              </CardTitle>
              <CardDescription>
                Configuración de notificaciones y alertas del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="notificationEmail">Email para Notificaciones</Label>
                <Input
                  id="notificationEmail"
                  type="email"
                  value={config.notificationEmail}
                  onChange={(e) => setConfig(prev => ({ ...prev, notificationEmail: e.target.value }))}
                  placeholder="notifications@summaqualitas.com"
                />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificaciones por Email</Label>
                    <p className="text-sm text-gray-600">
                      Enviar notificaciones importantes por correo electrónico
                    </p>
                  </div>
                  <Switch
                    checked={config.emailNotifications}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, emailNotifications: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificaciones por SMS</Label>
                    <p className="text-sm text-gray-600">
                      Enviar alertas críticas por mensaje de texto
                    </p>
                  </div>
                  <Switch
                    checked={config.smsNotifications}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, smsNotifications: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificaciones Push</Label>
                    <p className="text-sm text-gray-600">
                      Mostrar notificaciones en tiempo real en el navegador
                    </p>
                  </div>
                  <Switch
                    checked={config.pushNotifications}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, pushNotifications: checked }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuración de Base de Datos */}
        <TabsContent value="database">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Configuración de Base de Datos</span>
              </CardTitle>
              <CardDescription>
                Configuración de respaldos y mantenimiento de la base de datos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Respaldo Automático</Label>
                  <p className="text-sm text-gray-600">
                    Realizar respaldos automáticos de la base de datos
                  </p>
                </div>
                <Switch
                  checked={config.autoBackup}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, autoBackup: checked }))}
                />
              </div>
              
              {config.autoBackup && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="backupFrequency">Frecuencia de Respaldo</Label>
                    <Select 
                      value={config.backupFrequency} 
                      onValueChange={(value) => setConfig(prev => ({ ...prev, backupFrequency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {backupFrequencies.map((freq) => (
                          <SelectItem key={freq.value} value={freq.value}>
                            {freq.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="backupRetention">Retención de Respaldos (días)</Label>
                    <Input
                      id="backupRetention"
                      type="number"
                      min="1"
                      max="365"
                      value={config.backupRetention}
                      onChange={(e) => setConfig(prev => ({ ...prev, backupRetention: parseInt(e.target.value) || 30 }))}
                    />
                  </div>
                </div>
              )}
              
              <div className="pt-4 border-t">
                <h4 className="font-medium text-gray-900 mb-4">Acciones de Base de Datos</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Crear Respaldo Manual
                  </Button>
                  
                  <Button variant="outline" className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Optimizar Base de Datos
                  </Button>
                  
                  <Button variant="outline" className="w-full text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpiar Logs Antiguos
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuración de Apariencia */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="h-5 w-5" />
                <span>Configuración de Apariencia</span>
              </CardTitle>
              <CardDescription>
                Personalización del tema y apariencia del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="defaultTheme">Tema por Defecto</Label>
                  <Select 
                    value={config.defaultTheme} 
                    onValueChange={(value) => setConfig(prev => ({ ...prev, defaultTheme: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {themes.map((theme) => (
                        <SelectItem key={theme.value} value={theme.value}>
                          {theme.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Color Primario</Label>
                  <Input
                    id="primaryColor"
                    type="color"
                    value={config.primaryColor}
                    onChange={(e) => setConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customLogo">Logo Personalizado (URL)</Label>
                <Input
                  id="customLogo"
                  type="url"
                  value={config.customLogo}
                  onChange={(e) => setConfig(prev => ({ ...prev, customLogo: e.target.value }))}
                  placeholder="https://ejemplo.com/logo.png"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Permitir Cambio de Tema</Label>
                  <p className="text-sm text-gray-600">
                    Permite a los usuarios cambiar el tema de la interfaz
                  </p>
                </div>
                <Switch
                  checked={config.allowThemeChange}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, allowThemeChange: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions Footer */}
      <Card className="mt-8">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleExportConfig}>
                <Download className="h-4 w-4 mr-2" />
                Exportar Configuración
              </Button>
              
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportConfig}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Importar Configuración
                </Button>
              </div>
              
              <Button variant="outline" onClick={handleResetConfig}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Restaurar por Defecto
              </Button>
            </div>
            
            <Button 
              onClick={handleSaveConfig} 
              disabled={isSaving}
              className="flex items-center space-x-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Guardar Todos los Cambios</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}