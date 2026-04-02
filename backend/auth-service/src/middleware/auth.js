const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'ircm_secret_key';
const JWT_TTL    = parseInt(process.env.JWT_TTL || '3600'); // detik

module.exports = function authMiddleware(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Token tidak ditemukan' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.auth_user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token tidak valid atau sudah kadaluarsa' });
  }
};
