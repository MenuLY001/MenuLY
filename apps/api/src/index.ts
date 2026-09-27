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
const PORT = process.env.PORT ?? 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
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

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ─── Error Handling ───────────────────────────────────────────────────────────

app.use(notFound);
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[API] Server running at http://localhost:${PORT}`);
  console.log(`[API] Environment: ${process.env.NODE_ENV ?? 'development'}`);
});

export default app;
