import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSuperAdminContext } from '@/lib/auth';

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    await getSuperAdminContext(req);

    const params = await props.params;
    const { id } = params;
    const body = await req.json();
    
    if (body.action === 'delete') {
      const { error } = await supabaseAdmin
        .from('restaurants')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
        
      if (error) throw error;
      return NextResponse.json({ success: true });
    }
    
    if (body.action === 'restore') {
      const { error } = await supabaseAdmin
        .from('restaurants')
        .update({ deleted_at: null })
        .eq('id', id);
        
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (err) {
    if (err instanceof Response) return err;
    console.error('Failed to update deleted_at:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
