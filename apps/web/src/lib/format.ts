/**
 * Format a number as Indian Rupees (₹).
 * Used across both public and admin sides.
 */
export function formatPrice(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}
