export interface Category { id: string; name: string; sort_order: number; }
export interface MenuItem {
  id: string; category_id: string; name: string; description: string | null;
  price: number; is_veg: boolean; is_special: boolean; is_todays_special: boolean; is_available: boolean;
  image_url: string | null;
}
export interface Restaurant {
  id: string; name: string; slug: string; theme_color: string | null;
  logo_url: string | null; menu_template: string | null;
  status: string; trial_ends_at: string | null;
  phone?: string; address?: string;
}
export interface Props { restaurant: Restaurant; categories: Category[]; items: MenuItem[]; }
