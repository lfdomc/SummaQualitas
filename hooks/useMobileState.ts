'use client';

import { useState, useEffect } from 'react';

/**
 * Hook personalizado para manejar el estado móvil de manera consistente
 * en toda la aplicación
 */
export interface MobileState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  orientation: 'portrait' | 'landscape';
}

export function useMobileState(): MobileState {
  const [mobileState, setMobileState] = useState<MobileState>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenWidth: 1024,
    orientation: 'landscape'
  });

  useEffect(() => {
    const updateMobileState = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      const newState: MobileState = {
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        screenWidth: width,
        orientation: width > height ? 'landscape' : 'portrait'
      };
      
      setMobileState(newState);
    };

    // Configuración inicial
    updateMobileState();

    // Listener para cambios de tamaño
    window.addEventListener('resize', updateMobileState);
    
    // Listener para cambios de orientación
    window.addEventListener('orientationchange', () => {
      // Pequeño delay para que la orientación se actualice completamente
      setTimeout(updateMobileState, 100);
    });

    return () => {
      window.removeEventListener('resize', updateMobileState);
      window.removeEventListener('orientationchange', updateMobileState);
    };
  }, []);

  return mobileState;
}

/**
 * Hook simplificado que solo retorna si es móvil o no
 */
export function useIsMobile(): boolean {
  const { isMobile } = useMobileState();
  return isMobile;
}

/**
 * Hook que retorna breakpoints específicos
 */
export function useBreakpoint() {
  const { screenWidth } = useMobileState();
  
  return {
    xs: screenWidth < 480,
    sm: screenWidth >= 480 && screenWidth < 640,
    md: screenWidth >= 640 && screenWidth < 768,
    lg: screenWidth >= 768 && screenWidth < 1024,
    xl: screenWidth >= 1024 && screenWidth < 1280,
    '2xl': screenWidth >= 1280,
    screenWidth
  };
}

/**
 * Hook para detectar si el dispositivo soporta touch
 */
export function useTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);
  
  useEffect(() => {
    const checkTouch = () => {
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    
    checkTouch();
  }, []);
  
  return isTouch;
}

/**
 * Hook para detectar el tipo de dispositivo
 */
export function useDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const { isMobile, isTablet, isDesktop } = useMobileState();
  
  if (isMobile) return 'mobile';
  if (isTablet) return 'tablet';
  return 'desktop';
}

/**
 * Hook para manejar menús móviles con estado persistente
 */
export function useMobileMenu(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);
  const { isMobile } = useMobileState();
  
  // Cerrar menú automáticamente en desktop
  useEffect(() => {
    if (!isMobile && isOpen) {
      setIsOpen(false);
    }
  }, [isMobile, isOpen]);
  
  // Prevenir scroll del body cuando el menú está abierto en móvil
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobile, isOpen]);
  
  const toggle = () => setIsOpen(!isOpen);
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  
  return {
    isOpen,
    toggle,
    open,
    close,
    isMobile
  };
}

/**
 * Hook para optimizaciones de rendimiento en móviles
 */
export function useMobileOptimizations() {
  const { isMobile } = useMobileState();
  
  useEffect(() => {
    if (isMobile) {
      // Optimizaciones específicas para móviles
      
      // Deshabilitar hover en dispositivos touch
      document.documentElement.classList.add('touch-device');
      
      // Optimizar el viewport para móviles
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 
          'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover'
        );
      }
    } else {
      document.documentElement.classList.remove('touch-device');
    }
  }, [isMobile]);
  
  return {
    isMobile,
    shouldOptimize: isMobile
  };
}

/**
 * Utilidades para clases CSS condicionales basadas en el estado móvil
 */
export function useMobileClasses() {
  const mobileState = useMobileState();
  
  const getResponsiveClass = (mobileClass: string, desktopClass: string = '') => {
    return mobileState.isMobile ? mobileClass : desktopClass;
  };
  
  const getConditionalClass = (condition: keyof MobileState, trueClass: string, falseClass: string = '') => {
    return mobileState[condition] ? trueClass : falseClass;
  };
  
  return {
    ...mobileState,
    getResponsiveClass,
    getConditionalClass,
    // Clases comunes pre-definidas
    containerClass: getResponsiveClass('px-4 sm:px-6', 'px-8'),
    textClass: getResponsiveClass('text-sm', 'text-base'),
    spacingClass: getResponsiveClass('space-y-2', 'space-y-4'),
    paddingClass: getResponsiveClass('p-3', 'p-6')
  };
}