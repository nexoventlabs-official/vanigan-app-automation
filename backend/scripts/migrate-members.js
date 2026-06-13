/**
 * migrate-members.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Migrates 267 completed members from the old DB into MEMBER_MONGODB_URI.
 *
 * Per member:
 *   1. Download profile photo from old Cloudinary (vanigan/member_photos/)
 *      → re-upload to MEMBER_CLOUDINARY under vanigan_members/{phone}/photos/
 *   2. Map all fields to VaniganMember schema
 *   3. Insert into MEMBER_MONGODB_URI (skip duplicates by phone)
 *   4. Post-process: resolve referredBy links between members
 *
 * Card images are NOT copied — cards are generated client-side on demand.
 *
 * Usage:
 *   node scripts/migrate-members.js            ← dry run (no writes)
 *   node scripts/migrate-members.js --live     ← actually migrates
 *   node scripts/migrate-members.js --live --limit 5   ← test with 5
 * ─────────────────────────────────────────────────────────────────────────────
 */
require('dotenv').config();
const mongoose   = require('mongoose');
const cloudinary = require('cloudinary').v2;
const axios      = require('axios');
const crypto     = require('crypto');

const LIVE  = process.argv.includes('--live');
const LIMIT = (() => {
  const i = process.argv.indexOf('--limit');
  return i !== -1 ? parseInt(process.argv[i + 1], 10) : 0;
})();

/* ── Source credentials (old DB) ── */
const SRC_MONGO = 'mongodb+srv://tmisperiviharikrishna_db_user:9n02NuG61RRShSB2@cluster0.uolos8o.mongodb.net/?appName=Cluster0';
const SRC_DB    = 'vanigan';

/* ── Destination config (from .env) ── */
const DST_MONGO = process.env.MEMBER_MONGODB_URI;
const DST_CLOUD = {
  cloud_name: process.env.MEMBER_CLOUDINARY_NAME,
  api_key:    process.env.MEMBER_CLOUDINARY_KEY,
  api_secret: process.env.MEMBER_CLOUDINARY_SECRET,
};

const MEMBER_ROOT = 'vanigan_members';

/* ─────────────────────────────────── helpers ── */

async function downloadBuffer(url) {
  if (!url) return null;
  try {
    const r = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
    return Buffer.from(r.data);
  } catch (err) {
    console.warn('    ⚠ download failed:', url.slice(-60), '-', err.message);
    return null;
  }
}

function uploadToMemberCloud(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { ...DST_CLOUD, folder, resource_type: 'image' },
      (err, result) => err ? reject(err) : resolve(result)
    );
    stream.end(buffer);
  });
}

function generateId(prefix, len = 4) {
  return prefix + crypto.randomBytes(len).toString('hex').toUpperCase();
}

async function uniqueMembershipId(col) {
  let id, exists;
  do {
    id = generateId('TNVS-');
    exists = await col.findOne({ membershipId: id }, { projection: { _id: 1 } });
  } while (exists);
  return id;
}

async function uniqueReferralCode(col) {
  let code, exists;
  do {
    code = generateId('REF-');
    exists = await col.findOne({ referralCode: code }, { projection: { _id: 1 } });
  } while (exists);
  return code;
}

function calculateAge(dob) {
  if (!dob) return 0;
  try {
    let d, m, y;
    if (dob.includes('/')) { [d, m, y] = dob.split('/'); }
    else if (dob.includes('-')) { [y, m, d] = dob.split('-'); }
    else return 0;
    const birth = new Date(`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`);
    const now   = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    if (now < new Date(now.getFullYear(), birth.getMonth(), birth.getDate())) age--;
    return age > 0 ? age : 0;
  } catch { return 0; }
}

/* ─────────────────────────────────── main ── */

