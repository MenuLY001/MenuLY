import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const { data: restaurant, error } = await supabaseAdmin
    .from('restaurants')
    .select('id, name, slug, theme_color, status, trial_ends_at')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !restaurant) {
    return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
  }

  if (['suspended', 'cancelled'].includes(restaurant.status)) {
    return NextResponse.json({ error: 'Menu unavailable', status: restaurant.status }, { status: 403 });
  }

  // Check trial expiry
  if (restaurant.status === 'trialing' && restaurant.trial_ends_at) {
    if (new Date(restaurant.trial_ends_at) < new Date()) {
      await supabaseAdmin.from('restaurants').update({ status: 'suspended' }).eq('id', restaurant.id);
      return NextResponse.json({ error: 'Trial expired', status: 'suspended' }, { status: 403 });
    }
  }

  const { data: categories } = await supabaseAdmin
    .from('categories')
    .select('id, name, sort_order')
    .eq('restaurant_id', restaurant.id)
    .order('sort_order', { ascending: true });

  const { data: items } = await supabaseAdmin
    .from('menu_items')
    .select('id, category_id, name, description, price, is_veg, is_special, is_available, image_url, sort_order')
    .eq('restaurant_id', restaurant.id)
    .eq('is_available', true)
    .order('sort_order', { ascending: true });

  return NextResponse.json({ restaurant, categories: categories ?? [], items: items ?? [] });
}
