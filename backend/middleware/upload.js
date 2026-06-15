const multer = require('multer');
const { fromBuffer: fileTypeFromBuffer } = require('file-type');

const storage = multer.memoryStorage();

// Step 1 — MIME type check (fast, from Content-Type header)
const multerInstance = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, WebP and GIF images are allowed'));
    }
    cb(null, true);
  },
});

/**
 * Step 2 — Magic-byte validation middleware.
 * Runs AFTER multer has read the file buffer into memory.
 * Rejects any file whose actual byte signature does not match an allowed image type,
 * even if the Content-Type header was spoofed.
 *
 * Usage: router.post('/upload', upload.single('image'), validateImageBytes, handler)
 */
async function validateImageBytes(req, res, next) {
  const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const files = req.file
    ? [req.file]
    : Object.values(req.files || {}).flat();

  for (const file of files) {
    if (!file || !file.buffer) continue;
    let detected;
    try {
      detected = await fileTypeFromBuffer(file.buffer);
    } catch {
      detected = null;
    }
    if (!detected || !ALLOWED_MIMES.includes(detected.mime)) {
      return res.status(400).json({
        error: `Invalid file type${detected ? ` (detected: ${detected.mime})` : ''}. Only JPEG, PNG, WebP and GIF are allowed.`,
      });
    }
  }
  next();
}

// Export the multer instance as the default (backward-compatible)
// AND export validateImageBytes for routes that want magic-byte checking
multerInstance.validateImageBytes = validateImageBytes;

module.exports = multerInstance;
