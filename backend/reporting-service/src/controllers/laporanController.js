const Laporan = require('../models/Laporan');

// POST /api/laporan
exports.store = async (req, res) => {
  try {
    const data = req.body;

    // Parse anonim if it's sent as string form data
    if (data.anonim === 'true') data.anonim = true;
    if (data.anonim === 'false') data.anonim = false;

    if (data.anonim) {
      data.nama_pelapor = 'ANONIM';
      data.nik_pelapor = null;
      // data.telepon_pelapor tetap ada untuk tracking petugas
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

// GET /api/laporan/public-gis (Public API untuk Integrasi Web GIS Eksternal)
exports.getPublicGis = async (req, res) => {
  try {
    // Data sengaja diseleksi (select) untuk membuang field identitas korban/pelapor demi privasi
    const data = await Laporan.find({})
      .select('kode_laporan jenis_kekerasan tanggal_kejadian kelurahan_korban lokasi_kejadian latitude longitude status createdAt -_id')
      .sort({ createdAt: -1 });

    return res.json({
      message: 'Data Spasial Laporan SIPEKA (Anonim)',
      count: data.length,
      data: data
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
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
      kode_laporan: laporan.kode_laporan,
      status: laporan.status,
      jenis_kekerasan: laporan.jenis_kekerasan,
      tanggal_lapor: laporan.createdAt.toLocaleDateString('id-ID'),
      createdAt: laporan.createdAt,
      nama_korban: laporan.nama_korban,
      catatan: laporan.catatan,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/laporan/gis-map (Super Admin) - Peta Kerawanan
exports.getGisMap = async (req, res) => {
  try {
    const data = await Laporan.find({
      latitude: { $ne: null },
      longitude: { $ne: null }
    }).select('kode_laporan jenis_kekerasan tanggal_kejadian lokasi_kejadian latitude longitude status');

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/laporan
exports.index = async (req, res) => {
  try {
    const filter = {};

    const laporans = await Laporan.find(filter).sort({ createdAt: -1 });

    const data = laporans.map(l => ({
      ...l.toObject(),
      id: l._id,
      tanggal_kejadian: l.tanggal_kejadian ? l.tanggal_kejadian.toLocaleDateString('id-ID') : '-',
      tanggal_lapor: l.createdAt.toLocaleDateString('id-ID'),
    }));

    return res.json({ data });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/laporan/:id
exports.show = async (req, res) => {
  try {
    const laporan = await Laporan.findById(req.params.id);

    if (!laporan) return res.status(404).json({ message: 'Tidak ditemukan' });

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
