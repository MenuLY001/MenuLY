import { useState, useEffect } from 'react';
import { publicApi, ApiError } from '../../lib/api';
import { PublicMenuResponse } from '@qr-menu/types';

interface UseMenuResult {
  data: PublicMenuResponse | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
}

/**
 * Menu module — fetches categories and items for a given restaurant slug.
 * restaurant_id is derived server-side from the slug — never trusted from client.
 */
export function useMenu(slug: string): UseMenuResult {
  const [data, setData] = useState<PublicMenuResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setNotFound(false);

    publicApi
      .getMenu(slug)
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 404) {
            setNotFound(true);
          } else {
            setError(err instanceof Error ? err.message : 'Failed to load menu');
          }
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [slug]);

  return { data, loading, error, notFound };
}
