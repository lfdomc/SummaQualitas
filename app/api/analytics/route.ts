import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Utilidad para conversión robusta a número
function toNumber(value: any): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const digits = value.replace(/[^0-9.\-]/g, '');
    const num = Number(digits);
    return Number.isFinite(num) ? num : 0;
  }
  return 0;
}

function monthKey(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${y}-${m}`;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date.getTime());
  d.setMonth(d.getMonth() + months);
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function clampDate(date: Date, min: Date, max: Date): Date {
  return new Date(Math.min(Math.max(date.getTime(), min.getTime()), max.getTime()));
}

function diffDaysInclusive(a: Date, b: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const diff = Math.floor((b.getTime() - a.getTime()) / msPerDay);
  return diff >= 0 ? diff + 1 : 0; // incluir ambos extremos
}

// Calcula días del mes que caen dentro del rango [start, end]
function monthDaysInRange(month: Date, start: Date, end: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const mStart = startOfMonth(month);
  const mEnd = endOfMonth(month);
  const iStart = new Date(Math.max(mStart.getTime(), start.getTime()));
  const iEnd = new Date(Math.min(mEnd.getTime(), end.getTime()));
  if (iEnd < iStart) return 0;
  return diffDaysInclusive(iStart, iEnd);
}

// Conversión de montos a CRC considerando moneda y tipo de cambio
function toCRC(amount: number, currency: string | null | undefined, exchangeRate?: number, defaultRate: number = 520): number {
  const amt = toNumber(amount);
  const curr = (currency || 'CRC').toUpperCase();
  if (curr === 'USD') {
    const rate = toNumber(exchangeRate) || defaultRate;
    return Math.round(amt * rate);
  }
  return amt;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const fromParam = searchParams.get('from'); // YYYY-MM or YYYY-MM-DD
    const toParam = searchParams.get('to');
    const defaultUsdRateParam = searchParams.get('usdRate');

    if (!projectId) {
      return NextResponse.json({ success: false, error: 'Falta projectId' }, { status: 400 });
    }

    const supabase = await createClient(request);

    // Obtener proyecto
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .maybeSingle();

    if (projectError) {
      return NextResponse.json({ success: false, error: `Error obteniendo proyecto: ${projectError.message}` }, { status: 500 });
    }
    if (!project) {
      return NextResponse.json({ success: false, error: 'Proyecto no encontrado' }, { status: 404 });
    }

    const budgetAtCompletion = toNumber(project.presupuesto_final) || toNumber(project.presupuesto_inicial) || toNumber(project.budget) || 0;
    const completionPercentage = toNumber(project.progress_percentage) || toNumber(project.progress) || 0;
    const projectUsdRate = toNumber(project.exchange_rate_usd) || 520;

    // Definir rango de fechas para la serie
    const now = new Date();
    const startDate = project.actual_start_date ? new Date(project.actual_start_date) : (project.estimated_start_date ? new Date(project.estimated_start_date) : now);
    const endDate = project.actual_end_date ? new Date(project.actual_end_date) : (project.estimated_end_date ? new Date(project.estimated_end_date) : addMonths(startDate, 3));

    // Limitar por parámetros si existen
    let seriesStart = startDate;
    let seriesEnd = endDate;
    if (fromParam) {
      const fromDate = fromParam.length === 7 ? new Date(`${fromParam}-01`) : new Date(fromParam);
      seriesStart = clampDate(fromDate, startDate, endDate);
    }
    if (toParam) {
      const toDate = toParam.length === 7 ? endOfMonth(new Date(`${toParam}-01`)) : new Date(toParam);
      seriesEnd = clampDate(toDate, startDate, endDate);
    }
    // Asegurar orden
    if (seriesEnd < seriesStart) {
      seriesEnd = seriesStart;
    }

    // Consultar gastos e ingresos dentro del rango
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('id, amount, currency, exchange_rate_usd, expense_date')
      .eq('project_id', projectId)
      .gte('expense_date', seriesStart.toISOString())
      .lte('expense_date', seriesEnd.toISOString())
      .order('expense_date', { ascending: true });

    if (expensesError) {
      return NextResponse.json({ success: false, error: `Error obteniendo gastos: ${expensesError.message}` }, { status: 500 });
    }

    const { data: incomes, error: incomesError } = await supabase
      .from('incomes')
      .select('id, amount, currency, received_date')
      .eq('project_id', projectId)
      .gte('received_date', seriesStart.toISOString())
      .lte('received_date', seriesEnd.toISOString())
      .order('received_date', { ascending: true });

    if (incomesError) {
      return NextResponse.json({ success: false, error: `Error obteniendo ingresos: ${incomesError.message}` }, { status: 500 });
    }

    const defaultUsdRate = toNumber(defaultUsdRateParam) || projectUsdRate || 520;

    // Agrupar gastos e ingresos por mes
    const monthlyActualCost: Record<string, number> = {};
    const monthlyIncomes: Record<string, number> = {};

    for (const e of (expenses || [])) {
      const d = new Date(e.expense_date);
      const key = monthKey(d);
      const amtCRC = toCRC(toNumber(e.amount), e.currency, toNumber(e.exchange_rate_usd) || defaultUsdRate, defaultUsdRate);
      monthlyActualCost[key] = (monthlyActualCost[key] || 0) + amtCRC;
    }

    for (const inc of (incomes || [])) {
      const d = new Date(inc.received_date);
      const key = monthKey(d);
      const amtCRC = toCRC(toNumber(inc.amount), inc.currency, defaultUsdRate, defaultUsdRate);
      monthlyIncomes[key] = (monthlyIncomes[key] || 0) + amtCRC;
    }

    // Construir lista de meses entre seriesStart y seriesEnd
    const months: string[] = [];
    const monthDates: Date[] = [];
    let cursor = startOfMonth(seriesStart);
    const endCursor = endOfMonth(seriesEnd);
    while (cursor <= endCursor) {
      months.push(monthKey(cursor));
      monthDates.push(new Date(cursor.getTime()));
      cursor = startOfMonth(addMonths(cursor, 1));
    }

    const totalDurationDays = diffDaysInclusive(startDate, endDate);
    const elapsedEnd = clampDate(now, startDate, endDate);
    const elapsedDays = diffDaysInclusive(startDate, elapsedEnd);

    // PV mensual: proporcional a días del mes dentro de [startDate, endDate]
    const monthlyPlanned: Record<string, number> = {};
    for (const mDate of monthDates) {
      const daysInMonth = monthDaysInRange(mDate, startDate, endDate);
      const share = totalDurationDays > 0 ? daysInMonth / totalDurationDays : 0;
      monthlyPlanned[monthKey(mDate)] = Math.round(budgetAtCompletion * share);
    }

    // EV total actual y distribución mensual proporcional a días transcurridos
    const totalEV = Math.round(budgetAtCompletion * (completionPercentage / 100));
    const monthlyEarned: Record<string, number> = {};

    // Sumar shares sólo para los meses hasta elapsedEnd
    let elapsedSharesTotal = 0;
    const monthlyElapsedShares: Record<string, number> = {};
    for (const mDate of monthDates) {
      const shareDays = monthDaysInRange(mDate, startDate, elapsedEnd);
      const share = totalDurationDays > 0 ? shareDays / totalDurationDays : 0;
      monthlyElapsedShares[monthKey(mDate)] = share;
      elapsedSharesTotal += share;
    }

    for (const m of months) {
      const share = monthlyElapsedShares[m] || 0;
      const normalizedShare = elapsedSharesTotal > 0 ? share / elapsedSharesTotal : 0;
      monthlyEarned[m] = Math.round(totalEV * normalizedShare);
    }

    // Totales
    const totalActualCost = Object.values(monthlyActualCost).reduce((a, b) => a + b, 0);
    const totalPV = Object.values(monthlyPlanned).reduce((a, b) => a + b, 0);
    const totalEVSum = Object.values(monthlyEarned).reduce((a, b) => a + b, 0);
    const cpi = totalActualCost > 0 ? totalEVSum / totalActualCost : 0;
    const spi = totalPV > 0 ? totalEVSum / totalPV : 0;
    const eac = cpi > 0 ? Math.round(budgetAtCompletion / cpi) : budgetAtCompletion;
    const vac = Math.round(budgetAtCompletion - eac);

    const series = months.map(m => ({
      month: m,
      planned: monthlyPlanned[m] || 0,
      earned: monthlyEarned[m] || 0,
      actual: monthlyActualCost[m] || 0,
      incomes: monthlyIncomes[m] || 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        projectId,
        summary: {
          budgetAtCompletion,
          completionPercentage,
          totalActualCost,
          totalPV,
          totalEV: totalEVSum,
          cpi,
          spi,
          eac,
          vac,
        },
        series,
        range: {
          start: seriesStart.toISOString(),
          end: seriesEnd.toISOString(),
          months: months.length
        }
      }
    });
  } catch (error: any) {
    console.error('Error en /api/analytics:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Error inesperado' }, { status: 500 });
  }
}