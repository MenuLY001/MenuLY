export interface RestaurantRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  trial_ends_at: string | null;
  created_at: string;
  deleted_at: string | null;
  subscription: {
    status: string;
    razorpay_subscription_id: string;
    current_period_end: string | null;
  } | null;
}

export interface DashboardStats {
  totalRestaurants: number;
  activeCount: number;
  trialCount: number;
  suspendedCount: number;
  totalAdmins: number;
  totalRevenuePaise: number;
}

export interface DashboardData {
  stats: DashboardStats;
  restaurants: RestaurantRow[];
}

export type FilterState = 'all' | 'active' | 'trialing' | 'suspended' | 'cancelled' | 'deleted';
export type SortKey = 'name' | 'status' | 'created_at' | 'trial_ends_at';
export type SortDir = 'asc' | 'desc';
export type ToastType = 'success' | 'error' | 'info';
export interface Toast { id: string; type: ToastType; title: string; msg?: string; }
