const axios = require('axios');
const Kasus = require('../models/Kasus');

const REPORT_URL = process.env.REPORT_SERVICE_URL || 'http://localhost:8001';

// ─── GET /api/penanganan — Daftar semua kasus ───
exports.index = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const data = await Kasus.find(filter).sort({ createdAt: -1 });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET /api/penanganan/:id — Detail kasus ───
exports.show = async (req, res) => {
  try {
    const kasus = await Kasus.findById(req.params.id);
    if (!kasus) return res.status(404).json({ message: 'Kasus tidak ditemukan' });
    return res.json(kasus);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─── POST /api/penanganan/registrasi — Tahap 1: Terima & Registrasi Laporan ───
exports.registrasi = async (req, res) => {
  try {
    const user = req.auth_user;
    const { laporan_id, kode_laporan, pesan_tindak_lanjut } = req.body;

    if (!laporan_id || !kode_laporan || !pesan_tindak_lanjut) {
      return res.status(422).json({ message: 'laporan_id, kode_laporan, dan pesan_tindak_lanjut wajib diisi' });
    }

    // Cek apakah laporan sudah pernah diregistrasi
    const exists = await Kasus.findOne({ laporan_id });
    if (exists) {
      return res.status(422).json({ message: 'Laporan ini sudah diregistrasi sebelumnya' });
    }

    const kasus = await Kasus.create({
      laporan_id,
      kode_laporan,
      petugas_id:          user.id || user.sub,
      petugas_name:        user.name,
      pesan_tindak_lanjut,
      tanggal_registrasi:  new Date(),
      status:              'registrasi',
    });

    // Update status laporan di report-service → proses_assessment
    try {
      await axios.patch(
        `${REPORT_URL}/api/laporan/${laporan_id}/status`,
        {
          status:  'proses_assessment',
          catatan: pesan_tindak_lanjut,
        },
        { headers: { Authorization: `Bearer ${req.raw_token}` } }
      );
    } catch (httpErr) {
      console.error('Gagal update status laporan:', httpErr.message);
    }

    return res.status(201).json({
      message: 'Laporan berhasil diregistrasi dan dijadwalkan assessment',
      kasus,
    });
  } catch (err) {
    console.error('Registrasi error:', err);
    return res.status(422).json({ message: 'Validasi gagal', errors: err.message });
  }
};

// ─── PUT /api/penanganan/:id/assessment — Tahap 2: Input Hasil Assessment ───
exports.assessment = async (req, res) => {
  try {
    const { hasil_assessment, kondisi_korban, kebutuhan_korban } = req.body;

    if (!hasil_assessment) {
      return res.status(422).json({ message: 'hasil_assessment wajib diisi' });
    }

    const kasus = await Kasus.findByIdAndUpdate(
      req.params.id,
      {
        hasil_assessment,
        kondisi_korban:     kondisi_korban || null,
        kebutuhan_korban:   kebutuhan_korban || null,
        tanggal_assessment: new Date(),
        status:             'assessment',
      },
      { new: true }
    );

    if (!kasus) return res.status(404).json({ message: 'Kasus tidak ditemukan' });

    return res.json({ message: 'Hasil assessment berhasil disimpan', kasus });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─── PUT /api/penanganan/:id/intervensi — Tahap 3: Rencana Intervensi ───
exports.intervensi = async (req, res) => {
  try {
    const { metode_penanganan, rencana_tindakan } = req.body;

    if (!metode_penanganan) {
      return res.status(422).json({ message: 'metode_penanganan wajib diisi' });
    }

    const kasus = await Kasus.findByIdAndUpdate(
      req.params.id,
      {
        metode_penanganan,
        rencana_tindakan: rencana_tindakan || null,
        tanggal_mulai:    new Date(),
        status:           'penanganan',
      },
      { new: true }
    );

    if (!kasus) return res.status(404).json({ message: 'Kasus tidak ditemukan' });

    // Update status laporan → dalam_penanganan
    try {
      await axios.patch(
        `${REPORT_URL}/api/laporan/${kasus.laporan_id}/status`,
        {
          status:  'dalam_penanganan',
          catatan: `Dalam penanganan: ${metode_penanganan}`,
        },
        { headers: { Authorization: `Bearer ${req.raw_token}` } }
      );
    } catch (httpErr) {
      console.error('Gagal update status laporan:', httpErr.message);
    }

    return res.json({ message: 'Rencana intervensi berhasil disimpan', kasus });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─── POST /api/penanganan/:id/log — Tahap 4a: Tambah Log Aktivitas ───
exports.addLog = async (req, res) => {
  try {
    const { catatan, tanggal } = req.body;

    if (!catatan) {
      return res.status(422).json({ message: 'catatan wajib diisi' });
    }

    const kasus = await Kasus.findById(req.params.id);
    if (!kasus) return res.status(404).json({ message: 'Kasus tidak ditemukan' });
    if (kasus.arsip) return res.status(403).json({ message: 'Kasus sudah diarsipkan, tidak bisa ditambah log' });

    kasus.activity_log.push({
      catatan,
      tanggal: tanggal ? new Date(tanggal) : new Date(),
      petugas_name: req.auth_user.name,
    });

    await kasus.save();

    return res.json({ message: 'Log aktivitas berhasil ditambahkan', kasus });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─── PUT /api/penanganan/:id/selesai — Tahap 4b: Tutup Kasus ───
exports.selesaikan = async (req, res) => {
  try {
    const kasus = await Kasus.findByIdAndUpdate(
      req.params.id,
      {
        status:          'selesai',
        tanggal_selesai: new Date(),
        arsip:           true,
      },
      { new: true }
    );

    if (!kasus) return res.status(404).json({ message: 'Kasus tidak ditemukan' });

    // Update status laporan → selesai
    try {
      await axios.patch(
        `${REPORT_URL}/api/laporan/${kasus.laporan_id}/status`,
        {
          status:  'selesai',
          catatan: `Kasus selesai ditangani (${kasus.metode_penanganan || 'N/A'})`,
        },
        { headers: { Authorization: `Bearer ${req.raw_token}` } }
      );
    } catch (httpErr) {
      console.error('Gagal update status laporan:', httpErr.message);
    }

    return res.json({ message: 'Kasus berhasil diselesaikan dan diarsipkan', kasus });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};
