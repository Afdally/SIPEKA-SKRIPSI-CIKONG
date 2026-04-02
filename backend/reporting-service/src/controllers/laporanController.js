const Laporan = require('../models/Laporan');

// POST /api/laporan
exports.store = async (req, res) => {
  try {
    const data = req.body;
    
    // Parse anonim if it's sent as string form data
    if (data.anonim === 'true') data.anonim = true;
    if (data.anonim === 'false') data.anonim = false;

    if (data.anonim) {
      data.nama_pelapor = null;
      data.nik_pelapor = null;
      data.telepon_pelapor = null;
      data.hubungan_korban = null;
    }

    if (req.file) {
      data.bukti_file = 'storage/bukti/' + req.file.filename;
    }

    const laporan = await Laporan.create(data);

    return res.status(201).json({
      message: 'Laporan berhasil dikirim',
      kode_laporan: laporan.kode_laporan,
    });
  } catch (err) {
    console.error('Laporan store error:', err);
    return res.status(422).json({ message: 'Validasi gagal', errors: err.message });
  }
};

// GET /api/laporan/status/:kode
exports.cekStatus = async (req, res) => {
  try {
    const { kode } = req.params;
    const laporan = await Laporan.findOne({ kode_laporan: kode.toUpperCase() });

    if (!laporan) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }

    return res.json({
      kode_laporan:    laporan.kode_laporan,
      status:          laporan.status,
      jenis_kekerasan: laporan.jenis_kekerasan,
      tanggal_lapor:   laporan.createdAt.toLocaleDateString('id-ID'),
      catatan:         laporan.catatan,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/laporan
exports.index = async (req, res) => {
  try {
    const user = req.auth_user;
    const filter = {};

    if (user.role === 'admin_kelurahan') {
      filter.kelurahan_korban = user.kelurahan;
    }

    const laporans = await Laporan.find(filter).sort({ createdAt: -1 });

    const data = laporans.map(l => ({
      id:              l._id,
      kode_laporan:    l.kode_laporan,
      nama_korban:     l.nama_korban,
      jenis_kekerasan: l.jenis_kekerasan,
      tanggal_kejadian: l.tanggal_kejadian.toLocaleDateString('id-ID'),
      kelurahan_korban: l.kelurahan_korban,
      status:          l.status,
      tanggal_lapor:   l.createdAt.toLocaleDateString('id-ID'),
    }));

    return res.json({ data });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/laporan/:id
exports.show = async (req, res) => {
  try {
    const user = req.auth_user;
    const laporan = await Laporan.findById(req.params.id);

    if (!laporan) return res.status(404).json({ message: 'Tidak ditemukan' });

    if (user.role === 'admin_kelurahan' && laporan.kelurahan_korban !== user.kelurahan) {
      return res.status(403).json({ message: 'Akses ditolak' });
    }

    return res.json({ data: laporan });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/laporan/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const { status, catatan } = req.body;
    
    const laporan = await Laporan.findByIdAndUpdate(
      req.params.id, 
      { status, catatan },
      { new: true }
    );

    if (!laporan) return res.status(404).json({ message: 'Tidak ditemukan' });

    return res.json({ message: 'Status laporan diperbarui', data: laporan });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};
