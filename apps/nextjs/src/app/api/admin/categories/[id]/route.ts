import { NextRequest, NextResponse } from 'next/server';
import { getAdminContext } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// PATCH /api/admin/categories/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { restaurantId } = await getAdminContext(req);
    const { id } = await params;
    const body = await req.json();
    const { data, error } = await supabaseAdmin
      .from('categories').update(body).eq('id', id).eq('restaurant_id', restaurantId).select().single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

// DELETE /api/admin/categories/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { restaurantId } = await getAdminContext(req);
    const { id } = await params;
    const { error } = await supabaseAdmin
      .from('categories').delete().eq('id', id).eq('restaurant_id', restaurantId);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
