import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSuperAdminContext } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSuperAdminContext(req);
    const { id } = await props.params;
    const body = await req.json();

    // Allowlist to prevent arbitrary column injection
    const ALLOWED = ['name', 'description', 'price_paise', 'currency', 'interval', 'razorpay_plan_id', 'is_active'] as const;
    const update: Record<string, unknown> = {};
    for (const key of ALLOWED) { if (key in body) update[key] = body[key]; }

    const { error } = await supabaseAdmin
      .from('plans')
      .update(update)
      .eq('id', id);

    if (error) throw error;

    await logAudit({
      actorId: user.userId,
      action: 'plan.update',
      targetId: id,
      targetType: 'plan',
      metadata: body
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSuperAdminContext(req);
    const { id } = await props.params;

    // Typically soft-delete or block deletion if subscriptions exist
    // We will do a soft-delete by marking is_active = false
    const { error } = await supabaseAdmin
      .from('plans')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;

    await logAudit({
      actorId: user.userId,
      action: 'plan.deactivate',
      targetId: id,
      targetType: 'plan'
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
