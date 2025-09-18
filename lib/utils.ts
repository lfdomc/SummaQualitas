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
