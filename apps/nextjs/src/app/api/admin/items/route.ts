import { NextRequest, NextResponse } from 'next/server';
import { getAdminContext } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/admin/items
export async function GET(req: NextRequest) {
  try {
    const { restaurantId } = await getAdminContext(req);
    const { data, error } = await supabaseAdmin
      .from('menu_items').select('*').eq('restaurant_id', restaurantId).order('sort_order');
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    console.error('GET /api/admin/items Error:', e);
    if (e instanceof Response) return e;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/items
export async function POST(req: NextRequest) {
  try {
    const { restaurantId } = await getAdminContext(req);
    const body = await req.json();
    // Allowlist to prevent arbitrary field injection
    const ALLOWED = ['name', 'description', 'price', 'category_id', 'image_url', 'is_available', 'is_veg', 'is_special', 'is_todays_special', 'sort_order'] as const;
    const payload: Record<string, unknown> = { restaurant_id: restaurantId };
    for (const key of ALLOWED) { if (key in body) payload[key] = body[key]; }
    const { data, error } = await supabaseAdmin
      .from('menu_items').insert(payload).select().single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error('POST /api/admin/items Error:', e);
    if (e instanceof Response) return e;
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}
