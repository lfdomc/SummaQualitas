import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/client';

// Tablas principales del sistema. Si alguna no existe, se omite.
const TABLES = [
  'users',
  'clients',
  'projects',
  'suppliers',
  'expenses',
  'incomes',
  'payments',
  'change_orders',
  'equipment',
  'invoices',
  'sumitals'
] as const;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase(request);

    // Validar sesión y rol
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      return NextResponse.json({ error: 'Error autenticando usuario' }, { status: 401 });
    }
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('id, role, email, name')
      .eq('id', user.id)
      .single();

    const allowedRoles = new Set(['gerencia', 'administrativo']);
    if (!profile || !allowedRoles.has(profile.role)) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const admin = createAdminClient();

    // Recolectar datos de todas las tablas en formato JSON (paginado)
    const zip = new JSZip();

    const meta = {
      generated_at: new Date().toISOString(),
      requested_by: { id: profile.id, email: profile.email, name: profile.name, role: profile.role },
      format: 'json-zip',
      note: 'Este respaldo contiene datos (contenido) de tablas en formato JSON. No es un archivo .bak (SQL Server). Para PostgreSQL, el formato nativo es pg_dump (.sql/.dump).'
    };
    zip.file('meta.json', JSON.stringify(meta, null, 2));

    for (const table of TABLES) {
      try {
        const allRows: any[] = [];
        const pageSize = 1000;
        let from = 0;
        while (true) {
          const to = from + pageSize - 1;
          const { data: rows, error } = await admin.from(table as string).select('*').range(from, to);
          if (error) {
            // Si la tabla no existe o error de acceso, omitimos
            console.warn(`[backup] Error leyendo ${table}:`, error.message);
            break;
          }
          if (!rows || rows.length === 0) {
            break;
          }
          allRows.push(...rows);
          if (rows.length < pageSize) {
            break;
          }
          from += pageSize;
        }
        zip.file(`${table}.json`, JSON.stringify(allRows, null, 2));
      } catch (e: any) {
        console.warn(`[backup] Excepción leyendo ${table}:`, e?.message || e);
        // Continuar con demás tablas
      }
    }

    const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.zip`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename=${filename}`,
      },
    });
  } catch (error: any) {
    console.error('Error generando respaldo:', error);
    return NextResponse.json({ error: 'Error generando respaldo', details: error?.message || String(error) }, { status: 500 });
  }
}