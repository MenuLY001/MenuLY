// ─── DB Row Types ────────────────────────────────────────────────────────────

export interface Restaurant {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  theme_color: string;
  ordering_enabled: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  sort_order: number;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface PublicMenuResponse {
  restaurant: Pick<Restaurant, 'id' | 'name' | 'logo_url' | 'theme_color' | 'ordering_enabled'>;
  categories: (Category & { items: MenuItem[] })[];
}

export interface ApiError {
  error: string;
  code?: string;
}

// ─── Cart Module Types ────────────────────────────────────────────────────────

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  qty: number;
  image_url?: string | null;
}

export interface CartState {
  restaurantId: string;
  restaurantName: string;
  tableNo: string | null;
  items: CartItem[];
}

export type CartAction =
  | { type: 'ADD_ITEM'; item: Omit<CartItem, 'qty'> }
  | { type: 'REMOVE_ITEM'; menuItemId: string }
  | { type: 'UPDATE_QTY'; menuItemId: string; qty: number }
  | { type: 'CLEAR_CART' };

// ─── Fulfillment Module Types ─────────────────────────────────────────────────

export type FulfillmentResult =
  | { success: true; data: CartState }
  | { success: false; error: string };

export interface OrderFulfillmentStrategy {
  submit(cart: CartState): Promise<FulfillmentResult>;
}

// ─── Admin Types ──────────────────────────────────────────────────────────────

export interface AdminContext {
  restaurantId: string;
  userId: string;
}

export interface CreateCategoryPayload {
  name: string;
  sort_order?: number;
}

export interface UpdateCategoryPayload {
  name?: string;
  sort_order?: number;
}

export interface CreateMenuItemPayload {
  category_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available?: boolean;
  sort_order?: number;
}

export interface UpdateMenuItemPayload {
  category_id?: string;
  name?: string;
  description?: string;
  price?: number;
  image_url?: string;
  is_available?: boolean;
  sort_order?: number;
}
