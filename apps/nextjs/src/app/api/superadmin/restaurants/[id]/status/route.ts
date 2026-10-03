import { NextRequest, NextResponse } from 'next/server';
import { getSuperAdminContext } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getSuperAdminContext(req);
    const { id } = await params;
    const { status } = await req.json() as { status?: string };

    const allowed = ['active', 'suspended', 'trialing', 'cancelled'];
    if (!status || !allowed.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    await supabaseAdmin.from('restaurants').update({ status }).eq('id', id);
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
