import React, { useState, useEffect, useCallback } from 'react';
import { PublicMenuResponse, MenuItem, CartState } from '@qr-menu/types';
import { useCart } from '../../cart/CartContext';
import { useToast } from '../../../components/ToastContext';
import { CartBadge } from '../../cart/CartBadge';
import { CartDrawer } from '../../cart/CartDrawer';
import { WaiterDisplay } from '../../fulfillment/WaiterDisplay';
import { getFulfillmentStrategy } from '../../fulfillment/strategy';
import { formatPrice } from '../../../lib/format';

interface MenulyDarkTemplateProps {
  data: PublicMenuResponse;
  tableNo: string | null;
}

export function MenulyDarkTemplate({ data, tableNo }: MenulyDarkTemplateProps) {
  const { cart } = useCart();
  const [splashDone, setSplashDone] = useState(false);
  const [splashFading, setSplashFading] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [waiterCart, setWaiterCart] = useState<CartState | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCatId, setActiveCatId] = useState<string>('all');
  const [detailItem, setDetailItem] = useState<MenuItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const handleGetStarted = () => {
    setSplashFading(true);
    setTimeout(() => setSplashDone(true), 500);
  };

  const handleShowToWaiter = async (c: CartState) => {
    const strategy = getFulfillmentStrategy(data.restaurant.ordering_enabled);
    const result = await strategy.submit(c);
    if (result.success) {
      setCartOpen(false);
      setWaiterCart(result.data);
    }
  };

  const openDetail = useCallback((item: MenuItem) => setDetailItem(item), []);
  const closeDetail = useCallback(() => setDetailItem(null), []);

  const allItems = data.categories.flatMap((c) => c.items);
  const specialItems = allItems.filter((i) => (i as any).is_special);

  // Apply veg/non-veg filter to items
  const applyVegFilter = (items: MenuItem[]) => {
    if (activeFilter === 'veg') return items.filter((i) => i.is_veg !== false);
    if (activeFilter === 'non-veg') return items.filter((i) => i.is_veg === false);
    return items;
  };

  const filteredCategories = searchQuery.trim()
    ? [{
        id: '__search__',
        name: 'Search Results',
        sort_order: 0,
        restaurant_id: data.restaurant.id,
        items: applyVegFilter(allItems.filter(
          (it) =>
            it.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (it.description ?? '').toLowerCase().includes(searchQuery.toLowerCase())
        )),
      }]
    : data.categories;

  useEffect(() => {
    if (!searchQuery && activeCatId !== 'all' && !filteredCategories.find((c) => c.id === activeCatId)) {
      setActiveCatId('all');
    }
  }, [searchQuery]);

  const displaySpecialItems = activeCatId === 'all'
    ? applyVegFilter(specialItems)
    : applyVegFilter(specialItems).filter(i => i.category_id === activeCatId);

  const activeCategory =
    filteredCategories.find((c) => c.id === activeCatId) ?? filteredCategories[0];

  return (
    <div className="mly-root">
      {/* ── Splash Screen ── */}
      {!splashDone && (
        <div className={`mly-splash ${splashFading ? 'mly-splash--fading' : ''}`}>
          {/* Animated background blobs — warm organic iOS-style */}
          <div className="mly-splash__blob mly-splash__blob--1" />
          <div className="mly-splash__blob mly-splash__blob--2" />
          <div className="mly-splash__blob mly-splash__blob--3" />
          <div className="mly-splash__blob mly-splash__blob--4" />

          {/* Glass logo card */}
          <div className="mly-splash__logo-wrap">
            <div className="mly-splash__logo-card">
              {data.restaurant.logo_url ? (
                <img src={data.restaurant.logo_url} alt="" className="mly-splash__logo-img" />
              ) : (
                <span className="mly-splash__logo-emoji">🍽️</span>
              )}
            </div>
          </div>

          {/* Restaurant name */}
          <h1 className="mly-splash__name">{data.restaurant.name}</h1>
          <p className="mly-splash__tagline">Explore Flavors<br />At Your Fingertips</p>

          {/* Dots */}
          <div className="mly-splash__dots">
            <span className="mly-splash__dot mly-splash__dot--active" />
            <span className="mly-splash__dot" />
            <span className="mly-splash__dot" />
          </div>

          {/* CTA */}
          <button className="mly-splash__cta" onClick={handleGetStarted}>
            Get Started &nbsp;→
          </button>

          <p className="mly-splash__footer">Browse &nbsp;•&nbsp; Discover &nbsp;•&nbsp; Enjoy</p>
        </div>
      )}

      {/* ── Main Menu (hidden until splash done) ── */}
      <div className={`mly-menu-wrap ${!splashDone ? 'mly-menu-wrap--hidden' : ''}`}>
      <header className="mly-header">
        <div className="mly-header__brand">
          {data.restaurant.logo_url ? (
            <img src={data.restaurant.logo_url} alt="" className="mly-header__logo" />
          ) : (
            <div className="mly-header__logo-placeholder">🍽️</div>
          )}
          <div>
            <div className="mly-header__name">{data.restaurant.name}</div>
            {tableNo && <div className="mly-header__table">Table {tableNo}</div>}
          </div>
        </div>
      </header>

      <div className="mly-search-wrap">
        <div className="mly-search">
          <svg className="mly-search__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="mly-search__input"
            placeholder="Search for dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="mly-search__clear" onClick={() => setSearchQuery('')}>✕</button>
          )}
        </div>
      </div>

      {!searchQuery && (
        <nav className="mly-tabs">
          <div className="mly-tabs__scroll">
            <button
              className={`mly-tab ${activeCatId === 'all' ? 'mly-tab--active' : ''}`}
              onClick={() => setActiveCatId('all')}
            >
              <span className="mly-tab__icon">✨</span>
              <span className="mly-tab__label">All</span>
            </button>
            {data.categories.map((cat) => (
              <button
                key={cat.id}
                className={`mly-tab ${cat.id === activeCatId ? 'mly-tab--active' : ''}`}
                onClick={() => setActiveCatId(cat.id)}
              >
                <span className="mly-tab__icon">{getCatEmoji(cat.name)}</span>
                <span className="mly-tab__label">{cat.name}</span>
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* ── Veg/Non-Veg filter + View toggle ── */}
      <div className="mly-filter-bar">
        <div className="mly-filter-pills">
          {(['all', 'veg', 'non-veg'] as const).map((f) => (
            <button
              key={f}
              className={`mly-filter-pill ${activeFilter === f ? 'mly-filter-pill--active' : ''}`}
              onClick={() => setActiveFilter(f)}
            >
              {f === 'all' && '🍽 All'}
              {f === 'veg' && '🟢 Veg'}
              {f === 'non-veg' && '🔴 Non-Veg'}
            </button>
          ))}
        </div>
        <div className="mly-view-toggle">
          <button
            className={`mly-view-btn ${viewMode === 'list' ? 'mly-view-btn--active' : ''}`}
            onClick={() => setViewMode('list')}
            aria-label="List view"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </button>
          <button
            className={`mly-view-btn ${viewMode === 'grid' ? 'mly-view-btn--active' : ''}`}
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Today's Special ── */}
      {!searchQuery && displaySpecialItems.length > 0 && (
        <TodaysSpecialSection items={displaySpecialItems} onOpen={openDetail} />
      )}

      {/* ── Popular Today ── */}
      {!searchQuery && activeCatId === 'all' && (
        <PopularSection items={allItems.slice(0, 4)} onOpen={openDetail} />
      )}

      <main className="mly-main">
        {searchQuery ? (
          filteredCategories[0]?.items.length === 0 ? (
            <div className="mly-empty">
              <div style={{ fontSize: 48 }}>🔍</div>
              <p>No dishes found for &ldquo;{searchQuery}&rdquo;</p>
            </div>
          ) : (
            <ItemList items={filteredCategories[0]?.items ?? []} onOpen={openDetail} viewMode={viewMode} />
          )
        ) : activeCatId === 'all' ? (
          data.categories.map((cat) => {
            const catItems = applyVegFilter(cat.items);
            if (catItems.length === 0) return null;
            return (
              <div key={cat.id} style={{ marginBottom: 24 }}>
                <div className="mly-section-header">
                  <h2 className="mly-section-title">{cat.name}</h2>
                </div>
                <ItemList items={catItems} onOpen={openDetail} viewMode={viewMode} />
              </div>
            );
          })
        ) : (
          activeCategory && (
            <div>
              <div className="mly-section-header">
                <h2 className="mly-section-title">{activeCategory.name}</h2>
              </div>
              <ItemList items={applyVegFilter(activeCategory.items)} onOpen={openDetail} viewMode={viewMode} />
            </div>
          )
        )}
      </main>

      <CartBadge onClick={() => setCartOpen(true)} />
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onShowToWaiter={() => handleShowToWaiter(cart)}
      />
      {waiterCart && (
        <WaiterDisplay cart={waiterCart} onDone={() => setWaiterCart(null)} />
      )}

      {/* ── Item Detail Sheet ── */}
      <ItemDetailSheet item={detailItem} onClose={closeDetail} />
      </div>{/* end mly-menu-wrap */}

      <MlyStyles brandColor={data.restaurant.theme_color} />
    </div>
  );
}

// ── Category emoji auto-assignment ────────────────────────────────────────────
function getCatEmoji(name: string): string {
  const n = name.toLowerCase();
  if (/breakfast|morning/.test(n)) return '🥐';
  if (/starter|appetizer|snack/.test(n)) return '🥗';
  if (/main|lunch|entree|course/.test(n)) return '🍽️';
  if (/dessert|sweet|cake|pastry/.test(n)) return '🍰';
  if (/drink|beverage|juice|mocktail|coffee|tea/.test(n)) return '🥤';
  if (/grill|steak|bbq|barbeque/.test(n)) return '🥩';
  if (/pizza/.test(n)) return '🍕';
  if (/burger|sandwich|wrap/.test(n)) return '🍔';
  if (/pasta|noodle|spaghetti/.test(n)) return '🍝';
  if (/seafood|fish|prawn|shrimp/.test(n)) return '🦐';
  if (/chicken|poultry/.test(n)) return '🍗';
  if (/soup|broth|stew/.test(n)) return '🍜';
  if (/salad/.test(n)) return '🥙';
  if (/rice|biryani|pulao/.test(n)) return '🍚';
  if (/bread|roti|naan|paratha/.test(n)) return '🫓';
  if (/veg|paneer|dal/.test(n)) return '🥦';
  if (/non.?veg|meat|mutton|lamb/.test(n)) return '🍖';
  return '🍴';
}

// ── Veg/Non-veg dot icon ───────────────────────────────────────────────────────
function VegDot({ isVeg }: { isVeg?: boolean }) {
  const color = isVeg === false ? '#ef4444' : '#22c55e';
  return (
    <span className="mly-veg-dot" style={{ borderColor: color }}>
      <span style={{ background: color }} />
    </span>
  );
}

// ── Popular Section ────────────────────────────────────────────────────────────
function PopularSection({ items, onOpen }: { items: MenuItem[]; onOpen: (i: MenuItem) => void }) {
  if (items.length === 0) return null;
  return (
    <section className="mly-popular">
      <div className="mly-section-header">
        <h2 className="mly-section-title">Popular Today</h2>
      </div>
      <div className="mly-popular__scroll">
        {items.map((item) => (
          <PopularCard key={item.id} item={item} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}

function PopularCard({ item, onOpen }: { item: MenuItem; onOpen: (i: MenuItem) => void }) {
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [imgError, setImgError] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({ menuItemId: item.id, name: item.name, price: item.price, image_url: item.image_url });
    showToast(`Added ${item.name}`, 'success');
  };

  return (
    <div className="mly-pop-card" onClick={() => onOpen(item)} role="button" tabIndex={0}>
      <div className="mly-pop-card__img-wrap">
        {item.image_url && !imgError ? (
          <img src={item.image_url} alt={item.name} className="mly-pop-card__img" onError={() => setImgError(true)} loading="lazy" />
        ) : (
          <div className="mly-pop-card__img-placeholder">🍽️</div>
        )}
      </div>
      <div className="mly-pop-card__body">
        <div className="mly-pop-card__name">{item.name}</div>
        <div className="mly-pop-card__price-row">
          <div className="mly-pop-card__price-group">
            <VegDot isVeg={item.is_veg ?? true} />
            <span className="mly-pop-card__price">{formatPrice(item.price)}</span>
          </div>
          {item.is_available && (
            <button className="mly-pop-card__add" onClick={handleAdd} aria-label={`Add ${item.name}`}>+</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Today's Special Section ────────────────────────────────────────────────────
function TodaysSpecialSection({ items, onOpen }: { items: MenuItem[]; onOpen: (i: MenuItem) => void }) {
  return (
    <section className="mly-special">
      <div className="mly-section-header">
        <h2 className="mly-section-title">
          <span className="mly-special__star">⭐</span> Today&apos;s Special
        </h2>
      </div>
      <div className="mly-popular__scroll">
        {items.map((item) => (
          <SpecialCard key={item.id} item={item} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}

function SpecialCard({ item, onOpen }: { item: MenuItem; onOpen: (i: MenuItem) => void }) {
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [imgError, setImgError] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({ menuItemId: item.id, name: item.name, price: item.price, image_url: item.image_url });
    showToast(`Added ${item.name}`, 'success');
  };

  return (
    <div className="mly-special-card" onClick={() => onOpen(item)} role="button" tabIndex={0}>
      <div className="mly-special-card__badge">Special</div>
      <div className="mly-special-card__img-wrap">
        {item.image_url && !imgError ? (
          <img src={item.image_url} alt={item.name} className="mly-special-card__img" onError={() => setImgError(true)} loading="lazy" />
        ) : (
          <div className="mly-special-card__img-placeholder">⭐</div>
        )}
      </div>
      <div className="mly-special-card__body">
        <div className="mly-special-card__name">{item.name}</div>
        {item.description && <div className="mly-special-card__desc">{item.description}</div>}
        <div className="mly-special-card__footer">
          <div className="mly-pop-card__price-group">
            <VegDot isVeg={item.is_veg ?? true} />
            <span className="mly-pop-card__price">{formatPrice(item.price)}</span>
          </div>
          {item.is_available && (
            <button className="mly-pop-card__add" onClick={handleAdd} aria-label={`Add ${item.name}`}>+</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Item List ─────────────────────────────────────────────────────────────────
function ItemList({ items, onOpen, viewMode }: { items: MenuItem[]; onOpen: (i: MenuItem) => void; viewMode: 'list' | 'grid' }) {
  if (items.length === 0) {
    return (
      <div className="mly-empty">
        <div style={{ fontSize: 48 }}>🍽️</div>
        <p>No items available</p>
      </div>
    );
  }
  return (
    <div className={viewMode === 'grid' ? 'mly-item-grid' : 'mly-item-list'}>
      {items.map((item) => (
        viewMode === 'grid'
          ? <ItemGridCard key={item.id} item={item} onOpen={onOpen} />
          : <ItemRow key={item.id} item={item} onOpen={onOpen} />
      ))}
    </div>
  );
}

// ── List View Item Row ─────────────────────────────────────────────────────────
function ItemRow({ item, onOpen }: { item: MenuItem; onOpen: (i: MenuItem) => void }) {
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [imgError, setImgError] = useState(false);
  const [adding, setAdding] = useState(false);
  const isSpecial = (item as any).is_special;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.is_available) return;
    addItem({ menuItemId: item.id, name: item.name, price: item.price, image_url: item.image_url });
    showToast(`Added ${item.name}`, 'success');
    setAdding(true);
    setTimeout(() => setAdding(false), 600);
  };

  return (
    <div
      className={`mly-item ${!item.is_available ? 'mly-item--unavailable' : ''}`}
      onClick={() => onOpen(item)}
      role="button"
      tabIndex={0}
    >
      {isSpecial && <div className="mly-item__special-badge">⭐ Special</div>}
      <div className="mly-item__body">
        {/* Thumbnail — left side */}
        <div className="mly-item__img-wrap">
          {item.image_url && !imgError ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="mly-item__img"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="mly-item__img-placeholder">🍽️</div>
          )}
        </div>

        {/* Info — right side */}
        <div className="mly-item__info">
          <div className="mly-item__top-row">
            <VegDot isVeg={item.is_veg ?? true} />
          </div>
          <h3 className="mly-item__name">{item.name}</h3>
          {item.description && (
            <p className="mly-item__desc">{item.description}</p>
          )}
          <div className="mly-item__footer">
            <span className="mly-item__price">{formatPrice(item.price)}</span>
            {item.is_available ? (
              <button
                className={`mly-item__add ${adding ? 'mly-item__add--added' : ''}`}
                onClick={handleAdd}
                aria-label={`Add ${item.name}`}
              >
                {adding ? '✓' : '+'}
              </button>
            ) : (
              <span className="mly-item__unavailable">Unavailable</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Grid View Item Card ────────────────────────────────────────────────────────
function ItemGridCard({ item, onOpen }: { item: MenuItem; onOpen: (i: MenuItem) => void }) {
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [imgError, setImgError] = useState(false);
  const [adding, setAdding] = useState(false);
  const isSpecial = (item as any).is_special;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.is_available) return;
    addItem({ menuItemId: item.id, name: item.name, price: item.price, image_url: item.image_url });
    showToast(`Added ${item.name}`, 'success');
    setAdding(true);
    setTimeout(() => setAdding(false), 600);
  };

  return (
    <div
      className={`mly-grid-card ${!item.is_available ? 'mly-item--unavailable' : ''}`}
      onClick={() => onOpen(item)}
      role="button"
      tabIndex={0}
    >
      <div className="mly-grid-card__img-wrap">
        {item.image_url && !imgError ? (
          <img src={item.image_url} alt={item.name} className="mly-grid-card__img" loading="lazy" onError={() => setImgError(true)} />
        ) : (
          <div className="mly-grid-card__img-placeholder">🍽️</div>
        )}
        {isSpecial && <div className="mly-grid-card__special">⭐</div>}
      </div>
      <div className="mly-grid-card__body">
        <div className="mly-grid-card__name">{item.name}</div>
        <div className="mly-grid-card__footer">
          <div className="mly-pop-card__price-group">
            <VegDot isVeg={item.is_veg ?? true} />
            <span className="mly-pop-card__price">{formatPrice(item.price)}</span>
          </div>
          {item.is_available && (
            <button className={`mly-pop-card__add ${adding ? 'mly-item__add--added' : ''}`} onClick={handleAdd} aria-label={`Add ${item.name}`}>
              {adding ? '✓' : '+'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Item Detail Bottom Sheet ───────────────────────────────────────────────────
function ItemDetailSheet({ item, onClose }: { item: MenuItem | null; onClose: () => void }) {
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [qty, setQty] = useState(1);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (item) { setQty(1); setImgError(false); }
  }, [item?.id]);

  // Close on backdrop click or Escape
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [item, onClose]);

  if (!item) return null;

  const handleAddToOrder = () => {
    for (let i = 0; i < qty; i++) {
      addItem({ menuItemId: item.id, name: item.name, price: item.price, image_url: item.image_url });
    }
    showToast(`${qty}× ${item.name} added!`, 'success');
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="mly-sheet-backdrop" onClick={onClose} />

      {/* Sheet */}
      <div className="mly-sheet" role="dialog" aria-modal="true">
        {/* Large image */}
        <div className="mly-sheet__hero">
          {item.image_url && !imgError ? (
            <img src={item.image_url} alt={item.name} className="mly-sheet__hero-img" onError={() => setImgError(true)} />
          ) : (
            <div className="mly-sheet__hero-placeholder">🍽️</div>
          )}
          {/* Back button */}
          <button className="mly-sheet__back" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="mly-sheet__content">
          <div className="mly-sheet__title-row">
            <div>
              <div className="mly-sheet__name-line">
                <h2 className="mly-sheet__name">{item.name}</h2>
                <VegDot isVeg={item.is_veg ?? true} />
              </div>
            </div>
            <span className="mly-sheet__price">{formatPrice(item.price)}</span>
          </div>

          {item.description && (
            <>
              <h3 className="mly-sheet__section-title">Description</h3>
              <p className="mly-sheet__desc">{item.description}</p>
            </>
          )}

          {/* Qty stepper */}
          <div className="mly-sheet__qty-row">
            <div className="mly-sheet__qty">
              <button className="mly-sheet__qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
              <span className="mly-sheet__qty-val">{qty}</span>
              <button className="mly-sheet__qty-btn" onClick={() => setQty(q => q + 1)}>+</button>
            </div>
          </div>

          {/* Add to order */}
          {item.is_available ? (
            <button className="mly-sheet__order-btn" onClick={handleAddToOrder}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              Add to Order &nbsp;·&nbsp; {formatPrice(item.price * qty)}
            </button>
          ) : (
            <div className="mly-sheet__unavailable-banner">Currently Unavailable</div>
          )}
        </div>
      </div>
    </>
  );
}

function MlyStyles({ brandColor }: { brandColor: string }) {
  return (
    <style>{`
      /* ── Splash Screen ── */
      .mly-splash {
        position: fixed; inset: 0; z-index: 9999;
        background: #080808;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        padding: 40px 32px 48px;
        overflow: hidden;
        animation: mlySplashIn 0.6s ease both;
      }
      .mly-splash--fading {
        animation: mlySplashOut 0.5s ease forwards;
      }

      /* ── Splash Background Blobs (warm organic iOS-style) ── */
      .mly-splash__blob {
        position: absolute; border-radius: 50%; pointer-events: none; filter: blur(0px);
      }
      /* Top-right large warm flare */
      .mly-splash__blob--1 {
        width: 420px; height: 420px;
        background: radial-gradient(ellipse at center, #c84b0c 0%, #a03808 30%, transparent 70%);
        filter: blur(60px);
        top: -120px; right: -120px;
        opacity: 0.85;
        animation: mlyBlobDrift1 9s ease-in-out infinite alternate;
      }
      /* Bottom-left amber glow */
      .mly-splash__blob--2 {
        width: 380px; height: 380px;
        background: radial-gradient(ellipse at center, #d4620a 0%, #b04a08 35%, transparent 70%);
        filter: blur(70px);
        bottom: -80px; left: -100px;
        opacity: 0.75;
        animation: mlyBlobDrift2 11s ease-in-out infinite alternate;
      }
      /* Center-right secondary warm shape */
      .mly-splash__blob--3 {
        width: 260px; height: 260px;
        background: radial-gradient(ellipse at center, #e8720c 0%, #c45a08 40%, transparent 70%);
        filter: blur(55px);
        top: 38%; right: -60px;
        opacity: 0.5;
        animation: mlyBlobDrift3 13s ease-in-out infinite alternate;
      }
      /* Top-left warm tint */
      .mly-splash__blob--4 {
        width: 300px; height: 300px;
        background: radial-gradient(ellipse at center, #b84208 0%, #8a3006 40%, transparent 70%);
        filter: blur(80px);
        top: -60px; left: -80px;
        opacity: 0.55;
        animation: mlyBlobDrift1 14s ease-in-out infinite alternate-reverse;
      }

      /* Logo glass card */
      .mly-splash__logo-wrap { margin-bottom: 32px; animation: mlySplashItemIn 0.7s 0.2s ease both; }
      .mly-splash__logo-card {
        width: 104px; height: 104px; border-radius: 28px;
        background: rgba(20,16,14,0.75);
        backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
        border: 1.5px solid rgba(255,255,255,0.12);
        box-shadow: 0 12px 48px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 40px rgba(200,75,12,0.25);
        display: flex; align-items: center; justify-content: center;
        overflow: hidden;
      }
      .mly-splash__logo-img { width: 100%; height: 100%; object-fit: cover; }
      .mly-splash__logo-emoji { font-size: 44px; line-height: 1; }

      /* Typography */
      .mly-splash__name {
        font-size: clamp(32px, 8vw, 48px);
        font-weight: 900;
        letter-spacing: -1.5px;
        color: #f2f2f5;
        text-align: center;
        line-height: 1.1;
        margin-bottom: 16px;
        animation: mlySplashItemIn 0.7s 0.3s ease both;
      }
      .mly-splash__tagline {
        font-size: 16px;
        color: rgba(242,242,245,0.55);
        text-align: center;
        line-height: 1.6;
        margin-bottom: 40px;
        animation: mlySplashItemIn 0.7s 0.4s ease both;
      }

      /* Dots */
      .mly-splash__dots {
        display: flex; gap: 8px; margin-bottom: 44px;
        animation: mlySplashItemIn 0.7s 0.5s ease both;
      }
      .mly-splash__dot {
        width: 8px; height: 8px; border-radius: 50%;
        background: rgba(255,255,255,0.2);
        transition: all 0.3s;
      }
      .mly-splash__dot--active {
        width: 24px; border-radius: 4px;
        background: ${brandColor};
        box-shadow: 0 0 10px ${brandColor}88;
      }

      /* CTA */
      .mly-splash__cta {
        display: inline-flex; align-items: center; gap: 8px;
        padding: 16px 36px;
        background: ${brandColor};
        color: #fff;
        font-size: 17px; font-weight: 700;
        border-radius: 999px;
        border: none; cursor: pointer;
        font-family: inherit;
        box-shadow: 0 0 32px ${brandColor}66, 0 8px 24px rgba(0,0,0,0.4);
        transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
        animation: mlySplashItemIn 0.7s 0.55s ease both;
        margin-bottom: 28px;
        width: 100%; max-width: 300px; justify-content: center;
      }
      .mly-splash__cta:hover { transform: translateY(-2px); box-shadow: 0 0 40px ${brandColor}88, 0 12px 28px rgba(0,0,0,0.45); }
      .mly-splash__cta:active { transform: scale(0.97); }

      .mly-splash__footer {
        font-size: 13px;
        color: rgba(255,255,255,0.3);
        text-align: center;
        letter-spacing: 0.5px;
        animation: mlySplashItemIn 0.7s 0.6s ease both;
      }

      /* Menu wrap */
      .mly-menu-wrap { display: contents; }
      .mly-menu-wrap--hidden { display: none; }

      /* ── Main App ── */
      .mly-root { min-height:100dvh; background:#0f0f13; color:#f2f2f5; font-family:'Inter',system-ui,-apple-system,sans-serif; padding-bottom:100px; -webkit-font-smoothing:antialiased; }

      .mly-header { padding:20px 20px 16px; position:sticky; top:0; z-index:100; background:rgba(15,15,19,0.92); backdrop-filter:blur(16px); border-bottom:1px solid rgba(255,255,255,0.06); }
      .mly-header__brand { display:flex; align-items:center; gap:12px; }
      .mly-header__logo { width:44px; height:44px; border-radius:12px; object-fit:cover; border:2px solid rgba(255,255,255,0.1); }
      .mly-header__logo-placeholder { width:44px; height:44px; border-radius:12px; background:#1e1e28; display:flex; align-items:center; justify-content:center; font-size:22px; border:2px solid rgba(255,255,255,0.1); }
      .mly-header__name { font-size:20px; font-weight:800; letter-spacing:-0.5px; color:#f2f2f5; }
      .mly-header__table { font-size:12px; color:${brandColor}; font-weight:600; margin-top:2px; }
      .mly-search-wrap { padding:12px 16px 8px; }
      .mly-search { display:flex; align-items:center; gap:10px; background:#1a1a24; border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:0 16px; height:48px; transition:border-color 0.2s; }
      .mly-search:focus-within { border-color:${brandColor}; }
      .mly-search__icon { color:#666; flex-shrink:0; }
      .mly-search__input { flex:1; background:none; border:none; outline:none; font-size:15px; color:#f2f2f5; font-family:inherit; }
      .mly-search__input::placeholder { color:#555; }
      .mly-search__clear { color:#666; font-size:14px; cursor:pointer; background:none; border:none; padding:0; line-height:1; }
      /* ── Category Tabs — icon+text glassmorphic style ── */
      .mly-tabs { padding:10px 0 4px; }
      .mly-tabs__scroll { display:flex; gap:10px; overflow-x:auto; padding:4px 16px 10px; scrollbar-width:none; scroll-behavior:smooth; }
      .mly-tabs__scroll::-webkit-scrollbar { display:none; }
      .mly-tab {
        flex-shrink:0; min-width:66px; padding:10px 10px 8px;
        border-radius:18px; cursor:pointer; transition:all 0.22s;
        font-family:inherit; white-space:nowrap;
        display:flex; flex-direction:column; align-items:center; gap:6px;
        background:rgba(255,255,255,0.05);
        backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);
        border:1px solid rgba(255,255,255,0.1);
        box-shadow:inset 0 1px 0 rgba(255,255,255,0.07);
        color:#888;
      }
      .mly-tab:hover { background:rgba(255,255,255,0.1); color:#f2f2f5; border-color:rgba(255,255,255,0.22); }
      .mly-tab--active {
        background:rgba(255,255,255,0.1);
        border-color:${brandColor}88;
        box-shadow:0 0 18px ${brandColor}44, inset 0 1px 0 rgba(255,255,255,0.15);
        color:#f2f2f5;
      }
      .mly-tab__icon {
        font-size:22px; line-height:1;
        display:flex; align-items:center; justify-content:center;
        width:40px; height:40px; border-radius:12px;
        background:rgba(255,255,255,0.07);
        transition:background 0.2s;
      }
      .mly-tab--active .mly-tab__icon {
        background:${brandColor};
        box-shadow:0 0 12px ${brandColor}66;
      }
      .mly-tab__label { font-size:11px; font-weight:700; letter-spacing:0.1px; text-align:center; line-height:1.2; max-width:64px; overflow:hidden; text-overflow:ellipsis; }
      .mly-section-header { display:flex; align-items:center; justify-content:space-between; padding:16px 16px 8px; }
      .mly-section-title { font-size:18px; font-weight:700; color:#f2f2f5; letter-spacing:-0.3px; }
      .mly-popular { margin-bottom:4px; }
      .mly-popular__scroll { display:flex; gap:14px; overflow-x:auto; padding:4px 16px 16px; scrollbar-width:none; }
      .mly-popular__scroll::-webkit-scrollbar { display:none; }
      .mly-pop-card { flex-shrink:0; width:150px; background:#1a1a24; border-radius:18px; border:1px solid rgba(255,255,255,0.07); overflow:hidden; transition:transform 0.2s,box-shadow 0.2s; }
      .mly-pop-card:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(0,0,0,0.5); }
      .mly-pop-card__img-wrap { position:relative; height:110px; overflow:hidden; }
      .mly-pop-card__img { width:100%; height:100%; object-fit:cover; transition:transform 0.4s; }
      .mly-pop-card:hover .mly-pop-card__img { transform:scale(1.06); }
      .mly-pop-card__img-placeholder { width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:36px; background:#222230; }
      .mly-pop-card__heart { position:absolute; top:8px; right:8px; width:28px; height:28px; background:rgba(0,0,0,0.55); backdrop-filter:blur(4px); border-radius:50%; display:flex; align-items:center; justify-content:center; border:none; cursor:pointer; color:#fff; transition:background 0.2s; }
      .mly-pop-card__heart:hover { background:rgba(255,255,255,0.15); }
      .mly-pop-card__body { padding:10px 12px 12px; display:flex; flex-direction:column; gap:6px; }
      .mly-pop-card__name { font-size:13px; font-weight:700; color:#f2f2f5; line-height:1.3; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
      .mly-pop-card__price-row { display:flex; align-items:center; justify-content:space-between; gap:4px; }
      .mly-pop-card__price { font-size:13px; font-weight:800; color:${brandColor}; }
      .mly-pop-card__add { width:26px; height:26px; border-radius:50%; background:${brandColor}; color:#fff; font-size:18px; font-weight:700; display:flex; align-items:center; justify-content:center; border:none; cursor:pointer; flex-shrink:0; line-height:1; transition:opacity 0.15s,transform 0.15s; }
      .mly-pop-card__add:hover { opacity:0.85; }
      .mly-pop-card__add:active { transform:scale(0.9); }
      /* Veg/Non-veg dot */
      .mly-veg-dot { display:inline-flex; align-items:center; justify-content:center; width:16px; height:16px; border-radius:3px; border:1.5px solid; flex-shrink:0; }
      .mly-veg-dot span { width:7px; height:7px; border-radius:50%; display:block; }
      .mly-pop-card__price-group { display:flex; align-items:center; gap:5px; }

      /* ── Filter Bar ── */
      .mly-filter-bar { display:flex; align-items:center; justify-content:space-between; padding:6px 16px 6px; gap:8px; }
      .mly-filter-pills { display:flex; gap:6px; overflow-x:auto; scrollbar-width:none; }
      .mly-filter-pills::-webkit-scrollbar { display:none; }
      .mly-filter-pill {
        flex-shrink:0; padding:6px 14px; border-radius:999px; font-size:12px; font-weight:700;
        color:rgba(242,242,245,0.5);
        background:rgba(255,255,255,0.05);
        backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);
        border:1.5px solid rgba(255,255,255,0.08);
        cursor:pointer; transition:all 0.22s; font-family:inherit; white-space:nowrap;
      }
      .mly-filter-pill:hover { color:#f2f2f5; border-color:rgba(255,255,255,0.22); background:rgba(255,255,255,0.09); }
      .mly-filter-pill--active {
        background:${brandColor};
        color:#fff; border-color:transparent;
        box-shadow:0 0 14px ${brandColor}55;
      }

      /* ── View Toggle ── */
      .mly-view-toggle { display:flex; gap:2px; background:rgba(255,255,255,0.05); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); border-radius:10px; padding:3px; flex-shrink:0; border:1px solid rgba(255,255,255,0.08); }
      .mly-view-btn { width:30px; height:30px; border-radius:7px; background:none; border:none; cursor:pointer; color:rgba(242,242,245,0.4); display:flex; align-items:center; justify-content:center; transition:all 0.2s; }
      .mly-view-btn--active { background:rgba(255,255,255,0.14); color:#f2f2f5; }
      .mly-view-btn:hover:not(.mly-view-btn--active) { color:#aaa; }

      /* ── Today's Special ── */
      .mly-special { margin-bottom:4px; }
      .mly-special__star { font-size:16px; }
      .mly-special-card {
        flex-shrink:0; width:200px;
        background:rgba(255,255,255,0.04);
        backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px);
        border-radius:18px; border:1px solid rgba(255,200,50,0.3);
        box-shadow:0 0 20px rgba(255,200,50,0.08), inset 0 1px 0 rgba(255,255,255,0.08);
        overflow:hidden; transition:transform 0.2s,box-shadow 0.2s; cursor:pointer; position:relative;
      }
      .mly-special-card:hover { transform:translateY(-3px); box-shadow:0 8px 28px rgba(255,200,50,0.15); }
      .mly-special-card__badge {
        position:absolute; top:8px; left:8px; z-index:2;
        background:linear-gradient(135deg,#f59e0b,#d97706);
        color:#fff; font-size:10px; font-weight:800; letter-spacing:0.5px;
        padding:3px 8px; border-radius:999px;
        box-shadow:0 2px 8px rgba(245,158,11,0.4);
      }
      .mly-special-card__img-wrap { height:120px; overflow:hidden; position:relative; }
      .mly-special-card__img { width:100%; height:100%; object-fit:cover; transition:transform 0.4s; }
      .mly-special-card:hover .mly-special-card__img { transform:scale(1.06); }
      .mly-special-card__img-placeholder { width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:36px; background:rgba(255,200,50,0.06); }
      .mly-special-card__body { padding:10px 12px 12px; }
      .mly-special-card__name { font-size:13px; font-weight:700; color:#f2f2f5; margin-bottom:4px; line-height:1.3; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
      .mly-special-card__desc { font-size:11px; color:#888; margin-bottom:8px; line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
      .mly-special-card__footer { display:flex; align-items:center; justify-content:space-between; }

      /* ── Popular Cards ── */
      .mly-popular { margin-bottom:4px; }
      .mly-popular__scroll { display:flex; gap:14px; overflow-x:auto; padding:4px 16px 16px; scrollbar-width:none; }
      .mly-popular__scroll::-webkit-scrollbar { display:none; }
      .mly-pop-card {
        flex-shrink:0; width:150px;
        background:rgba(255,255,255,0.04);
        backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px);
        border-radius:18px; border:1px solid rgba(255,255,255,0.1);
        box-shadow:inset 0 1px 0 rgba(255,255,255,0.08);
        overflow:hidden; transition:transform 0.2s,box-shadow 0.2s; cursor:pointer;
      }
      .mly-pop-card:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(0,0,0,0.5); border-color:rgba(255,255,255,0.2); }
      .mly-pop-card__img-wrap { position:relative; height:110px; overflow:hidden; }
      .mly-pop-card__img { width:100%; height:100%; object-fit:cover; transition:transform 0.4s; }
      .mly-pop-card:hover .mly-pop-card__img { transform:scale(1.06); }
      .mly-pop-card__img-placeholder { width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:36px; background:rgba(255,255,255,0.04); }
      .mly-pop-card__heart { position:absolute; top:8px; right:8px; width:28px; height:28px; background:rgba(0,0,0,0.55); backdrop-filter:blur(4px); border-radius:50%; display:flex; align-items:center; justify-content:center; border:none; cursor:pointer; color:#fff; transition:background 0.2s; }
      .mly-pop-card__heart:hover { background:rgba(255,255,255,0.15); }
      .mly-pop-card__body { padding:10px 12px 12px; display:flex; flex-direction:column; gap:6px; }
      .mly-pop-card__name { font-size:13px; font-weight:700; color:#f2f2f5; line-height:1.3; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
      .mly-pop-card__price-row { display:flex; align-items:center; justify-content:space-between; gap:4px; }
      .mly-pop-card__price { font-size:13px; font-weight:800; color:${brandColor}; }
      .mly-pop-card__add { width:26px; height:26px; border-radius:50%; background:${brandColor}; color:#fff; font-size:18px; font-weight:700; display:flex; align-items:center; justify-content:center; border:none; cursor:pointer; flex-shrink:0; line-height:1; transition:opacity 0.15s,transform 0.15s; }
      .mly-pop-card__add:hover { opacity:0.85; }
      .mly-pop-card__add:active { transform:scale(0.9); }

      /* ── List View Items (GLASSMORPHISM) ── */
      .mly-main { padding:0 0 8px; }
      .mly-item-list { display:flex; flex-direction:column; padding:0 16px; gap:10px; }
      .mly-item {
        background:rgba(255,255,255,0.04);
        backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px);
        border-radius:18px;
        border:1px solid rgba(255,255,255,0.1);
        box-shadow:0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08);
        overflow:hidden; animation:mlyFadeIn 0.35s ease both;
        transition:border-color 0.2s, box-shadow 0.2s, transform 0.2s;
        cursor:pointer; position:relative;
      }
      .mly-item:hover { border-color:rgba(255,255,255,0.22); box-shadow:0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12); transform:translateY(-1px); }
      .mly-item:focus-visible { outline:2px solid ${brandColor}; outline-offset:2px; }
      .mly-item--unavailable { opacity:0.42; filter:grayscale(65%); pointer-events:none; }

      /* Special badge on list item */
      .mly-item__special-badge {
        position:absolute; top:0; left:0; right:0;
        background:linear-gradient(90deg,rgba(245,158,11,0.2),transparent);
        border-bottom:1px solid rgba(245,158,11,0.25);
        color:#f59e0b; font-size:11px; font-weight:700; padding:4px 14px;
        letter-spacing:0.4px;
      }
      .mly-item__body { display:flex; gap:14px; padding:14px; align-items:flex-start; }

      /* Thumbnail — LEFT */
      .mly-item__img-wrap { width:88px; height:88px; border-radius:14px; overflow:hidden; flex-shrink:0; box-shadow:0 4px 12px rgba(0,0,0,0.3); }
      .mly-item__img { width:100%; height:100%; object-fit:cover; transition:transform 0.4s; }
      .mly-item:hover .mly-item__img { transform:scale(1.07); }
      .mly-item__img-placeholder { width:88px; height:88px; border-radius:14px; background:rgba(255,255,255,0.06); display:flex; align-items:center; justify-content:center; font-size:30px; flex-shrink:0; }

      /* Info — RIGHT */
      .mly-item__info { flex:1; min-width:0; display:flex; flex-direction:column; }
      .mly-item__top-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:4px; }
      .mly-item__name { font-size:15px; font-weight:700; color:#f2f2f5; line-height:1.3; letter-spacing:-0.2px; margin:0 0 4px; }
      .mly-item__heart { flex-shrink:0; width:28px; height:28px; border-radius:50%; background:rgba(255,255,255,0.06); display:flex; align-items:center; justify-content:center; border:none; cursor:pointer; color:#888; transition:background 0.2s,color 0.2s; }
      .mly-item__heart:hover { background:rgba(255,255,255,0.12); color:#f2f2f5; }
      .mly-item__desc { font-size:12px; color:rgba(242,242,245,0.55); line-height:1.5; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; margin:0 0 8px; }
      .mly-item__footer { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-top:auto; }
      .mly-item__price { font-size:16px; font-weight:800; color:${brandColor}; }
      .mly-item__unavailable { font-size:11px; color:#666; font-weight:500; }
      .mly-item__add { width:32px; height:32px; border-radius:50%; background:${brandColor}; color:#fff; font-size:22px; font-weight:700; display:flex; align-items:center; justify-content:center; border:none; cursor:pointer; flex-shrink:0; line-height:1; transition:opacity 0.15s,transform 0.15s,background 0.2s; box-shadow:0 0 12px ${brandColor}44; }
      .mly-item__add:hover { opacity:0.85; }
      .mly-item__add:active { transform:scale(0.9); }
      .mly-item__add--added { background:#22c55e; font-size:16px; animation:mlyPop 0.4s ease; }

      /* ── Grid View Items ── */
      .mly-item-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; padding:0 16px; }
      .mly-grid-card {
        background:rgba(255,255,255,0.04);
        backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px);
        border-radius:18px; border:1px solid rgba(255,255,255,0.1);
        box-shadow:0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08);
        overflow:hidden; cursor:pointer; position:relative;
        transition:border-color 0.2s, box-shadow 0.2s, transform 0.2s;
        animation:mlyFadeIn 0.35s ease both;
      }
      .mly-grid-card:hover { transform:translateY(-3px); border-color:rgba(255,255,255,0.22); box-shadow:0 10px 28px rgba(0,0,0,0.4); }
      .mly-grid-card__img-wrap { height:130px; overflow:hidden; position:relative; }
      .mly-grid-card__img { width:100%; height:100%; object-fit:cover; transition:transform 0.4s; }
      .mly-grid-card:hover .mly-grid-card__img { transform:scale(1.07); }
      .mly-grid-card__img-placeholder { width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:36px; background:rgba(255,255,255,0.04); }
      .mly-grid-card__special { position:absolute; top:8px; left:8px; background:linear-gradient(135deg,#f59e0b,#d97706); color:#fff; font-size:13px; border-radius:50%; width:22px; height:22px; display:flex; align-items:center; justify-content:center; }
      .mly-grid-card__body { padding:10px 12px 12px; }
      .mly-grid-card__name { font-size:13px; font-weight:700; color:#f2f2f5; margin-bottom:8px; line-height:1.3; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
      .mly-grid-card__footer { display:flex; align-items:center; justify-content:space-between; gap:4px; }

      .mly-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; padding:60px 20px; color:#555; font-size:15px; text-align:center; }

      /* ── Item Detail Sheet ── */
      .mly-sheet-backdrop {
        position:fixed; inset:0; z-index:1000;
        background:rgba(0,0,0,0.65); backdrop-filter:blur(6px);
        animation:mlyFadeIn 0.25s ease;
      }
      .mly-sheet {
        position:fixed; bottom:0; left:0; right:0; z-index:1001;
        background:#13131a;
        border-radius:28px 28px 0 0;
        max-height:92dvh;
        overflow-y:auto;
        overflow-x:hidden;
        scrollbar-width:none;
        animation:mlySheetUp 0.35s cubic-bezier(0.32,0.72,0,1);
        box-shadow:0 -4px 40px rgba(0,0,0,0.7);
      }
      .mly-sheet::-webkit-scrollbar { display:none; }

      /* Hero image */
      .mly-sheet__hero { position:relative; height:260px; overflow:hidden; background:#0f0f13; }
      .mly-sheet__hero-img { width:100%; height:100%; object-fit:cover; display:block; }
      .mly-sheet__hero-placeholder { width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:72px; background:linear-gradient(135deg,#1a1a24,#0f0f13); }

      /* Back & fav buttons on image */
      .mly-sheet__back {
        position:absolute; top:16px; left:16px;
        width:38px; height:38px; border-radius:50%;
        background:rgba(0,0,0,0.55); backdrop-filter:blur(8px);
        border:1px solid rgba(255,255,255,0.12);
        display:flex; align-items:center; justify-content:center;
        color:#fff; cursor:pointer; transition:background 0.2s;
      }
      .mly-sheet__back:hover { background:rgba(255,255,255,0.15); }
      .mly-sheet__fav {
        position:absolute; top:16px; right:16px;
        width:38px; height:38px; border-radius:50%;
        background:rgba(0,0,0,0.55); backdrop-filter:blur(8px);
        border:1px solid rgba(255,255,255,0.12);
        display:flex; align-items:center; justify-content:center;
        color:#fff; cursor:pointer; transition:background 0.2s;
      }
      .mly-sheet__fav:hover { background:rgba(255,255,255,0.15); }

      /* Content area */
      .mly-sheet__content { padding:20px 20px 40px; }
      .mly-sheet__title-row { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:16px; }
      .mly-sheet__name-line { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
      .mly-sheet__name { font-size:22px; font-weight:800; color:#f2f2f5; letter-spacing:-0.4px; margin:0; line-height:1.2; }
      .mly-sheet__price { font-size:22px; font-weight:900; color:${brandColor}; white-space:nowrap; }
      .mly-sheet__section-title { font-size:14px; font-weight:700; color:#888; text-transform:uppercase; letter-spacing:0.8px; margin:0 0 8px; }
      .mly-sheet__desc { font-size:14px; color:rgba(242,242,245,0.7); line-height:1.65; margin:0 0 20px; }

      /* Quantity stepper */
      .mly-sheet__qty-row { display:flex; align-items:center; justify-content:center; margin:8px 0 24px; }
      .mly-sheet__qty { display:flex; align-items:center; gap:0; background:#1a1a24; border-radius:999px; border:1px solid rgba(255,255,255,0.1); overflow:hidden; }
      .mly-sheet__qty-btn { width:48px; height:48px; background:none; border:none; color:#f2f2f5; font-size:22px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background 0.2s; font-family:inherit; }
      .mly-sheet__qty-btn:hover { background:rgba(255,255,255,0.08); }
      .mly-sheet__qty-btn:active { background:rgba(255,255,255,0.14); }
      .mly-sheet__qty-val { min-width:44px; text-align:center; font-size:18px; font-weight:800; color:#f2f2f5; }

      /* Add to order button */
      .mly-sheet__order-btn {
        width:100%; padding:17px 24px;
        background:${brandColor};
        color:#fff; font-size:16px; font-weight:800;
        border-radius:18px; border:none; cursor:pointer;
        display:flex; align-items:center; justify-content:center; gap:10px;
        font-family:inherit;
        box-shadow:0 0 28px ${brandColor}55, 0 6px 20px rgba(0,0,0,0.35);
        transition:transform 0.2s, box-shadow 0.2s, opacity 0.2s;
      }
      .mly-sheet__order-btn:hover { transform:translateY(-2px); box-shadow:0 0 36px ${brandColor}77, 0 10px 24px rgba(0,0,0,0.4); }
      .mly-sheet__order-btn:active { transform:scale(0.98); opacity:0.9; }
      .mly-sheet__unavailable-banner { width:100%; padding:16px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:14px; text-align:center; font-size:14px; color:#666; }

      @keyframes mlyFadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
      @keyframes mlyPop { 0%{transform:scale(1)} 50%{transform:scale(1.35)} 100%{transform:scale(1)} }
      @keyframes mlySheetUp { from{transform:translateY(100%)} to{transform:translateY(0)} }

      /* Splash animations */
      @keyframes mlySplashIn { from{opacity:0} to{opacity:1} }
      @keyframes mlySplashOut { from{opacity:1;transform:scale(1)} to{opacity:0;transform:scale(1.03)} }
      @keyframes mlySplashItemIn { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
      @keyframes mlyBlobDrift1 { from{transform:translate(0,0) scale(1)} to{transform:translate(-40px,30px) scale(1.15)} }
      @keyframes mlyBlobDrift2 { from{transform:translate(0,0) scale(1)} to{transform:translate(30px,-25px) scale(0.9)} }
      @keyframes mlyBlobDrift3 { from{transform:translate(-50%,-50%) scale(0.8)} to{transform:translate(-50%,-50%) scale(1.2)} }
    `}</style>
  );
}
