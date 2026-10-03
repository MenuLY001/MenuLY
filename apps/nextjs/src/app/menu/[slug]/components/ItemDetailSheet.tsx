'use client';
import { useState, useEffect, useRef } from 'react';
import type { MenuItem } from './types';
import { fmt } from './helpers';
import { VegDot } from './VegDot';

export function ItemDetailSheet({ item, brand, onClose }: { item: MenuItem | null; brand: string; onClose: () => void }) {
  const [qty, setQty] = useState(1);
  const [imgError, setImgError] = useState(false);
  const prevItemId = useRef<string | undefined>(undefined);

  // Reset qty/imgError when a new item opens — use ref to detect id change without an effect
  if (item?.id !== prevItemId.current) {
    prevItemId.current = item?.id;
    if (item) { setQty(1); setImgError(false); }
  }
  useEffect(() => {
    if (!item) return;
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    
    return () => { 
      document.removeEventListener('keydown', fn); 
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo({ top: scrollY, behavior: 'instant' });
    };
  }, [item, onClose]);

  if (!item) return null;

  return (
    <>
      <div className="mly-sheet-backdrop" onClick={onClose} />
      <div className="mly-sheet" role="dialog" aria-modal="true">
        <div className="mly-sheet__hero">
          {item.image_url && !imgError
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={item.image_url} alt={item.name} className="mly-sheet__hero-img" onError={() => setImgError(true)} />
            : <div className="mly-sheet__hero-placeholder">🍽️</div>
          }
          <button className="mly-sheet__back" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>
        <div className="mly-sheet__content">
          <div className="mly-sheet__title-row">
            <div>
              <div className="mly-sheet__name-line">
                <h2 className="mly-sheet__name">{item.name}</h2>
                <VegDot isVeg={item.is_veg} />
              </div>
            </div>
            <span className="mly-sheet__price" style={{ color: brand }}>{fmt(item.price)}</span>
          </div>
          {item.description && (
            <>
              <h3 className="mly-sheet__section-title">Description</h3>
              <p className="mly-sheet__desc">{item.description}</p>
            </>
          )}
          <div className="mly-sheet__qty-row">
            <div className="mly-sheet__qty">
              <button className="mly-sheet__qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
              <span className="mly-sheet__qty-val">{qty}</span>
              <button className="mly-sheet__qty-btn" onClick={() => setQty(q => q + 1)}>+</button>
            </div>
          </div>
          {item.is_available
            ? <button className="mly-sheet__order-btn" style={{ background: brand, boxShadow: `0 0 28px ${brand}55,0 6px 20px rgba(0,0,0,.35)` }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                Add to Order · {fmt(item.price * qty)}
              </button>
            : <div className="mly-sheet__unavailable-banner">Currently Unavailable</div>
          }
        </div>
      </div>
    </>
  );
}
