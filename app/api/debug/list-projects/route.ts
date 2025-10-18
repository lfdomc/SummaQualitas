import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();

    console.log('📋 Listing all projects...');

    // Listing all projects
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        description,
        status,
        budget,
        presupuesto_inicial,
        presupuesto_original,
        presupuesto_final,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Found projects
    console.log(`✅ Found ${projects?.length || 0} projects`);

    return NextResponse.json({
      success: true,
      projects: projects || [],
      total: projects?.length || 0
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}