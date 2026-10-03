import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSuperAdminContext } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

// GET: list all announcements
export async function GET(req: NextRequest) {
  try {
    await getSuperAdminContext(req);
    const { data, error } = await supabaseAdmin
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: create announcement
export async function POST(req: NextRequest) {
  try {
    const { userId } = await getSuperAdminContext(req);
    const body = await req.json();
    const { title, message, type = 'info', target = 'all', expires_at } = body;
    if (!title?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'title and message are required' }, { status: 400 });
    }
    const { data, error } = await supabaseAdmin
      .from('announcements')
      .insert({ title: title.trim(), message: message.trim(), type, target, expires_at: expires_at || null, created_by: userId, is_active: true })
      .select()
      .single();
    if (error) throw error;
    await logAudit({ actorId: userId, action: 'announcement.created', targetId: data.id, targetType: 'announcement', metadata: { title } });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
