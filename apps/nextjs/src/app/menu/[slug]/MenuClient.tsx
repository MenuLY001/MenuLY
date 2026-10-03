'use client';
import { useState, useEffect, useCallback } from 'react';
import type { MenuItem, Props } from './components/types';
import { getCatEmoji } from './components/helpers';
import { SplashScreen } from './components/SplashScreen';
import { ItemDetailSheet } from './components/ItemDetailSheet';
import { SpecialCard, PopularCard, ItemRow, ItemGridCard } from './components/ItemCards';
import { MenuStyles } from './components/MenuStyles';

export function MenuClient({ restaurant, categories, items }: Props) {
  const brand = restaurant.theme_color ?? '#e67e22';
  const [splashDone, setSplashDone] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCatId, setActiveCatId] = useState('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [detailItem, setDetailItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    document.documentElement.style.setProperty('--brand', brand);
    document.title = `${restaurant.name} — Menu`;
    return () => { document.documentElement.style.removeProperty('--brand'); document.title = 'Menu'; };
  }, [brand, restaurant.name]);

  const openDetail = useCallback((item: MenuItem) => setDetailItem(item), []);
  const closeDetail = useCallback(() => setDetailItem(null), []);

  const applyVeg = (arr: MenuItem[]) => {
    if (activeFilter === 'veg') return arr.filter(i => i.is_veg !== false);
    if (activeFilter === 'non-veg') return arr.filter(i => i.is_veg === false);
    return arr;
  };

  const allItems = items;
  const specialItems = applyVeg(allItems.filter(i => i.is_special));
  const popularItems = allItems.slice(0, 4);

  const getDisplayItems = () => {
    let base = allItems;
    if (searchQuery.trim()) {
      base = base.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()) || (i.description ?? '').toLowerCase().includes(searchQuery.toLowerCase()));
      return applyVeg(base);
    }
    if (activeCatId !== 'all') {
      base = base.filter(i => i.category_id === activeCatId);
    }
    return applyVeg(base);
  };

  const displayItems = getDisplayItems();

  const displayCategories = searchQuery.trim() || activeCatId !== 'all'
    ? null // show flat list
    : categories;

  return (
    <>
      {!splashDone && <SplashScreen restaurant={restaurant} brand={brand} onDone={() => setSplashDone(true)} />}
      <div className={`mly-root${!splashDone ? ' mly-menu-hidden' : ''}`}>
        {/* Header */}
        <header className="mly-header">
          <div className="mly-header__brand">
            {restaurant.logo_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={restaurant.logo_url} alt="" className="mly-header__logo" />
              : <div className="mly-header__logo-placeholder">🍽️</div>
            }
            <div className="mly-header__name">{restaurant.name}</div>
          </div>
        </header>

        {/* Search */}
        <div className="mly-search-wrap">
          <div className="mly-search" style={{ '--brand': brand } as React.CSSProperties}>
            <svg className="mly-search__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input className="mly-search__input" placeholder="Search for dishes..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            {searchQuery && <button className="mly-search__clear" onClick={() => setSearchQuery('')}>✕</button>}
          </div>
        </div>

        {/* Category Tabs */}
        {!searchQuery && (
          <nav className="mly-tabs">
            <div className="mly-tabs__scroll">
              {[{ id: 'all', name: 'All', emoji: '✨' }, ...categories.map(c => ({ id: c.id, name: c.name, emoji: getCatEmoji(c.name) }))].map(tab => (
                <button key={tab.id} className={`mly-tab${activeCatId === tab.id ? ' mly-tab--active' : ''}`} onClick={() => setActiveCatId(tab.id)}
                  style={activeCatId === tab.id ? { borderColor: `${brand}88`, boxShadow: `0 0 18px ${brand}44` } : {}}>
                  <span className="mly-tab__icon" style={activeCatId === tab.id ? { background: brand, boxShadow: `0 0 12px ${brand}66` } : {}}>{tab.emoji}</span>
                  <span className="mly-tab__label">{tab.name}</span>
                </button>
              ))}
            </div>
          </nav>
        )}

        {/* Filter bar */}
        <div className="mly-filter-bar">
          <div className="mly-filter-pills">
            {(['all', 'veg', 'non-veg'] as const).map(f => (
              <button key={f} className={`mly-filter-pill${activeFilter === f ? ' mly-filter-pill--active' : ''}`}
                onClick={() => setActiveFilter(f)}
                style={activeFilter === f ? { background: brand, boxShadow: `0 0 14px ${brand}55`, borderColor: 'transparent' } : {}}>
                {f === 'all' && '🍽 All'}{f === 'veg' && '🟢 Veg'}{f === 'non-veg' && '🔴 Non-Veg'}
              </button>
            ))}
          </div>
          <div className="mly-view-toggle">
            {(['list', 'grid'] as const).map(m => (
              <button key={m} className={`mly-view-btn${viewMode === m ? ' mly-view-btn--active' : ''}`} onClick={() => setViewMode(m)} aria-label={`${m} view`}>
                {m === 'list'
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                }
              </button>
            ))}
          </div>
        </div>

        {/* Today's Special */}
        {!searchQuery && specialItems.length > 0 && (
          <section className="mly-special">
            <div className="mly-section-header"><h2 className="mly-section-title"><span style={{ fontSize: 16 }}>⭐</span> Today&apos;s Special</h2></div>
            <div className="mly-popular__scroll">
              {specialItems.map(item => <SpecialCard key={item.id} item={item} brand={brand} onOpen={openDetail} />)}
            </div>
          </section>
        )}

        {/* Popular Today */}
        {!searchQuery && activeCatId === 'all' && popularItems.length > 0 && (
          <section className="mly-popular">
            <div className="mly-section-header"><h2 className="mly-section-title">Popular Today</h2></div>
            <div className="mly-popular__scroll">
              {popularItems.map(item => <PopularCard key={item.id} item={item} brand={brand} onOpen={openDetail} />)}
            </div>
          </section>
        )}

        {/* Main content */}
        <main className="mly-main">
          {displayCategories ? (
            // All categories view
            displayCategories.map(cat => {
              const catItems = applyVeg(items.filter(i => i.category_id === cat.id));
              if (catItems.length === 0) return null;
              return (
                <div key={cat.id} style={{ marginBottom: 24 }}>
                  <div className="mly-section-header"><h2 className="mly-section-title">{cat.name}</h2></div>
                  {viewMode === 'grid'
                    ? <div className="mly-item-grid">{catItems.map(item => <ItemGridCard key={item.id} item={item} brand={brand} onOpen={openDetail} />)}</div>
                    : <div className="mly-item-list">{catItems.map(item => <ItemRow key={item.id} item={item} brand={brand} onOpen={openDetail} />)}</div>
                  }
                </div>
              );
            })
          ) : displayItems.length === 0 ? (
            <div className="mly-empty">
              <div style={{ fontSize: 48 }}>{searchQuery ? '🔍' : '🍽️'}</div>
              <p>{searchQuery ? `No dishes found for "${searchQuery}"` : 'No items available'}</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="mly-item-grid">{displayItems.map(item => <ItemGridCard key={item.id} item={item} brand={brand} onOpen={openDetail} />)}</div>
          ) : (
            <div className="mly-item-list">{displayItems.map(item => <ItemRow key={item.id} item={item} brand={brand} onOpen={openDetail} />)}</div>
          )}
        </main>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '24px 0 48px', fontSize: 13, color: 'rgba(255,255,255,.3)' }}>
          Powered by 
          <a href="https://vyoma.world" target="_blank" rel="noopener noreferrer" style={{ color: brand, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/vyoma-logo.jpg" alt="" style={{ width: 14, height: 14, borderRadius: 2 }} />
            vyoma.world
          </a>
        </div>

        <ItemDetailSheet item={detailItem} brand={brand} onClose={closeDetail} />
      </div>

      <MenuStyles />
    </>
  );
}
