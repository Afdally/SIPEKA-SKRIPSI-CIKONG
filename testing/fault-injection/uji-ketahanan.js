/**
 * Pengujian ketahanan penyelarasan status saat report-service dimatikan.
 *
 * Dua kondisi diukur dengan perlakuan yang sama persis, hanya berbeda pada
 * mekanisme pengiriman perubahan status:
 *
 *   sinkron — skrip memanggil PATCH /api/laporan/:id/status langsung ke
 *             report-service. Ini mereplikasi rancangan lama yang memakai
 *             axios.patch tanpa mekanisme pengulangan; jalur itu sudah dihapus
 *             dari case-service sehingga tidak bisa lagi dipicu lewat aplikasi.
 *
 *   broker  — skrip memanggil POST /api/penanganan/registrasi pada
 *             case-service, yang menerbitkan pesan ke antrean lewat produser
 *             sungguhan. Tidak ada bagian jalur ini yang disimulasikan.
 *
 * Keluarannya langsung memetakan ke kolom Tabel 7 pada naskah: jumlah dikirim,
 * berhasil tersinkron, hilang permanen, dan persentase keberhasilan. Waktu
 * pengosongan antrean dicatat terpisah.
 *
 * Pemakaian:
 *   node uji-ketahanan.js                 (100 perubahan status, kedua kondisi)
 *   node uji-ketahanan.js --n=200
 *   node uji-ketahanan.js --kondisi=broker
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const AKAR = path.resolve(__dirname, '..', '..');

// Driver MongoDB dipinjam dari testing/jmeter kalau folder ini belum punya
// node_modules sendiri. Penyiap data uji beban sudah memasangnya di sana,
// sehingga pengujian ini tidak menuntut instalasi terpisah.
function muatMongo() {
  try {
    return require('mongodb');
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') throw err;
    const pinjaman = path.join(AKAR, 'testing', 'jmeter', 'node_modules', 'mongodb');
    if (!fs.existsSync(pinjaman)) {
      throw new Error(
        'Driver mongodb tidak ditemukan. Pasang di folder ini, atau jalankan dulu ' +
        'penyiap data di testing/jmeter yang memasangnya.');
    }
    return require(pinjaman);
  }
}

const { MongoClient, ObjectId } = muatMongo();
const COMPOSE = path.join(AKAR, 'docker-compose.yml');
const CSV = path.join(AKAR, 'testing', 'jmeter', 'laporan_ids_micro.csv');
const HASIL = path.join(__dirname, 'hasil');

const GATEWAY = process.env.GATEWAY || 'http://localhost:8080';
const MONGO = process.env.MONGO_URL || 'mongodb://localhost:27017';
const RABBIT_API = process.env.RABBIT_API || 'http://localhost:15672';
const RABBIT_AUTH = 'Basic ' + Buffer.from('guest:guest').toString('base64');
const ANTREAN = 'kasus_status_updates';

const AKUN = {
  email: 'petugas@uptd-ppa.kendari.go.id',
  password: 'petugas123456',
};

// Status yang seharusnya terpasang pada Laporan setelah registrasi diproses.
const STATUS_TUJUAN = 'proses_assessment';
const STATUS_AWAL = 'menunggu_registrasi';

const arg = (nama, bawaan) => {
  const found = process.argv.find((a) => a.startsWith(`--${nama}=`));
  return found ? found.split('=')[1] : bawaan;
};

const JUMLAH = Number(arg('n', 100));
const KONDISI = arg('kondisi', 'keduanya');

const tidur = (ms) => new Promise((r) => setTimeout(r, ms));

function compose(...args) {
  execFileSync('docker', ['compose', '-f', COMPOSE, ...args], { stdio: 'inherit' });
}

async function kedalamanAntrean() {
  const url = `${RABBIT_API}/api/queues/%2F/${ANTREAN}`;
  const res = await fetch(url, { headers: { Authorization: RABBIT_AUTH } });
  if (!res.ok) throw new Error(`RabbitMQ API ${res.status}`);
  const data = await res.json();
  return data.messages ?? 0;
}

async function kosongkanAntrean() {
  const url = `${RABBIT_API}/api/queues/%2F/${ANTREAN}/contents`;
  await fetch(url, { method: 'DELETE', headers: { Authorization: RABBIT_AUTH } });
}

async function tungguSehat(batasDetik = 90) {
  const batas = Date.now() + batasDetik * 1000;
  while (Date.now() < batas) {
    try {
      const res = await fetch(`${GATEWAY}/api/master/kekerasan`);
      if (res.ok) return true;
    } catch (_) {
      // masih mati, coba lagi
    }
    await tidur(1000);
  }
  throw new Error('report-service tidak pulih dalam batas waktu');
}

async function tungguMati(batasDetik = 60) {
  const batas = Date.now() + batasDetik * 1000;
  while (Date.now() < batas) {
    try {
      const res = await fetch(`${GATEWAY}/api/master/kekerasan`);
      if (res.status >= 500) return true;
    } catch (_) {
      return true;
    }
    await tidur(500);
  }
  throw new Error('report-service masih melayani permintaan setelah dihentikan');
}

async function masuk() {
  const res = await fetch(`${GATEWAY}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(AKUN),
  });
  if (!res.ok) throw new Error(`Login gagal: ${res.status}`);
  const data = await res.json();
  const token = data.access_token || data.token || data.data?.access_token;
  if (!token) throw new Error('Token tidak ditemukan pada respons login');
  return token;
}

function ambilSasaran(jumlah, lewati) {
  const baris = fs.readFileSync(CSV, 'utf8').trim().split('\n');
  const dipilih = baris.slice(lewati, lewati + jumlah);
  if (dipilih.length < jumlah) {
    throw new Error(`CSV hanya menyediakan ${dipilih.length} baris, butuh ${jumlah}`);
  }
  return dipilih.map((b) => {
    const [id, kode] = b.split(',');
    return { id: id.trim(), kode: kode.trim() };
  });
}

// Koleksi kasus bernama 'kasus', bukan 'kasuses'. Ini bukan pluralisasi bawaan
// Mongoose, jadi mudah salah tebak; penyiap data di testing/jmeter memakai nama
// yang sama. Salah nama membuat penyetelan ulang diam-diam tidak berefek dan
// registrasi berikutnya ditolak dengan 422.
const KOLEKSI_KASUS = 'kasus';

async function setelUlang(klien, sasaran) {
  const ids = sasaran.map((s) => s.id);
  const objectIds = ids.map((id) => new ObjectId(id));

  await klien.db('report_db').collection('laporans').updateMany(
    { _id: { $in: objectIds } },
    { $set: { status: STATUS_AWAL }, $unset: { catatan: '' } },
  );
  await klien.db('case_db').collection(KOLEKSI_KASUS)
    .deleteMany({ laporan_id: { $in: ids } });
  await kosongkanAntrean();
}

// Tanpa pemeriksaan ini, CSV yang sudah basi menghasilkan pengujian yang
// tampak berjalan mulus namun tidak mengukur apa pun: case-service tidak
// memverifikasi keberadaan laporan saat registrasi, sehingga pesan tetap
// diterbitkan lalu dibuang konsumen karena laporannya tidak ditemukan.
async function pastikanSasaranAda(klien, sasaran) {
  const objectIds = sasaran.map((s) => new ObjectId(s.id));
  const ada = await klien.db('report_db').collection('laporans')
    .countDocuments({ _id: { $in: objectIds } });

  if (ada !== sasaran.length) {
    throw new Error(
      `Hanya ${ada} dari ${sasaran.length} laporan sasaran yang ada di report_db. ` +
      'Berkas laporan_ids_micro.csv tidak lagi cocok dengan isi basis data. ' +
      'Siapkan ulang data uji: node ../jmeter/seed-loadtest-data.js micro --yes');
  }
}

async function hitungTersinkron(klien, sasaran) {
  const objectIds = sasaran.map((s) => new ObjectId(s.id));
  return klien.db('report_db').collection('laporans').countDocuments({
    _id: { $in: objectIds },
    status: STATUS_TUJUAN,
  });
}

// Meniru persis panggilan yang dihapus pada commit ac156cf:
//
//   await axios.patch(
//     `${REPORT_URL}/api/laporan/${laporan_id}/status`,
//     { status: 'proses_assessment', catatan: pesan_tindak_lanjut },
//     { headers: { Authorization: `Bearer ${req.raw_token}` } }
//   );
//
// Rute tersebut berada di bawah router.use(authMid) pada report-service,
// sehingga token wajib dikirim; tanpa itu kegagalan yang terukur berasal dari
// penolakan otentikasi, bukan dari layanan yang sedang mati.
async function kirimSinkron(sasaran, token) {
  let gagalSeketika = 0;
  for (const s of sasaran) {
    try {
      const res = await fetch(`${GATEWAY}/api/laporan/${s.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: STATUS_TUJUAN,
          catatan: 'Uji ketahanan penyuntikan kegagalan',
        }),
      });
      if (!res.ok) gagalSeketika += 1;
    } catch (_) {
      gagalSeketika += 1;
    }
  }
  return gagalSeketika;
}

async function kirimLewatBroker(sasaran, token) {
  let gagalSeketika = 0;
  for (const s of sasaran) {
    try {
      const res = await fetch(`${GATEWAY}/api/penanganan/registrasi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          laporan_id: s.id,
          kode_laporan: s.kode,
          pesan_tindak_lanjut: 'Uji ketahanan penyuntikan kegagalan',
          metode_pertemuan: 'Datang ke UPTD',
        }),
      });
      if (!res.ok) gagalSeketika += 1;
    } catch (_) {
      gagalSeketika += 1;
    }
  }
  return gagalSeketika;
}

async function jalankan(kondisi, klien, lewati) {
  console.log(`\n=== Kondisi: ${kondisi} (${JUMLAH} perubahan status) ===`);
  const sasaran = ambilSasaran(JUMLAH, lewati);

  await tungguSehat();
  const token = await masuk();
  await pastikanSasaranAda(klien, sasaran);
  await setelUlang(klien, sasaran);

  console.log('Menghentikan report-service...');
  compose('stop', 'report-service');
  await tungguMati();

  console.log('Mengirim perubahan status selagi layanan mati...');
  const mulaiKirim = Date.now();
  const gagalSeketika = kondisi === 'sinkron'
    ? await kirimSinkron(sasaran, token)
    : await kirimLewatBroker(sasaran, token);
  const durasiKirim = (Date.now() - mulaiKirim) / 1000;

  // Plugin manajemen RabbitMQ menyegarkan statistiknya setiap beberapa detik,
  // sehingga pembacaan tepat setelah pengiriman bisa mengembalikan nol palsu.
  // Konsumen masih mati di titik ini, jadi antrean tidak mungkin menyusut dan
  // nilai terbesar yang teramati adalah nilai yang benar.
  let tertahan = 0;
  for (let i = 0; i < 10; i += 1) {
    await tidur(1000);
    tertahan = Math.max(tertahan, await kedalamanAntrean());
    if (tertahan >= JUMLAH) break;
  }
  console.log(`Pesan tertahan di antrean: ${tertahan}`);

  console.log('Menghidupkan kembali report-service...');
  const mulaiPulih = Date.now();
  compose('start', 'report-service');
  await tungguSehat();

  let waktuKosong = null;
  if (kondisi === 'broker') {
    const batas = Date.now() + 120000;
    while (Date.now() < batas) {
      if ((await kedalamanAntrean()) === 0) break;
      await tidur(250);
    }
    waktuKosong = (Date.now() - mulaiPulih) / 1000;
    console.log(`Antrean kosong setelah ${waktuKosong.toFixed(2)} detik sejak layanan dimulai`);
  } else {
    // Beri jeda setara agar kedua kondisi mendapat kesempatan pulih yang sama.
    await tidur(5000);
  }

  const tersinkron = await hitungTersinkron(klien, sasaran);
  const hilang = JUMLAH - tersinkron;
  const persen = (tersinkron / JUMLAH) * 100;

  const baris = {
    kondisi,
    dikirim: JUMLAH,
    gagalSeketika,
    tertahanDiAntrean: tertahan,
    tersinkron,
    hilangPermanen: hilang,
    keberhasilanPersen: Number(persen.toFixed(2)),
    durasiKirimDetik: Number(durasiKirim.toFixed(2)),
    waktuPengosonganAntreanDetik: waktuKosong === null ? null : Number(waktuKosong.toFixed(2)),
  };

  console.log(JSON.stringify(baris, null, 2));
  return baris;
}

async function main() {
  if (!fs.existsSync(CSV)) {
    throw new Error(`CSV sasaran tidak ditemukan: ${CSV}\n` +
      'Jalankan dulu: node ../jmeter/seed-loadtest-data.js micro --yes');
  }
  fs.mkdirSync(HASIL, { recursive: true });

  const klien = await MongoClient.connect(MONGO);
  const hasil = [];
  try {
    if (KONDISI === 'sinkron' || KONDISI === 'keduanya') {
      hasil.push(await jalankan('sinkron', klien, 0));
    }
    if (KONDISI === 'broker' || KONDISI === 'keduanya') {
      hasil.push(await jalankan('broker', klien, JUMLAH));
    }
  } finally {
    await klien.close();
    // Pastikan sistem ditinggalkan dalam keadaan hidup.
    try {
      compose('start', 'report-service');
    } catch (_) {
      // sudah hidup
    }
  }

  const berkas = path.join(HASIL, `ketahanan-${Date.now()}.json`);
  fs.writeFileSync(berkas, JSON.stringify(hasil, null, 2));

  console.log('\n=== Ringkasan untuk Tabel 7 ===');
  for (const b of hasil) {
    const nama = b.kondisi === 'sinkron'
      ? 'Tanpa message broker (HTTP sinkron)'
      : 'Dengan message broker (RabbitMQ)';
    console.log(`${nama} | ${b.dikirim} | ${b.tersinkron} | ${b.hilangPermanen} | ` +
      `${b.keberhasilanPersen.toFixed(2)}`);
  }
  const brokerRow = hasil.find((b) => b.kondisi === 'broker');
  if (brokerRow?.waktuPengosonganAntreanDetik !== null && brokerRow) {
    console.log(`\nWaktu pengosongan antrean: ${brokerRow.waktuPengosonganAntreanDetik} detik`);
  }
  console.log(`\nHasil mentah: ${berkas}`);
}

main().catch((err) => {
  console.error('GAGAL:', err.message);
  process.exit(1);
});
