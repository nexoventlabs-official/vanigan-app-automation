/**
 * DANGER — drops every collection in the configured MONGODB_URI database.
 *
 * FIX H6: Production guard + interactive confirmation added.
 *
 * Usage: npm run reset:mongo
 */
require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');

(async () => {
  // Block execution entirely in production
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ reset:mongo is DISABLED in production environments.');
    console.error('   Set NODE_ENV=development if you really need to run this against a non-production DB.');
    process.exit(1);
  }

  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not set.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const dbName = db.databaseName;
  const collections = await db.listCollections().toArray();

  console.log(`\n⚠️  WARNING: This will permanently drop ALL ${collections.length} collections in database: "${dbName}"`);
  console.log('   This action CANNOT be undone.\n');

  // Require an explicit typed confirmation
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  await new Promise((resolve, reject) => {
    rl.question(`   Type "DROP ${dbName}" to confirm: `, (answer) => {
      rl.close();
      if (answer.trim() !== `DROP ${dbName}`) {
        console.log('\nAborted — no changes made.');
        process.exit(0);
      }
      resolve();
    });
  });

  console.log('');
  for (const col of collections) {
    try {
      await db.dropCollection(col.name);
      console.log(`  ✓ dropped ${col.name}`);
    } catch (err) {
      console.warn(`  ✗ ${col.name}: ${err.message}`);
    }
  }

  console.log('\n✅ Mongo reset complete.');
  await mongoose.disconnect();
})();
