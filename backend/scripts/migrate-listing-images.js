/**
 * migrate-listing-images.js
 * ---------------------------------------------------------------------------
 * Uploads the business listing images that PHYSICALLY EXIST in the
 * public-html backup folder to the BUSINESS Cloudinary account, and maps
 * them onto the matching MongoDB business documents (joined by listingCode).
 *
 * Safety / correctness guarantees:
 *   • Only files that actually exist on disk are uploaded (no guessing).
 *   • Businesses are matched by listingCode (unique key) — never by name.
 *   • Deterministic Cloudinary public_ids (overwrite:true) => re-runs never
 *     create duplicates.
 *   • A checkpoint file records processed listingCodes so the job can resume.
 *   • Deleted SQL rows are skipped. Businesses with no present file are left
 *     untouched.
 *
 * Usage:
 *   node scripts/migrate-listing-images.js            # DRY RUN (no uploads, no writes)
 *   node scripts/migrate-listing-images.js --live     # real uploads + DB updates
 *   node scripts/migrate-listing-images.js --live --limit 50   # only first 50 (test batch)
 *   node scripts/migrate-listing-images.js --live --fresh       # ignore checkpoint, start over
 * ---------------------------------------------------------------------------
 */
require('dotenv').config();
const fs        = require('fs');
const path      = require('path');
const readline  = require('readline');
const mongoose  = require('mongoose');
const cloudinary = require('cloudinary').v2;

/* ── Paths & config ─────────────────────────────────────────── */
const SQL_FILE     = 'c:\\Users\\Admin\\Desktop\\Prodution\\listings_complete (1).sql';
const LISTINGS_DIR = 'c:\\Users\\Admin\\Desktop\\Prodution\\public-html\\public_html\\public\\images\\listings';
const CHECKPOINT   = path.join(__dirname, '.image-migration-checkpoint.json');

const MONGO_URI = process.env.BUSINESS_MONGODB_URI;
const CLOUD = {
  cloud_name: process.env.BUSINESS_CLOUDINARY_NAME,
  api_key:    process.env.BUSINESS_CLOUDINARY_KEY,
  api_secret: process.env.BUSINESS_CLOUDINARY_SECRET,
};
const ROOT   = 'vanigan_biz';
const FOLDER = `${ROOT}/businesses`;
const GALLERY_FOLDER = `${ROOT}/businesses/gallery`;

/* ── CLI flags ──────────────────────────────────────────────── */
const args  = process.argv.slice(2);
const LIVE  = args.includes('--live');
const FRESH = args.includes('--fresh');
const CONCURRENCY = 5;
let LIMIT = Infinity;
const li = args.indexOf('--limit');
if (li !== -1 && args[li + 1]) LIMIT = parseInt(args[li + 1], 10) || Infinity;

/* ── SQL column indices ─────────────────────────────────────── */
const C = { code:1, name:8, profile:20, cover:21, gallery:22, del1:61, del2:62 };

/* ── SQL row parser (same dialect as migrate-listings.js) ───── */
function parseSqlRow(line){let s=line.trim();if(s.startsWith('('))s=s.slice(1);if(s.endsWith('),')||s.endsWith(');'))s=s.slice(0,-2);else if(s.endsWith(')'))s=s.slice(0,-1);const values=[];let i=0;while(i<s.length){while(i<s.length&&s[i]===' ')i++;if(i>=s.length)break;if(s[i]==="'"){i++;let str='';while(i<s.length){if(s[i]==='\\'&&i+1<s.length){const c=s[++i];if(c==="'")str+="'";else if(c==='\\')str+='\\';else if(c==='n')str+='\n';else if(c==='r')str+='\r';else if(c==='"')str+='"';else str+='\\'+c;i++;}else if(s[i]==="'"&&s[i+1]==="'"){str+="'";i+=2;}else if(s[i]==="'"){i++;break;}else{str+=s[i++];}}values.push(str);}else if(s.startsWith('NULL',i)){values.push(null);i+=4;}else{let val='';while(i<s.length&&s[i]!==',')val+=s[i++];val=val.trim();if(val==='')values.push(null);else if(!isNaN(val))values.push(Number(val));else values.push(val);}if(i<s.length&&s[i]===',')i++;}return values;}
function splitMulti(v){if(!v)return[];return String(v).split(/[,;|]/).map(x=>x.trim()).filter(Boolean);}
function basename(v){if(!v)return'';let s=String(v).trim().replace(/\\/g,'/');const p=s.split('/');return p[p.length-1].trim();}

/* ── checkpoint helpers ─────────────────────────────────────── */
function loadCheckpoint(){
  if (FRESH) return new Set();
  try { return new Set(JSON.parse(fs.readFileSync(CHECKPOINT,'utf8'))); }
  catch { return new Set(); }
}
function saveCheckpoint(set){
  try { fs.writeFileSync(CHECKPOINT, JSON.stringify([...set])); } catch {}
}

/* ── cloudinary upload (deterministic, overwrite) ───────────── */
async function uploadFile(absPath, folder, publicId){
  return cloudinary.uploader.upload(absPath, {
    folder,
    public_id: publicId,
    overwrite: true,
    invalidate: true,
    resource_type: 'image',
    unique_filename: false,
    use_filename: false,
  });
}

