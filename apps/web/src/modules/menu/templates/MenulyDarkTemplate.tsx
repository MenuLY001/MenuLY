import React, { useState, useEffect } from 'react';
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
  const [cartOpen, setCartOpen] = useState(false);
  const [waiterCart, setWaiterCart] = useState<CartState | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCatId, setActiveCatId] = useState<string>(
    data.categories[0]?.id ?? ''
  );

  const handleShowToWaiter = async (c: CartState) => {
    const strategy = getFulfillmentStrategy(data.restaurant.ordering_enabled);
    const result = await strategy.submit(c);
    if (result.success) {
      setCartOpen(false);
      setWaiterCart(result.data);
    }
  };

  const allItems = data.categories.flatMap((c) => c.items);

  const filteredCategories = searchQuery.trim()
    ? [{
        id: '__search__',
        name: 'Search Results',
        sort_order: 0,
        restaurant_id: data.restaurant.id,
        items: allItems.filter(
          (it) =>
            it.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (it.description ?? '').toLowerCase().includes(searchQuery.toLowerCase())
        ),
      }]
    : data.categories;

  useEffect(() => {
    if (!searchQuery && !filteredCategories.find((c) => c.id === activeCatId)) {
      setActiveCatId(filteredCategories[0]?.id ?? '');
    }
  }, [searchQuery]);

  const activeCategory =
    filteredCategories.find((c) => c.id === activeCatId) ?? filteredCategories[0];

  return (
    <div className="mly-root">
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
            {data.categories.map((cat) => (
              <button
                key={cat.id}
                className={`mly-tab ${cat.id === activeCatId ? 'mly-tab--active' : ''}`}
                onClick={() => setActiveCatId(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </nav>
      )}

      {!searchQuery && activeCatId === data.categories[0]?.id && (
        <PopularSection items={allItems.slice(0, 4)} />
      )}

      <main className="mly-main">
        {searchQuery ? (
          filteredCategories[0]?.items.length === 0 ? (
            <div className="mly-empty">
              <div style={{ fontSize: 48 }}>🔍</div>
              <p>No dishes found for "{searchQuery}"</p>
            </div>
          ) : (
            <ItemList items={filteredCategories[0]?.items ?? []} />
          )
        ) : (
          activeCategory && (
            <div>
              <div className="mly-section-header">
                <h2 className="mly-section-title">{activeCategory.name}</h2>
              </div>
              <ItemList items={activeCategory.items} />
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

      <MlyStyles brandColor={data.restaurant.theme_color} />
    </div>
  );
}

function PopularSection({ items }: { items: MenuItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mly-popular">
      <div className="mly-section-header">
        <h2 className="mly-section-title">Popular Today</h2>
      </div>
      <div className="mly-popular__scroll">
        {items.map((item) => (
          <PopularCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function PopularCard({ item }: { item: MenuItem }) {
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [imgError, setImgError] = useState(false);

  const handleAdd = () => {
    addItem({ menuItemId: item.id, name: item.name, price: item.price, image_url: item.image_url });
    showToast(`Added ${item.name}`, 'success');
  };

  return (
    <div className="mly-pop-card">
      <div className="mly-pop-card__img-wrap">
        {item.image_url && !imgError ? (
          <img src={item.image_url} alt={item.name} className="mly-pop-card__img" onError={() => setImgError(true)} loading="lazy" />
        ) : (
          <div className="mly-pop-card__img-placeholder">🍽️</div>
        )}
        <button className="mly-pop-card__heart" aria-label="Favourite">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>
      <div className="mly-pop-card__body">
        <div className="mly-pop-card__name">{item.name}</div>
        <div className="mly-pop-card__price-row">
          <span className="mly-pop-card__price">{formatPrice(item.price)}</span>
          {item.is_available && (
            <button className="mly-pop-card__add" onClick={handleAdd} aria-label={`Add ${item.name}`}>+</button>
          )}
        </div>
      </div>
    </div>
  );
}

function ItemList({ items }: { items: MenuItem[] }) {
  if (items.length === 0) {
    return (
      <div className="mly-empty">
        <div style={{ fontSize: 48 }}>🍽️</div>
        <p>No items available</p>
      </div>
    );
  }
  return (
    <div className="mly-item-list">
      {items.map((item) => (
        <ItemRow key={item.id} item={item} />
      ))}
    </div>
  );
}

function ItemRow({ item }: { item: MenuItem }) {
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [imgError, setImgError] = useState(false);
  const [adding, setAdding] = useState(false);

  const handleAdd = () => {
    if (!item.is_available) return;
    addItem({ menuItemId: item.id, name: item.name, price: item.price, image_url: item.image_url });
    showToast(`Added ${item.name}`, 'success');
    setAdding(true);
    setTimeout(() => setAdding(false), 600);
  };

  return (
    <div className={`mly-item ${!item.is_available ? 'mly-item--unavailable' : ''}`}>
      <div className="mly-item__body">
        <div className="mly-item__info">
          <div className="mly-item__name-row">
            <h3 className="mly-item__name">{item.name}</h3>
            <button className="mly-item__heart" aria-label="Favourite">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          </div>
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
        {item.image_url && !imgError ? (
          <div className="mly-item__img-wrap">
            <img
              src={item.image_url}
              alt={item.name}
              className="mly-item__img"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          </div>
        ) : (
          <div className="mly-item__img-placeholder">🍽️</div>
        )}
      </div>
    </div>
  );
}

function MlyStyles({ brandColor }: { brandColor: string }) {
  return (
    <style>{`
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
      .mly-tabs { padding:8px 0 4px; }
      .mly-tabs__scroll { display:flex; gap:8px; overflow-x:auto; padding:4px 16px 8px; scrollbar-width:none; scroll-behavior:smooth; }
      .mly-tabs__scroll::-webkit-scrollbar { display:none; }
      .mly-tab { flex-shrink:0; padding:8px 18px; border-radius:999px; font-size:13px; font-weight:600; color:#888; background:#1a1a24; border:1px solid rgba(255,255,255,0.07); cursor:pointer; transition:all 0.2s; font-family:inherit; white-space:nowrap; }
      .mly-tab:hover { color:#f2f2f5; border-color:rgba(255,255,255,0.2); }
      .mly-tab--active { background:${brandColor}; color:#fff; border-color:transparent; box-shadow:0 0 16px ${brandColor}55; }
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
      .mly-main { padding:0 0 8px; }
      .mly-item-list { display:flex; flex-direction:column; padding:0 16px; }
      .mly-item { background:#1a1a24; border-radius:16px; margin-bottom:12px; border:1px solid rgba(255,255,255,0.06); overflow:hidden; animation:mlyFadeIn 0.35s ease both; transition:border-color 0.2s; }
      .mly-item:hover { border-color:rgba(255,255,255,0.14); }
      .mly-item--unavailable { opacity:0.45; filter:grayscale(70%); pointer-events:none; }
      .mly-item__body { display:flex; gap:12px; padding:14px; align-items:center; }
      .mly-item__info { flex:1; min-width:0; }
      .mly-item__name-row { display:flex; align-items:flex-start; justify-content:space-between; gap:8px; }
      .mly-item__name { font-size:15px; font-weight:700; color:#f2f2f5; line-height:1.3; letter-spacing:-0.2px; }
      .mly-item__heart { flex-shrink:0; width:28px; height:28px; border-radius:50%; background:rgba(255,255,255,0.06); display:flex; align-items:center; justify-content:center; border:none; cursor:pointer; color:#888; transition:background 0.2s,color 0.2s; }
      .mly-item__heart:hover { background:rgba(255,255,255,0.12); color:#f2f2f5; }
      .mly-item__desc { font-size:12px; color:#888; margin-top:4px; line-height:1.5; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
      .mly-item__footer { display:flex; align-items:center; justify-content:space-between; margin-top:10px; gap:8px; }
      .mly-item__price { font-size:16px; font-weight:800; color:${brandColor}; }
      .mly-item__unavailable { font-size:11px; color:#666; font-weight:500; }
      .mly-item__add { width:32px; height:32px; border-radius:50%; background:${brandColor}; color:#fff; font-size:22px; font-weight:700; display:flex; align-items:center; justify-content:center; border:none; cursor:pointer; flex-shrink:0; line-height:1; transition:opacity 0.15s,transform 0.15s,background 0.2s; box-shadow:0 0 12px ${brandColor}44; }
      .mly-item__add:hover { opacity:0.85; }
      .mly-item__add:active { transform:scale(0.9); }
      .mly-item__add--added { background:#22c55e; font-size:16px; animation:mlyPop 0.4s ease; }
      .mly-item__img-wrap { width:88px; height:88px; border-radius:14px; overflow:hidden; flex-shrink:0; }
      .mly-item__img { width:100%; height:100%; object-fit:cover; transition:transform 0.4s; }
      .mly-item:hover .mly-item__img { transform:scale(1.06); }
      .mly-item__img-placeholder { width:88px; height:88px; border-radius:14px; background:#222230; display:flex; align-items:center; justify-content:center; font-size:30px; flex-shrink:0; }
      .mly-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; padding:60px 20px; color:#555; font-size:15px; text-align:center; }
      @keyframes mlyFadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
      @keyframes mlyPop { 0%{transform:scale(1)} 50%{transform:scale(1.35)} 100%{transform:scale(1)} }
    `}</style>
  );
}
