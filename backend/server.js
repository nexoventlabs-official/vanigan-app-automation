require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const authRoutes = require('./routes/auth');
const publicRegisterRoutes = require('./routes/publicRegister');
const publicBizDirRoutes   = require('./routes/publicBizDir');
const photoUploadRoutes    = require('./routes/photoUpload');
const webhookRoutes = require('./routes/webhook');
const flowEndpointRoutes = require('./routes/flowEndpoint');
const businessRoutes = require('./routes/businesses');
const organizerRoutes = require('./routes/organizers');
const memberRoutes = require('./routes/members');
const planRoutes = require('./routes/plans');
const postingRoutes = require('./routes/postings');
const wingRoutes = require('./routes/wings');
const reviewRoutes = require('./routes/reviews');
const districtRoutes = require('./routes/districts');
const flowImageRoutes = require('./routes/flowImages');
const dashboardRoutes = require('./routes/dashboard');
const userRoutes = require('./routes/users');
const categoryImageRoutes = require('./routes/categoryImages');
const publicApiRoutes     = require('./routes/publicApi');
const webAuthRoutes       = require('./routes/webAuth');
const galleryRoutes       = require('./routes/gallery');
const memberAuthRoutes    = require('./routes/memberAuth');
const socialRoutes        = require('./routes/social');

const app = express();
app.set('trust proxy', 1);

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(compression());

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// Always allow the backend's own URL (for server-rendered pages calling own API)
const backendSelf = (process.env.BACKEND_URL || '').replace(/\/+$/, '');
if (backendSelf && !allowedOrigins.includes(backendSelf)) {
  allowedOrigins.push(backendSelf);
}

// CORS only applies to /api/* routes.
// /public/* routes serve server-rendered HTML forms (opened directly in browser
// via WhatsApp links) — those use regular HTML form POSTs, not fetch/XHR, so
// CORS headers are not needed and the null-origin block must not apply.
app.use('/api', cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // same-origin / server-to-server — allow
    if (origin === 'null') return cb(new Error('CORS blocked: null origin')); // sandboxed iframe — block
    if (allowedOrigins.includes(origin)) return cb(null, true);
    if (process.env.NODE_ENV !== 'production' && /^http:\/\/localhost(:\d+)?$/.test(origin)) {
      return cb(null, true);
    }
    return cb(new Error('CORS blocked: ' + origin));
  },
  credentials: true,
}));

