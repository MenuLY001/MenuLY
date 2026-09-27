import { CartState, OrderFulfillmentStrategy, FulfillmentResult } from '@qr-menu/types';

/**
 * /fulfillment module — strategy pattern for order submission.
 *
 * Phase 1: DisplayToWaiterStrategy — no network call, returns cart for rendering.
 * Phase 2: BackendOrderStrategy (stubbed) — will POST to /api/restaurants/:id/orders.
 *
 * Strategy is selected per-restaurant based on ordering_enabled flag.
 * To migrate: flip ordering_enabled → true, the rest is automatic.
 */

// ─── Strategy 1: Display To Waiter (Active in Phase 1) ───────────────────────

export class DisplayToWaiterStrategy implements OrderFulfillmentStrategy {
  async submit(cart: CartState): Promise<FulfillmentResult> {
    // No network call — return cart for full-screen waiter display
    return { success: true, data: cart };
  }
}

// ─── Strategy 2: Backend Order (Stubbed — not active) ─────────────────────────

export class BackendOrderStrategy implements OrderFulfillmentStrategy {
  private apiBase: string;

  constructor(apiBase: string = '/api') {
    this.apiBase = apiBase;
  }

  async submit(cart: CartState): Promise<FulfillmentResult> {
    // TODO: Implement when ordering_enabled = true for a restaurant
    // Steps:
    //   1. POST /api/restaurants/:id/orders with cart payload
    //   2. Persist cart to server-side draft (to survive refresh)
    //   3. Return order confirmation ID
    //
    // Add `orders` and `order_items` tables to Supabase schema
    // and decide cart persistence (localStorage vs server-side draft order)
    // since in-memory cart won't survive a refresh once orders are trackable.

    try {
      const res = await fetch(
        `${this.apiBase}/restaurants/${cart.restaurantId}/orders`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tableNo: cart.tableNo,
            items: cart.items.map((item) => ({
              menuItemId: item.menuItemId,
              qty: item.qty,
              price: item.price,
            })),
          }),
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return { success: false, error: body.error ?? 'Order submission failed' };
      }

      return { success: true, data: cart };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Network error',
      };
    }
  }
}

// ─── Strategy Factory ─────────────────────────────────────────────────────────

/**
 * Returns the correct fulfillment strategy based on the restaurant's
 * ordering_enabled flag. Flipping that boolean is the entire migration path.
 */
export function getFulfillmentStrategy(orderingEnabled: boolean): OrderFulfillmentStrategy {
  if (orderingEnabled) {
    return new BackendOrderStrategy();
  }
  return new DisplayToWaiterStrategy();
}
