/**
 * Penyiap data uji beban SIPEKA.
 *
 * Dijalankan ulang SEBELUM setiap run JMeter supaya volume data di database
 * selalu identik — volume adalah variabel terkontrol dalam perbandingan
 * arsitektur ini. Endpoint GET /api/penanganan membaca seluruh koleksi tanpa
 * paginasi, jadi kalau sisa data run sebelumnya dibiarkan menumpuk, response
 * time-nya naik terus dan angkanya tidak bisa dibandingkan antar-run.
 *
 * Yang dibuat:
 *   - VOLUME_KASUS kasus  → beban baca untuk GET /api/penanganan
 *   - VOLUME_LAPORAN laporan (sudah diregistrasi) → isi latar database
 *   - TARGET_LAPORAN laporan berstatus menunggu_registrasi → sasaran
 *     POST /api/penanganan/registrasi, id-nya diekspor ke CSV
 *
 * Kenapa perlu CSV: registrasi menolak laporan_id yang sudah pernah dipakai
 * (422). Kalau semua virtual user menembak id yang sama, error rate langsung
 * ~99% dan datanya tidak berarti apa-apa. Tiap thread harus dapat id sendiri.
 *
 * Pemakaian:
 *   node seed-loadtest-data.js micro --yes
 *   node seed-loadtest-data.js mono  --yes
 */

const fs = require('fs');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';

const VOLUME_KASUS = Number(process.env.VOLUME_KASUS || 500);
const VOLUME_LAPORAN = Number(process.env.VOLUME_LAPORAN || 500);
// Pengujian berbasis durasi, bukan jumlah iterasi tetap, sehingga banyaknya
// permintaan registrasi ditentukan kecepatan server. Jumlah ini disiapkan
// berlebih supaya antrean id tidak habis di tengah pengukuran — kalau habis,
// thread berhenti lebih awal dan tingkat konkurensinya ikut turun.
const TARGET_LAPORAN = Number(process.env.TARGET_LAPORAN || 60000);

// Microservices memecah data ke dua database (satu per service); monolitik
// menyatukannya. Perbedaan ini murni konsekuensi arsitektur, bukan perlakuan
// yang dibedakan — jumlah dan isi dokumennya sama persis.
const TARGETS = {
  micro: { laporanDb: 'report_db', kasusDb: 'case_db', csv: 'laporan_ids_micro.csv' },
  mono: { laporanDb: 'monolith_db', kasusDb: 'monolith_db', csv: 'laporan_ids_mono.csv' },
};

const JENIS_KEKERASAN = [
  'Kekerasan Fisik',
  'Kekerasan Psikis',
  'Kekerasan Seksual',
  'KDRT',
  'Penelantaran',
  'Cyberbullying',
];

const KELURAHAN = ['Kadia', 'Mandonga', 'Wua-Wua', 'Poasia', 'Baruga', 'Kambu'];

// Kode dibuat deterministik dari nomor urut, bukan acak seperti hook pre-save
// di model. Koleksi selalu dikosongkan lebih dulu, jadi nomor urut sudah cukup
// menjamin keunikan — sekaligus menghindari tabrakan indeks unique yang mulai
// nyata kemungkinannya pada ribuan dokumen acak 5 karakter.
function buatKode(index) {
  return `LP-2026-${index.toString(36).toUpperCase().padStart(5, '0')}`;
}

function buatLaporan(index, sudahDiregistrasi) {
  const now = new Date();
  return {
    _id: new ObjectId(),
    kode_laporan: buatKode(index),
    tipe_laporan: 'perempuan',
    anonim: false,
    nama_pelapor: `Pelapor Uji ${index}`,
    nik_pelapor: null,
    telepon_pelapor: `08127${String(index).padStart(7, '0')}`,
    hubungan_korban: 'Keluarga',
    nama_korban: `Korban Uji ${index}`,
    nik_korban: null,
    usia_korban: 18 + (index % 40),
    jenis_kelamin: 'Perempuan',
    alamat_korban: `Jl. Data Uji No. ${index % 200}`,
    kelurahan_korban: KELURAHAN[index % KELURAHAN.length],
    jenis_kekerasan: JENIS_KEKERASAN[index % JENIS_KEKERASAN.length],
    tanggal_kejadian: new Date('2026-07-01'),
    lokasi_kejadian: 'Kota Kendari',
    latitude: -3.99 + (index % 100) / 10000,
    longitude: 122.51 + (index % 100) / 10000,
    kronologi: 'Data sintetis untuk pengujian beban. Bukan laporan sebenarnya.',
    bukti_file: null,
    preferensi_layanan: 'Datang ke UPTD',
    pernyataan_benar: true,
    status: sudahDiregistrasi ? 'proses_assessment' : 'menunggu_registrasi',
    catatan: null,
    // Dikunci 'sent' supaya worker email reminder tidak ikut memproses data uji
    // dan mengganggu pengukuran.
    email_reminder_sent_at: sudahDiregistrasi ? now : null,
    email_reminder_status: 'sent',
    email_reminder_claimed_at: null,
    email_reminder_claim_token: null,
    createdAt: now,
    updatedAt: now,
  };
}

function buatKasus(laporan) {
  const now = new Date();
  return {
    _id: new ObjectId(),
    laporan_id: String(laporan._id),
    kode_laporan: laporan.kode_laporan,
    petugas_id: '000000000000000000000000',
    petugas_name: 'Petugas Uji Beban',
    pesan_tindak_lanjut: 'Data sintetis pengujian beban',
    metode_pertemuan: 'Datang ke UPTD',
    tanggal_registrasi: now,
    hasil_assessment: null,
    kondisi_korban: null,
    kebutuhan_korban: null,
    tanggal_assessment: null,
    metode_penanganan: null,
    rencana_tindakan: null,
    tanggal_mulai: null,
    status: 'registrasi',
    activity_log: [],
    tanggal_selesai: null,
    arsip: false,
    createdAt: now,
    updatedAt: now,
  };
}

