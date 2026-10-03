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
    const { days } = await req.json() as { days?: number };

    if (!days || days < 1 || days > 365) {
      return NextResponse.json({ error: 'Days must be between 1 and 365' }, { status: 400 });
    }

    const { data: restaurant } = await supabaseAdmin
      .from('restaurants').select('trial_ends_at').eq('id', id).single();
    if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });

    const base = restaurant.trial_ends_at
      ? new Date(Math.max(Date.now(), new Date(restaurant.trial_ends_at).getTime()))
      : new Date();
    base.setDate(base.getDate() + days);

    await supabaseAdmin.from('restaurants').update({
      trial_ends_at: base.toISOString(),
      status: 'trialing',
    }).eq('id', id);

    return NextResponse.json({ success: true, trial_ends_at: base.toISOString() });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
