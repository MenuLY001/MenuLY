# QR Menu Platform

A multi-tenant restaurant QR-menu platform. Each restaurant gets admin login + QR codes per table. Customers scan to browse the menu, build a cart, and show it to a waiter.

## Architecture

```
qr-menu-platform/
├── apps/
│   ├── api/        Node.js + Express + TypeScript — REST API
│   └── web/        React + Vite — Admin dashboard + Public menu
├── packages/
│   └── types/      Shared TypeScript interfaces
└── supabase/
    ├── migrations/ SQL schema + RLS policies
    └── seed.sql    Demo data
```

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)

---

## 1. Supabase Setup

### 1a. Run the migration

In your Supabase SQL Editor, paste and run:

```sql
-- contents of supabase/migrations/001_initial_schema.sql
```

Or use Supabase CLI:
```bash
supabase db push
```

### 1b. Create the storage bucket

In Supabase Dashboard → Storage → New Bucket:
- Name: `menu-images`
- ✅ Public bucket (items need public URLs for the menu page)

### 1c. Create an admin user

In Supabase Dashboard → Authentication → Users → Invite User:
- Enter the admin's email
- They receive a magic link to set a password

Then link them to a restaurant in the SQL Editor:
```sql
INSERT INTO restaurant_admins (user_id, restaurant_id)
VALUES ('paste-user-uuid-here', 'paste-restaurant-uuid-here');
```

### 1d. Create a restaurant

Either use the seed file (`supabase/seed.sql`) for demo data, or insert directly:
```sql
INSERT INTO restaurants (slug, name, theme_color)
VALUES ('my-restaurant-abc1', 'My Restaurant', '#e67e22');
```

> **Slugs should be random and non-sequential.** Suggested format: `{name-kebab}-{4-char-random}`.

---

## 2. Environment Variables

### API (`apps/api/.env`)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # Settings > API > service_role
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### Web (`apps/web/.env`)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key              # Settings > API > anon key
API_URL=http://localhost:3001
```

---

## 3. Install & Run

```bash
# Install all dependencies (root installs everything via workspaces)
npm install

# Start both API and web in development mode
npm run dev

# Or start individually:
npm run dev:api   # API on :3001
npm run dev:web   # Vite on :5173
```

---

## 4. URLs

| Route | Description |
|-------|-------------|
| `/admin` | Admin login → dashboard |
| `/menu/:slug?table=N` | Public customer menu |

**QR Codes** are generated in Admin → QR Codes panel.
Each table gets a unique QR linking to `/menu/{slug}?table={N}`.

---

## Security Model

### Tenant Isolation

| Layer | Mechanism |
|-------|-----------|
| **Public API** | `restaurant_id` derived from slug lookup — never from client |
| **Admin API** | `restaurant_id` derived from JWT → `restaurant_admins` table lookup |
| **Database RLS** | `restaurant_admins.user_id = auth.uid()` on all write policies |
| **API server** | Service-role key on server only — anon key never touches data |

### No Public Signup

Admin accounts are created by the platform owner only.
The `/admin` route shows a login form — no registration UI.

---

## Module Architecture (Frontend)

```
/menu        — fetch & render categories/items for a given slug
/cart        — CartContext (useReducer), pure functions, no network in phase 1
/fulfillment — strategy pattern (DisplayToWaiter | BackendOrder)
/table       — useTable() parses tableNo from URL params
```

Modules communicate only through typed interfaces. No module reaches into another's internals.

### Adding Real Ordering (Phase 2)

1. Flip `ordering_enabled = TRUE` for the restaurant in Supabase
2. Implement `BackendOrderStrategy.submit()` in `apps/web/src/modules/fulfillment/strategy.ts`
3. Add the `POST /api/restaurants/:id/orders` endpoint in `apps/api`
4. Add `orders` + `order_items` tables + RLS policies
5. Decide cart persistence (localStorage or server-side draft)

That's it — no other code changes needed.

---

## Onboarding a New Restaurant

```sql
-- 1. Create restaurant (generate a random slug)
INSERT INTO restaurants (slug, name, theme_color)
VALUES ('spice-house-7k9m', 'Spice House', '#c0392b')
RETURNING id;

-- 2. Create admin user in Supabase Auth dashboard, then link:
INSERT INTO restaurant_admins (user_id, restaurant_id)
VALUES ('user-uuid', 'restaurant-uuid');
```

The admin can then log in at `/admin` and manage their menu.

---

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript
- **Backend**: Node.js + Express + TypeScript
- **DB / Auth / Storage**: Supabase (Postgres + GoTrue + S3-compatible)
- **QR Generation**: `qrcode` npm package (client-side, no server needed)
- **Monorepo**: npm workspaces
"# MenuLY" 
