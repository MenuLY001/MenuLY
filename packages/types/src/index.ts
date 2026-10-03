// ─── DB Row Types ────────────────────────────────────────────────────────────

export type MenuTemplate = 'classic' | 'menuly-dark';

export type RestaurantStatus = 'trialing' | 'active' | 'past_due' | 'suspended' | 'cancelled';

export interface Restaurant {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  theme_color: string;
  menu_template: MenuTemplate;
  ordering_enabled: boolean;
  status: RestaurantStatus;
  trial_ends_at: string | null;
  updated_at: string;
  created_at: string;
}

// ─── Billing Types ────────────────────────────────────────────────────────────

export interface Plan {
  id: string;
  name: string;
  description: string | null;
  price_paise: number;
  currency: string;
  interval: string;
  razorpay_plan_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  restaurant_id: string;
  plan_id: string;
  status: string; // mirrors Razorpay states
  razorpay_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  restaurant_id: string;
  subscription_id: string | null;
  razorpay_payment_id: string | null;
  amount_paise: number;
  currency: string;
  status: 'captured' | 'failed' | 'refunded';
  failure_reason: string | null;
  created_at: string;
}

export interface BillingInfo {
  subscription: Subscription | null;
  payments: Payment[];
  plan: Plan | null;
  trial_ends_at: string | null;
  status: RestaurantStatus;
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
  is_veg: boolean | null;
  is_special: boolean;
  sort_order: number;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface PublicMenuResponse {
  restaurant: Pick<Restaurant, 'id' | 'name' | 'logo_url' | 'theme_color' | 'ordering_enabled' | 'menu_template'>;
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
  is_veg?: boolean;
  is_special?: boolean;
  sort_order?: number;
}

export interface UpdateMenuItemPayload {
  category_id?: string;
  name?: string;
  description?: string;
  price?: number;
  image_url?: string;
  is_available?: boolean;
  is_veg?: boolean;
  is_special?: boolean;
  sort_order?: number;
}
