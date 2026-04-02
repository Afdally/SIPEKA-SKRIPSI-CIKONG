const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'ircm_secret_key';

module.exports = function authMiddleware(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return res.status(401).json({ message: 'Token tidak ditemukan' });

  try {
    req.auth_user = jwt.verify(token, JWT_SECRET);
    // Kita juga bypass raw token biar bisa dikirim ulang ke service lain jika perlu
    req.raw_token = token;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token tidak valid' });
  }
};
