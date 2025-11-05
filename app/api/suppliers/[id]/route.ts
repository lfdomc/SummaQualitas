import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/client';

// DELETE /api/suppliers/:id
// - Verifica autenticación y rol del usuario (solo "gerencia" puede eliminar)
// - Si el proveedor tiene dependencias (gastos o pagos), realiza un "soft delete" (status = INACTIVO)
// - Si no tiene dependencias, elimina físicamente el registro
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient(request);
    const admin = createAdminClient();

    const supplierId = params.id;
    if (!supplierId) {
      return NextResponse.json({ error: 'ID de proveedor requerido' }, { status: 400 });
    }

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener rol del usuario
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, role, is_active')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: 'No se pudo verificar el perfil del usuario' }, { status: 403 });
    }
    if (!profile || String(profile.role) !== 'gerencia') {
      return NextResponse.json({ error: 'Permisos insuficientes para eliminar proveedores' }, { status: 403 });
    }

    // Comprobar dependencias (gastos y pagos a proveedores)
    const [{ data: expenses, error: expensesError }, { data: payments, error: paymentsError }] = await Promise.all([
      admin.from('expenses').select('id').eq('supplier_id', supplierId).limit(1),
      admin.from('supplier_payments').select('id').eq('supplier_id', supplierId).limit(1),
    ]);

    if (expensesError || paymentsError) {
      const err = expensesError || paymentsError;
      return NextResponse.json({ error: 'Error al verificar dependencias', details: err?.message }, { status: 500 });
    }

    const hasDependencies = Boolean((expenses && expenses.length > 0) || (payments && payments.length > 0));

    if (hasDependencies) {
      // Soft delete: marcar como INACTIVO
      const { data, error } = await admin
        .from('suppliers')
        .update({ status: 'INACTIVO' })
        .eq('id', supplierId)
        .select()
        .maybeSingle();

      if (error) {
        return NextResponse.json({ error: 'No se pudo marcar como INACTIVO', details: error.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        softDeleted: true,
        message: 'El proveedor tiene movimientos asociados. Se marcó como INACTIVO en lugar de eliminarse.',
        data,
      });
    }

    // Sin dependencias: eliminar físicamente
    const { error: deleteError } = await admin
      .from('suppliers')
      .delete()
      .eq('id', supplierId);

    if (deleteError) {
      return NextResponse.json({ error: 'Error al eliminar proveedor', details: deleteError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error interno' }, { status: 500 });
  }
}