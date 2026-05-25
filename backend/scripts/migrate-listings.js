/**
 * migrate-listings.js
 * Parses listings_complete.sql, deduplicates, and imports clean records
 * into the target MongoDB.
 *
 * Usage:  node scripts/migrate-listings.js
 */

require('dotenv').config();
const fs      = require('fs');
const path    = require('path');
const readline = require('readline');
const mongoose = require('mongoose');

const SQL_FILE  = path.join(__dirname, '..', '..', '..', 'listings_complete.sql');
const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://contactgreenailabs_db_user:0jqqC0IeoU0lMKQf@cluster0.4pulawx.mongodb.net/venkatraman?appName=Cluster0';

/* ── Column indices (0-based) ─────────────────────────────────── */
const C = {
  code: 1, name: 8, description: 9, address: 10,
  phone: 12, phone2: 13, email: 15, website: 16,
  profileImage: 20,
  openDays: 23, openTime: 24, closeTime: 25,
  landmark: 29,
  lat_raw: 57, lng_raw: 58,
  status: 59, isDelete1: 61, isDelete2: 62,
  latitude: 70, longitude: 71,
  districtId: 74, assemblyId: 75,
  listingCdt: 82,
};

/* ── TN district name list (for address-based lookup) ─────────── */
const TN_DISTRICTS = [
  'Ariyalur','Chengalpattu','Chennai','Coimbatore','Cuddalore',
  'Dharmapuri','Dindigul','Erode','Kallakurichi','Kancheepuram',
  'Kanyakumari','Karur','Krishnagiri','Madurai','Mayiladuthurai',
  'Nagapattinam','Namakkal','Nilgiris','Perambalur','Pudukkottai',
  'Ramanathapuram','Ranipet','Salem','Sivaganga','Tenkasi',
  'Thanjavur','Theni','Thoothukudi','Tiruchirappalli','Tirunelveli',
  'Tirupathur','Tiruppur','Tiruvallur','Tiruvannamalai','Tiruvarur',
  'Vellore','Villupuram','Virudhunagar',
];
const ALIASES = {
  'tambaram':'Chengalpattu','trichy':'Tiruchirappalli','tiruchy':'Tiruchirappalli',
  'trichur':'Tiruchirappalli','tuticorin':'Thoothukudi','nagercoil':'Kanyakumari',
  'ooty':'Nilgiris','tanjore':'Thanjavur','nellai':'Tirunelveli',
  'kanchipuram':'Kancheepuram',
};
const DISTRICT_LOWER = TN_DISTRICTS.map(d => ({ key: d.toLowerCase(), name: d }));

function guessDistrict(addr) {
  if (!addr) return '';
  const lower = addr.toLowerCase();
  for (const [alias, name] of Object.entries(ALIASES)) {
    if (lower.includes(alias)) return name;
  }
  for (const { key, name } of DISTRICT_LOWER) {
    if (lower.includes(key)) return name;
  }
  return '';
}

/* ── SQL row parser ───────────────────────────────────────────── */
function parseSqlRow(line) {
  let s = line.trim();
  if (s.startsWith('(')) s = s.slice(1);
  if (s.endsWith('),') || s.endsWith(');')) s = s.slice(0, -2);
  else if (s.endsWith(')')) s = s.slice(0, -1);

  const values = [];
  let i = 0;

  while (i < s.length) {
    while (i < s.length && s[i] === ' ') i++;
    if (i >= s.length) break;

    if (s[i] === "'") {
      i++;
      let str = '';
      while (i < s.length) {
        if (s[i] === '\\' && i + 1 < s.length) {
          const c = s[++i];
          if      (c === "'")  str += "'";
          else if (c === '\\') str += '\\';
          else if (c === 'n')  str += '\n';
          else if (c === 'r')  str += '\r';
          else if (c === '"')  str += '"';
          else                 str += '\\' + c;
          i++;
        } else if (s[i] === "'" && s[i + 1] === "'") {
          str += "'"; i += 2;
        } else if (s[i] === "'") {
          i++; break;
        } else {
          str += s[i++];
        }
      }
      values.push(str);
    } else if (s.startsWith('NULL', i)) {
      values.push(null); i += 4;
    } else {
      let val = '';
      while (i < s.length && s[i] !== ',') val += s[i++];
      val = val.trim();
      if (val === '')           values.push(null);
      else if (!isNaN(val))     values.push(Number(val));
      else                      values.push(val);
    }

    if (i < s.length && s[i] === ',') i++;
  }
  return values;
}

