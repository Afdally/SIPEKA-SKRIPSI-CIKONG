const mongoose = require('mongoose');

const penangananSchema = new mongoose.Schema({
  laporan_id:         { type: String, required: true },
  kode_laporan:       { type: String, required: true },
  admin_id:           { type: String, required: true },
  admin_name:         { type: String, required: true },
  metode:             {
    type: String,
    enum: ['Konsultasi / Mediasi', 'Psikososial', 'Bantuan Hukum'],
    required: true
  },
  keterangan:         { type: String, default: null },
  tanggal_penanganan: { type: Date, required: true },
  status:             { type: String, enum: ['proses', 'selesai'], default: 'proses' },
}, { timestamps: true });

module.exports = mongoose.model('Penanganan', penangananSchema);
