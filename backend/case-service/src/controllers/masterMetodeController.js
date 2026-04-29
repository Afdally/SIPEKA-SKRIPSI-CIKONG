const MasterMetode = require('../models/MasterMetode');

// GET /api/master/metode (Public/Petugas)
exports.getAll = async (req, res) => {
  try {
    const filter = req.query.all === 'true' ? {} : { is_active: true };
    const data = await MasterMetode.find(filter).sort({ nama_metode: 1 });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/master/metode (Super Admin)
exports.create = async (req, res) => {
  try {
    const { nama_metode, deskripsi } = req.body;
    if (!nama_metode) return res.status(422).json({ message: 'nama_metode wajib diisi' });

    const exists = await MasterMetode.findOne({ nama_metode });
    if (exists) return res.status(422).json({ message: 'Metode penanganan sudah ada' });

    const metode = await MasterMetode.create({ nama_metode, deskripsi });
    return res.status(201).json({ message: 'Metode berhasil ditambahkan', data: metode });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/master/metode/:id (Super Admin)
exports.update = async (req, res) => {
  try {
    const { nama_metode, deskripsi, is_active } = req.body;
    const metode = await MasterMetode.findById(req.params.id);
    if (!metode) return res.status(404).json({ message: 'Metode tidak ditemukan' });

    if (nama_metode) metode.nama_metode = nama_metode;
    if (deskripsi !== undefined) metode.deskripsi = deskripsi;
    if (is_active !== undefined) metode.is_active = is_active;

    await metode.save();
    return res.json({ message: 'Metode berhasil diupdate', data: metode });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/master/metode/:id (Super Admin)
exports.delete = async (req, res) => {
  try {
    const metode = await MasterMetode.findByIdAndDelete(req.params.id);
    if (!metode) return res.status(404).json({ message: 'Metode tidak ditemukan' });
    return res.json({ message: 'Metode berhasil dihapus' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Fungsi auto-seeding dipanggil saat aplikasi menyala
exports.seedMetode = async () => {
  try {
    const count = await MasterMetode.countDocuments();
    if (count === 0) {
      const defaultMetodes = [
        { nama_metode: 'Konsultasi / Mediasi', deskripsi: 'Penyelesaian masalah melalui konsultasi atau mediasi' },
        { nama_metode: 'Psikososial', deskripsi: 'Pendampingan psikologis untuk pemulihan trauma' },
        { nama_metode: 'Bantuan Hukum', deskripsi: 'Bantuan jalur litigasi atau pelaporan kepolisian' }
      ];
      await MasterMetode.insertMany(defaultMetodes);
      console.log('✅ Seed MasterMetode: Data default berhasil dimasukkan.');
    }
  } catch (err) {
    console.error('❌ Gagal seed MasterMetode:', err.message);
  }
};
