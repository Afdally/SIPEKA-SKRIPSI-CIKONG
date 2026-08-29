/**
 * Membersihkan sisa data uji beban dari report_db/case_db — basis data yang
 * sama dipakai case-service/report-service yang hidup di baliknya UI.
 *
 * Jalankan ini setelah selesai sesi pengujian arsitektur 'micro', SEBELUM
 * memakai UI lagi untuk demo/pengembangan/UAT. seed-loadtest-data.js sendiri
 * sudah membersihkan data lamanya sebelum tiap run (selektif, bukan
 * deleteMany({}) polos — lihat komentar di sana), tapi kalau sesi pengujian
 * berhenti di tengah jalan (Ctrl+C, error, listrik mati), sisa data uji bisa
 * tertinggal sampai run berikutnya.
 *
 * Filter yang dipakai sama persis dengan seed-loadtest-data.js:
 *   - laporans : kronologi mengandung "Data sintetis"
 *   - kasus    : pesan_tindak_lanjut mengandung "pengujian beban"
 * Kalau kamu ubah kalimat penanda di seed-loadtest-data.js atau di berkas
 * .jmx, filter di sini harus ikut diubah — jangan biarkan menyimpang.
 *
 * Pemakaian:
 *   node bersihkan-data-uji.js          (lihat dulu berapa yang akan dihapus)
 *   node bersihkan-data-uji.js --yes    (benar-benar hapus)
 */

const { MongoClient } = require('mongodb');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const FILTER_LAPORAN = { kronologi: { $regex: 'Data sintetis', $options: 'i' } };
// "pengujian beban" menangkap skrip di folder ini; "penyuntikan kegagalan"
// menangkap data dari pengujian fault-injection RabbitMQ (dibuat terpisah,
// bukan oleh skrip ini) — polanya sama: teks "Uji ketahanan penyuntikan
// kegagalan" di pesan_tindak_lanjut. Tambahkan penanda baru di sini kalau
// nanti ada skrip pengujian lain yang menulis ke case_db/report_db.
const FILTER_KASUS = { pesan_tindak_lanjut: { $regex: 'pengujian beban|penyuntikan kegagalan', $options: 'i' } };

async function main() {
  const konfirmasi = process.argv.includes('--yes');
  const client = new MongoClient(MONGO_URL);
  await client.connect();

  const laporanCol = client.db('report_db').collection('laporans');
  const kasusCol = client.db('case_db').collection('kasus');

  const jmlLaporan = await laporanCol.countDocuments(FILTER_LAPORAN);
  const jmlKasus = await kasusCol.countDocuments(FILTER_KASUS);
  const totalLaporan = await laporanCol.countDocuments();
  const totalKasus = await kasusCol.countDocuments();

  console.log(`report_db.laporans : ${jmlLaporan} data uji dari total ${totalLaporan}`);
  console.log(`case_db.kasus      : ${jmlKasus} data uji dari total ${totalKasus}`);

  if (jmlLaporan === 0 && jmlKasus === 0) {
    console.log('\nTidak ada data uji tersisa. Basis data sudah bersih.');
    await client.close();
    return;
  }

  if (!konfirmasi) {
    console.log('\nTambahkan --yes untuk benar-benar menghapus data di atas.');
    await client.close();
    return;
  }

  const r1 = await laporanCol.deleteMany(FILTER_LAPORAN);
  const r2 = await kasusCol.deleteMany(FILTER_KASUS);
  console.log(`\nDihapus: ${r1.deletedCount} laporan, ${r2.deletedCount} kasus.`);
  console.log(`Sisa asli: ${totalLaporan - r1.deletedCount} laporan, ${totalKasus - r2.deletedCount} kasus.`);

  await client.close();
}

main().catch((err) => {
  console.error('Gagal membersihkan data uji:', err);
  process.exit(1);
});
