const cloudinary = require('cloudinary').v2;

const ROOT = 'vanigan_biz';

function bizOpts(extra = {}) {
  return {
    cloud_name: process.env.BUSINESS_CLOUDINARY_NAME,
    api_key:    process.env.BUSINESS_CLOUDINARY_KEY,
    api_secret: process.env.BUSINESS_CLOUDINARY_SECRET,
    ...extra,
  };
}

function uploadBuffer(buffer, { folder, publicId } = {}) {
  return new Promise((resolve, reject) => {
    const opts = bizOpts({
      folder: folder || ROOT,
      resource_type: 'image',
    });
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
    return await cloudinary.uploader.destroy(publicId, bizOpts({ resource_type: 'image' }));
  } catch (err) {
    console.warn('[bizCloudinary] destroy failed:', err.message);
    return null;
  }
}

module.exports = { uploadBuffer, destroy, ROOT };
