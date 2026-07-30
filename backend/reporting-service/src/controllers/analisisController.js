// POST /api/laporan/analisis-kronologi
//
// Membaca cerita bebas pelapor dan mengusulkan isi formulir. Usulan, bukan
// keputusan: pelapor tetap memeriksa dan mengoreksi sebelum laporan dikirim,
// jadi kesalahan model tidak pernah langsung menjadi data resmi.
//
// Dua lapis, sengaja:
//   1. Ollama (model bahasa) untuk hal yang butuh pemahaman kalimat
//   2. Aturan/regex untuk daftar tertutup & hitungan tanggal, sekaligus jadi
//      cadangan penuh kalau Ollama mati atau kelewat lambat
//
// Endpoint ini publik (formulir pelaporan tidak butuh login), makanya ada
// pembatas laju sederhana di bawah.

const MasterKekerasan = require('../models/MasterKekerasan');
const ollama = require('../services/ollamaClient');
const {
  ekstrakDenganAturan,
  konversiTanggal,
  cocokkanKelurahan,
  bersihkanNama,
  bersihkanPilihan,
  bersihkanUsia,
  bersihkanTeksPendek,
  HUBUNGAN_VALID,
  JENIS_KELAMIN_VALID,
} = require('../services/ekstraksiRule');

const KRONOLOGI_MIN = 50;
const KRONOLOGI_MAKS = 2000;

// ─── Pembatas laju sederhana ───
// Endpoint publik yang memicu inferensi model itu sasaran penyalahgunaan yang
// mahal (satu permintaan bisa memakan CPU belasan detik). Volume nyata cuma
// belasan laporan per bulan, jadi batas ini sangat longgar untuk pemakaian wajar.
const BATAS_PER_JENDELA = 10;
const JENDELA_MS = 60 * 1000;
const jejak = new Map(); // ip -> number[] (timestamp)

function lewatBatas(ip) {
  const sekarang = Date.now();
  const daftar = (jejak.get(ip) || []).filter(t => sekarang - t < JENDELA_MS);
  daftar.push(sekarang);
  jejak.set(ip, daftar);

  // Bersihkan entri IP yang sudah lama tidak aktif supaya Map tidak tumbuh terus
  if (jejak.size > 500) {
    for (const [k, v] of jejak) {
      if (v.every(t => sekarang - t >= JENDELA_MS)) jejak.delete(k);
    }
  }

  return daftar.length > BATAS_PER_JENDELA;
}

// Ambil nilai yang sah dari hasil model. Apa pun yang tidak lolos validasi
// dibuang (jadi null), bukan dipaksakan masuk form.
function bersihkanHasilModel(mentah, { masterKekerasan, kronologi, sekarang }) {
  return {
    namaKorban:      bersihkanNama(mentah.nama_korban),
    namaPelapor:     bersihkanNama(mentah.nama_pelapor),
    // `mentah.nama_pelaku` DIBUANG dengan sengaja — formulir tidak punya field
    // pelaku. Field itu tetap diminta ke model sebagai tempat pembuangan supaya
    // nama pelaku tidak salah masuk ke nama_korban (lihat SKEMA di ollamaClient).
    usiaKorban:      bersihkanUsia(mentah.usia_korban),
    jenisKelamin:    bersihkanPilihan(mentah.jenis_kelamin, JENIS_KELAMIN_VALID),
    hubunganKorban:  bersihkanPilihan(mentah.hubungan_pelapor, HUBUNGAN_VALID),
    jenisKekerasan:  bersihkanPilihan(mentah.jenis_kekerasan, masterKekerasan),
    lokasiKejadian:  bersihkanTeksPendek(mentah.lokasi_kejadian),
    // Kelurahan TIDAK diambil dari model — dicocokkan dari daftar tertutup
    // supaya tidak mungkin muncul nama kelurahan yang tidak ada.
    kelurahanKorban: cocokkanKelurahan(kronologi),
    // Model hanya menyalin frasa waktunya; hitungan tanggalnya dikerjakan kode.
    tanggalKejadian: konversiTanggal(mentah.waktu_kejadian, sekarang)
                     || konversiTanggal(kronologi, sekarang),
  };
}

// Field yang kosong di hasil utama diisi dari hasil aturan.
function gabungkan(utama, cadangan) {
  const hasil = {};
  for (const kunci of Object.keys(cadangan)) {
    hasil[kunci] = utama[kunci] ?? cadangan[kunci] ?? null;
  }
  return hasil;
}

exports.analisisKronologi = async (req, res) => {
  const { kronologi } = req.body || {};

  if (typeof kronologi !== 'string' || kronologi.trim().length < KRONOLOGI_MIN) {
    return res.status(422).json({ message: `Cerita minimal ${KRONOLOGI_MIN} huruf.` });
  }
  if (kronologi.length > KRONOLOGI_MAKS) {
    return res.status(422).json({ message: `Cerita maksimal ${KRONOLOGI_MAKS} huruf.` });
  }

  const ip = req.ip || req.socket?.remoteAddress || 'tak-diketahui';
  if (lewatBatas(ip)) {
    return res.status(429).json({ message: 'Terlalu banyak permintaan analisis. Coba lagi sebentar.' });
  }

  const sekarang = new Date();

  let masterKekerasan = [];
  try {
    const master = await MasterKekerasan.find({ is_active: true }).select('nama_kategori -_id');
    masterKekerasan = master.map(m => m.nama_kategori);
  } catch (err) {
    console.error('⚠️ Gagal memuat master kekerasan:', err.message);
  }

  const hasilAturan = ekstrakDenganAturan(kronologi, { masterKekerasan, sekarang });

  let hasil = hasilAturan;
  let sumber = 'aturan';
  let model = null;
  let durasiMs = 0;
  let catatan = null;

  try {
    const { mentah, durasiMs: durasi, model: namaModel } = await ollama.analisisKronologi({
      kronologi,
      masterKekerasan,
      hubunganValid: HUBUNGAN_VALID,
      jenisKelaminValid: JENIS_KELAMIN_VALID,
    });

    hasil = gabungkan(bersihkanHasilModel(mentah, { masterKekerasan, kronologi, sekarang }), hasilAturan);
    sumber = 'model';
    model = namaModel;
    durasiMs = durasi;
  } catch (err) {
    // Bukan kegagalan permintaan: pelapor tetap dapat hasil dari aturan.
    // Isi cerita sengaja TIDAK ikut di-log — ini data pribadi bersifat spesifik.
    console.error(`⚠️ Analisis model gagal (${err.name}: ${err.message}) — memakai ekstraksi aturan.`);
    catatan = 'Analisis otomatis tidak tersedia, hasil diisi dengan pembacaan sederhana.';
  }

  return res.json({
    sumber,
    model,
    durasi_ms: durasiMs,
    catatan,
    hasil,
    // Dipakai antarmuka untuk menandai field mana yang terisi otomatis,
    // supaya pelapor tahu bagian mana yang perlu diteliti.
    terisi: Object.keys(hasil).filter(k => hasil[k] !== null && hasil[k] !== ''),
  });
};
