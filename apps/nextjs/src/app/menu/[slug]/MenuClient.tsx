'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { MenuItem, Props } from './components/types';
import { SplashScreen } from './components/SplashScreen';
import { ItemDetailSheet } from './components/ItemDetailSheet';
import { SpecialCard, ItemRow } from './components/ItemCards';
import { CartSheet } from './components/CartSheet';
import { MenuStyles } from './components/MenuStyles';
import { Search, Phone, MapPin, X, Menu as MenuIcon, ShoppingBag } from 'lucide-react';
import type { CartItem } from './components/types';

export function MenuClient({ restaurant, categories, items }: Props) {
  const brand = restaurant.theme_color ?? '#e67e22';
  const [splashDone, setSplashDone] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState(false);
  const [activeCatId, setActiveCatId] = useState('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'veg'>('all');
  const [detailItem, setDetailItem] = useState<MenuItem | null>(null);
  const [menuSheetOpen, setMenuSheetOpen] = useState(false);
  const [cartSheetOpen, setCartSheetOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = useCallback((item: MenuItem, qty: number) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + qty } : i);
      return [...prev, { ...item, qty }];
    });
    setDetailItem(null);
  }, []);

  const updateCartQty = useCallback((id: string, delta: number) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);
  const cartTotalQty = cart.reduce((acc, item) => acc + item.qty, 0);
  const cartTotalPrice = cart.reduce((acc, item) => acc + item.price * item.qty, 0);



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
  const displayCategories = searchQuery.trim() ? null : activeCatId === 'all' ? categories : categories.filter(c => c.id === activeCatId);

  const selectCat = (id: string) => {
    setActiveCatId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
                <button
                  className={`mly-cat-pill${activeCatId === 'all' ? ' mly-cat-pill--active' : ''}`}
                  onClick={() => selectCat('all')}
                  style={activeCatId === 'all' ? { color: '#fff' } : {}}
                >
                  All
                </button>
                {categories.map(cat => (
                  <button 
                    key={cat.id} 
                    className={`mly-cat-pill${activeCatId === cat.id ? ' mly-cat-pill--active' : ''}`} 
                    onClick={() => selectCat(cat.id)}
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
          {!searchQuery && activeCatId === 'all' && specialItems.length > 0 && (
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

        {/* FABs */}
        {!cartSheetOpen && !detailItem && (
          <div style={{ position: 'fixed', bottom: 24, left: 0, right: 0, pointerEvents: 'none', zIndex: 900, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '0 24px' }}>
            
            <button className="mly-fab" style={{ position: 'relative', bottom: 'auto', left: 'auto', transform: 'none', background: cartTotalQty > 0 ? '#1a1a24' : brand, boxShadow: cartTotalQty > 0 ? '0 8px 32px rgba(0,0,0,.5)' : `0 8px 24px ${brand}66`, pointerEvents: 'auto', border: cartTotalQty > 0 ? '1px solid rgba(255,255,255,.1)' : 'none' }} onClick={() => setMenuSheetOpen(true)}>
              <MenuIcon size={20} />
              <span>Menu</span>
            </button>

            {cartTotalQty > 0 && (
              <button 
                style={{ background: brand, width: '100%', maxWidth: 400, borderRadius: 16, border: 'none', padding: '16px 20px', color: '#fff', fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'space-between', pointerEvents: 'auto', boxShadow: `0 12px 40px ${brand}66`, cursor: 'pointer', transition: 'transform 0.2s' }}
                onClick={() => setCartSheetOpen(true)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ShoppingBag size={20} />
                  <span>{cartTotalQty} item{cartTotalQty !== 1 ? 's' : ''}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span>View Order</span>
                  <span style={{ opacity: 0.9 }}>{fmt(cartTotalPrice)}</span>
                </div>
              </button>
            )}
          </div>
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
                <button className="mly-cat-sheet__item" onClick={() => selectCat('all')}>
                  <span className="mly-cat-sheet__name">All Categories</span>
                  <span className="mly-cat-sheet__count">{items.length}</span>
                </button>
                {categories.map(cat => {
                  const count = items.filter(i => i.category_id === cat.id).length;
                  if (count === 0) return null;
                  return (
                    <button key={cat.id} className="mly-cat-sheet__item" onClick={() => selectCat(cat.id)}>
                      <span className="mly-cat-sheet__name">{cat.name}</span>
                      <span className="mly-cat-sheet__count">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {detailItem && <ItemDetailSheet item={detailItem} brand={brand} onClose={closeDetail} onAddToCart={addToCart} />}
        
        {cartSheetOpen && (
          <CartSheet 
            cart={cart} 
            brand={brand} 
            restaurant={restaurant} 
            onClose={() => setCartSheetOpen(false)} 
            onUpdateQty={updateCartQty} 
            onClear={clearCart} 
          />
        )}
      </div>

      <MenuStyles />
    </>
  );
}
