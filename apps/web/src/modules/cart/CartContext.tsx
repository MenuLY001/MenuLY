import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
} from 'react';
import { CartState, CartItem } from '@qr-menu/types';
import { cartReducer, getTotal, getTotalQty } from './cartReducer';

interface CartContextValue {
  cart: CartState;
  totalQty: number;
  totalPrice: number;
  addItem: (item: Omit<CartItem, 'qty'>) => void;
  removeItem: (menuItemId: string) => void;
  updateQty: (menuItemId: string, qty: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

interface CartProviderProps {
  restaurantId: string;
  restaurantName: string;
  tableNo: string | null;
  children: ReactNode;
}

/**
 * Cart module — owns all cart state for a single restaurant session.
 * State is in-memory per tab (no backend persistence in phase 1).
 * Never reaches into menu or fulfillment internals.
 */
export function CartProvider({
  restaurantId,
  restaurantName,
  tableNo,
  children,
}: CartProviderProps) {
  const initialState: CartState = {
    restaurantId,
    restaurantName,
    tableNo,
    items: [],
  };

  const [cart, dispatch] = useReducer(cartReducer, initialState);

  const addItem = useCallback(
    (item: Omit<CartItem, 'qty'>) => dispatch({ type: 'ADD_ITEM', item }),
    []
  );
  const removeItem = useCallback(
    (menuItemId: string) => dispatch({ type: 'REMOVE_ITEM', menuItemId }),
    []
  );
  const updateQty = useCallback(
    (menuItemId: string, qty: number) =>
      dispatch({ type: 'UPDATE_QTY', menuItemId, qty }),
    []
  );
  const clearCart = useCallback(() => dispatch({ type: 'CLEAR_CART' }), []);

  const totalQty = getTotalQty(cart.items);
  const totalPrice = getTotal(cart.items);

  return (
    <CartContext.Provider
      value={{ cart, totalQty, totalPrice, addItem, removeItem, updateQty, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within <CartProvider>');
  return ctx;
}
