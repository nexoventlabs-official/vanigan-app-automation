/**
 * import-seed-members.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Imports 208 showcase members from member_list_12-06-26.json
 * into BUSINESS_MONGODB_URI as a `seedmembers` collection.
 *
 * SHOWCASE-ONLY — never touches MEMBER_MONGODB_URI or real VaniganMember data.
 *
 * Usage:
 *   node scripts/import-seed-members.js           ← dry run
 *   node scripts/import-seed-members.js --live    ← actually imports
 * ─────────────────────────────────────────────────────────────────────────────
 */
require('dotenv').config();
const mongoose = require('mongoose');
const path     = require('path');
const fs       = require('fs');

const LIVE     = process.argv.includes('--live');
const JSON_PATH = path.join(__dirname, '..', '..', 'member_list_12-06-26.json');

async function run() {
  console.log('\n══════════════════════════════════════════════════════');
  console.log(LIVE ? '🔴 LIVE — importing to BUSINESS_MONGODB_URI' : '🟡 DRY RUN — no writes');
  console.log('══════════════════════════════════════════════════════\n');

  const raw      = fs.readFileSync(JSON_PATH, 'utf8');
  const jsonData = JSON.parse(raw);
  const source   = jsonData.members || [];
  console.log('Source members in JSON:', source.length);

  const conn = await mongoose.createConnection(process.env.BUSINESS_MONGODB_URI).asPromise();
  const col  = conn.db.collection('seedmembers');
  console.log('Connected to BUSINESS_MONGODB_URI');

  if (LIVE) {
    const existing = await col.countDocuments();
    if (existing > 0) {
      await col.drop();
      console.log('Dropped existing seedmembers collection (' + existing + ' docs)');
    }
  }

  let inserted = 0, skipped = 0;
  const docs = [];

  for (const m of source) {
    const name = (m.name || '').trim();
    if (!name) { skipped++; continue; }

    // Mobile may have multiple numbers separated by " / " — take first valid one
    const rawMobile = String(m.mobile || '');
    const phone = rawMobile.split(/[\/,]/).map(p => p.replace(/\D/g, '').trim())
      .find(p => p.length >= 10) || '';

    docs.push({
      name,
      phone,
      district:    (m.district || '').trim(),
      designation: (m.designation || 'Member').trim(),
      assemblyName: '',
      zone:        '',
      photoUrl:    '',
      active:      true,
      isSeed:      true,
      createdAt:   new Date(),
      updatedAt:   new Date(),
    });
    inserted++;
  }

  console.log('Valid members to insert :', inserted);
  console.log('Skipped (no name)       :', skipped);

  if (!LIVE) {
    console.log('\nSample (first 3):');
    docs.slice(0, 3).forEach(d => {
      console.log(' ', d.name, '|', d.phone, '|', d.district);
    });
    console.log('\n✅ Dry run complete. Run with --live to import.\n');
    await conn.close();
    return;
  }

  await col.insertMany(docs);
  console.log('✅ Inserted', docs.length, 'seed members into seedmembers collection');

  await col.createIndex({ district: 1 });
  await col.createIndex({ phone:    1 });
  console.log('Indexes created.');

  await conn.close();
  console.log('\n══════════════════════════════════════════════════════');
  console.log('✅ Import complete.');
  console.log('══════════════════════════════════════════════════════\n');
}

run().catch(err => {
  console.error('\n❌ Fatal:', err.message);
  process.exit(1);
});
