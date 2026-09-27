import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useMenu } from './useMenu';
import { useTable } from '../table/useTable';
import { CartProvider, useCart } from '../cart/CartContext';
import { CartBadge } from '../cart/CartBadge';
import { CartDrawer } from '../cart/CartDrawer';
import { WaiterDisplay } from '../fulfillment/WaiterDisplay';
import { CategorySection } from './CategorySection';
import { ToastProvider } from '../../components/ToastContext';
import { MenuSkeleton } from '../../components/SkeletonLoader';
import { getFulfillmentStrategy } from '../fulfillment/strategy';
import { CartState, PublicMenuResponse } from '@qr-menu/types';

/**
 * MenuPage — public customer-facing menu page.
 * Fetches restaurant data by slug (no auth), then mounts CartProvider
 * and ToastProvider once data is available.
 *
 * Two-pass render:
 *   1. Load + skeleton (no CartProvider)
 *   2. Data ready → mount providers + MenuPageInner
 */
export function MenuPage() {
  const { slug } = useParams<{ slug: string }>();
  const tableNo = useTable();
  const { data, loading, error, notFound } = useMenu(slug!);
  const [cartOpen, setCartOpen] = useState(false);
  const [waiterCart, setWaiterCart] = useState<CartState | null>(null);

  // Apply per-restaurant brand color as CSS custom property
  useEffect(() => {
    if (data?.restaurant.theme_color) {
      document.documentElement.style.setProperty('--brand', data.restaurant.theme_color);
    }
    return () => { document.documentElement.style.removeProperty('--brand'); };
  }, [data?.restaurant.theme_color]);

  useEffect(() => {
    if (data?.restaurant.name) {
      document.title = `${data.restaurant.name} — Menu`;
    }
    return () => { document.title = 'QR Menu Platform'; };
  }, [data?.restaurant.name]);

  const handleShowToWaiter = async (cart: CartState) => {
    const strategy = getFulfillmentStrategy(data?.restaurant.ordering_enabled ?? false);
    const result = await strategy.submit(cart);
    if (result.success) {
      setCartOpen(false);
      setWaiterCart(result.data);
    }
  };

  if (notFound) {
    return (
      <div className="menu-error">
        <div className="menu-error__icon">🍽️</div>
        <h1 className="menu-error__title">Restaurant Not Found</h1>
        <p className="menu-error__msg">This QR code may be outdated or incorrect.</p>
        <style>{`.menu-error{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:80dvh;padding:40px 20px;text-align:center;gap:12px;}.menu-error__icon{font-size:64px;}.menu-error__title{font-size:24px;font-weight:700;color:var(--text-primary);}.menu-error__msg{color:var(--text-secondary);font-size:16px;}`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="menu-error">
        <div className="menu-error__icon">⚠️</div>
        <h1 className="menu-error__title">Something went wrong</h1>
        <p className="menu-error__msg">{error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{ marginTop: 16, padding: '12px 24px', background: 'var(--brand)', color: 'var(--brand-text)', borderRadius: 999, fontFamily: 'inherit', fontWeight: 700, fontSize: 15 }}
        >
          Try Again
        </button>
        <style>{`.menu-error{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:80dvh;padding:40px 20px;text-align:center;gap:12px;}.menu-error__icon{font-size:64px;}.menu-error__title{font-size:24px;font-weight:700;color:var(--text-primary);}.menu-error__msg{color:var(--text-secondary);font-size:16px;}`}</style>
      </div>
    );
  }

  // Skeleton while loading — no CartProvider yet
  if (loading || !data) {
    return (
      <div className="menu-page" style={{ paddingBottom: 100 }}>
        <header style={{ padding: '48px 20px 36px', textAlign: 'center' }}>
          <div className="skeleton" style={{ width: 80, height: 80, borderRadius: '50%', margin: '0 auto 16px' }} />
          <div className="skeleton" style={{ width: 200, height: 28, margin: '0 auto 8px' }} />
          <div className="skeleton" style={{ width: 100, height: 18, margin: '0 auto' }} />
        </header>
        <main style={{ padding: '24px 0' }}>
          <MenuSkeleton />
        </main>
      </div>
    );
  }

  return (
    <ToastProvider>
      <CartProvider
        restaurantId={data.restaurant.id}
        restaurantName={data.restaurant.name}
        tableNo={tableNo}
      >
        <MenuPageInner
          data={data}
          tableNo={tableNo}
          cartOpen={cartOpen}
          setCartOpen={setCartOpen}
          waiterCart={waiterCart}
          setWaiterCart={setWaiterCart}
          onShowToWaiter={handleShowToWaiter}
        />
      </CartProvider>
    </ToastProvider>
  );
}

// Inner component — lives inside CartProvider so can use useCart()
function MenuPageInner({
  data,
  tableNo,
  cartOpen,
  setCartOpen,
  waiterCart,
  setWaiterCart,
  onShowToWaiter,
}: {
  data: PublicMenuResponse;
  tableNo: string | null;
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  waiterCart: CartState | null;
  setWaiterCart: (v: CartState | null) => void;
  onShowToWaiter: (cart: CartState) => Promise<void>;
}) {
  const { cart } = useCart();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Sync theme with body class for global background color change
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
    return () => document.body.classList.remove('light-mode');
  }, [theme]);

  return (
    <div className={`menu-page ${theme === 'light' ? 'light-mode' : ''}`}>
      {/* Hero Header */}
      <header className="menu-hero">
        <div className="menu-hero__bg" aria-hidden="true" />
        
        {/* Controls Toolbar */}
        <div className="menu-hero__controls">
          <div className="menu-hero__controls-group">
            <button 
              className={`menu-hero__btn ${viewMode === 'list' ? 'menu-hero__btn--active' : ''}`}
              onClick={() => setViewMode('list')}
              aria-label="List View"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            </button>
            <button 
              className={`menu-hero__btn ${viewMode === 'grid' ? 'menu-hero__btn--active' : ''}`}
              onClick={() => setViewMode('grid')}
              aria-label="Grid View"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            </button>
          </div>
          <div className="menu-hero__controls-group">
            <button 
              className="menu-hero__btn"
              onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
              )}
            </button>
          </div>
        </div>

        <div className="menu-hero__content">
          {data.restaurant.logo_url && (
            <img
              src={data.restaurant.logo_url}
              alt={`${data.restaurant.name} logo`}
              className="menu-hero__logo"
            />
          )}
          <h1 className="menu-hero__name">{data.restaurant.name}</h1>
          {tableNo && (
            <div className="menu-hero__table">Table {tableNo}</div>
          )}
        </div>
      </header>

      {/* Category Nav */}
      {data.categories.length > 1 && (
        <nav className="cat-nav" aria-label="Menu categories">
          <div className="cat-nav__scroll">
            {data.categories.map((cat) => (
              <a key={cat.id} href={`#cat-${cat.id}`} className="cat-nav__pill">
                {cat.name}
              </a>
            ))}
          </div>
        </nav>
      )}

      {/* Menu Body */}
      <main className="menu-body">
        <div className="menu-categories">
          {data.categories.map((cat) => (
            <CategorySection key={cat.id} category={cat} viewMode={viewMode} />
          ))}
        </div>
      </main>

      {/* Cart — CartBadge reads from CartContext */}
      <CartBadge onClick={() => setCartOpen(true)} />
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onShowToWaiter={() => onShowToWaiter(cart)}
      />

      {/* Waiter Display — full-screen overlay */}
      {waiterCart && (
        <WaiterDisplay
          cart={waiterCart}
          onDone={() => setWaiterCart(null)}
        />
      )}

      <style>{`
        .menu-page { min-height: 100dvh; padding-bottom: 100px; background: var(--bg-base); transition: background var(--transition-base); }
        .menu-hero { position: relative; padding: 48px 20px 36px; text-align: center; overflow: hidden; }
        .menu-hero__bg { position: absolute; inset: 0; background: radial-gradient(ellipse at center top, color-mix(in srgb, var(--brand) 20%, transparent), transparent 70%); pointer-events: none; }
        
        .menu-hero__controls { position: absolute; top: 16px; right: 16px; left: 16px; display: flex; justify-content: space-between; align-items: center; z-index: 10; }
        .menu-hero__controls-group { display: flex; gap: 8px; background: var(--bg-surface); padding: 4px; border-radius: 999px; border: 1px solid var(--border); box-shadow: var(--shadow-sm); }
        .menu-hero__btn { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); transition: all 150ms ease; }
        .menu-hero__btn:hover { color: var(--text-primary); background: var(--bg-elevated); }
        .menu-hero__btn--active { background: color-mix(in srgb, var(--brand) 15%, transparent); color: var(--brand); }
        .menu-hero__btn--active:hover { background: color-mix(in srgb, var(--brand) 20%, transparent); color: var(--brand); }

        .menu-hero__content { position: relative; display: flex; flex-direction: column; align-items: center; gap: 8px; margin-top: 16px; }
        .menu-hero__logo { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid var(--border-strong); box-shadow: var(--shadow-md); }
        .menu-hero__name { font-family: var(--font-serif); font-size: 28px; font-weight: 700; color: var(--text-primary); line-height: 1.2; }
        .menu-hero__table { font-size: 14px; font-weight: 600; color: var(--brand); background: color-mix(in srgb, var(--brand) 15%, transparent); padding: 4px 12px; border-radius: 9999px; }
        .cat-nav { position: sticky; top: 0; z-index: 50; background: color-mix(in srgb, var(--bg-base) 92%, transparent); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); padding: 10px 0; }
        .cat-nav__scroll { display: flex; gap: 8px; overflow-x: auto; padding: 0 16px; scroll-snap-type: x mandatory; scroll-behavior: smooth; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
        .cat-nav__scroll::-webkit-scrollbar { display: none; }
        .cat-nav__pill { flex-shrink: 0; scroll-snap-align: start; padding: 7px 16px; border-radius: 9999px; background: var(--bg-elevated); border: 1px solid var(--border); font-size: 13px; font-weight: 600; color: var(--text-secondary); transition: all 150ms ease; white-space: nowrap; }
        .cat-nav__pill:hover { background: color-mix(in srgb, var(--brand) 15%, transparent); color: var(--brand); border-color: var(--brand); }
        .menu-body { padding: 24px 0; }
        .menu-categories { display: flex; flex-direction: column; gap: 32px; }
      `}</style>
    </div>
  );
}
