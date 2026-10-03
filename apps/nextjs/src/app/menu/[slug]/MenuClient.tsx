'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Category { id: string; name: string; sort_order: number; }
interface MenuItem  {
  id: string; category_id: string; name: string; description: string | null;
  price: number; is_veg: boolean; is_special: boolean; is_available: boolean;
  image_url: string | null; sort_order: number;
}
interface Restaurant {
  id: string; name: string; slug: string; theme_color: string | null;
  status: string; trial_ends_at: string | null;
}

interface Props {
  restaurant: Restaurant;
  categories: Category[];
  items: MenuItem[];
}

function VegIcon({ isVeg }: { isVeg: boolean }) {
  const color = isVeg ? '#16a34a' : '#dc2626';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 16, height: 16, border: `1.5px solid ${color}`, borderRadius: 2, flexShrink: 0 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'block' }} />
    </span>
  );
}



export function MenuClient({ restaurant, categories, items }: Props) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const brand = restaurant.theme_color ?? '#e67e22';

  useEffect(() => {
    document.documentElement.style.setProperty('--brand', brand);
    return () => { document.documentElement.style.removeProperty('--brand'); };
  }, [brand]);

  const filteredCategories = activeCategory
    ? categories.filter(c => c.id === activeCategory)
    : categories;

  const dark = theme === 'dark';
  const bg = dark ? '#111' : '#f8fafc';
  const cardBg = dark ? '#1e1e2e' : '#fff';
  const textPrimary = dark ? '#f1f5f9' : '#1a1a2e';
  const textSecondary = dark ? '#94a3b8' : '#6b7280';
  const borderColor = dark ? '#2d2d3d' : '#f0f0f0';

  return (
    <div style={{ minHeight: '100dvh', background: bg, paddingBottom: 60, transition: 'background .3s' }}>
      {/* Hero */}
      <header style={{ position: 'relative', padding: '52px 20px 32px', textAlign: 'center',
        background: dark ? '#1e1e2e' : '#fff', borderBottom: `1px solid ${borderColor}` }}>
        <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', gap: 8 }}>
          {/* Grid / List toggle */}
          {(['list', 'grid'] as const).map(m => (
            <button key={m} onClick={() => setViewMode(m)}
              style={{ width: 36, height: 36, borderRadius: 8, border: `1.5px solid ${viewMode === m ? brand : borderColor}`,
                background: viewMode === m ? brand + '22' : 'transparent', color: viewMode === m ? brand : textSecondary,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {m === 'list' ? '≡' : '⊞'}
            </button>
          ))}
          {/* Dark mode */}
          <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
            style={{ width: 36, height: 36, borderRadius: 8, border: `1.5px solid ${borderColor}`,
              background: 'transparent', color: textSecondary, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
            {dark ? '☀️' : '🌙'}
          </button>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: textPrimary, margin: '0 0 6px' }}>
          {restaurant.name}
        </h1>
        <p style={{ fontSize: 13, color: textSecondary, margin: 0 }}>
          {items.length} dishes · {categories.length} categories
        </p>
      </header>

      {/* Category Nav */}
      {categories.length > 1 && (
        <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: dark ? '#111e' : '#fffd',
          backdropFilter: 'blur(12px)', borderBottom: `1px solid ${borderColor}`, padding: '10px 0' }}>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px', scrollbarWidth: 'none' }}>
            <button onClick={() => setActiveCategory(null)}
              style={{ flexShrink: 0, padding: '7px 16px', borderRadius: 999,
                background: !activeCategory ? brand : 'transparent',
                color: !activeCategory ? '#fff' : textSecondary,
                border: `1.5px solid ${!activeCategory ? brand : borderColor}`,
                fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
                fontFamily: 'inherit' }}>
              All
            </button>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                style={{ flexShrink: 0, padding: '7px 16px', borderRadius: 999,
                  background: activeCategory === cat.id ? brand : 'transparent',
                  color: activeCategory === cat.id ? '#fff' : textSecondary,
                  border: `1.5px solid ${activeCategory === cat.id ? brand : borderColor}`,
                  fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
                  fontFamily: 'inherit' }}>
                {cat.name}
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* Menu Body */}
      <main style={{ padding: '20px 16px', maxWidth: 800, margin: '0 auto' }}>
        {filteredCategories.map(cat => {
          const catItems = items.filter(i => i.category_id === cat.id);
          if (catItems.length === 0) return null;
          return (
            <section key={cat.id} id={`cat-${cat.id}`} style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: textPrimary,
                margin: '0 0 12px', paddingBottom: 8, borderBottom: `2px solid ${brand}22`,
                display: 'flex', alignItems: 'center', gap: 8 }}>
                {cat.name}
                <span style={{ fontSize: 12, color: textSecondary, fontWeight: 500 }}>
                  ({catItems.length})
                </span>
              </h2>
              <div style={{
                display: viewMode === 'grid' ? 'grid' : 'flex',
                gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(160px, 1fr))' : undefined,
                flexDirection: viewMode === 'list' ? 'column' : undefined,
                gap: 12,
              }}>
                {catItems.map(item => (
                  <div key={item.id} style={{
                    background: cardBg, borderRadius: 14, overflow: 'hidden',
                    border: `1px solid ${borderColor}`, boxShadow: '0 1px 6px rgba(0,0,0,.05)',
                    display: 'flex', flexDirection: viewMode === 'grid' ? 'column' : 'row',
                  }}>
                    {item.image_url && (
                      <div style={{
                        position: 'relative',
                        width: viewMode === 'grid' ? '100%' : 100,
                        height: viewMode === 'grid' ? 150 : 100,
                        flexShrink: 0
                      }}>
                        <Image src={item.image_url} alt={item.name} fill style={{ objectFit: 'cover' }} />
                      </div>
                    )}
                    <div style={{ padding: 12, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 4 }}>
                        <VegIcon isVeg={item.is_veg} />
                        <span style={{ fontWeight: 700, fontSize: 13, color: textPrimary, lineHeight: 1.3 }}>
                          {item.name}
                        </span>
                      </div>
                      {item.is_special && (
                        <span style={{ display: 'inline-block', fontSize: 10, background: '#fff3e0', color: '#e67e22',
                          fontWeight: 700, padding: '2px 7px', borderRadius: 4, marginBottom: 4 }}>
                          ⭐ Chef&apos;s Special
                        </span>
                      )}
                      {item.description && viewMode === 'list' && (
                        <p style={{ fontSize: 12, color: textSecondary, margin: '3px 0 6px',
                          lineHeight: 1.4, display: '-webkit-box',
                          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {item.description}
                        </p>
                      )}
                      <div style={{ fontWeight: 800, color: brand, fontSize: 14 }}>₹{item.price}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </main>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '12px', color: textSecondary, fontSize: 12 }}>
        Powered by <span style={{ color: brand, fontWeight: 700 }}>Menuly</span>
      </div>
    </div>
  );
}
