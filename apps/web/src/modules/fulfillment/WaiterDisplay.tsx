import React, { useEffect } from 'react';
import { CartState } from '@qr-menu/types';
import { formatPrice } from '../../lib/format';
import { getTotal } from '../cart/cartReducer';

interface WaiterDisplayProps {
  cart: CartState;
  onDone: () => void;
}

/**
 * Full-screen waiter display — large, legible, no distractions.
 * Phase 1 fulfillment: customer shows this screen to the waiter.
 */
export function WaiterDisplay({ cart, onDone }: WaiterDisplayProps) {
  const total = getTotal(cart.items);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="waiter-overlay">
      <div className="waiter-card">
        {/* Header */}
        <div className="waiter-header">
          <div className="waiter-badge">🧾 Show to Waiter</div>
          <h1 className="waiter-restaurant">{cart.restaurantName}</h1>
          {cart.tableNo && (
            <div className="waiter-table">Table {cart.tableNo}</div>
          )}
        </div>

        {/* Divider */}
        <div className="waiter-divider" />

        {/* Items */}
        <div className="waiter-items">
          {cart.items.map((item) => (
            <div key={item.menuItemId} className="waiter-item">
              <div className="waiter-item__left">
                <span className="waiter-item__qty">×{item.qty}</span>
                {item.image_url && (
                  <img src={item.image_url} alt={item.name} className="waiter-item__img" />
                )}
                <span className="waiter-item__name">{item.name}</span>
              </div>
              <span className="waiter-item__price">
                {formatPrice(item.price * item.qty)}
              </span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="waiter-divider" />
        <div className="waiter-total">
          <span>Total</span>
          <span className="waiter-total__price">{formatPrice(total)}</span>
        </div>

        {/* Done button */}
        <button className="waiter-done" onClick={onDone}>
          ✓ Done — Place Order
        </button>
        <p className="waiter-hint">The waiter will note your order manually.</p>
      </div>

      <style>{`
        .waiter-overlay {
          position: fixed;
          inset: 0;
          background: #0a0a0f;
          z-index: 300;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeIn 0.25s ease;
        }
        .waiter-card {
          width: 100%;
          max-width: 480px;
          background: var(--bg-surface);
          border-radius: var(--radius-xl);
          padding: 28px 24px;
          border: 1px solid var(--border-strong);
          box-shadow: var(--shadow-lg);
        }
        .waiter-header {
          text-align: center;
          margin-bottom: 16px;
        }
        .waiter-badge {
          display: inline-block;
          background: var(--brand);
          color: var(--brand-text);
          font-size: 13px;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: var(--radius-full);
          margin-bottom: 12px;
          letter-spacing: 0.5px;
        }
        .waiter-restaurant {
          font-family: var(--font-serif);
          font-size: 26px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 6px;
        }
        .waiter-table {
          font-size: 32px;
          font-weight: 800;
          color: var(--brand);
          line-height: 1;
        }
        .waiter-divider {
          height: 1px;
          background: var(--border);
          margin: 16px 0;
        }
        .waiter-items {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 40dvh;
          overflow-y: auto;
        }
        .waiter-item {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 12px;
        }
        .waiter-item__left {
          display: flex;
          align-items: baseline;
          gap: 10px;
          min-width: 0;
        }
        .waiter-item__qty {
          font-size: 18px;
          font-weight: 800;
          color: var(--brand);
          flex-shrink: 0;
        }
        .waiter-item__img {
          width: 36px;
          height: 36px;
          border-radius: 6px;
          object-fit: cover;
          flex-shrink: 0;
        }
        .waiter-item__name {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .waiter-item__price {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-secondary);
          flex-shrink: 0;
          text-align: right;
        }
        .waiter-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 16px;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .waiter-total__price {
          font-size: 28px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .waiter-done {
          width: 100%;
          margin-top: 20px;
          padding: 16px;
          background: var(--brand);
          color: var(--brand-text);
          border-radius: var(--radius-lg);
          font-size: 16px;
          font-weight: 700;
          font-family: inherit;
          transition: opacity var(--transition-fast), transform var(--transition-fast);
        }
        .waiter-done:hover { opacity: 0.9; }
        .waiter-done:active { transform: scale(0.98); }
        .waiter-hint {
          text-align: center;
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 10px;
        }
      `}</style>
    </div>
  );
}
