/**
 * import-seed-organizers.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Imports 628 TNVS organizers from tnvs_organizer_report_25-05-26.json
 * into BUSINESS_MONGODB_URI as a `seedorganizers` collection.
 *
 * This is SHOWCASE-ONLY data — it lives in BUSINESS_MONGODB_URI and is
 * NEVER touched by the live Organizer model (which uses MEMBER_MONGODB_URI).
 *
 * Usage:
 *   node scripts/import-seed-organizers.js           ← dry run
 *   node scripts/import-seed-organizers.js --live    ← actually imports
 * ─────────────────────────────────────────────────────────────────────────────
 */
require('dotenv').config();
const mongoose = require('mongoose');
const path     = require('path');
const fs       = require('fs');

const LIVE = process.argv.includes('--live');
const JSON_PATH = path.join(__dirname, '..', '..', 'tnvs_organizer_report_25-05-26.json');

async function run() {
  console.log('\n══════════════════════════════════════════════════════');
  console.log(LIVE ? '🔴 LIVE — importing to BUSINESS_MONGODB_URI' : '🟡 DRY RUN — no writes');
  console.log('══════════════════════════════════════════════════════\n');

  /* ── Load JSON ── */
  const raw      = fs.readFileSync(JSON_PATH, 'utf8');
  const jsonData = JSON.parse(raw);
  const source   = jsonData.organizers || [];
  console.log('Source organizers in JSON:', source.length);

  /* ── Connect to BUSINESS_MONGODB_URI ── */
  const conn = await mongoose.createConnection(process.env.BUSINESS_MONGODB_URI).asPromise();
  const col  = conn.db.collection('seedorganizers');
  console.log('Connected to BUSINESS_MONGODB_URI');

  if (LIVE) {
    // Clear existing seed organizers first
    const existing = await col.countDocuments();
    if (existing > 0) {
      await col.drop();
      console.log('Dropped existing seedorganizers collection (' + existing + ' docs)');
    }
  }

  /* ── Map + insert ── */
  let inserted = 0, skipped = 0;
  const docs = [];

  for (const org of source) {
    const name = (org.name || '').trim();
    if (!name) { skipped++; continue; }

    // Use first mobile number as phone
    const phone = (org.mobile || []).map(m => String(m).replace(/\D/g, '')).filter(m => m.length >= 10)[0] || '';

    // Clean up district — some entries embed designation in the name field
    const district   = (org.district || '').trim();
    const designation = (org.designation || '').trim();

    // Extract clean district (first word group before any extra text)
    const cleanDistrict = district.split(/\s+/)[0] || '';

    docs.push({
      name,
      phone,
      role:        designation,
      district:    district,   // keep full for display
      assembly:    '',         // not provided in JSON
      description: designation,
      email:       '',
      image:       '',
      imagePublicId: '',
      active:      true,
      isSeed:      true,
      createdAt:   new Date(),
      updatedAt:   new Date(),
    });
    inserted++;
  }

  console.log('Valid organizers to insert:', inserted);
  console.log('Skipped (no name)         :', skipped);

  if (!LIVE) {
    console.log('\nSample (first 3):');
    docs.slice(0, 3).forEach(d => {
      console.log(' ', d.name, '|', d.phone, '|', d.district, '|', d.role.substring(0, 40));
    });
    console.log('\n✅ Dry run complete. Run with --live to import.\n');
    await conn.close();
    return;
  }

  // Insert in bulk
  await col.insertMany(docs);
  console.log('✅ Inserted', docs.length, 'seed organizers into seedorganizers collection');

  // Create indexes
  await col.createIndex({ district: 1 });
  await col.createIndex({ phone: 1 });
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
