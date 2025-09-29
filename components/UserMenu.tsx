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
  MapPin,
  FolderOpen
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
    <div className={`bg-card border-b border-border shadow-sm ${className}`}>
      <div className="container mx-auto px-4">
        <div className="py-3">
          {/* Información básica del usuario - siempre visible */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-10 w-10 ring-2 ring-border">
                <AvatarImage src={profile.avatar_url} alt={profile.name} />
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {getInitials(profile.name || 'Usuario')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-foreground">{profile.name}</span>
                  <Badge variant={getRoleBadgeVariant(profile.role)} className="text-xs">
                    <Shield className="w-3 h-3 mr-1" />
                    {getRoleDisplayName(profile.role)}
                  </Badge>
                </div>
                <span className="text-sm text-muted-foreground">{user.email}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Botones de acción rápida */}
              <Link href="/profile">
                <Button variant="ghost" size="sm" className="text-primary hover:bg-accent">
                  <Settings className="w-4 h-4 mr-1" />
                  Perfil
                </Button>
              </Link>
              
              <Link href="/proyectos">
                <Button variant="ghost" size="sm" className="text-primary hover:bg-accent">
                  <FolderOpen className="w-4 h-4 mr-1" />
                  Proyectos
                </Button>
              </Link>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSignOut}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Cerrar Sesión
              </Button>

              {/* Botón para expandir/contraer información adicional */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-muted-foreground hover:bg-accent"
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
            <div className="mt-4 pt-4 border-t border-border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Información de contacto */}
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground flex items-center">
                    <User className="w-4 h-4 mr-2 text-primary" />
                    Información Personal
                  </h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
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
                    <h4 className="font-medium text-foreground flex items-center">
                      <Building className="w-4 h-4 mr-2 text-primary" />
                      Empresa
                    </h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div>{profile.company}</div>
                      {profile.department && (
                        <div className="text-xs text-muted-foreground/80">{profile.department}</div>
                      )}
                    </div>
                  </div>
                )}


              </div>

              {/* Biografía si existe */}
              {profile.bio && (
                <div className="mt-4 pt-4 border-t border-border">
                  <h4 className="font-medium text-foreground mb-2">Acerca de</h4>
                  <p className="text-sm text-muted-foreground">{profile.bio}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}