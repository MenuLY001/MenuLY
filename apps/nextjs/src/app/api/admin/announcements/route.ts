import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAdminContext } from '@/lib/auth';

// GET: fetch active announcements for the logged-in restaurant
export async function GET(req: NextRequest) {
  try {
    await getAdminContext(req);
    const now = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from('announcements')
      .select('id, title, message, type, created_at')
      .eq('is_active', true)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('created_at', { ascending: false })
      .limit(5);
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
