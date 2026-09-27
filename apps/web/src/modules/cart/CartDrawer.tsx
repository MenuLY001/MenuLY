import React, { useEffect } from 'react';
import { useCart } from './CartContext';
import { formatPrice } from '../../lib/format';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToWaiter: () => void;
}

/**
 * Bottom-sheet cart drawer — mobile-first.
 * Communicates with cart module only via useCart() and typed callbacks.
 */
export function CartDrawer({ isOpen, onClose, onShowToWaiter }: CartDrawerProps) {
  const { cart, totalPrice, removeItem, updateQty, clearCart } = useCart();

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="drawer-backdrop" onClick={onClose} aria-hidden="true" />

      <div className="cart-drawer" role="dialog" aria-label="Your cart" aria-modal="true">
        {/* Handle */}
        <div className="drawer-handle" />

        {/* Header */}
        <div className="drawer-header">
          <div>
            <h2 className="drawer-title">Your Order</h2>
            {cart.tableNo && (
              <p className="drawer-table">Table {cart.tableNo}</p>
            )}
          </div>
          <button className="drawer-close" onClick={onClose} aria-label="Close cart">✕</button>
        </div>

        {/* Items */}
        <div className="drawer-items">
          {cart.items.length === 0 ? (
            <div className="drawer-empty">
              <span className="drawer-empty__icon">🛒</span>
              <p>Your cart is empty</p>
              <p className="drawer-empty__sub">Browse the menu and add items</p>
            </div>
          ) : (
            cart.items.map((item) => (
              <div key={item.menuItemId} className="drawer-item">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="drawer-item__img" />
                ) : (
                  <div className="drawer-item__img-placeholder">🍽️</div>
                )}
                <div className="drawer-item__info">
                  <p className="drawer-item__name">{item.name}</p>
                  <p className="drawer-item__price">{formatPrice(item.price)}</p>
                </div>
                <div className="drawer-item__controls">
                  <button
                    className="qty-btn"
                    onClick={() => updateQty(item.menuItemId, item.qty - 1)}
                    aria-label="Decrease quantity"
                  >−</button>
                  <span className="qty-value">{item.qty}</span>
                  <button
                    className="qty-btn"
                    onClick={() => updateQty(item.menuItemId, item.qty + 1)}
                    aria-label="Increase quantity"
                  >+</button>
                </div>
                <p className="drawer-item__subtotal">{formatPrice(item.price * item.qty)}</p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.items.length > 0 && (
          <div className="drawer-footer">
            <div className="drawer-total">
              <span>Total</span>
              <span className="drawer-total__price">{formatPrice(totalPrice)}</span>
            </div>
            <button className="btn-show-waiter" onClick={onShowToWaiter}>
              🧾 Show to Waiter
            </button>
            <button
              className="btn-clear-cart"
              onClick={() => {
                if (confirm('Clear all items from your cart?')) clearCart();
              }}
            >
              Clear cart
            </button>
          </div>
        )}
      </div>

      <style>{`
        .drawer-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          z-index: 200;
          backdrop-filter: blur(4px);
        }
        .cart-drawer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: var(--bg-surface);
          border-radius: 20px 20px 0 0;
          z-index: 201;
          max-height: 85dvh;
          display: flex;
          flex-direction: column;
          animation: slideUp 0.3s ease;
          box-shadow: 0 -4px 40px rgba(0,0,0,0.5);
        }
        .drawer-handle {
          width: 36px;
          height: 4px;
          background: var(--border-strong);
          border-radius: 2px;
          margin: 12px auto 0;
          flex-shrink: 0;
        }
        .drawer-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 16px 20px 12px;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }
        .drawer-title {
          font-size: 18px;
          font-weight: 700;
        }
        .drawer-table {
          font-size: 13px;
          color: var(--brand);
          font-weight: 500;
          margin-top: 2px;
        }
        .drawer-close {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--bg-elevated);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          transition: background var(--transition-fast);
        }
        .drawer-close:hover { background: var(--border-strong); }
        .drawer-items {
          flex: 1;
          overflow-y: auto;
          padding: 12px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .drawer-empty {
          text-align: center;
          padding: 40px 20px;
          color: var(--text-secondary);
        }
        .drawer-empty__icon {
          font-size: 48px;
          display: block;
          margin-bottom: 12px;
          opacity: 0.4;
        }
        .drawer-empty__sub {
          font-size: 14px;
          color: var(--text-muted);
          margin-top: 4px;
        }
        .drawer-item {
          display: grid;
          grid-template-columns: auto 1fr auto auto;
          gap: 12px;
          align-items: center;
          padding: 12px;
          background: var(--bg-elevated);
          border-radius: var(--radius-md);
        }
        .drawer-item__img {
          width: 44px;
          height: 44px;
          border-radius: 8px;
          object-fit: cover;
        }
        .drawer-item__img-placeholder {
          width: 44px;
          height: 44px;
          border-radius: 8px;
          background: var(--bg-glass);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          opacity: 0.5;
        }
        .drawer-item__info { min-width: 0; }
        .drawer-item__name {
          font-size: 14px;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .drawer-item__price {
          font-size: 13px;
          color: var(--text-secondary);
          margin-top: 2px;
        }
        .drawer-item__controls {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-surface);
          border-radius: var(--radius-full);
          padding: 4px;
        }
        .qty-btn {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--bg-glass);
          color: var(--text-primary);
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          transition: background var(--transition-fast);
          line-height: 1;
        }
        .qty-btn:hover { background: var(--border-strong); }
        .qty-value {
          font-size: 15px;
          font-weight: 700;
          min-width: 20px;
          text-align: center;
        }
        .drawer-item__subtotal {
          font-size: 14px;
          font-weight: 700;
          color: var(--brand);
          text-align: right;
        }
        .drawer-footer {
          padding: 16px 20px calc(16px + env(safe-area-inset-bottom));
          border-top: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex-shrink: 0;
        }
        .drawer-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 16px;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .drawer-total__price {
          font-size: 22px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .btn-show-waiter {
          width: 100%;
          padding: 16px;
          background: var(--brand);
          color: var(--brand-text);
          border-radius: var(--radius-lg);
          font-size: 16px;
          font-weight: 700;
          font-family: inherit;
          transition: opacity var(--transition-fast), transform var(--transition-fast);
          letter-spacing: 0.3px;
        }
        .btn-show-waiter:hover { opacity: 0.92; }
        .btn-show-waiter:active { transform: scale(0.98); }
        .btn-clear-cart {
          width: 100%;
          padding: 10px;
          color: var(--text-muted);
          font-size: 14px;
          font-family: inherit;
          transition: color var(--transition-fast);
        }
        .btn-clear-cart:hover { color: var(--error); }
      `}</style>
    </>
  );
}
