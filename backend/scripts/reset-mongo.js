/**
 * DANGER — drops every collection in the configured MONGODB_URI database.
 *
 * Used during initial setup to wipe any leftover data so the Vanigan
 * project starts from a known-clean slate.
 *
 * Usage: npm run reset:mongo
 */
require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not set.');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const dbName = db.databaseName;
  const collections = await db.listCollections().toArray();
  console.log(`• Database: ${dbName}`);
  console.log(`• Collections found: ${collections.length}`);

  for (const col of collections) {
    try {
      await db.dropCollection(col.name);
      console.log(`  ✓ dropped ${col.name}`);
    } catch (err) {
      console.warn(`  ✗ ${col.name}: ${err.message}`);
    }
  }

  console.log('✅ Mongo reset complete.');
  await mongoose.disconnect();
})();
