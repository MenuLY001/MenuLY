'use client';
import { useState } from 'react';
import type { MenuItem } from './types';
import { fmt } from './helpers';
import { Plus } from 'lucide-react';
import { VegDot } from './VegDot';

export function SpecialCard({ item, brand, onOpen }: { item: MenuItem; brand: string; onOpen: (i: MenuItem) => void }) {
  const [imgError, setImgError] = useState(false);
  return (
    <div className={`mly-special-card${!item.is_available ? ' mly-special-card--soldout' : ''}`} onClick={() => item.is_available && onOpen(item)} role="button" tabIndex={0}>
      <div className="mly-special-card__img-wrap">
        {item.image_url && !imgError
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={item.image_url} alt={item.name} className="mly-special-card__img" onError={() => setImgError(true)} loading="lazy" />
          : <div className="mly-special-card__img-placeholder">⭐</div>
        }
        {!item.is_available && <div className="mly-soldout-overlay">Sold Out</div>}
      </div>
      <div className="mly-special-card__body">
        <div className="mly-special-card__name">{item.name}</div>
        {item.description && <div className="mly-special-card__desc">{item.description}</div>}
        <div className="mly-special-card__footer">
          <div className="mly-pop-card__price-group">
            <VegDot isVeg={item.is_veg} />
            <span className="mly-pop-card__price">{fmt(item.price)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PopularCard({ item, brand, onOpen }: { item: MenuItem; brand: string; onOpen: (i: MenuItem) => void }) {
  const [imgError, setImgError] = useState(false);
  return (
    <div className={`mly-pop-card${!item.is_available ? ' mly-pop-card--soldout' : ''}`} onClick={() => item.is_available && onOpen(item)} role="button" tabIndex={0}>
      <div className="mly-pop-card__img-wrap">
        {item.image_url && !imgError
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={item.image_url} alt={item.name} className="mly-pop-card__img" onError={() => setImgError(true)} loading="lazy" />
          : <div className="mly-pop-card__img-placeholder">🍽️</div>
        }
        {!item.is_available && <div className="mly-soldout-overlay">Sold Out</div>}
      </div>
      <div className="mly-pop-card__body">
        <div className="mly-pop-card__name">{item.name}</div>
        <div className="mly-pop-card__price-row">
          <div className="mly-pop-card__price-group">
            <VegDot isVeg={item.is_veg} />
            <span className="mly-pop-card__price">{fmt(item.price)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ItemRow({ item, brand, onOpen }: { item: MenuItem; brand: string; onOpen: (i: MenuItem) => void }) {
  const [imgError, setImgError] = useState(false);
  return (
    <div className={`mly-item${!item.is_available ? ' mly-item--unavailable' : ''}`} onClick={() => onOpen(item)} role="button" tabIndex={0}>
      <div className="mly-item__body">
        <div className="mly-item__img-wrap">
          {item.image_url && !imgError
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={item.image_url} alt={item.name} className="mly-item__img" loading="lazy" onError={() => setImgError(true)} />
            : <div className="mly-item__img-placeholder">🍽️</div>
          }
          {!item.is_available && <div className="mly-soldout-overlay mly-soldout-overlay--small">Sold Out</div>}
        </div>
        <div className="mly-item__info">
          <div className="mly-item__top-row"><VegDot isVeg={item.is_veg} /></div>
          <h3 className="mly-item__name">{item.name}</h3>
          {item.description && <p className="mly-item__desc">{item.description}</p>}
          <div className="mly-item__footer">
            <span className="mly-item__price">{fmt(item.price)}</span>
            {item.is_available
              ? <button className="mly-item__add" style={{ background: brand, boxShadow: `0 0 12px ${brand}44` }} onClick={e => { e.stopPropagation(); onOpen(item); }}><Plus size={20} strokeWidth={3} /></button>
              : <span className="mly-item__unavailable">Sold Out</span>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

export function ItemGridCard({ item, brand, onOpen }: { item: MenuItem; brand: string; onOpen: (i: MenuItem) => void }) {
  const [imgError, setImgError] = useState(false);
  return (
    <div className={`mly-grid-card${!item.is_available ? ' mly-item--unavailable' : ''}`} onClick={() => onOpen(item)} role="button" tabIndex={0}>
      <div className="mly-grid-card__img-wrap">
        {item.image_url && !imgError
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={item.image_url} alt={item.name} className="mly-grid-card__img" loading="lazy" onError={() => setImgError(true)} />
          : <div className="mly-grid-card__img-placeholder">🍽️</div>
        }
        {item.is_special && <div className="mly-grid-card__special">⭐</div>}
      </div>
      <div className="mly-grid-card__body">
        <div className="mly-grid-card__name">{item.name}</div>
        <div className="mly-grid-card__footer">
          <div className="mly-pop-card__price-group">
            <VegDot isVeg={item.is_veg} />
            <span className="mly-pop-card__price" style={{ color: brand }}>{fmt(item.price)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
