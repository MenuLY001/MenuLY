export interface Category { id: string; name: string; sort_order: number; }
export interface MenuItem { id: string; name: string; description?: string; price: number; image_url?: string; category_id: string; is_available: boolean; is_veg: boolean; is_special: boolean; is_todays_special: boolean; }
export interface Restaurant { id: string; name: string; slug: string; status: string; trial_ends_at: string | null; theme_color?: string; logo_url?: string; address?: string; phone?: string; menu_template?: string; }
export type Tab = 'dashboard' | 'categories' | 'items' | 'settings' | 'billing';
export type ToastType = 'success' | 'error' | 'info';
