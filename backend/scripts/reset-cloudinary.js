/**
 * DANGER — deletes every resource in the configured Cloudinary cloud
 * (image, raw, video) and removes every folder.
 *
 * Use when migrating to a fresh Cloudinary account so old test uploads
 * do not clutter the namespace.
 *
 * Usage: npm run reset:cloudinary
 */
require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function deleteAllOfType(resource_type) {
  console.log(`\n— Deleting all ${resource_type} resources —`);
  let total = 0;
  let cursor;
  while (true) {
    const res = await cloudinary.api
      .resources({ resource_type, max_results: 100, next_cursor: cursor })
      .catch((e) => {
        console.warn(`  list failed: ${e.error?.message || e.message || e}`);
        return { resources: [] };
      });
    const ids = (res.resources || []).map((r) => r.public_id);
    if (!ids.length) break;
    try {
      const del = await cloudinary.api.delete_resources(ids, { resource_type });
      const deleted = Object.values(del.deleted || {}).filter((s) => s === 'deleted').length;
      total += deleted;
      console.log(`  deleted ${deleted} (running total: ${total})`);
    } catch (err) {
      console.warn(`  delete failed: ${err.error?.message || err.message || JSON.stringify(err)}`);
      break;
    }
    cursor = res.next_cursor;
    if (!cursor) break;
  }
  console.log(`✓ ${resource_type}: removed ${total} resources`);
}

async function deleteFolderTree(folderPath) {
  // Recursively delete sub-folders first
  try {
    const sub = await cloudinary.api.sub_folders(folderPath);
    for (const f of sub.folders || []) {
      await deleteFolderTree(f.path);
    }
  } catch (err) {
    // ignore — folder may already be empty / removed
  }

  // Wipe any remaining resources inside this folder
  for (const resource_type of ['image', 'video', 'raw']) {
    try {
      await cloudinary.api.delete_resources_by_prefix(folderPath + '/', { resource_type });
    } catch {}
  }

  // Finally delete the folder shell
  try {
    await cloudinary.api.delete_folder(folderPath);
    console.log(`  ✓ folder ${folderPath}`);
  } catch (err) {
    console.warn(`  ✗ folder ${folderPath}: ${err.error?.message || err.message || JSON.stringify(err)}`);
  }
}

async function deleteAllFolders() {
  console.log('\n— Deleting all folders —');
  try {
    const top = await cloudinary.api.root_folders();
    for (const f of top.folders || []) {
      await deleteFolderTree(f.path);
    }
  } catch (err) {
    console.warn('  root_folders failed:', err.error?.message || err.message);
  }
}

(async () => {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    console.error('❌ Cloudinary not configured.');
    process.exit(1);
  }
  console.log('• Cloud:', process.env.CLOUDINARY_CLOUD_NAME);

  await deleteAllOfType('image');
  await deleteAllOfType('video');
  await deleteAllOfType('raw');
  await deleteAllFolders();

  console.log('\n✅ Cloudinary reset complete.');
})();
