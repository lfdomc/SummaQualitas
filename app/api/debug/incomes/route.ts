import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Debug endpoint to verify RLS for incomes using SSR client (authenticated user via cookies)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({
        ok: false,
        error: 'projectId requerido',
        incomes: [],
      }, { status: 400 });
    }

    // Create SSR supabase client using cookies/session
    const supabase = await createClient();

    // Optional: verify user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      return NextResponse.json({
        ok: false,
        error: `Error obteniendo usuario: ${userError.message}`,
        incomes: [],
      }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({
        ok: false,
        error: 'No autenticado',
        incomes: [],
      }, { status: 401 });
    }

    // Query incomes with RLS applied for the authenticated user
    const { data: incomes, error: incomesError } = await supabase
      .from('incomes')
      .select('*')
      .eq('project_id', projectId)
      .order('received_date', { ascending: false })
      .limit(100);

    return NextResponse.json({
      ok: !incomesError,
      projectId,
      userId: user.id,
      incomes: incomes || [],
      incomesCount: incomes?.length || 0,
      incomesError,
      message: incomesError ? `Error: ${incomesError.message}` : `Ingresos encontrados: ${incomes?.length || 0}`,
    }, { status: incomesError ? 400 : 200 });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }, { status: 500 });
  }
}