require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const authRoutes = require('./routes/auth');
const publicRegisterRoutes = require('./routes/publicRegister');
const publicBizDirRoutes   = require('./routes/publicBizDir');
const webhookRoutes = require('./routes/webhook');
const flowEndpointRoutes = require('./routes/flowEndpoint');
const businessRoutes = require('./routes/businesses');
const organizerRoutes = require('./routes/organizers');
const memberRoutes = require('./routes/members');
const planRoutes = require('./routes/plans');
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

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || origin === 'null') return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      if (process.env.NODE_ENV !== 'production' && /^http:\/\/localhost(:\d+)?$/.test(origin)) {
        return cb(null, true);
      }
      return cb(new Error('CORS blocked: ' + origin));
    },
    credentials: true,
  })
);

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

/* Debug endpoint — shows which env vars are present (values masked) */
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

app.use('/public', publicRegisterRoutes);
app.use('/public/dir', publicBizDirRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/flow-endpoint', flowEndpointRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/organizers', organizerRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/plans', planRoutes);
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
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
    console.log('[Mongo] connected');
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

  // BUSINESS_MONGODB_URI is now READ-ONLY seed data (18k records) — no warm-up needed

  // Seed default admin if none exists
  try {
    const Admin = require('./models/Admin');
    const bcrypt = require('bcryptjs');
    const count = await Admin.countDocuments();
    if (count === 0) {
      const username = process.env.ADMIN_USERNAME || 'admin';
      const password = process.env.ADMIN_PASSWORD || 'admin';
      const passwordHash = await bcrypt.hash(password, 10);
      await Admin.create({ username, passwordHash, role: 'superadmin' });
      console.log(`[Seed] Default admin created: ${username}`);
    }
  } catch (err) {
    console.warn('[Seed] admin seed skipped:', err.message);
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