async function main() {
  const mode = process.argv[2];
  const konfirmasi = process.argv.includes('--yes');

  if (!TARGETS[mode]) {
    console.error('Pemakaian: node seed-loadtest-data.js <micro|mono> --yes');
    process.exit(1);
  }
  if (!konfirmasi) {
    console.error(
      'Skrip ini menghapus dokumen bertanda data uji di koleksi laporans dan kasus\n' +
      '(bukan seluruh isi koleksi — dokumen asli aman), lalu mengisinya ulang.\n' +
      'Tambahkan --yes untuk lanjut.'
    );
    process.exit(1);
  }

  const target = TARGETS[mode];
  const client = new MongoClient(MONGO_URL);
  await client.connect();

  // Nama koleksi diambil dari model, bukan ditebak. Mongoose memperlakukan
  // "Kasus" sebagai kata yang sudah jamak sehingga koleksinya bernama `kasus`,
  // bukan `kasuses` — menebaknya salah membuat data uji masuk ke koleksi yang
  // tidak pernah dibaca aplikasi.
  const laporanCol = client.db(target.laporanDb).collection('laporans');
  const kasusCol = client.db(target.kasusDb).collection('kasus');

  // Penghapusan SELEKTIF, bukan deleteMany({}) kosongkan seluruh koleksi.
  // Untuk mode 'micro', laporanDb/kasusDb ini adalah report_db/case_db —
  // basis data yang sama dipakai case-service/report-service yang hidup di
  // baliknya UI. deleteMany({}) polos pernah menghapus laporan asli yang
  // masuk lewat UI di antara sesi pengujian. Filter di bawah cuma mengenai
  // dokumen yang memang dibuat skrip ini atau JMeter (lihat PENANDA_UJI di
  // seed-loadtest-data.js, sipeka-load-test.jmx, sipeka-beban-campuran.jmx —
  // ketiganya harus dijaga konsisten).
  const filterLaporanUji = { kronologi: { $regex: 'Data sintetis', $options: 'i' } };
  // "penyuntikan kegagalan" menangkap data dari pengujian fault-injection
  // RabbitMQ (skrip terpisah, bukan bagian folder ini) — jaga filter ini
  // konsisten dengan bersihkan-data-uji.js.
  const filterKasusUji = { pesan_tindak_lanjut: { $regex: 'pengujian beban|penyuntikan kegagalan', $options: 'i' } };
  await laporanCol.deleteMany(filterLaporanUji);
  await kasusCol.deleteMany(filterKasusUji);

  let urut = 1;

  const laporanTerdaftar = [];
  for (let i = 0; i < VOLUME_KASUS; i++) laporanTerdaftar.push(buatLaporan(urut++, true));
  const kasus = laporanTerdaftar.map(buatKasus);

  const laporanLatar = [];
  for (let i = 0; i < VOLUME_LAPORAN; i++) laporanLatar.push(buatLaporan(urut++, true));

  const laporanSasaran = [];
  for (let i = 0; i < TARGET_LAPORAN; i++) laporanSasaran.push(buatLaporan(urut++, false));

  await laporanCol.insertMany([...laporanTerdaftar, ...laporanLatar, ...laporanSasaran]);
  await kasusCol.insertMany(kasus);
  await laporanCol.createIndex({ kode_laporan: 1 }, { unique: true });

  const csvPath = path.join(__dirname, target.csv);
  const isi = laporanSasaran.map((l) => `${l._id},${l.kode_laporan}`).join('\n');
  try {
    fs.writeFileSync(csvPath, isi + '\n', 'utf8');
  } catch (err) {
    // Penyebab tersering: berkasnya sedang dibuka Excel. Windows mengunci
    // berkas yang dibuka Excel, dan pesan bawaannya ("EBUSY") tidak
    // menyebutkan aplikasi mana yang menahannya.
    if (err.code === 'EBUSY' || err.code === 'EPERM') {
      await client.close();
      console.error(
        `\nTidak bisa menulis ${target.csv} karena sedang dibuka aplikasi lain.\n` +
        'Paling sering ini Microsoft Excel. Tutup berkasnya lalu jalankan ulang.'
      );
      process.exit(1);
    }
    throw err;
  }

  const sisaLaporanAsli = await laporanCol.countDocuments({ kronologi: { $not: { $regex: 'Data sintetis', $options: 'i' } } });
  const sisaKasusAsli = await kasusCol.countDocuments({ pesan_tindak_lanjut: { $not: { $regex: 'pengujian beban', $options: 'i' } } });

  console.log(`Mode          : ${mode}`);
  console.log(`Database      : laporan=${target.laporanDb}, kasus=${target.kasusDb}`);
  console.log(`Kasus         : ${kasus.length} (beban baca GET /api/penanganan)`);
  console.log(`Laporan latar : ${laporanLatar.length + laporanTerdaftar.length}`);
  console.log(`Laporan sasaran: ${laporanSasaran.length} → ${target.csv}`);
  console.log(`Data asli yang dilindungi: ${sisaLaporanAsli} laporan, ${sisaKasusAsli} kasus`);

  await client.close();
}

main().catch((err) => {
  console.error('Gagal menyiapkan data uji:', err);
  process.exit(1);
});
