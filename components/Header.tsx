"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, User, LogOut, Home, FolderOpen, FileText, BarChart3, Settings } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useAuthContext } from "@/lib/contexts/AuthContext"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { isAuthenticated, loading } = useAuthContext()
  
  // Detectar si es dispositivo móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Cerrar menú al hacer clic fuera en móvil
  useEffect(() => {
    if (isMenuOpen && isMobile) {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Element;
        if (!target.closest('.mobile-menu') && !target.closest('.menu-button')) {
          setIsMenuOpen(false);
        }
      };
      
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isMenuOpen, isMobile]);

  const navigationItems = [
    { href: '/nosotros', label: 'Nosotros', icon: Home },
    { href: '/servicios', label: 'Servicios', icon: FolderOpen },
    { href: '/proyectos', label: 'Proyectos', icon: FileText },
    { href: '/contacto', label: 'Contacto', icon: BarChart3 },
    { href: '/cotizacion', label: 'Cotización', icon: Settings },
  ];

  return (
    <header className="mobile-header">
      <div className="mobile-header-content container-mobile">

          {/* Logo - Optimizado para móvil */}
          <Link 
            href="/" 
            className="flex items-center space-x-2 touch-manipulation"
            onClick={() => setIsMenuOpen(false)}
          >
            <Image
              src="/images/summa/logo_2b.png"
              alt="Logo"
              width={180}
              height={180}
              className="mobile-logo"
            />
            <span className="text-mobile-lg sm:text-[30px] font-bold text-foreground"></span>
          </Link>

          {/* Desktop Navigation - Oculto en móvil y cuando el usuario está autenticado (tiene sidebar) */}
          {!isAuthenticated && (
            <nav className="hidden lg:flex space-x-6 xl:space-x-8">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link 
                    key={item.href}
                    href={item.href} 
                    className="flex items-center space-x-2 text-muted-foreground hover:text-primary px-3 py-2 text-sm font-medium transition-colors touch-manipulation"

                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden xl:inline">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right side - Auth buttons y Mobile menu */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {!loading && (
              <>
                {isAuthenticated ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="flex items-center space-x-2 min-h-touch min-w-touch p-2 sm:px-3"
                      >
                        <User className="h-4 w-4" />
                        <span className="hidden sm:inline text-mobile-sm sm:text-sm truncate max-w-32">
                          Usuario
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem className="cursor-pointer">
                        <LogOut className="h-4 w-4 mr-2" />
                        Cerrar Sesión
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <>
                    <Link href="/login" className="hidden sm:inline-block">
                      <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-full text-mobile-sm sm:text-sm">
                        Iniciar Sesión
                      </Button>
                    </Link>
                    <Link href="/cotizacion" className="hidden sm:inline-block">
                      <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full text-mobile-sm sm:text-sm">
                        Get Quote
                      </Button>
                    </Link>
                    <Link href="/login" className="sm:hidden">
                      <Button variant="ghost" size="sm" className="min-h-touch">
                        <User className="h-4 w-4" />
                      </Button>
                    </Link>
                  </>
                )}
              </>
            )}

            {/* Mobile menu button - Solo visible en móvil/tablet y cuando NO está autenticado */}
            {!isAuthenticated && (
              <div className="lg:hidden">
                <Button
                  variant="ghost"
                  size="sm"
  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="mobile-menu-button"
                  aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                >
                  {isMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </Button>
              </div>
            )}
          </div>
        {/* Mobile Navigation - Solo visible cuando NO está autenticado */}
        {isMenuOpen && !isAuthenticated && (
          <>
            {/* Overlay */}
            <div 
              className="mobile-menu-overlay lg:hidden"
              onClick={() => setIsMenuOpen(false)}
              aria-hidden="true"
            />
            
            {/* Menú móvil */}
            <div className="lg:hidden py-4 border-t border-border bg-card mobile-menu">
              <nav className="flex flex-col space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="mobile-nav-item"
onClick={() => setIsMenuOpen(false)}
                    >
                      <Icon className="mobile-nav-icon" />
                      <span className="text-mobile-base">{item.label}</span>
                    </Link>
                  );
                })}
              
                {/* Mobile Auth Buttons */}
                {!loading && !isAuthenticated && (
                  <div className="pt-4 space-y-3 border-t border-border mt-2">
                    <Link href="/cotizacion" onClick={() => setIsMenuOpen(false)}>
                      <Button className="mobile-primary-button w-full rounded-full">Get Quote</Button>
                    </Link>
                    <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                      <Button className="mobile-secondary-button w-full rounded-full">Iniciar Sesión</Button>
                    </Link>
                  </div>
                )}
              </nav>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
