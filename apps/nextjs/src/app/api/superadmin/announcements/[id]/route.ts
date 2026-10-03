import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSuperAdminContext } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

// PATCH: update announcement (toggle active, edit)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await getSuperAdminContext(req);
    const { id } = await params;
    const body = await req.json();
    const ALLOWED = ['title', 'message', 'type', 'target', 'expires_at', 'is_active'] as const;
    const update: Record<string, unknown> = {};
    for (const key of ALLOWED) { if (key in body) update[key] = body[key]; }
    const { data, error } = await supabaseAdmin
      .from('announcements').update(update).eq('id', id).select().single();
    if (error) throw error;
    await logAudit({ actorId: userId, action: 'announcement.updated', targetId: id, targetType: 'announcement', metadata: update });
    return NextResponse.json(data);
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: remove announcement
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await getSuperAdminContext(req);
    const { id } = await params;
    const { error } = await supabaseAdmin.from('announcements').delete().eq('id', id);
    if (error) throw error;
    await logAudit({ actorId: userId, action: 'announcement.deleted', targetId: id, targetType: 'announcement', metadata: {} });
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
