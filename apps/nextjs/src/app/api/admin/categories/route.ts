import { NextRequest, NextResponse } from 'next/server';
import { getAdminContext } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/admin/categories
export async function GET(req: NextRequest) {
  try {
    const { restaurantId } = await getAdminContext(req);
    const { data, error } = await supabaseAdmin
      .from('categories').select('*').eq('restaurant_id', restaurantId).order('sort_order');
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/categories
export async function POST(req: NextRequest) {
  try {
    const { restaurantId } = await getAdminContext(req);
    const body = await req.json();
    const { data: existing } = await supabaseAdmin
      .from('categories').select('sort_order').eq('restaurant_id', restaurantId).order('sort_order', { ascending: false }).limit(1).maybeSingle();
    const sort_order = (existing?.sort_order ?? -1) + 1;
    const { data, error } = await supabaseAdmin
      .from('categories').insert({ restaurant_id: restaurantId, name: body.name, sort_order }).select().single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
