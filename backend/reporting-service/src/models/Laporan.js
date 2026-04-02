const mongoose = require('mongoose');

// Generate kode otomatis e.g. LP-2026-X8Y2A
function generateKode() {
  const date = new Date();
  const year = date.getFullYear();
  
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randStr = '';
  for (let i = 0; i < 5; i++) {
    randStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `LP-${year}-${randStr}`;
}

const laporanSchema = new mongoose.Schema({
  kode_laporan:     { type: String, unique: true, default: generateKode },
  anonim:           { type: Boolean, default: false },
  
  // Pelapor
  nama_pelapor:     { type: String, default: null },
  nik_pelapor:      { type: String, default: null },
  telepon_pelapor:  { type: String, default: null },
  hubungan_korban:  { type: String, default: null },
  
  // Korban
  nama_korban:      { type: String, required: true },
  nik_korban:       { type: String, default: null },
  usia_korban:      { type: Number, required: true },
  jenis_kelamin:    { type: String, enum: ['Laki-laki', 'Perempuan'], required: true },
  alamat_korban:    { type: String, required: true },
  kelurahan_korban: { type: String, default: null },
  
  // Kejadian
  jenis_kekerasan:  { type: String, required: true },
  tanggal_kejadian: { type: Date, required: true },
  lokasi_kejadian:  { type: String, required: true },
  kronologi:        { type: String, required: true },
  bukti_file:       { type: String, default: null },
  
  // Status
  status:           { type: String, default: 'menunggu_verifikasi' },
  catatan:          { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Laporan', laporanSchema);
