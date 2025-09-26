import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Función para verificar si las variables de entorno de Supabase están configuradas
export const hasEnvVars = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

// Función para formatear moneda
export function formatCurrency(amount: number, currency: string = 'CRC'): string {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// Función para traducir categorías de español a inglés
export function translateCategory(category: string): string {
  const translations: Record<string, string> = {
    'costos_directos': 'DIRECT COSTS',
    'costos_indirectos': 'INDIRECT COSTS', 
    'mano_obra': 'LABOR',
    'imprevistos': 'CONTINGENCIES',
    'administracion': 'ADMINISTRATION',
    'gastos_administrativos': 'ADMINISTRATIVE EXPENSES',
    'utilidad': 'PROFIT'
  };

  // Si la categoría existe en las traducciones, devolverla traducida
  if (translations[category]) {
    return translations[category];
  }

  // Si no existe traducción, formatear el texto (reemplazar _ con espacios y convertir a mayúsculas)
  return category?.replace('_', ' ').toUpperCase() || 'N/A';
}