app.use(
  express.json({
    limit: '5mb',
    verify: (req, _res, buf) => {
      if (req.originalUrl && req.originalUrl.startsWith('/api/webhook/meta')) {
        req.rawBody = buf.toString();
      }
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

app.get('/', (_req, res) =>
  res.json({ name: 'Vanigan API', status: 'ok', time: new Date().toISOString() })
);
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

/* Debug endpoint — DISABLED in production. Only available in development. */
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/env-check', (_req, res) => {
    const keys = [
      'MONGODB_URI', 'BUSINESS_MONGODB_URI', 'MEMBER_MONGODB_URI',
      'MEMBER_CLOUDINARY_NAME', 'TWO_FACTOR_API_KEY', 'BACKEND_URL',
    ];
    const result = {};
    for (const k of keys) {
      const v = process.env[k] || '';
      result[k] = v
        ? `SET (len=${v.length}, starts="${v.substring(0, 12)}...")`
        : 'NOT SET';
    }
    res.json(result);
  });
}

app.use('/public', publicRegisterRoutes);
app.use('/public', photoUploadRoutes);
app.use('/public/dir', publicBizDirRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/flow-endpoint', flowEndpointRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/organizers', organizerRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/postings', postingRoutes);
app.use('/api/wings', wingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/districts', districtRoutes);
app.use('/api/flow-images', flowImageRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/category-images', categoryImageRoutes);
app.use('/api/public',          publicApiRoutes);
app.use('/api/web-auth',        webAuthRoutes);
app.use('/api/gallery',         galleryRoutes);
app.use('/api/member-auth',     memberAuthRoutes);
app.use('/api/social',          socialRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found', path: req.originalUrl }));

app.use((err, _req, res, _next) => {
  console.error('[ErrorHandler]', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = parseInt(process.env.PORT || '5050', 10);

async function start() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI not configured');
    process.exit(1);
  }
  try {
    // FIX M9: Add explicit TLS, pool size, and connection timeout settings
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      tls: true,
    });
    console.log('[Mongo] connected');
    try {
      await mongoose.connection.collection('admins').dropIndex('email_1');
    } catch (e) {
      // Ignore if index doesn't exist
    }
  } catch (err) {
    console.error('[Mongo] connection failed:', err.message);
    process.exit(1);
  }

  // Connect member MongoDB (for VaniganMember model) if configured
  if (process.env.MEMBER_MONGODB_URI) {
    try {
      // Warm up the shared member DB connection (Business, Review, VaniganUser, VaniganMember)
      const { getConnection } = require('./services/memberDb');
      getConnection().then(() => {
        // Pre-load models so first requests don't wait
        const Business    = require('./models/Business');
        const Review      = require('./models/Review');
        const VaniganUser = require('./models/VaniganUser');
        // Run lightweight warm-up queries
        Business.findOne({}).select('_id').lean().catch(e => console.warn('[MemberDB/Business] warm-up:', e.message));
        Review.findOne({}).select('_id').lean().catch(e => console.warn('[MemberDB/Review] warm-up:', e.message));
        VaniganUser.findOne({}).select('_id').lean().catch(e => console.warn('[MemberDB/VaniganUser] warm-up:', e.message));
      }).catch(e => console.warn('[MemberDB] warm-up error:', e.message));
    } catch (err) {
      console.warn('[MemberDB] init skipped:', err.message);
    }
  }

  // BUSINESS_MONGODB_URI — seed data (18k records) — warm up read-only connection
  if (process.env.BUSINESS_MONGODB_URI) {
    const { getSeedConnection } = require('./services/seedDb');
    getSeedConnection().catch(() => {});
  }

  try {
    const Admin = require('./models/Admin');
    const bcrypt = require('bcryptjs');
    
    // Seed/upsert superadmin if configured or if count is 0
    const superUsername = process.env.ADMIN_USERNAME || 'admin';
    const superPassword = process.env.ADMIN_PASSWORD;
    const count = await Admin.countDocuments();
    
    if (count === 0 || superPassword) {
      if (!superPassword && process.env.NODE_ENV === 'production') {
        console.error('[Seed] CRITICAL: ADMIN_PASSWORD env var is not set. Refusing to seed a default admin in production. Set ADMIN_PASSWORD and restart.');
        process.exit(1);
      }
      if (!superPassword) {
        console.warn('[Seed] WARNING: ADMIN_PASSWORD not set — using insecure default "admin". DO NOT use in production.');
      }
      const finalPassword = superPassword || 'admin';
      const passwordHash = await bcrypt.hash(finalPassword, 10);
      await Admin.findOneAndUpdate(
        { username: superUsername },
        { $set: { passwordHash, role: 'superadmin' } },
        { upsert: true, new: true }
      );
      console.log(`[Seed] Superadmin upserted: ${superUsername}`);
    }

    // Seed/upsert subadmin if configured
    const subUsername = process.env.SUBADMIN_USERNAME;
    const subPassword = process.env.SUBADMIN_PASSWORD;
    if (subUsername && subPassword) {
      const passwordHash = await bcrypt.hash(subPassword, 10);
      await Admin.findOneAndUpdate(
        { username: subUsername },
        { $set: { passwordHash, role: 'admin' } },
        { upsert: true, new: true }
      );
      console.log(`[Seed] Subadmin upserted: ${subUsername}`);
    }
  } catch (err) {
    console.warn('[Seed] admin seed skipped/failed:', err.message);
  }

  // Ensure FlowImage slots exist
  try {
    const { ensureKeysExist } = require('./services/flowImages');
    await ensureKeysExist();
  } catch (err) {
    console.warn('[Seed] flow images skipped:', err.message);
  }

  // Ensure the three default plan rows exist (admins can edit them later)
  try {
    const Plan = require('./models/Plan');
    const defaults = [
      { code: 'free', name: 'Free', priceLabel: '₹0 / month', description: 'Browse all listings.', sortOrder: 0, features: ['Browse businesses', 'Browse organizers', 'Browse members'] },
      { code: 'premium', name: 'Premium', priceLabel: '₹99 / month', description: 'Priority placement & WhatsApp alerts.', sortOrder: 1, features: ['Priority placement', 'Monthly newsletter'] },
      { code: 'premium_plus', name: 'Premium Plus', priceLabel: '₹199 / month', description: 'All Premium perks + analytics.', sortOrder: 2, features: ['Everything in Premium', 'Listing analytics', 'Dedicated support'] },
    ];
    for (const p of defaults) {
      await Plan.updateOne(
        { code: p.code },
        { $setOnInsert: p },
        { upsert: true }
      );
    }
  } catch (err) {
    console.warn('[Seed] plans skipped:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`[Server] http://localhost:${PORT}`);
  });
}

start();
