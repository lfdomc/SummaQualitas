'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { withAuth } from '@/components/auth/withAuth';
import { UserRole, UserRoleType } from '@/lib/types';
import { Settings, User, Bell, Shield, Database, Palette } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

function SettingsPage() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false,
  });

  const [preferences, setPreferences] = useState({
    darkMode: false,
    language: 'es',
    timezone: 'America/Mexico_City',
  });

  const handleSaveSettings = () => {
    toast.success('Configuración guardada correctamente');
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
            <p className="text-gray-600">Administra las configuraciones del sistema y preferencias</p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Perfil de Usuario */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Perfil de Usuario
              </CardTitle>
              <CardDescription>
                Actualiza tu información personal y datos de contacto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre completo</Label>
                  <Input id="name" placeholder="Tu nombre completo" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input id="email" type="email" placeholder="tu@email.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input id="phone" placeholder="+52 123 456 7890" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Departamento</Label>
                  <Input id="department" placeholder="Departamento" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notificaciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificaciones
              </CardTitle>
              <CardDescription>
                Configura cómo y cuándo recibir notificaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificaciones por email</Label>
                    <p className="text-sm text-gray-500">Recibir alertas y actualizaciones por correo</p>
                  </div>
                  <Switch
                    checked={notifications.email}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, email: checked }))
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificaciones push</Label>
                    <p className="text-sm text-gray-500">Recibir notificaciones en el navegador</p>
                  </div>
                  <Switch
                    checked={notifications.push}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, push: checked }))
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificaciones SMS</Label>
                    <p className="text-sm text-gray-500">Recibir alertas críticas por SMS</p>
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Preferencias
              </CardTitle>
              <CardDescription>
                Personaliza la apariencia y comportamiento de la aplicación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Modo oscuro</Label>
                    <p className="text-sm text-gray-500">Cambiar a tema oscuro</p>
                  </div>
                  <Switch
                    checked={preferences.darkMode}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ ...prev, darkMode: checked }))
                    }
                  />
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="language">Idioma</Label>
                    <select 
                      id="language" 
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={preferences.language}
                      onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                    >
                      <option value="es">Español</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Zona horaria</Label>
                    <select 
                      id="timezone" 
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={preferences.timezone}
                      onChange={(e) => setPreferences(prev => ({ ...prev, timezone: e.target.value }))}
                    >
                      <option value="America/Mexico_City">Ciudad de México</option>
                      <option value="America/Monterrey">Monterrey</option>
                      <option value="America/Tijuana">Tijuana</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seguridad */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Seguridad
              </CardTitle>
              <CardDescription>
                Administra la seguridad de tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <Button variant="outline" className="w-full md:w-auto">
                  Cambiar contraseña
                </Button>
                <Button variant="outline" className="w-full md:w-auto">
                  Configurar autenticación de dos factores
                </Button>
                <Button variant="outline" className="w-full md:w-auto">
                  Ver sesiones activas
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Sistema
              </CardTitle>
              <CardDescription>
                Información del sistema y herramientas de administración
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">
                    Sistema funcionando correctamente. Última actualización: hace 2 horas
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline">
                    Exportar datos
                  </Button>
                  <Button variant="outline">
                    Generar reporte de actividad
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-4">
          <Button variant="outline">
            Cancelar
          </Button>
          <Button onClick={handleSaveSettings}>
            Guardar cambios
          </Button>
        </div>
      </div>
    </div>
  );
}

export default withAuth(SettingsPage, ['gerencia', 'administrativo', 'cliente'] as UserRoleType[]);