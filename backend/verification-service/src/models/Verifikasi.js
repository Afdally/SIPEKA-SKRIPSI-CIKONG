const mongoose = require('mongoose');

const verifikasiSchema = new mongoose.Schema({
  laporan_id:   { type: String, required: true },
  kode_laporan: { type: String, required: true },
  admin_id:     { type: String, required: true },
  admin_name:   { type: String, required: true },
  kelurahan:    { type: String, default: null },
  status:       { type: String, required: true },
  catatan:      { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Verifikasi', verifikasiSchema);
