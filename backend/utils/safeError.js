/**
 * safeError — sanitize error messages before sending to clients.
 *
 * In production, internal error details (MongoDB messages, stack traces,
 * connection strings) must never reach the client. Return a generic message.
 * In development, return the real message for easier debugging.
 *
 * Usage:
 *   const safeError = require('../utils/safeError');
 *   res.status(500).json({ error: safeError(err) });
 */
function safeError(err) {
  if (process.env.NODE_ENV === 'production') {
    return 'Internal server error';
  }
  return (err && err.message) ? err.message : 'Unknown error';
}

module.exports = safeError;
