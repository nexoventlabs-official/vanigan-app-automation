const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const ROOT = process.env.CLOUDINARY_FOLDER || 'vanigan';

/** Upload an in-memory image buffer to Cloudinary. */
function uploadBuffer(buffer, { folder, publicId } = {}) {
  return new Promise((resolve, reject) => {
    const opts = { folder: folder || ROOT, resource_type: 'image' };
    if (publicId) opts.public_id = publicId;
    const stream = cloudinary.uploader.upload_stream(opts, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    stream.end(buffer);
  });
}

async function destroy(publicId, { resource_type = 'image' } = {}) {
  if (!publicId) return null;
  try {
    return await cloudinary.uploader.destroy(publicId, { resource_type });
  } catch (err) {
    console.warn('[cloudinary] destroy failed:', err.message);
    return null;
  }
}

/** Delete every resource under a folder prefix, then remove the empty folder. */
async function deleteByPrefix(prefix) {
  if (!prefix) return;
  try {
    await cloudinary.api.delete_resources_by_prefix(prefix, { resource_type: 'image' });
    await cloudinary.api.delete_folder(prefix).catch(() => {});
  } catch (err) {
    console.warn('[cloudinary] deleteByPrefix failed:', err.message);
  }
}

module.exports = { cloudinary, uploadBuffer, destroy, deleteByPrefix, ROOT };
