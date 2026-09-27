import { CartState, CartAction, CartItem } from '@qr-menu/types';

// ─── Pure functions ───────────────────────────────────────────────────────────

export function addItem(state: CartState, item: Omit<CartItem, 'qty'>): CartState {
  const existing = state.items.find((i) => i.menuItemId === item.menuItemId);
  if (existing) {
    return {
      ...state,
      items: state.items.map((i) =>
        i.menuItemId === item.menuItemId ? { ...i, qty: i.qty + 1 } : i
      ),
    };
  }
  return { ...state, items: [...state.items, { ...item, qty: 1 }] };
}

export function removeItem(state: CartState, menuItemId: string): CartState {
  return { ...state, items: state.items.filter((i) => i.menuItemId !== menuItemId) };
}

export function updateQty(state: CartState, menuItemId: string, qty: number): CartState {
  if (qty <= 0) return removeItem(state, menuItemId);
  return {
    ...state,
    items: state.items.map((i) => (i.menuItemId === menuItemId ? { ...i, qty } : i)),
  };
}

export function getTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

export function getTotalQty(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.qty, 0);
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM':
      return addItem(state, action.item);
    case 'REMOVE_ITEM':
      return removeItem(state, action.menuItemId);
    case 'UPDATE_QTY':
      return updateQty(state, action.menuItemId, action.qty);
    case 'CLEAR_CART':
      return { ...state, items: [] };
    default:
      return state;
  }
}
