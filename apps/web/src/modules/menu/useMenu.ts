import { useState, useEffect } from 'react';
import { publicApi, ApiError } from '../../lib/api';
import { PublicMenuResponse } from '@qr-menu/types';

interface UseMenuResult {
  data: PublicMenuResponse | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
  /** true when the restaurant exists but its subscription is inactive */
  unavailable: boolean;
  restaurantName: string | null;
}

/**
 * Menu module — fetches categories and items for a given restaurant slug.
 * restaurant_id is derived server-side from the slug — never trusted from client.
 * Handles the "unavailable" state returned for suspended/cancelled restaurants.
 */
export function useMenu(slug: string): UseMenuResult {
  const [data, setData] = useState<PublicMenuResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [restaurantName, setRestaurantName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setNotFound(false);
    setUnavailable(false);
    setRestaurantName(null);

    publicApi
      .getMenu(slug)
      .then((res) => {
        if (cancelled) return;

        // The API returns { unavailable: true, restaurant: { name } } for suspended restaurants
        if ((res as unknown as { unavailable?: boolean }).unavailable) {
          const r = (res as unknown as { restaurant?: { name?: string } }).restaurant;
          setUnavailable(true);
          setRestaurantName(r?.name ?? null);
        } else {
          setData(res);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load menu');
        }
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [slug]);

  return { data, loading, error, notFound, unavailable, restaurantName };
}
