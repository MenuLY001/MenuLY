import React, { useState } from 'react';
import { MenuItem } from '@qr-menu/types';
import { useCart } from '../cart/CartContext';
import { useToast } from '../../components/ToastContext';
import { formatPrice } from '../../lib/format';

interface MenuItemCardProps {
  item: MenuItem;
  viewMode: 'list' | 'grid';
}

export function MenuItemCard({ item, viewMode }: MenuItemCardProps) {
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [imgError, setImgError] = useState(false);
  const [adding, setAdding] = useState(false);

  const handleAdd = () => {
    addItem({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      image_url: item.image_url,
    });
    setAdding(true);
    showToast(`Added ${item.name}`, 'success');
    setTimeout(() => setAdding(false), 600);
  };

  return (
    <div className={`menu-item-card menu-item-card--${viewMode} ${!item.is_available ? 'unavailable' : ''}`}>
      {item.image_url && !imgError ? (
        <div className="menu-item-card__img-wrap">
          <img
            src={item.image_url}
            alt={item.name}
            className="menu-item-card__img"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        </div>
      ) : null}
      <div className="menu-item-card__body">
        <div className="menu-item-card__info">
          <h3 className="menu-item-card__name">{item.name}</h3>
          {item.description && (
            <p className="menu-item-card__desc">{item.description}</p>
          )}
        </div>
        <div className="menu-item-card__footer">
          <span className="menu-item-card__price">{formatPrice(item.price)}</span>
          {item.is_available ? (
            <button
              className={`btn-add ${adding ? 'btn-add--added' : ''}`}
              onClick={handleAdd}
              aria-label={`Add ${item.name} to cart`}
            >
              {adding ? '✓' : '+'}
            </button>
          ) : (
            <span className="menu-item-card__unavailable">Unavailable</span>
          )}
        </div>
      </div>

      <style>{`
        .menu-item-card {
          display: flex;
          background: var(--bg-surface);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          overflow: hidden;
          transition: transform var(--transition-base), box-shadow var(--transition-base), border-color var(--transition-base);
          animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
          position: relative;
        }
        
        /* List View */
        .menu-item-card--list {
          flex-direction: row;
        }
        .menu-item-card--list .menu-item-card__img-wrap {
          width: 110px;
          flex-shrink: 0;
          overflow: hidden;
        }
        .menu-item-card--list .menu-item-card__body {
          flex: 1;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-width: 0;
          gap: 8px;
        }
        
        /* Grid View */
        .menu-item-card--grid {
          flex-direction: column;
          height: 100%;
        }
        .menu-item-card--grid .menu-item-card__img-wrap {
          width: 100%;
          height: 140px;
          flex-shrink: 0;
          overflow: hidden;
        }
        .menu-item-card--grid .menu-item-card__body {
          flex: 1;
          padding: 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-width: 0;
          gap: 12px;
        }

        .menu-item-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
          border-color: color-mix(in srgb, var(--brand) 50%, transparent);
        }
        .menu-item-card.unavailable {
          opacity: 0.5;
          pointer-events: none;
          filter: grayscale(80%);
        }
        .menu-item-card__img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform var(--transition-slow);
        }
        .menu-item-card:hover .menu-item-card__img {
          transform: scale(1.08);
        }
        .menu-item-card__info { min-width: 0; }
        .menu-item-card__name {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.3;
          letter-spacing: -0.01em;
        }
        .menu-item-card__desc {
          font-size: 13px;
          color: var(--text-secondary);
          margin-top: 6px;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .menu-item-card__footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-top: auto;
        }
        .menu-item-card__price {
          font-size: 16px;
          font-weight: 800;
          color: var(--brand);
        }
        .menu-item-card__unavailable {
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 500;
        }
        .btn-add {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--brand);
          color: var(--brand-text);
          font-size: 22px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: inherit;
          flex-shrink: 0;
          transition: background var(--transition-fast), transform var(--transition-fast);
          line-height: 1;
        }
        .btn-add:hover { opacity: 0.88; }
        .btn-add:active { transform: scale(0.92); }
        .btn-add--added {
          background: var(--success);
          animation: badgePop 0.4s ease;
          font-size: 16px;
        }
      `}</style>
    </div>
  );
}