async function run() {
  console.log('\n══════════════════════════════════════════════════════');
  console.log(LIVE ? '🔴 LIVE RUN — data will be written' : '🟡 DRY RUN — no writes');
  if (LIMIT) console.log('   Limit: ' + LIMIT + ' members');
  console.log('══════════════════════════════════════════════════════\n');

  /* ── Connect source ── */
  console.log('Connecting to source DB...');
  const srcConn = await mongoose.createConnection(SRC_MONGO, { dbName: SRC_DB }).asPromise();
  const srcDb   = srcConn.db;

  /* ── Connect destination ── */
  console.log('Connecting to destination DB (MEMBER_MONGODB_URI)...');
  const dstConn = await mongoose.createConnection(DST_MONGO).asPromise();
  const dstDb   = dstConn.db;
  const col     = dstDb.collection('vaniganmembers');

  /* ── Configure destination Cloudinary ── */
  cloudinary.config(DST_CLOUD);

  /* ── Fetch completed members from BOTH collections ── */
  const filter     = { details_completed: true };
  const membersRaw = await srcDb.collection('members').find(filter).toArray();
  const manualRaw  = await srcDb.collection('manual_entries').find(filter).toArray();
  let allSrc = [...membersRaw, ...manualRaw];

  // Deduplicate by mobile
  const seen = new Set();
  allSrc = allSrc.filter(m => {
    const key = String(m.mobile || '').replace(/\D/g, '');
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`Source completed members: ${allSrc.length} (members:${membersRaw.length} + manual:${manualRaw.filter(m=>m.details_completed).length})`);

  if (LIMIT) allSrc = allSrc.slice(0, LIMIT);

  /* ── Stats ── */
  let inserted = 0, skipped = 0, photoOk = 0, errors = 0;

  for (let i = 0; i < allSrc.length; i++) {
    const src   = allSrc[i];
    const phone = String(src.mobile || '').replace(/\D/g, '');
    const label = `[${i+1}/${allSrc.length}] ${src.name || '?'} (${phone})`;

    console.log('\n' + label);

    if (!phone || phone.length < 10) {
      console.log('  ⚠ invalid phone — skip');
      skipped++; continue;
    }

    /* Check duplicate in destination */
    const existing = await col.findOne({ phone }, { projection: { _id: 1 } });
    if (existing) {
      console.log('  ⏭ already exists — skip');
      skipped++; continue;
    }

    /* ── Profile photo ── */
    let photoUrl = '', photoPublicId = '';
    if (src.photo_url) {
      console.log('  📷 downloading profile photo...');
      const buf = await downloadBuffer(src.photo_url);
      if (buf && LIVE) {
        try {
          const r   = await uploadToMemberCloud(buf, `${MEMBER_ROOT}/${phone}/photos`);
          photoUrl      = r.secure_url;
          photoPublicId = r.public_id;
          photoOk++;
          console.log('  ✅ photo → ' + photoPublicId);
        } catch (e) {
          console.warn('  ⚠ photo upload failed:', e.message);
          photoUrl = src.photo_url; // keep original URL as fallback
        }
      } else if (buf) {
        console.log('  (dry) would upload photo');
        photoUrl = src.photo_url;
        photoOk++;
      }
    }

    /* ── Generate IDs ── */
    const membershipId = LIVE ? await uniqueMembershipId(col) : 'TNVS-DRY00001';
    const referralCode = LIVE ? await uniqueReferralCode(col)  : 'REF-DRY00001';

    /* ── Build document ── */
    const doc = {
      membershipId,
      referralCode,
      referredBy:     '',   // resolved in post-processing
      referralCount:  0,
      phone,
      secondaryPhone: String(src.contact_number || '').replace(/\D/g, '').slice(-10),
      pinHash:        src.pin_hash || '',
      name:           String(src.name || '').trim(),
      hasEpic:        !!(src.epic_no),
      epicNo:         String(src.epic_no || '').toUpperCase().trim(),
      assemblyName:   String(src.assembly || '').trim(),
      assemblyNo:     '',
      district:       String(src.district || '').trim(),
      zone:           String(src.zone || '').trim(),
      dob:            String(src.dob || '').trim(),
      age:            parseInt(src.age, 10) || calculateAge(src.dob),
      bloodGroup:     String(src.blood_group || '').trim(),
      gender:         '',
      businessAddress: String(src.address || '').trim(),
      photoUrl,
      photoPublicId,
      bizName:         '',
      bizCategory:     '',
      bizSubCat:       '',
      businessId:      null,
      following:       [],
      savedBusinesses: [],
      active:          true,
      isOrganizer:     false,
      // Temp fields for referral post-processing (removed after)
      _srcUniqueId:   src.unique_id   || '',
      _srcReferredBy: src.referred_by || '',
      createdAt: src.created_at ? new Date(src.created_at) : new Date(),
      updatedAt: new Date(),
    };

    if (!LIVE) {
      console.log(`  (dry) would insert: ${doc.membershipId} / ${doc.name}`);
      inserted++; continue;
    }

    try {
      await col.insertOne(doc);
      console.log(`  ✅ inserted: ${membershipId}`);
      inserted++;
    } catch (e) {
      console.error('  ❌ insert failed:', e.message);
      errors++;
    }
  }

  /* ── Post-processing: resolve referredBy links ── */
  if (LIVE && inserted > 0) {
    console.log('\n── Post-processing referredBy links ──');

    // Build map: old unique_id → new membershipId
    const allNew = await col
      .find({ _srcUniqueId: { $exists: true, $ne: '' } })
      .project({ _srcUniqueId: 1, _srcReferredBy: 1, membershipId: 1 })
      .toArray();

    const uidMap = {};
    allNew.forEach(m => { if (m._srcUniqueId) uidMap[m._srcUniqueId] = m.membershipId; });

    let linked = 0;
    for (const m of allNew) {
      if (!m._srcReferredBy) continue;
      const referrerMid = uidMap[m._srcReferredBy];
      if (!referrerMid) continue;
      await col.updateOne({ _id: m._id }, { $set: { referredBy: referrerMid } });
      await col.updateOne({ membershipId: referrerMid }, { $inc: { referralCount: 1 } });
      linked++;
    }
    console.log(`  Referral links resolved: ${linked}`);

    // Remove temp fields
    await col.updateMany({}, { $unset: { _srcUniqueId: '', _srcReferredBy: '' } });
    console.log('  Temp fields cleaned up.');
  }

  /* ── Summary ── */
  console.log('\n══════════════════════════════════════════════════════');
  console.log('MIGRATION SUMMARY');
  console.log(`  Inserted  : ${inserted}`);
  console.log(`  Skipped   : ${skipped}`);
  console.log(`  Photos OK : ${photoOk}`);
  console.log(`  Errors    : ${errors}`);
  console.log(LIVE ? '✅ Done.' : '✅ Dry run complete. Run with --live to migrate.');
  console.log('══════════════════════════════════════════════════════\n');

  await srcConn.close();
  await dstConn.close();
}

run().catch(err => {
  console.error('\n❌ Fatal:', err.message);
  process.exit(1);
});
