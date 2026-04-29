const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'ircm_secret_key';
const JWT_TTL    = parseInt(process.env.JWT_TTL || '3600');

function generateToken(user) {
  return jwt.sign(
    {
      sub:   user._id,
      id:    user._id,
      name:  user.name,
      email: user.email,
      role:  user.role,
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
        id:    user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/logout
exports.logout = (req, res) => {
  return res.json({ message: 'Berhasil logout' });
};

// GET /api/auth/me
exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.auth_user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
    return res.json({
      id:    user._id,
      name:  user.name,
      email: user.email,
      role:  user.role,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/auth/validate — dipanggil service lain untuk verifikasi token
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
        id:    decoded.id || decoded.sub,
        name:  decoded.name,
        email: decoded.email,
        role:  decoded.role,
      },
    });
  } catch (err) {
    return res.status(401).json({ valid: false, message: 'Token tidak valid' });
  }
};

// ==========================================
// USER MANAGEMENT (SUPER ADMIN ONLY)
// ==========================================

// GET /api/auth/users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/users
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(422).json({ message: 'name, email, password, role wajib diisi' });
    }

    if (!['petugas_uptd', 'super_admin'].includes(role)) {
      return res.status(422).json({ message: 'Role tidak valid' });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(422).json({ message: 'Email sudah terdaftar' });
    }

    const user = await User.create({ name, email, password, role });

    return res.status(201).json({
      message: 'Akun berhasil dibuat',
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
      },
    });
  } catch (err) {
    console.error('createUser error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/auth/users/:id
exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (role && ['petugas_uptd', 'super_admin'].includes(role)) user.role = role;
    if (password) user.password = password; // pre-save hook will hash it

    await user.save();

    return res.json({
      message: 'Akun berhasil diperbarui',
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/auth/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

    if (user._id.toString() === req.auth_user.id) {
      return res.status(403).json({ message: 'Tidak dapat menghapus akun sendiri' });
    }

    await User.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Akun berhasil dihapus' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};
