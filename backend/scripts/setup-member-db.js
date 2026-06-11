/**
 * setup-member-db.js
 * One-time setup script for the new member MongoDB (MEMBER_MONGODB_URI).
 * 
 * What it does:
 * 1. Connects to MEMBER_MONGODB_URI
 * 2. Clears any existing dummy/test data from wati_panel DB
 * 3. Creates proper indexes on the VaniganMember collection
 * 4. Verifies connection to voter DB (read-only)
 * 
 * Run: node scripts/setup-member-db.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  const memberUri = process.env.MEMBER_MONGODB_URI;
  const voterUri  = process.env.MONGO_VOTER_URL;

  if (!memberUri) { console.error('MEMBER_MONGODB_URI not set'); process.exit(1); }

  /* ── Connect to member DB ── */
  console.log('\n[1] Connecting to member DB...');
  const memberConn = await mongoose.createConnection(memberUri, {
    serverSelectionTimeoutMS: 10000,
  }).asPromise();
  console.log('    ✅ Connected:', memberUri.split('@')[1]?.split('/')[0]);

  /* ── List existing collections ── */
  const db = memberConn.db;
  const cols = await db.listCollections().toArray();
  console.log('\n[2] Existing collections in wati_panel:');
  if (cols.length === 0) {
    console.log('    (empty — clean start)');
  } else {
    for (const c of cols) {
      const count = await db.collection(c.name).estimatedDocumentCount();
      console.log(`    • ${c.name}: ${count} documents`);
    }
  }

  /* ── Drop all collections except VaniganMember (clean slate) ── */
  console.log('\n[3] Dropping non-member collections (dummy data cleanup)...');
  const KEEP = ['vanigamembers', 'vaniganmembers']; // keep member collection if exists
  let dropped = 0;
  for (const c of cols) {
    if (!KEEP.includes(c.name.toLowerCase())) {
      await db.collection(c.name).drop().catch(() => {});
      console.log(`    🗑  Dropped: ${c.name}`);
      dropped++;
    }
  }
  if (dropped === 0) console.log('    (nothing to drop)');

  /* ── Create VaniganMember collection with indexes ── */
  console.log('\n[4] Setting up VaniganMember collection indexes...');
  const memberSchema = new mongoose.Schema({
    membershipId:    { type: String, trim: true },
    phone:           { type: String, required: true, unique: true, trim: true },
    secondaryPhone:  { type: String, default: '', trim: true },
    pinHash:         { type: String, required: true },
    name:            { type: String, required: true, trim: true },
    hasEpic:         { type: Boolean, default: false },
    epicNo:          { type: String, default: '', trim: true, uppercase: true },
    assemblyName:    { type: String, default: '', trim: true },
    assemblyNo:      { type: String, default: '', trim: true },
    district:        { type: String, default: '', trim: true },
    zone:            { type: String, default: '', trim: true },
    dob:             { type: String, default: '' },
    age:             { type: Number, default: 0 },
    bloodGroup:      { type: String, default: '', trim: true },
    gender:          { type: String, default: '', trim: true },
    businessAddress: { type: String, default: '', trim: true },
    photoUrl:        { type: String, default: '' },
    photoPublicId:   { type: String, default: '' },
    bizName:         { type: String, default: '', trim: true },
    bizCategory:     { type: String, default: '', trim: true },
    bizSubCat:       { type: String, default: '', trim: true },
    businessId:      { type: mongoose.Schema.Types.ObjectId, default: null },
    active:          { type: Boolean, default: true },
  }, { timestamps: true });

  memberSchema.index({ phone: 1 }, { unique: true });
  memberSchema.index({ epicNo: 1 }, { sparse: true });
  memberSchema.index({ membershipId: 1 }, { unique: true, sparse: true });

  const VaniganMember = memberConn.model('VaniganMember', memberSchema);
  await VaniganMember.createIndexes();
  console.log('    ✅ Indexes created on VaniganMember');

  /* ── Verify voter DB ── */
  if (voterUri) {
    console.log('\n[5] Verifying voter DB connection (read-only)...');
    try {
      const voterConn = await mongoose.createConnection(voterUri, {
        serverSelectionTimeoutMS: 10000,
        dbName: 'voter_db',
      }).asPromise();
      const voterCols = await voterConn.db.listCollections().toArray();
      const assCols = voterCols.filter(c => /^ass_\d+$/.test(c.name));
      console.log(`    ✅ Voter DB connected — ${assCols.length} assembly collections found`);
      await voterConn.close();
    } catch (err) {
      console.warn('    ⚠  Voter DB connection failed:', err.message);
    }
  }

  await memberConn.close();
  console.log('\n✅ Member DB setup complete!\n');
  process.exit(0);
}

run().catch(err => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
