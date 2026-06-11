/**
 * memberCloudinary.js
 * Dedicated Cloudinary service for member photos and business images.
 * Uses the new Cloudinary account (MEMBER_CLOUDINARY_*).
 * Each member gets their own folder: vanigan_members/{phone}/
 */
const cloudinary = require('cloudinary').v2;

const MEMBER_ROOT = 'vanigan_members';

function memberConfig() {
  return {
    cloud_name: process.env.MEMBER_CLOUDINARY_NAME,
    api_key:    process.env.MEMBER_CLOUDINARY_KEY,
    api_secret: process.env.MEMBER_CLOUDINARY_SECRET,
  };
}

/**
 * Upload a buffer to member's folder.
 * @param {Buffer} buffer
 * @param {{ phone: string, subfolder?: string, publicId?: string }} opts
 */
function uploadBuffer(buffer, { phone, subfolder = 'photos', publicId } = {}) {
  const cfg = memberConfig();
  const folder = phone
    ? `${MEMBER_ROOT}/${phone}/${subfolder}`
    : `${MEMBER_ROOT}/misc/${subfolder}`;

  return new Promise((resolve, reject) => {
    const opts = {
      ...cfg,
      folder,
      resource_type: 'image',
    };
    if (publicId) opts.public_id = publicId;

    const stream = cloudinary.uploader.upload_stream(opts, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    stream.end(buffer);
  });
}

async function destroy(publicId) {
  if (!publicId) return null;
  try {
    const cfg = memberConfig();
    return await cloudinary.uploader.destroy(publicId, { ...cfg, resource_type: 'image' });
  } catch (err) {
    console.warn('[memberCloudinary] destroy failed:', err.message);
    return null;
  }
}

/** Delete all assets in a member's folder (e.g. on account deletion) */
async function deleteMemberFolder(phone) {
  if (!phone) return;
  const prefix = `${MEMBER_ROOT}/${phone}`;
  try {
    const cfg = memberConfig();
    await cloudinary.api.delete_resources_by_prefix(prefix, { ...cfg, resource_type: 'image' });
    await cloudinary.api.delete_folder(prefix, cfg).catch(() => {});
  } catch (err) {
    console.warn('[memberCloudinary] deleteMemberFolder failed:', err.message);
  }
}

module.exports = { uploadBuffer, destroy, deleteMemberFolder, MEMBER_ROOT };
