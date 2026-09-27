import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import menuRouter from './routes/menu';
import categoriesRouter from './routes/admin/categories';
import itemsRouter from './routes/admin/items';
import uploadRouter from './routes/upload';
import restaurantRouter from './routes/admin/restaurant';
import platformRouter from './routes/platform';
import { errorHandler, notFound } from './middleware/errorHandler';

const app = express();
app.set('trust proxy', 1); // Trust first proxy (Railway/Render) for rate limiting
const PORT = process.env.PORT ?? 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────

// FRONTEND_URL supports comma-separated origins for multi-domain setups.
// Each entry also auto-generates its www/apex counterpart.
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
    // Allow requests with no origin (server-to-server, curl, health checks, etc.)
    if (!origin || allowedOrigins.has(origin)) return cb(null, true);
    cb(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// Rate limiting — stricter on auth-adjacent admin routes
const publicLimiter = rateLimit({ windowMs: 60_000, max: 120 });
const adminLimiter = rateLimit({ windowMs: 60_000, max: 60 });
// Platform registration: very tight — 5 requests/minute max
const platformLimiter = rateLimit({ windowMs: 60_000, max: 5, message: 'Too many requests' });

// ─── Secret Platform Route ────────────────────────────────────────────────────
// Mounted under a secret key from PLATFORM_REGISTRATION_KEY env var.
// URL: /api/platform/<key>/register  and  /api/platform/<key>/login
// If the env var is missing, this route is disabled entirely at startup.
const PLATFORM_KEY = process.env.PLATFORM_REGISTRATION_KEY;
if (!PLATFORM_KEY || PLATFORM_KEY.length < 32) {
  console.warn(
    '[API] PLATFORM_REGISTRATION_KEY is missing or too short (min 32 chars).\n' +
    '      Platform registration routes are DISABLED.'
  );
} else {
  app.use(`/api/platform/${PLATFORM_KEY}`, platformLimiter, platformRouter);
  console.log('[API] Platform registration routes: enabled (key from env)');
}

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/menu', publicLimiter, menuRouter);
app.use('/api/admin/categories', adminLimiter, categoriesRouter);
app.use('/api/admin/items', adminLimiter, itemsRouter);
app.use('/api/admin/upload', adminLimiter, uploadRouter);
app.use('/api/admin/restaurant', adminLimiter, restaurantRouter);

// Health checks
app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.get('/', (_req, res) => res.json({ status: 'ok', service: 'qr-menu-api' }));

// ─── Error Handling ───────────────────────────────────────────────────────────

app.use(notFound);
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`[API] Server running at http://0.0.0.0:${PORT}`);
  console.log(`[API] Environment: ${process.env.NODE_ENV ?? 'development'}`);
});

export default app;
