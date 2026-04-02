const axios = require('axios');
const Penanganan = require('../models/Penanganan');

const REPORT_URL = process.env.REPORT_SERVICE_URL || 'http://localhost:8001';

exports.index = async (req, res) => {
  try {
    const filter = {};
    if (req.query.metode) filter.metode = req.query.metode;
    if (req.query.status) filter.status = req.query.status;

    const data = await Penanganan.find(filter).sort({ createdAt: -1 });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.store = async (req, res) => {
  try {
    const user = req.auth_user;
    const { laporan_id, kode_laporan, metode, keterangan, tanggal_penanganan } = req.body;

    const penanganan = await Penanganan.create({
      laporan_id,
      kode_laporan,
      metode,
      keterangan,
      admin_id: user.id || user.sub,
      admin_name: user.name,
      tanggal_penanganan: new Date(tanggal_penanganan),
      status: 'proses'
    });

    // Notify reporting service to update laporan status
    try {
      await axios.patch(
        `${REPORT_URL}/api/laporan/${laporan_id}/status`,
        { status: 'sedang_ditangani', catatan: `Sedang ditangani oleh DP3A (${metode})` },
        { headers: { Authorization: `Bearer ${req.raw_token}` } }
      );
    } catch (httpErr) {
      console.error('Gagal update status laporan:', httpErr.message);
    }

    return res.status(201).json({
      message: 'Penanganan kasus berhasil ditambahkan',
      penanganan
    });
  } catch (err) {
    return res.status(422).json({ message: 'Validasi gagal', errors: err.message });
  }
};

exports.show = async (req, res) => {
  try {
    const penanganan = await Penanganan.findById(req.params.id);
    if (!penanganan) return res.status(404).json({ message: 'Tidak ditemukan' });
    return res.json(penanganan);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.update = async (req, res) => {
  try {
    const { metode, keterangan, tanggal_penanganan, status } = req.body;

    const updateData = {};
    if (metode) updateData.metode = metode;
    if (keterangan) updateData.keterangan = keterangan;
    if (tanggal_penanganan) updateData.tanggal_penanganan = new Date(tanggal_penanganan);
    if (status) updateData.status = status;

    const penanganan = await Penanganan.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    if (!penanganan) return res.status(404).json({ message: 'Tidak ditemukan' });

    // If status changed to selesai, notify reporting service
    if (status === 'selesai') {
      try {
        await axios.patch(
          `${REPORT_URL}/api/laporan/${penanganan.laporan_id}/status`,
          { status: 'selesai', catatan: `Penanganan kasus selesai (${penanganan.metode})` },
          { headers: { Authorization: `Bearer ${req.raw_token}` } }
        );
      } catch (httpErr) {
        console.error('Gagal update status laporan:', httpErr.message);
      }
    }

    return res.json({ message: 'Penanganan berhasil diperbarui', penanganan });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.destroy = async (req, res) => {
  try {
    const penanganan = await Penanganan.findByIdAndDelete(req.params.id);
    if (!penanganan) return res.status(404).json({ message: 'Tidak ditemukan' });
    return res.json({ message: 'Penanganan berhasil dihapus' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};
