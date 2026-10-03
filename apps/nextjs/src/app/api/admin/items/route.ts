import { NextRequest, NextResponse } from 'next/server';
import { getAdminContext } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/admin/items
export async function GET(req: NextRequest) {
  try {
    const { restaurantId } = await getAdminContext(req);
    const { data, error } = await supabaseAdmin
      .from('menu_items').select('*').eq('restaurant_id', restaurantId).order('created_at');
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/items
export async function POST(req: NextRequest) {
  try {
    const { restaurantId } = await getAdminContext(req);
    const body = await req.json();
    const { data, error } = await supabaseAdmin
      .from('menu_items').insert({ ...body, restaurant_id: restaurantId }).select().single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}
