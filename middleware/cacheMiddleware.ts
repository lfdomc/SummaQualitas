/**
 * Middleware para gestión de caché en Next.js
 * Precarga datos frecuentes y gestiona la invalidación de caché
 */

import { NextRequest, NextResponse } from 'next/server';
import { optimizedDatabaseService } from '@/lib/services/optimizedDatabaseService';
import { cacheService } from '@/lib/services/cacheService';

// Rutas que deberían invalidar el caché de proyectos
const PROJECT_MUTATION_ROUTES = [
  '/api/projects/create',
  '/api/projects/update',
  '/api/projects/delete',
];

// Rutas que deberían invalidar el caché de gastos
const EXPENSE_MUTATION_ROUTES = [
  '/api/expenses/create',
  '/api/expenses/update',
  '/api/expenses/delete',
];

// Rutas que deberían invalidar el caché de ingresos
const INCOME_MUTATION_ROUTES = [
  '/api/incomes/create',
  '/api/incomes/update',
  '/api/incomes/delete',
];

// Tiempo mínimo entre precargas (5 minutos)
const PRELOAD_INTERVAL = 5 * 60 * 1000;
let lastPreloadTime = 0;

export async function cacheMiddleware(
  request: NextRequest,
  response: NextResponse
) {
  const { pathname, searchParams } = request.nextUrl;
  const method = request.method;

  // Solo procesar solicitudes POST (mutaciones) para invalidación de caché
  if (method === 'POST') {
    // Invalidar caché según la ruta
    if (PROJECT_MUTATION_ROUTES.some(route => pathname.startsWith(route))) {
      const projectId = searchParams.get('id') || '';
      if (projectId) {
        optimizedDatabaseService.invalidateProjectCache(projectId);
      } else {
        // Si no hay ID específico, invalidar el caché relacionado con proyectos
        cacheService.invalidateFunction('get_projects_with_summary');
        // También invalidar KPIs porque pueden verse afectados
        cacheService.invalidateFunction('get_dashboard_kpis');
      }
    }

    if (EXPENSE_MUTATION_ROUTES.some(route => pathname.startsWith(route))) {
      optimizedDatabaseService.invalidateExpensesCache();
    }

    if (INCOME_MUTATION_ROUTES.some(route => pathname.startsWith(route))) {
      optimizedDatabaseService.invalidateIncomesCache();
    }
  }

  // Precargar datos frecuentes periódicamente (solo en solicitudes GET a páginas principales)
  if (
    method === 'GET' &&
    (pathname === '/' || pathname === '/dashboard' || pathname === '/projects') &&
    Date.now() - lastPreloadTime > PRELOAD_INTERVAL
  ) {
    lastPreloadTime = Date.now();
    // No esperamos a que termine la precarga para no bloquear la respuesta
    optimizedDatabaseService.preloadFrequentData().catch(console.error);
  }

  return response;
}

export default cacheMiddleware;