import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSuperAdminContext } from '@/lib/auth';

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    await getSuperAdminContext(req);

    const params = await props.params;
    const { id } = params;

    const { data: restaurant, error: rErr } = await supabaseAdmin
      .from('restaurants')
      .select('*, subscription:subscriptions(*)')
      .eq('id', id)
      .maybeSingle();

    if (rErr || !restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    // Clean up subscription array to single object
    if (Array.isArray(restaurant.subscription)) {
      restaurant.subscription = restaurant.subscription[0] || null;
    }

    // Get owner email
    const { data: adminLink } = await supabaseAdmin
      .from('restaurant_admins')
      .select('user_id')
      .eq('restaurant_id', id)
      .limit(1)
      .maybeSingle();

    let adminEmail = 'Unknown';
    if (adminLink?.user_id) {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(adminLink.user_id);
      if (authUser?.user?.email) {
        adminEmail = authUser.user.email;
      }
    }

    return NextResponse.json({ restaurant, adminEmail });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('Failed to load restaurant details:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    await getSuperAdminContext(req);

    const params = await props.params;
    const { id } = params;
    const body = await req.json();

    const allowed = ['name', 'slug'];
    const update: Record<string, string> = {};
    for (const key of allowed) {
      if (key in body && body[key]) update[key] = body[key];
    }

    if (update.slug) {
      const { data: existing } = await supabaseAdmin.from('restaurants').select('id').eq('slug', update.slug).neq('id', id).maybeSingle();
      if (existing) return NextResponse.json({ error: 'Slug already taken' }, { status: 409 });
    }

    const { data, error } = await supabaseAdmin.from('restaurants').update(update).eq('id', id).select().single();
    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('Failed to update restaurant:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
