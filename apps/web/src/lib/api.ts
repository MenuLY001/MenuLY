/**
 * Typed API client — all requests go through the Express backend.
 * Admin requests attach the Supabase JWT as a Bearer token.
 */

const API_BASE = import.meta.env.API_URL || '/api'; // proxied via Vite in dev, or absolute URL in prod

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error ?? `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const publicApi = {
  getMenu: (slug: string) =>
    request<import('@qr-menu/types').PublicMenuResponse>(`/menu/${slug}`),
};

// ─── Admin API ────────────────────────────────────────────────────────────────

export const adminApi = {
  getRestaurant: (token: string) =>
    request<import('@qr-menu/types').Restaurant>('/admin/restaurant', {}, token),

  updateRestaurant: (token: string, data: { name?: string; logo_url?: string; theme_color?: string }) =>
    request<import('@qr-menu/types').Restaurant>('/admin/restaurant', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, token),

  getCategories: (token: string) =>
    request<import('@qr-menu/types').Category[]>('/admin/categories', {}, token),

  createCategory: (token: string, data: import('@qr-menu/types').CreateCategoryPayload) =>
    request<import('@qr-menu/types').Category>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token),

  updateCategory: (token: string, id: string, data: import('@qr-menu/types').UpdateCategoryPayload) =>
    request<import('@qr-menu/types').Category>(`/admin/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, token),

  deleteCategory: (token: string, id: string) =>
    request<void>(`/admin/categories/${id}`, { method: 'DELETE' }, token),

  getItems: (token: string) =>
    request<import('@qr-menu/types').MenuItem[]>('/admin/items', {}, token),

  createItem: (token: string, data: import('@qr-menu/types').CreateMenuItemPayload) =>
    request<import('@qr-menu/types').MenuItem>('/admin/items', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token),

  updateItem: (token: string, id: string, data: import('@qr-menu/types').UpdateMenuItemPayload) =>
    request<import('@qr-menu/types').MenuItem>(`/admin/items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, token),

  deleteItem: (token: string, id: string) =>
    request<void>(`/admin/items/${id}`, { method: 'DELETE' }, token),

  uploadImage: async (token: string, file: File): Promise<string> => {
    const form = new FormData();
    form.append('image', file);
    const res = await fetch(`${API_BASE}/admin/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(res.status, body.error ?? 'Upload failed');
    }
    const { url } = await res.json();
    return url as string;
  },
};
