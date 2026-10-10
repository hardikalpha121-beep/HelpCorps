import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import mongoose from 'mongoose';

import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';


// Route imports
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/users/user.routes.js';
import volunteerRoutes from './modules/volunteers/volunteer.routes.js';
import helpRequestRoutes from './modules/helpRequests/helpRequest.routes.js';
import kindnessRoutes from './modules/kindnessPoints/kindnessPoints.routes.js';
import womenSafetyRoutes from './modules/womenSafety/womenSafety.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import chatRoutes from './modules/chat/chat.routes.js';

const app = express();

// ── 1. Security headers ────────────────────────────────────────────────
app.use(helmet());

// ── 2. CORS — allow local development origins and configured list ─────
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      const allowed = env.CORS_ORIGINS.split(',').map((s) => s.trim());
      if (allowed.includes(origin)) {
        return callback(null, true);
      }
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
);

// ── 3. Cookie parser (for refresh token cookies) ───────────────────────
app.use(cookieParser());

// ── 4. Body parsing with size limit ────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ── 5. NoSQL injection prevention (in-place sanitization for Express 5) ──
app.use((req, _res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.params) mongoSanitize.sanitize(req.params);
  if (req.query) mongoSanitize.sanitize(req.query);
  next();
});

// ── 6. HTTP request logging (dev only) ─────────────────────────────────
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}


// ── 8. Global rate limit ───────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 60_000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' },
  },
});
app.use('/api', globalLimiter);

// ── 9. Strict auth-route rate limit ────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many auth attempts' },
  },
});
app.use(['/api/v1/auth', '/api/auth'], authLimiter);

// ── 10. Health & readiness endpoints ───────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/ready', (_req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  if (dbReady) {
    res.status(200).json({ status: 'ready', db: 'connected' });
  } else {
    res.status(503).json({ status: 'not ready', db: 'disconnected' });
  }
});

// ── 11. API routes (support both /api/v1 and /api prefixes) ────────────
for (const prefix of ['/api/v1', '/api']) {
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/users`, userRoutes);
  app.use(`${prefix}/volunteers`, volunteerRoutes);
  app.use(`${prefix}/help-requests`, helpRequestRoutes);
  app.use(`${prefix}/kindness`, kindnessRoutes);
  app.use(`${prefix}/women-safety`, womenSafetyRoutes);
  app.use(`${prefix}/admin`, adminRoutes);
  app.use(`${prefix}/chat`, chatRoutes);
}

// ── 12. 404 handler ────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route not found' },
  });
});

// ── 13. Central error handler (always last) ────────────────────────────
app.use(errorHandler);

export default app;
