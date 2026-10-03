import { NextRequest, NextResponse } from 'next/server';
import { getAdminContext } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/admin/restaurant
export async function GET(req: NextRequest) {
  try {
    const { restaurantId } = await getAdminContext(req);
    const { data, error } = await supabaseAdmin
      .from('restaurants').select('*').eq('id', restaurantId).single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/restaurant
export async function PATCH(req: NextRequest) {
  try {
    const { restaurantId } = await getAdminContext(req);
    const body = await req.json();
    // Only allow safe fields to be updated
    const allowed = ['name', 'slug', 'theme_color', 'logo_url', 'banner_url', 'address', 'phone', 'description', 'menu_template'];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }
    const { data, error } = await supabaseAdmin
      .from('restaurants').update(update).eq('id', restaurantId).select().single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: 'Failed to update restaurant' }, { status: 500 });
  }
}
