import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import menuRouter from './routes/menu';
import categoriesRouter from './routes/admin/categories';
import itemsRouter from './routes/admin/items';
import uploadRouter from './routes/upload';
import restaurantRouter from './routes/admin/restaurant';
import billingRouter from './routes/admin/billing';
import authRegisterRouter from './routes/auth/register';
import razorpayWebhookRouter from './routes/webhooks/razorpay';
import superAdminRouter from './routes/superadmin/index';
import { errorHandler, notFound } from './middleware/errorHandler';

const app = express();
app.set('trust proxy', 1); // Trust first proxy (Railway/Render) for rate limiting
const PORT = process.env.PORT ?? 3001;

// ─── CORS ─────────────────────────────────────────────────────────────────────
// FRONTEND_URL supports comma-separated origins for multi-domain setups.
const rawOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:5173')
  .split(',')
  .map(s => s.trim().replace(/\/$/, ''))
  .filter(Boolean);

const allowedOrigins = new Set<string>(rawOrigins);
for (const origin of rawOrigins) {
  try {
    const u = new URL(origin);
    if (u.hostname.startsWith('www.')) {
      allowedOrigins.add(`${u.protocol}//${u.hostname.slice(4)}`);
    } else {
      allowedOrigins.add(`${u.protocol}//www.${u.hostname}`);
    }
  } catch { /* not a valid URL, skip */ }
}

console.log('[API] Allowed CORS origins:', [...allowedOrigins].join(', '));

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.has(origin) || origin.startsWith('http://localhost:')) {
      return cb(null, true);
    }
    cb(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
}));

// ─── Razorpay webhook — MUST be mounted BEFORE express.json() ────────────────
// Razorpay sends the raw body; we need it as a Buffer for HMAC verification.
app.use(
  '/api/webhooks/razorpay',
  express.raw({ type: 'application/json' }),
  razorpayWebhookRouter
);

// ─── Body parsing (all other routes) ─────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));

// ─── Rate limiters ────────────────────────────────────────────────────────────
const publicLimiter  = rateLimit({ windowMs: 60_000, max: 120 });
const adminLimiter   = rateLimit({ windowMs: 60_000, max: 60 });
// Registration: tight — 5 per IP per minute to prevent abuse
const registerLimiter = rateLimit({
  windowMs: 60_000,
  max: 5,
  message: { error: 'Too many registration attempts. Please try again later.' },
});

// ─── Routes ───────────────────────────────────────────────────────────────────

// Public menu (no auth)
app.use('/api/menu', publicLimiter, menuRouter);

// Self-serve registration (public, tightly rate-limited)
app.use('/api/auth', registerLimiter, authRegisterRouter);

// Restaurant admin (requires valid JWT + restaurant_admins mapping)
app.use('/api/admin/categories', adminLimiter, categoriesRouter);
app.use('/api/admin/items',      adminLimiter, itemsRouter);
app.use('/api/admin/upload',     adminLimiter, uploadRouter);
app.use('/api/admin/restaurant', adminLimiter, restaurantRouter);
app.use('/api/admin/billing',    adminLimiter, billingRouter);

// Super admin (requires valid JWT + super_admins table row)
app.use('/api/superadmin', adminLimiter, superAdminRouter);

// Health checks
app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.get('/health',     (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.get('/',           (_req, res) => res.json({ status: 'ok', service: 'menuly-api' }));

// ─── Error handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`[API] Server running at http://0.0.0.0:${PORT}`);
  console.log(`[API] Environment: ${process.env.NODE_ENV ?? 'development'}`);

  // Warn about missing Razorpay config (non-fatal — billing routes will 503)
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.warn('[API] ⚠  RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not set — billing routes disabled');
  }
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    console.warn('[API] ⚠  RAZORPAY_WEBHOOK_SECRET not set — webhook endpoint will reject all requests');
  }
});

export default app;
