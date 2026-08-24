const crypto = require('crypto');

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left || ''));
  const rightBuffer = Buffer.from(String(right || ''));
  return leftBuffer.length === rightBuffer.length
    && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

module.exports = function internalApiKey(req, res, next) {
  const configuredKey = process.env.INTERNAL_API_KEY;
  const suppliedKey = req.get('x-internal-api-key');

  if (!configuredKey || !safeEqual(suppliedKey, configuredKey)) {
    return res.status(401).json({ message: 'Akses internal tidak sah.' });
  }

  next();
};
