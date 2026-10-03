'use client';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './shared';
import type { Restaurant, Category, MenuItem } from './types';

export function useRestaurant(token: string | undefined) {
  return useQuery({
    queryKey: ['restaurant'],
    queryFn: async () => {
      if (!token) return null;
      let r = await apiFetch(token, '/api/admin/restaurant');
      if (!r || r.id === undefined) {
        r = await apiFetch(token, '/api/admin/restaurant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'My Restaurant' }),
        });
      }
      return r as Restaurant;
    },
    enabled: !!token,
  });
}

export function useCategories(token: string | undefined) {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiFetch(token!, '/api/admin/categories');
      return Array.isArray(res) ? res as Category[] : [];
    },
    enabled: !!token,
  });
}

export function useItems(token: string | undefined) {
  return useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const res = await apiFetch(token!, '/api/admin/items');
      return Array.isArray(res) ? res as MenuItem[] : [];
    },
    enabled: !!token,
  });
}
