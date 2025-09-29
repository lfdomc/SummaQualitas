import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug projects API called');
    
    const supabase = createAdminClient();

    console.log('📊 Fetching projects...');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, presupuesto_original, presupuesto_final, budget')
      .limit(10);

    console.log('📊 Projects data:', projects);
    console.log('❌ Projects error:', projectsError);

    if (projectsError) {
      return NextResponse.json({ error: 'Error fetching projects', details: projectsError }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      projects: projects || [],
      count: projects?.length || 0
    });

  } catch (error) {
    console.error('❌ Debug projects error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}