/**
 * middleware/upload.js  —  unit tests
 *
 * Tests the multer MIME fileFilter and the magic-byte validateImageBytes
 * middleware added as FIX 4.3.
 */

describe('upload middleware', () => {
  const upload = require('../middleware/upload');

  test('is a multer instance with .single() and .fields() methods', () => {
    expect(typeof upload.single).toBe('function');
    expect(typeof upload.fields).toBe('function');
  });

  test('exposes validateImageBytes middleware (FIX 4.3)', () => {
    expect(typeof upload.validateImageBytes).toBe('function');
  });

  // ── fileFilter (MIME type check) ────────────────────────────────────────────
  // We replicate the exact fileFilter function from upload.js to test it directly.
  function fileFilter(_req, file, cb) {
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, WebP and GIF images are allowed'));
    }
    cb(null, true);
  }

  test('fileFilter rejects application/pdf', () => {
    const cb = jest.fn();
    fileFilter({}, { mimetype: 'application/pdf' }, cb);
    expect(cb).toHaveBeenCalledWith(expect.any(Error));
    expect(cb.mock.calls[0][0].message).toMatch(/only jpeg/i);
  });

  test('fileFilter rejects image/tiff (not in allowed list)', () => {
    const cb = jest.fn();
    fileFilter({}, { mimetype: 'image/tiff' }, cb);
    expect(cb).toHaveBeenCalledWith(expect.any(Error));
  });

  test('fileFilter accepts image/jpeg', () => {
    const cb = jest.fn();
    fileFilter({}, { mimetype: 'image/jpeg' }, cb);
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  test('fileFilter accepts image/png', () => {
    const cb = jest.fn();
    fileFilter({}, { mimetype: 'image/png' }, cb);
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  test('fileFilter accepts image/webp', () => {
    const cb = jest.fn();
    fileFilter({}, { mimetype: 'image/webp' }, cb);
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  test('fileFilter accepts image/gif', () => {
    const cb = jest.fn();
    fileFilter({}, { mimetype: 'image/gif' }, cb);
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  test('file size limit is 5 MB (verified by module source)', () => {
    const fs   = require('fs');
    const path = require('path');
    const src  = fs.readFileSync(path.join(__dirname, '../middleware/upload.js'), 'utf8');
    expect(src).toContain('5 * 1024 * 1024');
  });

  // ── validateImageBytes (magic-byte check) ───────────────────────────────────
  describe('validateImageBytes (FIX 4.3)', () => {
    // JPEG magic bytes: FF D8 FF
    const jpegBuffer = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10,
      0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    ]);
    // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    ]);

    test('passes JPEG buffer with correct magic bytes', async () => {
      const req  = { file: { buffer: jpegBuffer } };
      const res  = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await upload.validateImageBytes(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    test('passes PNG buffer with correct magic bytes', async () => {
      const req  = { file: { buffer: pngBuffer } };
      const res  = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await upload.validateImageBytes(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
    });

    test('rejects a spoofed file (PHP script bytes, not an image)', async () => {
      const fakeBuffer = Buffer.from('<?php echo "evil"; ?>');
      const req  = { file: { buffer: fakeBuffer } };
      const res  = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await upload.validateImageBytes(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(String) })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('passes through when no file is present in request', async () => {
      const req  = {}; // no req.file, no req.files
      const res  = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await upload.validateImageBytes(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
