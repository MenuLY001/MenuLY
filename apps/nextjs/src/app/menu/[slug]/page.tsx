import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { MenuClient } from './MenuClient';

interface Props {
  params: Promise<{ slug: string }>;
}

// Server-side data fetch for SSR
async function getMenuData(slug: string) {
  const { data: restaurant } = await supabaseAdmin
    .from('restaurants')
    .select('id, name, slug, theme_color, logo_url, menu_template, status, trial_ends_at, phone, address')
    .eq('slug', slug)
    .maybeSingle();

  if (!restaurant) return null;
  if (['suspended', 'cancelled'].includes(restaurant.status)) return { restaurant, categories: [], items: [], suspended: true };

  if (restaurant.status === 'trialing' && restaurant.trial_ends_at) {
    if (new Date(restaurant.trial_ends_at) < new Date()) {
      await supabaseAdmin.from('restaurants').update({ status: 'suspended' }).eq('id', restaurant.id);
      return { restaurant: { ...restaurant, status: 'suspended' }, categories: [], items: [], suspended: true };
    }
  }

  const [{ data: categories }, { data: items }] = await Promise.all([
    supabaseAdmin.from('categories').select('id, name, sort_order')
      .eq('restaurant_id', restaurant.id).order('sort_order', { ascending: true }),
    supabaseAdmin.from('menu_items').select('id, category_id, name, description, price, is_veg, is_special, is_todays_special, is_available, image_url, sort_order')
      .eq('restaurant_id', restaurant.id).eq('is_available', true).order('sort_order', { ascending: true }),
  ]);

  return { restaurant, categories: categories ?? [], items: items ?? [], suspended: false };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getMenuData(slug);
  if (!data) return { title: 'Menu Not Found — Menuly' };
  return {
    title: `${data.restaurant.name} Menu — Menuly`,
    description: `View the full menu of ${data.restaurant.name}. Scan the QR code or open this link to see all dishes.`,
  };
}

export default async function MenuPage({ params }: Props) {
  const { slug } = await params;
  const data = await getMenuData(slug);

  if (!data) notFound();

  if (data.suspended) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, textAlign: 'center', background: '#f8fafc' }}>
        <div style={{ fontSize: 64 }}>🔒</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Menu Unavailable</h1>
        <p style={{ color: '#6b7280', maxWidth: 340, margin: 0 }}>
          This restaurant&apos;s menu is currently unavailable. Please contact the restaurant directly.
        </p>
      </div>
    );
  }

  // Pass pre-fetched data to Client Component for interactivity (category filters, cart, etc.)
  return <MenuClient restaurant={data.restaurant} categories={data.categories} items={data.items} />;
}
