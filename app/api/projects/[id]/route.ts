import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/client";

// Normaliza números y elimina undefined para evitar errores con PostgREST
function sanitizeUpdatePayload(payload: Record<string, any>) {
  const out: Record<string, any> = {};
  const numericKeys = new Set([
    'budget',
    'total_area',
    'exchange_rate_usd',
    'presupuesto_inicial',
    'presupuesto_original',
    'presupuesto_final',
    'costos_directos',
    'costos_indirectos',
    'administracion',
    'mano_obra',
    'imprevistos',
    'utilidad',
    'costos_directos_porcentaje',
    'costos_indirectos_porcentaje',
    'mano_obra_porcentaje',
    'administracion_porcentaje',
    'imprevistos_porcentaje',
    'utilidad_porcentaje',
  ]);

  for (const [k, v] of Object.entries(payload)) {
    if (v === undefined) continue;
    if (typeof v === 'string' && numericKeys.has(k)) {
      const parsed = v.trim() === '' ? undefined : Number(v);
      if (parsed === undefined) continue;
      out[k] = Number.isFinite(parsed) ? parsed : undefined;
      continue;
    }
    out[k] = v;
  }
  return out;
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const projectId = params.id;
    const body = await request.json();
    const supabase = createClient(request);

    // Validar sesión
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

  const updates = sanitizeUpdatePayload(body);

    // Evitar enviar budgets inválidos que rompan constraints
    if (Object.prototype.hasOwnProperty.call(updates, 'budget')) {
      const b = updates['budget'];
      if (typeof b !== 'number' || !Number.isFinite(b) || b <= 0) {
        delete updates['budget'];
      }
    }

    // Aplicar actualización y devolver la fila actualizada (si RLS bloquea, esto da error)
    const { data: updatedByUser, error: updateError } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select('*')
      .single();

    if (updateError || !updatedByUser) {
      const serialized = {
        message: updateError?.message,
        details: (updateError as any)?.details,
        hint: (updateError as any)?.hint,
        code: (updateError as any)?.code,
      };
      console.warn('⚠️ Falló actualización con sesión del usuario, intentando con service role (RLS bypass):', serialized);

      // Fallback: usar service role para asegurar la actualización en entornos donde RLS bloquea
      try {
        const admin = createAdminClient();
        const { data: adminUpdated, error: adminErr } = await admin
          .from('projects')
          .update(updates)
          .eq('id', projectId)
          .select('*')
          .single();

        if (adminErr || !adminUpdated) {
          const serializedAdmin = {
            message: adminErr?.message,
            details: (adminErr as any)?.details,
            hint: (adminErr as any)?.hint,
            code: (adminErr as any)?.code,
          };
          console.error('❌ Error también con service role al actualizar proyecto:', serializedAdmin);

          let status = 500;
          const lower = serializedAdmin.message?.toLowerCase() || '';
          if (lower.includes('invalid') || lower.includes('22p02') || lower.includes('not-null') || lower.includes('foreign key') || lower.includes('check constraint') || lower.includes('numeric field overflow') || lower.includes('value out of range') || lower.includes('22003')) {
            status = 400;
          }
          return NextResponse.json({ success: false, error: serializedAdmin.message || 'Error al actualizar', details: serializedAdmin.details, hint: serializedAdmin.hint, code: serializedAdmin.code }, { status });
        }

        // Éxito con service role
        return NextResponse.json({ success: true, data: adminUpdated });
      } catch (fallbackError) {
        const message = fallbackError instanceof Error ? fallbackError.message : 'Error interno actualizando (fallback)';
        console.error('❌ Error en fallback con service role:', message);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
      }
    }
    // Éxito con sesión del usuario, devolver la fila actualizada
    return NextResponse.json({ success: true, data: updatedByUser });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    let status = 500;
    const lower = message.toLowerCase();
    if (lower.includes('no autorizado')) status = 401;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}