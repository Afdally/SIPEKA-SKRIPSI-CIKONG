const mongoose = require('mongoose');

const laporanSchema = new mongoose.Schema({
  kode_laporan:     { type: String, unique: true },
  tipe_laporan:     { type: String, enum: ['anak', 'perempuan'], default: 'perempuan' },
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
  latitude:         { type: Number, default: null }, // Koordinat peta
  longitude:        { type: Number, default: null }, // Koordinat peta
  kronologi:        { type: String, required: true },
  bukti_file:       { type: String, default: null },

  // Dikonfirmasi pelapor di langkah awal form pelaporan:
  // cara pertemuan yang diinginkan + pernyataan bahwa laporan benar.
  preferensi_layanan: { type: String, default: 'Datang ke UPTD' },
  pernyataan_benar:   { type: Boolean, default: false },
  
  // Status
  status:           { type: String, default: 'menunggu_registrasi' },
  catatan:          { type: String, default: null },
}, { timestamps: true });

laporanSchema.pre('save', function(next) {
  if (this.kode_laporan) return next();

  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randStr = '';
  for (let i = 0; i < 5; i++) {
    randStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const prefix = this.tipe_laporan === 'anak' ? 'LA' : 'LP';
  this.kode_laporan = `${prefix}-${year}-${randStr}`;
  next();
});

module.exports = mongoose.model('Laporan', laporanSchema);
