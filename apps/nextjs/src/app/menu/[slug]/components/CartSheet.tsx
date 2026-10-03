'use client';
import { useState, useEffect } from 'react';
import type { CartItem, Restaurant } from './types';
import { fmt } from './helpers';

export function CartSheet({
  cart,
  brand,
  restaurant,
  onClose,
  onUpdateQty,
  onClear,
}: {
  cart: CartItem[];
  brand: string;
  restaurant: Restaurant;
  onClose: () => void;
  onUpdateQty: (id: string, delta: number) => void;
  onClear: () => void;
}) {
  const [showWaiter, setShowWaiter] = useState(false);
  const total = cart.reduce((acc, item) => acc + item.price * item.qty, 0);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (showWaiter) {
    return (
      <div className="mly-waiter-overlay">
        <div className="mly-waiter-card">
          <div className="mly-waiter-header">
            <div className="mly-waiter-badge">🧾 Show to Waiter</div>
            <h1 className="mly-waiter-restaurant">{restaurant.name}</h1>
          </div>
          <div className="mly-waiter-divider" />
          <div className="mly-waiter-items">
            {cart.map(item => (
              <div key={item.id} className="mly-waiter-item">
                <div className="mly-waiter-item__left">
                  <span className="mly-waiter-item__qty">×{item.qty}</span>
                  {item.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image_url} alt="" className="mly-waiter-item__img" />
                  )}
                  <span className="mly-waiter-item__name">{item.name}</span>
                </div>
                <span className="mly-waiter-item__price">{fmt(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
          <div className="mly-waiter-divider" />
          <div className="mly-waiter-total">
            <span>Total</span>
            <span className="mly-waiter-total__price">{fmt(total)}</span>
          </div>
          <button className="mly-waiter-done" style={{ background: brand }} onClick={() => setShowWaiter(false)}>
            ✓ Done — Go Back
          </button>
          <button className="mly-waiter-clear" onClick={() => { onClear(); onClose(); }}>
            Start New Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mly-sheet-backdrop" onClick={onClose} />
      <div className="mly-sheet mly-cart-sheet">
        <div className="mly-sheet__header">
          <h3 className="mly-sheet__title">Your Order</h3>
          <button className="mly-sheet__close" onClick={onClose}>✕</button>
        </div>
        <div className="mly-cart-items">
          {cart.length === 0 ? (
            <div className="mly-cart-empty">Your cart is empty.</div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="mly-cart-item">
                {item.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image_url} alt="" className="mly-cart-item__img" />
                ) : (
                  <div className="mly-cart-item__img-placeholder">🍽️</div>
                )}
                <div className="mly-cart-item__info">
                  <div className="mly-cart-item__name">{item.name}</div>
                  <div className="mly-cart-item__price">{fmt(item.price)}</div>
                </div>
                <div className="mly-cart-item__controls">
                  <button className="mly-qty-btn" onClick={() => onUpdateQty(item.id, -1)}>−</button>
                  <span className="mly-qty-val">{item.qty}</span>
                  <button className="mly-qty-btn" onClick={() => onUpdateQty(item.id, 1)}>+</button>
                </div>
                <div className="mly-cart-item__subtotal">{fmt(item.price * item.qty)}</div>
              </div>
            ))
          )}
        </div>
        {cart.length > 0 && (
          <div className="mly-cart-footer">
            <div className="mly-cart-total">
              <span>Total</span>
              <span className="mly-cart-total__price">{fmt(total)}</span>
            </div>
            <button className="mly-cart-waiter-btn" style={{ background: brand }} onClick={() => setShowWaiter(true)}>
              🧾 Show to Waiter
            </button>
          </div>
        )}
      </div>
    </>
  );
}
