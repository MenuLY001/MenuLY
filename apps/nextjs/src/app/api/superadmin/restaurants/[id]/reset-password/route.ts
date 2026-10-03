import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSuperAdminContext } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSuperAdminContext(req);

    const params = await props.params;
    const { id } = params;
    const { password } = await req.json();

    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Get the owner user_id
    const { data: adminLink } = await supabaseAdmin
      .from('restaurant_admins')
      .select('user_id')
      .eq('restaurant_id', id)
      .limit(1)
      .maybeSingle();

    if (!adminLink?.user_id) {
      return NextResponse.json({ error: 'No owner found for this restaurant' }, { status: 404 });
    }

    // Update password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(adminLink.user_id, {
      password,
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    await logAudit({
      actorId: user.userId,
      action: 'restaurant.reset_password',
      targetId: id,
      targetType: 'restaurant',
      metadata: { targetUserId: adminLink.user_id }
    });

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('Failed to reset password:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
