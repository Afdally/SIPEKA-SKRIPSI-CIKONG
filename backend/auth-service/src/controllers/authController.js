const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'ircm_secret_key';
const JWT_TTL    = parseInt(process.env.JWT_TTL || '3600');

function generateToken(user) {
  return jwt.sign(
    {
      sub:       user._id,
      id:        user._id,
      name:      user.name,
      email:     user.email,
      role:      user.role,
      kelurahan: user.kelurahan,
    },
    JWT_SECRET,
    { expiresIn: JWT_TTL }
  );
}

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(422).json({ message: 'Email dan password wajib diisi' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    const token = generateToken(user);

    return res.json({
      access_token: token,
      token_type:   'bearer',
      expires_in:   JWT_TTL,
      user: {
        id:        user._id,
        name:      user.name,
        email:     user.email,
        role:      user.role,
        kelurahan: user.kelurahan,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/logout
exports.logout = (req, res) => {
  // JWT stateless — client cukup hapus token
  return res.json({ message: 'Berhasil logout' });
};

// GET /api/auth/me
exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.auth_user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
    return res.json({
      id:        user._id,
      name:      user.name,
      email:     user.email,
      role:      user.role,
      kelurahan: user.kelurahan,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/auth/validate  — dipanggil service lain untuk verifikasi token
exports.validateToken = (req, res) => {
  const header = req.headers['authorization'] || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ valid: false, message: 'Token tidak ditemukan' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return res.json({
      valid: true,
      user: {
        id:        decoded.id || decoded.sub,
        name:      decoded.name,
        email:     decoded.email,
        role:      decoded.role,
        kelurahan: decoded.kelurahan,
      },
    });
  } catch (err) {
    return res.status(401).json({ valid: false, message: 'Token tidak valid' });
  }
};

// POST /api/auth/users — hanya admin_dp3a
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, kelurahan } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(422).json({ message: 'name, email, password, role wajib diisi' });
    }

    if (!['admin_dp3a', 'admin_kelurahan'].includes(role)) {
      return res.status(422).json({ message: 'Role tidak valid' });
    }

    if (role === 'admin_kelurahan' && !kelurahan) {
      return res.status(422).json({ message: 'Kelurahan wajib diisi untuk admin kelurahan' });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(422).json({ message: 'Email sudah terdaftar' });
    }

    const user = await User.create({ name, email, password, role, kelurahan: kelurahan || null });

    return res.status(201).json({
      message: 'Akun berhasil dibuat',
      user: {
        id:        user._id,
        name:      user.name,
        email:     user.email,
        role:      user.role,
        kelurahan: user.kelurahan,
      },
    });
  } catch (err) {
    console.error('createUser error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
