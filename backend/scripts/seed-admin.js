/**
 * Re-seed the admin user (uses ADMIN_USERNAME / ADMIN_PASSWORD from .env).
 * Useful if you forgot the password.
 *
 * FIX C4: Blocks execution in production if ADMIN_PASSWORD is not set.
 *
 * Usage: npm run seed:admin
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  try {
    await mongoose.connection.collection('admins').dropIndex('email_1');
    console.log('Dropped obsolete email_1 unique index from admins collection');
  } catch (e) {
    // Ignore if index doesn't exist
  }

  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ ADMIN_PASSWORD must be set in production. Refusing to seed with a default password.');
      await mongoose.disconnect();
      process.exit(1);
    }
    console.warn('⚠️  ADMIN_PASSWORD not set — using insecure default "admin". DO NOT use in production.');
  }

  const finalPassword = password || 'admin';
  const passwordHash = await bcrypt.hash(finalPassword, 10);
  const updated = await Admin.findOneAndUpdate(
    { username },
    { $set: { passwordHash, role: 'superadmin' } },
    { upsert: true, new: true }
  );
  console.log('✅ Admin upserted:', { username: updated.username, role: updated.role });

  const subUsername = process.env.SUBADMIN_USERNAME;
  const subPassword = process.env.SUBADMIN_PASSWORD;
  if (subUsername && subPassword) {
    const subHash = await bcrypt.hash(subPassword, 10);
    const subUpdated = await Admin.findOneAndUpdate(
      { username: subUsername },
      { $set: { passwordHash: subHash, role: 'admin' } },
      { upsert: true, new: true }
    );
    console.log('✅ Subadmin upserted:', { username: subUpdated.username, role: subUpdated.role });
  }

  await mongoose.disconnect();
})();
