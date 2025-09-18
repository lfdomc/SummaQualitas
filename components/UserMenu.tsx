"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  User, 
  Settings, 
  LogOut, 
  ChevronDown, 
  ChevronUp,
  Shield,
  Building,
  Phone,
  Mail,
  MapPin
} from "lucide-react"
import Link from "next/link"
import { useAuthContext } from "@/lib/contexts/AuthContext"
import { UserRole } from "@/lib/types"

interface UserMenuProps {
  className?: string
}

export function UserMenu({ className = "" }: UserMenuProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { user, profile, signOut, isAuthenticated, loading } = useAuthContext()

  // No mostrar el menú si no está autenticado o está cargando
  if (!isAuthenticated || loading || !user || !profile) {
    return null
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case UserRole.GERENCIA:
        return "Gerencia"
      case UserRole.ADMINISTRATIVO:
        return "Administrativo"
      case UserRole.CLIENTE:
        return "Cliente"
      default:
        return role
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case UserRole.GERENCIA:
        return "default" as const
      case UserRole.ADMINISTRATIVO:
        return "secondary" as const
      case UserRole.CLIENTE:
        return "outline" as const
      default:
        return "outline" as const
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 shadow-sm ${className}`}>
      <div className="container mx-auto px-4">
        <div className="py-3">
          {/* Información básica del usuario - siempre visible */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-10 w-10 ring-2 ring-blue-200">
                <AvatarImage src={profile.avatar_url} alt={profile.name} />
                <AvatarFallback className="bg-blue-600 text-white font-semibold">
                  {getInitials(profile.name || 'Usuario')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-900">{profile.name}</span>
                  <Badge variant={getRoleBadgeVariant(profile.role)} className="text-xs">
                    <Shield className="w-3 h-3 mr-1" />
                    {getRoleDisplayName(profile.role)}
                  </Badge>
                </div>
                <span className="text-sm text-gray-600">{user.email}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Botones de acción rápida */}
              <Link href="/profile">
                <Button variant="ghost" size="sm" className="text-blue-700 hover:bg-blue-100">
                  <Settings className="w-4 h-4 mr-1" />
                  Perfil
                </Button>
              </Link>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSignOut}
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Cerrar Sesión
              </Button>

              {/* Botón para expandir/contraer información adicional */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-gray-600 hover:bg-gray-100"
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Información expandida */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-blue-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Información de contacto */}
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <User className="w-4 h-4 mr-2 text-blue-600" />
                    Información Personal
                  </h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    {/* Campo phone removido del esquema
                    {profile.phone && (
                      <div className="flex items-center">
                        <Phone className="w-3 h-3 mr-2" />
                        {profile.phone}
                      </div>
                    )}
                    */}
                    <div className="flex items-center">
                      <Mail className="w-3 h-3 mr-2" />
                      {user.email}
                    </div>
                    {profile.address && (
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-2" />
                        {profile.address}
                      </div>
                    )}
                  </div>
                </div>

                {/* Información de la empresa */}
                {profile.company && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <Building className="w-4 h-4 mr-2 text-blue-600" />
                      Empresa
                    </h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>{profile.company}</div>
                      {profile.department && (
                        <div className="text-xs text-gray-500">{profile.department}</div>
                      )}
                    </div>
                  </div>
                )}


              </div>

              {/* Biografía si existe */}
              {profile.bio && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <h4 className="font-medium text-gray-900 mb-2">Acerca de</h4>
                  <p className="text-sm text-gray-600">{profile.bio}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}