'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { MenuItem, Props } from './components/types';
import { SplashScreen } from './components/SplashScreen';
import { ItemDetailSheet } from './components/ItemDetailSheet';
import { SpecialCard, ItemRow } from './components/ItemCards';
import { MenuStyles } from './components/MenuStyles';
import { Search, Phone, MapPin, X, Menu as MenuIcon } from 'lucide-react';

export function MenuClient({ restaurant, categories, items }: Props) {
  const brand = restaurant.theme_color ?? '#e67e22';
  const [splashDone, setSplashDone] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState(false);
  const [activeCatId, setActiveCatId] = useState(categories[0]?.id || 'all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'veg'>('all');
  const [detailItem, setDetailItem] = useState<MenuItem | null>(null);
  const [menuSheetOpen, setMenuSheetOpen] = useState(false);

  // Intersection Observer for scroll spy
  useEffect(() => {
    if (searchQuery) return;
    const observer = new IntersectionObserver((entries) => {
      let maxRatio = 0;
      let mostVisible = '';
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
          maxRatio = entry.intersectionRatio;
          mostVisible = entry.target.id.replace('cat-', '');
        }
      });
      if (mostVisible) setActiveCatId(mostVisible);
    }, { rootMargin: '-120px 0px -60% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] });
    
    categories.forEach(c => {
      const el = document.getElementById(`cat-${c.id}`);
      if (el) observer.observe(el);
    });
    
    return () => observer.disconnect();
  }, [categories, searchQuery]);

  // Set brand color
  useEffect(() => {
    document.documentElement.style.setProperty('--brand', brand);
    document.title = `${restaurant.name} — Menu`;
    return () => { document.documentElement.style.removeProperty('--brand'); document.title = 'Menu'; };
  }, [brand, restaurant.name]);

  const openDetail = useCallback((item: MenuItem) => setDetailItem(item), []);
  const closeDetail = useCallback(() => setDetailItem(null), []);

  const applyVeg = (arr: MenuItem[]) => {
    if (activeFilter === 'veg') return arr.filter(i => i.is_veg !== false);
    return arr;
  };

  const allItems = items;
  // Today's special or recommended (limit 5)
  const specialItems = applyVeg(allItems.filter(i => i.is_special || i.is_todays_special)).slice(0, 5);
  
  const getDisplayItems = () => {
    let base = allItems;
    if (searchQuery.trim()) {
      base = base.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()) || (i.description ?? '').toLowerCase().includes(searchQuery.toLowerCase()));
      return applyVeg(base);
    }
    return applyVeg(base);
  };

  const displayItems = getDisplayItems();
  const displayCategories = searchQuery.trim() ? null : categories;

  const scrollToCat = (id: string) => {
    setActiveCatId(id);
    const el = document.getElementById(`cat-${id}`);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 110;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setMenuSheetOpen(false);
  };

  return (
    <>
      {!splashDone && <SplashScreen restaurant={restaurant} brand={brand} onDone={() => setSplashDone(true)} />}
      <div className={`mly-root${!splashDone ? ' mly-menu-hidden' : ''}`}>
        
        {/* Unified Sticky Header */}
        <header className="mly-header">
          <div className="mly-header__top">
            {searchMode ? (
              <div className="mly-search-full">
                <Search size={18} color="#888" />
                <input 
                  autoFocus
                  className="mly-search-full__input" 
                  placeholder="Search for dishes..." 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)} 
                />
                <button className="mly-search-full__close" onClick={() => { setSearchMode(false); setSearchQuery(''); }} aria-label="Close search">
                  <X size={20} />
                </button>
              </div>
            ) : (
              <>
                <div className="mly-header__brand">
                  {restaurant.logo_url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={restaurant.logo_url} alt="" className="mly-header__logo" />
                    : <div className="mly-header__logo-placeholder">🍽️</div>
                  }
                  <div className="mly-header__name">{restaurant.name}</div>
                </div>
                <div className="mly-header__actions">
                  <button className="mly-icon-btn" onClick={() => setSearchMode(true)} aria-label="Search"><Search size={20} /></button>
                  {restaurant.phone && <a href={`tel:${restaurant.phone}`} className="mly-icon-btn" aria-label="Call"><Phone size={20} /></a>}
                  {restaurant.address && <a href={`https://maps.google.com/?q=${encodeURIComponent(restaurant.address)}`} target="_blank" rel="noopener noreferrer" className="mly-icon-btn" aria-label="Directions"><MapPin size={20} /></a>}
                </div>
              </>
            )}
          </div>
          
          {/* Category Bar */}
          {!searchMode && (
            <div className="mly-header__bottom">
              <nav className="mly-cat-bar">
                {categories.map(cat => (
                  <button 
                    key={cat.id} 
                    className={`mly-cat-pill${activeCatId === cat.id ? ' mly-cat-pill--active' : ''}`} 
                    onClick={() => scrollToCat(cat.id)}
                    style={activeCatId === cat.id ? { color: '#fff' } : {}}
                  >
                    {cat.name}
                  </button>
                ))}
              </nav>
              <div className="mly-veg-filter">
                <label className="mly-veg-toggle" aria-label="Toggle Veg Only">
                  <input type="checkbox" checked={activeFilter === 'veg'} onChange={e => setActiveFilter(e.target.checked ? 'veg' : 'all')} />
                  <span className="mly-veg-toggle__slider"></span>
                </label>
                <span className="mly-veg-toggle__label">Veg</span>
              </div>
            </div>
          )}
        </header>

        <div className="mly-container">
          {/* Today's Special */}
          {!searchQuery && specialItems.length > 0 && (
            <section className="mly-special">
              <div className="mly-section-header">
                <h2 className="mly-section-title">Today&apos;s Special</h2>
              </div>
              <div className="mly-special__scroll">
                {specialItems.map(item => <SpecialCard key={item.id} item={item} brand={brand} onOpen={openDetail} />)}
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
                  <div key={cat.id} id={`cat-${cat.id}`} className="mly-category-section">
                    <div className="mly-section-header">
                      <h2 className="mly-section-title">
                        {cat.name} <span className="mly-section-count">· {catItems.length}</span>
                      </h2>
                    </div>
                    <div className="mly-item-list">
                      {catItems.map(item => <ItemRow key={item.id} item={item} brand={brand} onOpen={openDetail} />)}
                    </div>
                  </div>
                );
              })
            ) : displayItems.length === 0 ? (
              <div className="mly-empty">
                <div style={{ fontSize: 48 }}>🔍</div>
                <p>No dishes found for &quot;{searchQuery}&quot;</p>
              </div>
            ) : (
              <div className="mly-item-list mly-search-results">
                {displayItems.map(item => <ItemRow key={item.id} item={item} brand={brand} onOpen={openDetail} />)}
              </div>
            )}
          </main>

          <footer className="mly-footer">
            <div className="mly-footer__hours">Open today</div>
            <div className="mly-footer__powered">
              Powered by 
              <a href="https://vyoma.world" target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/vyoma-logo.jpg" alt="" />
                vyoma.world
              </a>
            </div>
          </footer>
        </div>

        {/* Floating Menu Button */}
        {!searchQuery && (
          <button className="mly-fab" style={{ background: brand, boxShadow: `0 8px 24px ${brand}66` }} onClick={() => setMenuSheetOpen(true)}>
            <MenuIcon size={20} />
            <span>Menu</span>
          </button>
        )}

        {/* Categories Bottom Sheet */}
        {menuSheetOpen && (
          <>
            <div className="mly-sheet-backdrop" onClick={() => setMenuSheetOpen(false)} />
            <div className="mly-sheet mly-cat-sheet" role="dialog" aria-modal="true">
              <div className="mly-sheet__header">
                <h3 className="mly-sheet__title">Menu</h3>
                <button className="mly-sheet__close" onClick={() => setMenuSheetOpen(false)} aria-label="Close menu">
                  <X size={24} />
                </button>
              </div>
              <div className="mly-cat-sheet__list">
                {categories.map(cat => {
                  const count = items.filter(i => i.category_id === cat.id).length;
                  if (count === 0) return null;
                  return (
                    <button key={cat.id} className="mly-cat-sheet__item" onClick={() => scrollToCat(cat.id)}>
                      <span className="mly-cat-sheet__name">{cat.name}</span>
                      <span className="mly-cat-sheet__count">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        <ItemDetailSheet item={detailItem} brand={brand} onClose={closeDetail} />
      </div>

      <MenuStyles />
    </>
  );
}