/* ── Helpers ──────────────────────────────────────────────────── */
function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractTime(ts) {
  if (!ts) return '';
  const m = String(ts).match(/T(\d{2}:\d{2})/);
  return m ? m[1] : '';
}

function clean(val) {
  return (val || '').toString().trim();
}

function dedupKey(name, phone) {
  const n = (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const p = (phone || '').replace(/\D/g, '');
  return `${n}|${p}`;
}

/* ── Business Schema (inline — no app connection needed) ──────── */
const BusinessSchema = new mongoose.Schema(
  {
    name: String, description: String, category: { type: String, default: '' },
    district: { type: String, default: '' }, assembly: { type: String, default: '' },
    address: String, phone: String, phone2: { type: String, default: '' },
    email: { type: String, default: '' }, website: { type: String, default: '' },
    openDays: { type: String, default: '' }, openTime: { type: String, default: '' },
    closeTime: { type: String, default: '' }, landmark: { type: String, default: '' },
    lat: { type: String, default: '' }, lng: { type: String, default: '' },
    image: { type: String, default: '' }, imagePublicId: { type: String, default: '' },
    ownerPhone: { type: String, default: '' }, listingCode: { type: String, default: '' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

/* ── Main ─────────────────────────────────────────────────────── */
async function run() {
  console.log('Connecting to MongoDB…');
  const conn = await mongoose.createConnection(MONGO_URI).asPromise();
  const Business = conn.model('Business', BusinessSchema);

  /* Drop existing businesses to start fresh */
  await Business.deleteMany({});
  console.log('Cleared existing businesses collection.');

  const seen   = new Map(); // dedupKey → true
  const docs   = [];
  let skippedDeleted = 0, skippedDupe = 0, parseErrors = 0;

  const rl = readline.createInterface({
    input: fs.createReadStream(SQL_FILE, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (!line.startsWith('(')) continue;

    let vals;
    try { vals = parseSqlRow(line); } catch (e) { parseErrors++; continue; }
    if (!vals || vals.length < 83) { parseErrors++; continue; }

    /* Skip deleted records */
    const isDel1 = vals[C.isDelete1];
    const isDel2 = vals[C.isDelete2];
    if (isDel1 === 1 || isDel2 === 1) { skippedDeleted++; continue; }

    const name  = clean(vals[C.name]);
    const phone = clean(vals[C.phone]).replace(/\D/g, '').slice(-10);
    if (!name) { parseErrors++; continue; }

    /* Deduplication */
    const key = dedupKey(name, phone);
    if (seen.has(key)) { skippedDupe++; continue; }
    seen.set(key, true);

    /* District from address */
    const addrText = clean(vals[C.address]);
    const district = guessDistrict(addrText);

    /* Build document */
    const openDays = clean(vals[C.openDays]).replace(/,+$/, '');
    const lat  = clean(vals[C.latitude]  || vals[C.lat_raw]);
    const lng  = clean(vals[C.longitude] || vals[C.lng_raw]);

    docs.push({
      listingCode:  clean(vals[C.code]),
      name,
      description:  stripHtml(clean(vals[C.description])),
      address:      addrText,
      phone:        phone || clean(vals[C.phone]),
      phone2:       clean(vals[C.phone2]).replace(/\D/g, '').slice(-10),
      email:        clean(vals[C.email]),
      website:      clean(vals[C.website]),
      openDays,
      openTime:     extractTime(vals[C.openTime]),
      closeTime:    extractTime(vals[C.closeTime]),
      landmark:     clean(vals[C.landmark]),
      lat, lng,
      district,
      assembly:     '',
      active:       clean(vals[C.status]) === 'Active',
      createdAt:    vals[C.listingCdt] ? new Date(vals[C.listingCdt]) : new Date(),
    });
  }

  /* Batch insert */
  const BATCH = 500;
  let inserted = 0;
  for (let i = 0; i < docs.length; i += BATCH) {
    await Business.insertMany(docs.slice(i, i + BATCH), { ordered: false });
    inserted += Math.min(BATCH, docs.length - i);
    process.stdout.write(`\r  Inserted ${inserted}/${docs.length}…`);
  }

  console.log(`\n\n✅ Done!`);
  console.log(`   Inserted  : ${inserted}`);
  console.log(`   Skipped (deleted) : ${skippedDeleted}`);
  console.log(`   Skipped (duplicate): ${skippedDupe}`);
  console.log(`   Parse errors      : ${parseErrors}`);

  await conn.close();
}

run().catch(err => { console.error('Migration failed:', err); process.exit(1); });
