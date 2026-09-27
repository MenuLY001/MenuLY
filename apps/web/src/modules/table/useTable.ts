import { useSearchParams } from 'react-router-dom';

/**
 * /table module — parses the table number from the URL search params.
 * This is the single source of truth for tableNo, always derived from URL.
 */
export function useTable(): string | null {
  const [searchParams] = useSearchParams();
  const tableNo = searchParams.get('table');
  return tableNo ?? null;
}
