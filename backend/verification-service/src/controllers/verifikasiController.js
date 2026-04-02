const Verifikasi = require('../models/Verifikasi');
const axios = require('axios');

// Konfigurasi URL Report Service (inter-service)
const REPORT_URL = process.env.REPORT_SERVICE_URL || 'http://report-service:8000';

async function prosesVerifikasi(req, res, status) {
  try {
    const user = req.auth_user;
    const { laporan_id, kode_laporan, catatan } = req.body;

    const existing = await Verifikasi.findOne({ laporan_id });
    if (existing) {
      return res.status(422).json({ 
        message: `Laporan ini sudah pernah diproses (status: ${existing.status})` 
      });
    }

    const verifikasi = await Verifikasi.create({
      laporan_id,
      kode_laporan,
      admin_id:   user.id || user.sub,
      admin_name: user.name,
      kelurahan:  user.kelurahan,
      status,
      catatan
    });

    const statusReport = (status === 'diteruskan') ? 'diteruskan_dp3a' : status;

    // Call Reporting Service
    try {
      await axios.patch(`${REPORT_URL}/api/laporan/${laporan_id}/status`, {
        status: statusReport,
        catatan
      }, {
        headers: {
          'Authorization': `Bearer ${req.raw_token}`
        }
      });
    } catch (httpErr) {
      console.error('Failed to notify report-service:', httpErr.message);
      // Optional: rollback atau lanjutkan saja
    }

    return res.status(201).json({
      message: `Laporan berhasil ${labelStatus(status)}`,
      verifikasi
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

function labelStatus(status) {
  if (status === 'diverifikasi') return 'diverifikasi';
  if (status === 'ditolak') return 'ditolak';
  if (status === 'diteruskan') return 'diteruskan ke DP3A';
  return status;
}

exports.index = async (req, res) => {
  try {
    const user = req.auth_user;
    const filter = {};
    if (user.role === 'admin_kelurahan') {
      filter.kelurahan = user.kelurahan;
    }
    const data = await Verifikasi.find(filter).sort({ createdAt: -1 });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.terima = (req, res) => prosesVerifikasi(req, res, 'diverifikasi');
exports.tolak = (req, res) => prosesVerifikasi(req, res, 'ditolak');
exports.teruskan = (req, res) => prosesVerifikasi(req, res, 'diteruskan');
