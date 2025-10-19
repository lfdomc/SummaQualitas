import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/client'

// Evitar prerender y forzar Node.js runtime
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

// Headers de cache seguros
const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
  'CDN-Cache-Control': 'public, s-maxage=120',
  'Vercel-CDN-Cache-Control': 'public, s-maxage=120'
}

// Mock de proyectos para fallback cuando no hay configuración de Supabase
const mockProjects = [
  {
    id: '1',
    name: 'Residencial Norte',
    client_id: '1',
    description: 'Complejo residencial de 200 unidades',
    location: 'Zona Norte, Ciudad',
    start_date: '2024-01-15',
    end_date: '2024-12-15',
    status: 'en_progreso',
    presupuesto_inicial: 5000000,
    actualExpenses: 1750000,
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Filtros
    const status = searchParams.get('status') || undefined
    const clientId = searchParams.get('client_id') || undefined
    const search = searchParams.get('search') || undefined

    // Paginación
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const from = (page - 1) * limit
    const to = from + limit - 1

    // 1) Si hay Service Role Key, usar cliente administrativo
    const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    const hasAnonEnv = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (hasServiceRole && hasAnonEnv) {
      try {
        const supabase = createAdminClient()
        let query = supabase
          .from('projects')
          .select(`*, client:clients(*), expenses(amount, currency)`, { count: 'exact' })
          .order('created_at', { ascending: false })

        if (status && status !== 'all') query = query.eq('status', status)
        if (clientId && clientId !== 'all') query = query.eq('client_id', clientId)
        if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`)

        const { data, error, count } = await query.range(from, to)
        if (error) throw error

        // Calcular gastos totales si hay expenses
        const processed = (data || []).map(p => {
          const totalExpenses = Array.isArray((p as any).expenses)
            ? (p as any).expenses.reduce((sum: number, e: any) => sum + (e.amount || 0) * (e.currency === 'USD' ? 500 : 1), 0)
            : 0
          return { ...p, actualExpenses: totalExpenses }
        })

        const response = NextResponse.json({
          data: processed,
          total: count || processed.length,
          page,
          limit,
          total_pages: Math.ceil((count || processed.length) / limit)
        })
        Object.entries(CACHE_HEADERS).forEach(([k, v]) => response.headers.set(k, v))
        return response
      } catch (err) {
        console.error('Admin client error, fallback to server client:', err)
        // Continuar con fallback
      }
    }

    // 2) Fallback: usar cliente de servidor con sesión (si existen env anon)
    if (hasAnonEnv) {
      try {
        const supabase = await createServerClient(request)
        let query = supabase
          .from('projects')
          .select(`*, client:clients(*), expenses(amount, currency)`, { count: 'exact' })
          .order('created_at', { ascending: false })

        if (status && status !== 'all') query = query.eq('status', status)
        if (clientId && clientId !== 'all') query = query.eq('client_id', clientId)
        if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`)

        const { data, error, count } = await query.range(from, to)
        if (error) throw error

        const processed = (data || []).map(p => {
          const totalExpenses = Array.isArray((p as any).expenses)
            ? (p as any).expenses.reduce((sum: number, e: any) => sum + (e.amount || 0) * (e.currency === 'USD' ? 500 : 1), 0)
            : 0
          return { ...p, actualExpenses: totalExpenses }
        })

        const response = NextResponse.json({
          data: processed,
          total: count || processed.length,
          page,
          limit,
          total_pages: Math.ceil((count || processed.length) / limit)
        })
        Object.entries(CACHE_HEADERS).forEach(([k, v]) => response.headers.set(k, v))
        return response
      } catch (err) {
        console.error('Server client error, fallback to mock:', err)
        // Continuar con mock
      }
    }

    // 3) Último fallback: datos mock si no hay env o hubo errores
    const total = mockProjects.length
    const paginated = mockProjects.slice(from, from + limit)
    const response = NextResponse.json({
      data: paginated,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
      warning: 'Supabase no configurado o error en consulta: usando datos mock'
    })
    Object.entries(CACHE_HEADERS).forEach(([k, v]) => response.headers.set(k, v))
    return response
  } catch (error) {
    console.error('Error en API de proyectos admin (top-level):', error)
    // Último recurso: evitar 500 devolviendo datos mock con headers de cache
    const total = mockProjects.length
    const limit = 10
    const page = 1
    const paginated = mockProjects.slice(0, limit)
    const response = NextResponse.json({
      data: paginated,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
      warning: 'Error en API de proyectos admin: devolviendo datos mock en lugar de 500'
    })
    Object.entries(CACHE_HEADERS).forEach(([k, v]) => response.headers.set(k, v))
    return response
  }
}