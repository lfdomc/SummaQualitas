'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { withAuth } from '@/components/auth/withAuth';
import { UserRoleType } from '@/lib/types';
import { Settings, User, Bell, Shield, Database, Palette, Save } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

function SettingsPage() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false,
  });

  const [preferences, setPreferences] = useState({
    language: 'es',
    timezone: 'America/Mexico_City',
  });

  const [isBackingUp, setIsBackingUp] = useState(false);

  const handleSaveSettings = () => {
    toast.success('Configuración guardada correctamente');
  };

  const handleBackup = async () => {
    try {
      setIsBackingUp(true);
      const res = await fetch('/api/backup', { method: 'POST' });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Error HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename=([^;]+)/i);
      const filename = match ? match[1] : `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Respaldo generado y descarga iniciada');
    } catch (error) {
      console.error('Error al generar respaldo:', error);
      toast.error('No se pudo generar el respaldo. Intenta de nuevo.');
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <div className="container mx-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-4">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
          <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
              <span className="hidden sm:inline">Configuración</span>
              <span className="sm:hidden">Config</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              <span className="hidden sm:inline">Administra las configuraciones del sistema y preferencias</span>
              <span className="sm:hidden">Configuraciones del sistema</span>
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6">
          {/* Perfil de Usuario */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <User className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Perfil de Usuario</span>
                <span className="sm:hidden">Perfil</span>
              </CardTitle>
              <CardDescription className="text-sm">
                <span className="hidden sm:inline">Actualiza tu información personal y datos de contacto</span>
                <span className="sm:hidden">Información personal</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm">
                    <span className="hidden sm:inline">Nombre completo</span>
                    <span className="sm:hidden">Nombre</span>
                  </Label>
                  <Input id="name" placeholder="Tu nombre completo" className="h-9 sm:h-10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm">
                    <span className="hidden sm:inline">Correo electrónico</span>
                    <span className="sm:hidden">Email</span>
                  </Label>
                  <Input id="email" type="email" placeholder="tu@email.com" className="h-9 sm:h-10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm">Teléfono</Label>
                  <Input id="phone" placeholder="+52 123 456 7890" className="h-9 sm:h-10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department" className="text-sm">
                    <span className="hidden sm:inline">Departamento</span>
                    <span className="sm:hidden">Depto</span>
                  </Label>
                  <Input id="department" placeholder="Departamento" className="h-9 sm:h-10" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notificaciones */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Notificaciones</span>
                <span className="sm:hidden">Notif</span>
              </CardTitle>
              <CardDescription className="text-sm">
                <span className="hidden sm:inline">Configura cómo y cuándo recibir notificaciones</span>
                <span className="sm:hidden">Configurar alertas</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start sm:items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <Label className="text-sm">
                      <span className="hidden sm:inline">Notificaciones por email</span>
                      <span className="sm:hidden">Email</span>
                    </Label>
                    <p className="text-xs sm:text-sm text-gray-500">
                      <span className="hidden sm:inline">Recibir alertas y actualizaciones por correo</span>
                      <span className="sm:hidden">Alertas por correo</span>
                    </p>
                  </div>
                  <Switch
                    checked={notifications.email}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, email: checked }))
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-start sm:items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <Label className="text-sm">
                      <span className="hidden sm:inline">Notificaciones push</span>
                      <span className="sm:hidden">Push</span>
                    </Label>
                    <p className="text-xs sm:text-sm text-gray-500">
                      <span className="hidden sm:inline">Recibir notificaciones en el navegador</span>
                      <span className="sm:hidden">En navegador</span>
                    </p>
                  </div>
                  <Switch
                    checked={notifications.push}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, push: checked }))
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-start sm:items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <Label className="text-sm">
                      <span className="hidden sm:inline">Notificaciones SMS</span>
                      <span className="sm:hidden">SMS</span>
                    </Label>
                    <p className="text-xs sm:text-sm text-gray-500">
                      <span className="hidden sm:inline">Recibir alertas críticas por SMS</span>
                      <span className="sm:hidden">Alertas críticas</span>
                    </p>
                  </div>
                  <Switch
                    checked={notifications.sms}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, sms: checked }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preferencias */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Palette className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Preferencias</span>
                <span className="sm:hidden">Pref</span>
              </CardTitle>
              <CardDescription className="text-sm">
                <span className="hidden sm:inline">Personaliza la apariencia y comportamiento de la aplicación</span>
                <span className="sm:hidden">Personalizar experiencia</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language" className="text-sm">
                    <span className="hidden sm:inline">Idioma</span>
                    <span className="sm:hidden">Idioma</span>
                  </Label>
                  <select 
                    id="language" 
                    className="w-full p-2 border border-gray-300 rounded-md h-9 sm:h-10"
                    value={preferences.language}
                    onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone" className="text-sm">
                    <span className="hidden sm:inline">Zona horaria</span>
                    <span className="sm:hidden">Zona</span>
                  </Label>
                  <select 
                    id="timezone" 
                    className="w-full p-2 border border-gray-300 rounded-md h-9 sm:h-10"
                    value={preferences.timezone}
                    onChange={(e) => setPreferences(prev => ({ ...prev, timezone: e.target.value }))}
                  >
                    <option value="America/Mexico_City">Ciudad de México</option>
                    <option value="America/Monterrey">Monterrey</option>
                    <option value="America/Tijuana">Tijuana</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seguridad */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Seguridad</span>
                <span className="sm:hidden">Segur</span>
              </CardTitle>
              <CardDescription className="text-sm">
                <span className="hidden sm:inline">Gestiona la seguridad de tu cuenta</span>
                <span className="sm:hidden">Gestionar seguridad</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <Label className="text-sm">
                      <span className="hidden sm:inline">Cambiar contraseña</span>
                      <span className="sm:hidden">Contraseña</span>
                    </Label>
                    <p className="text-xs sm:text-sm text-gray-500">
                      <span className="hidden sm:inline">Actualiza tu contraseña regularmente</span>
                      <span className="sm:hidden">Actualizar contraseña</span>
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    <span className="hidden sm:inline">Cambiar</span>
                    <span className="sm:hidden">Cambiar</span>
                  </Button>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <Label className="text-sm">
                      <span className="hidden sm:inline">Autenticación de dos factores</span>
                      <span className="sm:hidden">2FA</span>
                    </Label>
                    <p className="text-xs sm:text-sm text-gray-500">
                      <span className="hidden sm:inline">Añade una capa extra de seguridad</span>
                      <span className="sm:hidden">Seguridad extra</span>
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    <span className="hidden sm:inline">Configurar</span>
                    <span className="sm:hidden">Config</span>
                  </Button>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <Label className="text-sm">
                      <span className="hidden sm:inline">Sesiones activas</span>
                      <span className="sm:hidden">Sesiones</span>
                    </Label>
                    <p className="text-xs sm:text-sm text-gray-500">
                      <span className="hidden sm:inline">Revisa y gestiona tus sesiones</span>
                      <span className="sm:hidden">Gestionar sesiones</span>
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    <span className="hidden sm:inline">Ver sesiones</span>
                    <span className="sm:hidden">Ver</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sistema */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Database className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Sistema</span>
                <span className="sm:hidden">Sist</span>
              </CardTitle>
              <CardDescription className="text-sm">
                <span className="hidden sm:inline">Información del sistema y herramientas de administración</span>
                <span className="sm:hidden">Info del sistema</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="space-y-3 sm:space-y-4">
                <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-xs sm:text-sm text-green-800">
                    <span className="hidden sm:inline">Sistema funcionando correctamente. Última actualización: hace 2 horas</span>
                    <span className="sm:hidden">Sistema OK. Actualiz: 2h</span>
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                  <Button onClick={handleBackup} disabled={isBackingUp} variant="outline" size="sm" className="w-full flex items-center gap-2">
                    <Save className="h-3 w-3 sm:h-4 sm:w-4" />
                    {isBackingUp ? 'Generando…' : 'Descargar respaldo (.zip)'}
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    <span className="hidden sm:inline">Generar reporte de actividad</span>
                    <span className="sm:hidden">Reporte</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Botón de guardar */}
        <div className="flex justify-end">
          <Button onClick={handleSaveSettings} className="w-full sm:w-auto" size="sm">
            <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Guardar configuración</span>
            <span className="sm:hidden">Guardar</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default withAuth(SettingsPage, ['gerencia', 'administrativo', 'cliente'] as UserRoleType[]);