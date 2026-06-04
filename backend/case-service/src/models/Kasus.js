const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  catatan:      { type: String, required: true },
  tanggal:      { type: Date, required: true },
  petugas_name: { type: String, default: 'Sistem' },
}, { timestamps: true });

const kasusSchema = new mongoose.Schema({
  laporan_id:    { type: String, required: true },
  kode_laporan:  { type: String, required: true },
  petugas_id:    { type: String, required: true },
  petugas_name:  { type: String, required: true },

  // Tahap 1: Registrasi
  pesan_tindak_lanjut: { type: String, default: null },
  tanggal_registrasi:  { type: Date, default: Date.now },

  // Tahap 2: Assessment
  hasil_assessment: { type: String, default: null },
  kondisi_korban:   { type: String, default: null },
  kebutuhan_korban: { type: String, default: null },
  tanggal_assessment: { type: Date, default: null },

  // Tahap 3: Intervensi
  metode_penanganan: { type: String, default: null },
  rencana_tindakan:  { type: String, default: null },
  tanggal_mulai:     { type: Date, default: null },

  // Status kasus
  status: {
    type: String,
    enum: ['registrasi', 'assessment', 'penanganan', 'selesai'],
    default: 'registrasi',
  },

  // Tahap 4: Log Aktivitas
  activity_log: [activityLogSchema],

  tanggal_selesai: { type: Date, default: null },
  arsip:           { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Kasus', kasusSchema);
