const MasterKekerasan = require('../models/MasterKekerasan');

// GET /api/master/kekerasan (Public)
exports.getAll = async (req, res) => {
  try {
    const filter = req.query.all === 'true' ? {} : { is_active: true };
    const data = await MasterKekerasan.find(filter).sort({ nama_kategori: 1 });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/master/kekerasan (Super Admin)
exports.create = async (req, res) => {
  try {
    const { nama_kategori, deskripsi } = req.body;
    if (!nama_kategori) return res.status(422).json({ message: 'nama_kategori wajib diisi' });

    const exists = await MasterKekerasan.findOne({ nama_kategori });
    if (exists) return res.status(422).json({ message: 'Kategori kekerasan sudah ada' });

    const kategori = await MasterKekerasan.create({ nama_kategori, deskripsi });
    return res.status(201).json({ message: 'Kategori berhasil ditambahkan', data: kategori });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/master/kekerasan/:id (Super Admin)
exports.update = async (req, res) => {
  try {
    const { nama_kategori, deskripsi, is_active } = req.body;
    const kategori = await MasterKekerasan.findById(req.params.id);
    if (!kategori) return res.status(404).json({ message: 'Kategori tidak ditemukan' });

    if (nama_kategori) kategori.nama_kategori = nama_kategori;
    if (deskripsi !== undefined) kategori.deskripsi = deskripsi;
    if (is_active !== undefined) kategori.is_active = is_active;

    await kategori.save();
    return res.json({ message: 'Kategori berhasil diupdate', data: kategori });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/master/kekerasan/:id (Super Admin)
exports.delete = async (req, res) => {
  try {
    const kategori = await MasterKekerasan.findByIdAndDelete(req.params.id);
    if (!kategori) return res.status(404).json({ message: 'Kategori tidak ditemukan' });
    return res.json({ message: 'Kategori berhasil dihapus' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Auto-seeding dipanggil saat aplikasi menyala
exports.seedKekerasan = async () => {
  try {
    const count = await MasterKekerasan.countDocuments();
    if (count === 0) {
      const defaultKategori = [
        { nama_kategori: 'Kekerasan Fisik', deskripsi: 'Tindakan yang mengakibatkan rasa sakit atau luka fisik' },
        { nama_kategori: 'Kekerasan Psikis', deskripsi: 'Tindakan yang mengakibatkan ketakutan, hilangnya rasa percaya diri' },
        { nama_kategori: 'Kekerasan Seksual', deskripsi: 'Pemaksaan hubungan seksual yang tidak dikehendaki' },
        { nama_kategori: 'KDRT', deskripsi: 'Kekerasan Dalam Rumah Tangga' },
        { nama_kategori: 'Penelantaran', deskripsi: 'Penelantaran rumah tangga atau anak' },
        { nama_kategori: 'Cyberbullying', deskripsi: 'Perundungan melalui media digital' }
      ];
      await MasterKekerasan.insertMany(defaultKategori);
      console.log('✅ Seed MasterKekerasan: Data default berhasil dimasukkan.');
    }
  } catch (err) {
    console.error('❌ Gagal seed MasterKekerasan:', err.message);
  }
};