/* ── main ───────────────────────────────────────────────────── */
async function run(){
  console.log('============================================================');
  console.log(' Vanigan business image migration');
  console.log(' Mode:', LIVE ? 'LIVE (uploads + DB writes)' : 'DRY RUN (no changes)');
  if (LIMIT !== Infinity) console.log(' Limit:', LIMIT, 'businesses');
  console.log('============================================================\n');

  if (!MONGO_URI) throw new Error('BUSINESS_MONGODB_URI missing');
  if (LIVE && (!CLOUD.cloud_name || !CLOUD.api_key || !CLOUD.api_secret))
    throw new Error('BUSINESS_CLOUDINARY_* env vars missing');
  cloudinary.config(CLOUD);

  /* 1. index physical files (lowercase -> actual filename) */
  const fileMap = new Map();
  for (const f of fs.readdirSync(LISTINGS_DIR)) fileMap.set(f.toLowerCase(), f);
  console.log('Physical files in listings folder:', fileMap.size);

  /* 2. load Mongo businesses keyed by listingCode */
  const conn = await mongoose.createConnection(MONGO_URI).asPromise();
  const Business = conn.model('Business', new mongoose.Schema({}, { strict:false }), 'businesses');
  const docs = await Business.find({}, { listingCode:1 }).lean();
  const codeToId = new Map();
  for (const d of docs){ const c=(d.listingCode||'').trim(); if(c) codeToId.set(c, d._id); }
  console.log('Mongo businesses:', docs.length, '| distinct codes:', codeToId.size, '\n');

  /* 3. build the work list from SQL (only mappable, present-file rows) */
  const work = [];
  const rl = readline.createInterface({ input: fs.createReadStream(SQL_FILE,{encoding:'utf8'}), crlfDelay: Infinity });
  for await (const line of rl){
    if(!line.startsWith('('))continue;
    let v;try{v=parseSqlRow(line);}catch(e){continue;}
    if(!v||v.length<83)continue;
    if(v[C.del1]===1||v[C.del2]===1)continue;             // skip deleted
    const code=(v[C.code]||'').toString().trim();
    const _id = codeToId.get(code);
    if(!_id)continue;                                      // must exist in Mongo

    const prof = basename(v[C.profile]);
    const cov  = basename(v[C.cover]);
    const gal  = splitMulti(v[C.gallery]).map(basename);

    const profFile = prof && fileMap.get(prof.toLowerCase());
    const covFile  = cov  && fileMap.get(cov.toLowerCase());
    const galFiles = [];
    const seenGal = new Set();
    for (const g of gal){
      const real = fileMap.get(g.toLowerCase());
      if (real && !seenGal.has(real.toLowerCase())){ seenGal.add(real.toLowerCase()); galFiles.push(real); }
    }
    if(!profFile && !covFile && galFiles.length===0) continue;  // nothing present

    work.push({ code, _id, profFile, covFile, galFiles });
  }
  console.log('Businesses with at least one present image:', work.length, '\n');

  /* 4. process */
  const done = loadCheckpoint();
  let processed=0, skippedDone=0, uploads=0, updatedDocs=0, errors=0;
  const queue = work.filter(w => !done.has(w.code)).slice(0, LIMIT);
  console.log('Already done (checkpoint):', done.size, '| To process now:', queue.length, '\n');

  let idx = 0;
  async function worker(){
    while (idx < queue.length){
      const w = queue[idx++];
      const n = idx;
      try {
        const set = {};
        if (w.profFile){
          const abs = path.join(LISTINGS_DIR, w.profFile);
          if (LIVE){ const r = await uploadFile(abs, FOLDER, `${w.code}_profile`); set.image=r.secure_url; set.imagePublicId=r.public_id; }
          uploads++;
        }
        if (w.covFile){
          const abs = path.join(LISTINGS_DIR, w.covFile);
          if (LIVE){ const r = await uploadFile(abs, FOLDER, `${w.code}_cover`); set.coverImage=r.secure_url; set.coverImagePublicId=r.public_id; }
          uploads++;
        }
        if (w.galFiles.length){
          const galArr = [];
          for (let g=0; g<w.galFiles.length; g++){
            const abs = path.join(LISTINGS_DIR, w.galFiles[g]);
            if (LIVE){ const r = await uploadFile(abs, GALLERY_FOLDER, `${w.code}_g${g}`); galArr.push({ url:r.secure_url, publicId:r.public_id }); }
            uploads++;
          }
          if (LIVE && galArr.length) set.galleryImages = galArr;
        }
        // if no profile but cover/gallery exists, also use first available as main `image` so the card always shows something
        if (LIVE && !set.image){
          if (set.coverImage){ set.image=set.coverImage; set.imagePublicId=set.coverImagePublicId; }
          else if (set.galleryImages && set.galleryImages[0]){ set.image=set.galleryImages[0].url; set.imagePublicId=set.galleryImages[0].publicId; }
        }

        if (LIVE && Object.keys(set).length){
          await Business.updateOne({ _id: w._id }, { $set: set });
          updatedDocs++;
        }
        done.add(w.code);
        processed++;
        if (n % 25 === 0 || n === queue.length){
          process.stdout.write(`\r  [${n}/${queue.length}] processed=${processed} uploads=${uploads} updated=${updatedDocs} errors=${errors}   `);
          if (LIVE) saveCheckpoint(done);
        }
      } catch (err){
        errors++;
        console.error(`\n  ! ${w.code} failed:`, err.message);
      }
    }
  }
  await Promise.all(Array.from({length: CONCURRENCY}, worker));
  if (LIVE) saveCheckpoint(done);

  console.log('\n\n============================================================');
  console.log(LIVE ? 'LIVE RUN COMPLETE' : 'DRY RUN COMPLETE (no changes made)');
  console.log('  Businesses processed :', processed);
  console.log('  Image uploads        :', uploads, LIVE ? '' : '(would upload)');
  console.log('  Mongo docs updated   :', updatedDocs, LIVE ? '' : '(would update)');
  console.log('  Errors               :', errors);
  console.log('============================================================');

  await conn.close();
}

run().catch(err => { console.error('\nMigration failed:', err); process.exit(1); });
