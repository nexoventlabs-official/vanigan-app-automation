/**
 * setup-member-cloudinary.js
 * One-time setup: list and optionally clear all resources in the new
 * member Cloudinary account (MEMBER_CLOUDINARY_*).
 *
 * Run: node scripts/setup-member-cloudinary.js
 * Run with wipe: node scripts/setup-member-cloudinary.js --wipe
 */
require('dotenv').config();
const cloudinary = require('cloudinary').v2;

const WIPE = process.argv.includes('--wipe');

cloudinary.config({
  cloud_name: process.env.MEMBER_CLOUDINARY_NAME,
  api_key:    process.env.MEMBER_CLOUDINARY_KEY,
  api_secret: process.env.MEMBER_CLOUDINARY_SECRET,
  secure: true,
});

async function run() {
  console.log('\n[Member Cloudinary Setup]');
  console.log(`Cloud: ${process.env.MEMBER_CLOUDINARY_NAME}`);

  /* ── List all resources ── */
  let resources = [];
  let nextCursor = undefined;
  do {
    const res = await cloudinary.api.resources({
      type: 'upload',
      max_results: 500,
      ...(nextCursor ? { next_cursor: nextCursor } : {}),
    });
    resources = resources.concat(res.resources || []);
    nextCursor = res.next_cursor;
  } while (nextCursor);

  console.log(`\nTotal existing resources: ${resources.length}`);
  if (resources.length > 0) {
    resources.slice(0, 10).forEach(r => console.log(`  • ${r.public_id} (${r.format})`));
    if (resources.length > 10) console.log(`  ... and ${resources.length - 10} more`);
  }

  if (!WIPE) {
    if (resources.length > 0) {
      console.log('\n⚠  To delete ALL existing resources, run with --wipe flag:');
      console.log('   node scripts/setup-member-cloudinary.js --wipe');
    } else {
      console.log('\n✅ Cloudinary is clean — ready for member photos.');
    }
    return;
  }

  /* ── Wipe mode ── */
  if (resources.length === 0) {
    console.log('\n✅ Already clean — nothing to delete.');
    return;
  }

  console.log(`\n🗑  Deleting ${resources.length} resources...`);
  // Delete in batches of 100
  const publicIds = resources.map(r => r.public_id);
  const batches = [];
  for (let i = 0; i < publicIds.length; i += 100) {
    batches.push(publicIds.slice(i, i + 100));
  }
  for (const batch of batches) {
    await cloudinary.api.delete_resources(batch, { resource_type: 'image' });
    process.stdout.write('.');
  }

  // Also delete all folders
  try {
    const foldersRes = await cloudinary.api.root_folders();
    for (const folder of (foldersRes.folders || [])) {
      await cloudinary.api.delete_folder(folder.path).catch(() => {});
      console.log(`\n  🗑  Folder removed: ${folder.path}`);
    }
  } catch { /* no folders */ }

  console.log('\n✅ Cloudinary wiped clean — ready for member photos.\n');
}

run().catch(err => {
  console.error('Failed:', err.message || err);
  process.exit(1);
});
