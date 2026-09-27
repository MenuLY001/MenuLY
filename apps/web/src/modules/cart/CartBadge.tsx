import React from 'react';
import { useCart } from './CartContext';
import { getTotal } from './cartReducer';
import { formatPrice } from '../../lib/format';

interface CartBadgeProps {
  onClick: () => void;
}

/**
 * Floating cart button with animated item count badge.
 * Only visible when cart has items.
 */
export function CartBadge({ onClick }: CartBadgeProps) {
  const { totalQty, totalPrice } = useCart();

  if (totalQty === 0) return null;

  return (
    <button
      className="cart-badge"
      onClick={onClick}
      aria-label={`View cart — ${totalQty} items`}
    >
      <span className="cart-badge__icon">🛒</span>
      <span className="cart-badge__content">
        <span className="cart-badge__qty">{totalQty} item{totalQty !== 1 ? 's' : ''}</span>
        <span className="cart-badge__price">{formatPrice(totalPrice)}</span>
      </span>
      <span className="cart-badge__arrow">›</span>

      <style>{`
        .cart-badge {
          position: fixed;
          bottom: 16px;
          left: 16px;
          right: 16px;
          display: flex;
          align-items: center;
          background: var(--brand);
          color: var(--brand-text);
          padding: 16px 20px;
          border-radius: 16px;
          box-shadow: 0 12px 24px -6px color-mix(in srgb, var(--brand) 40%, transparent), 0 0 0 1px rgba(255,255,255,0.1);
          font-weight: 600;
          font-size: 15px;
          z-index: 100;
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          transition: transform 0.2s ease, filter 0.2s ease;
          justify-content: space-between;
          width: calc(100% - 32px);
          max-width: 400px;
          margin: 0 auto;
        }
        .cart-badge:hover {
          filter: brightness(1.05);
          transform: translateY(-2px);
        }
        .cart-badge:active {
          transform: scale(0.98);
        }
        .cart-badge__icon {
          font-size: 20px;
          background: rgba(255,255,255,0.2);
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          margin-right: -4px;
        }
        .cart-badge__content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          flex: 1;
        }
        .cart-badge__qty {
          font-size: 12px;
          opacity: 0.85;
          line-height: 1;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .cart-badge__price {
          font-size: 16px;
          font-weight: 800;
          line-height: 1;
        }
        .cart-badge__arrow {
          font-size: 20px;
          opacity: 0.9;
          font-weight: 700;
        }
      `}</style>
    </button>
  );
}
