import { Metadata } from 'next';
import OptimizedDashboard from '@/components/dashboard/OptimizedDashboard';

export const metadata: Metadata = {
  title: 'Dashboard Optimizado | Summa Qualitas',
  description: 'Dashboard con sistema de caché optimizado para mejor rendimiento',
};

/**
 * Página del dashboard optimizado con sistema de caché
 * Demuestra las mejoras de rendimiento implementadas
 */
export default function OptimizedDashboardPage() {
  return <OptimizedDashboard />;
}