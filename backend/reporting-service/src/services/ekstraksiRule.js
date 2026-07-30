// Ekstraksi berbasis aturan (regex + pencocokan daftar tertutup).
//
// Dua perannya:
//   1. Cadangan penuh kalau Ollama mati / kelewat lambat — pelapor tetap dapat
//      bantuan pengisian, cuma lebih sederhana.
//   2. Pengisi celah untuk field yang tidak berhasil diambil model.
//
// Yang ditangani di sini adalah hal-hal yang justru LEBIH andal dikerjakan kode
// daripada model kecil: pencocokan daftar tertutup (kelurahan) dan hitung-hitungan
// tanggal. Model 3B sering keliru menghitung "tiga bulan lalu".

const { SEMUA_KELURAHAN } = require('../data/kelurahan');

const HUBUNGAN_VALID = ['Orang Tua', 'Anak', 'Saudara', 'Suami/Istri', 'Tetangga', 'Teman', 'Diri Sendiri'];
const JENIS_KELAMIN_VALID = ['Laki-laki', 'Perempuan'];

// Kata yang sering dikira nama oleh model, padahal bukan.
const BUKAN_NAMA = new Set([
  'sa','s','ak','saya', 'aku', 'dia', 'ia', 'kami', 'korban', 'pelaku', 'anak', 'anaknya',
  'ibu', 'ayah', 'suami', 'istri', 'tidak', 'tidak ada', 'tidak disebutkan', '-',
]);

const BULAN = {
  januari: 0, februari: 1, maret: 2, april: 3, mei: 4, juni: 5,
  juli: 6, agustus: 7, september: 8, oktober: 9, november: 10, desember: 11,
};

// ─── Normalisasi ketikan singkat ───
//
// Pelapor sering menulis cepat dan disingkat ("adek s dipukuli sma bpkku di rmh
// kmrn"). Tanpa dinormalkan, hampir semua pola di bawah gagal. Model bahasa
// relatif tahan terhadap ini, tapi lapisan aturan tidak — dan lapisan aturan
// justru yang dipakai saat Ollama mati, jadi di situ normalisasi paling penting.
//
// Hanya dipakai untuk MEMBACA. Teks asli pelapor tidak pernah diubah.

const SINGKATAN = {
  // sapaan & kerabat
  bpk: 'bapak', bpa: 'bapak', bapa: 'bapak', pak: 'bapak',
  ayh: 'ayah', ibuk: 'ibu', bu: 'ibu', mama: 'ibu', mami: 'ibu',
  papa: 'bapak', papi: 'bapak', ortu: 'orang tua',
  adek: 'adik', ade: 'adik', adk: 'adik', dek: 'adik',
  kk: 'kakak', kaka: 'kakak', kakk: 'kakak',
  tmn: 'teman', sdr: 'saudara', spupu: 'sepupu',
  // kata ganti
  aku: 'saya', gw: 'saya', gue: 'saya', sy: 'saya', ak: 'saya',
  // kata penghubung & pengingkar
  sma: 'sama', sm: 'sama', dgn: 'dengan', dg: 'dengan',
  yg: 'yang', krn: 'karena', karna: 'karena', utk: 'untuk',
  tdk: 'tidak', gk: 'tidak', ga: 'tidak', gak: 'tidak', ndak: 'tidak', nggak: 'tidak',
  udh: 'sudah', udah: 'sudah', sdh: 'sudah', blm: 'belum', belom: 'belum',
  // tempat & waktu
  rmh: 'rumah', sklh: 'sekolah', skolah: 'sekolah', kmr: 'kamar',
  kmrn: 'kemarin', kmren: 'kemarin', skrg: 'sekarang', tgl: 'tanggal',
  thn: 'tahun', bln: 'bulan', mgg: 'minggu',
};

// Kerabat + akhiran "-ku" -> "<kerabat> saya", supaya pola kepemilikan di bawah
// ikut kena. Ditulis sebelum penggantian singkatan, jadi bentuk singkatnya
// (bpkku) juga tertangani: "bpkku" -> "bpk saya" -> "bapak saya".
const KERABAT_UNTUK_KU = [
  'bpk', 'bapak', 'bapa', 'pak', 'papa', 'papi', 'ayh', 'ayah',
  'ibu', 'ibuk', 'mama', 'mami', 'ortu', 'orang tua',
  'anak', 'adek', 'ade', 'adk', 'adik', 'kakak', 'kaka', 'kk',
  'suami', 'istri', 'teman', 'tmn', 'tetangga', 'saudara', 'sdr', 'sepupu',
];

function normalisasiTeks(teks) {
  let t = String(teks).toLowerCase();

  // "bpkku" / "adikku" / "anakku" -> "<kerabat> saya"
  const polaKu = new RegExp(`\\b(${KERABAT_UNTUK_KU.join('|')})ku\\b`, 'g');
  t = t.replace(polaKu, '$1 saya');

  // Singkatan per kata (utuh saja, supaya "sama" tidak ikut terpotong)
  t = t.replace(/\b[a-z]+\b/g, (kata) => SINGKATAN[kata] || kata);

  return t;
}

// ─── Usia ───

function tebakUsia(teksAsli) {
  const teks = normalisasiTeks(teksAsli);
  // "15 tahun", "umur 15", "berusia 7 thn"
  const langsung = teks.match(/(?:umur|usia|berumur|berusia)?\s*(\d{1,2})\s*(?:tahun|thn|th\b)/i);
  if (langsung) return Number(langsung[1]);

  // "kelas 2 SMP" -> perkiraan usia sekolah. Ditandai perkiraan, bukan pasti,
  // tapi tetap membantu karena pelapor bisa mengoreksi.
  const kelas = teks.match(/kelas\s*(\d{1,2})\s*(sd|smp|sma|smk)?/i);
  if (kelas) {
    const tingkat = Number(kelas[1]);
    const jenjang = (kelas[2] || '').toLowerCase();
    if (jenjang === 'sd' || (!jenjang && tingkat <= 6)) return 6 + tingkat;
    if (jenjang === 'smp') return 12 + tingkat;
    if (jenjang === 'sma' || jenjang === 'smk') return 15 + tingkat;
  }
  return null;
}

// ─── Jenis kelamin ───

function tebakJenisKelamin(teks) {
  const t = normalisasiTeks(teks);
  if (/\b(perempuan|wanita|istri|ibu|putri|anak perempuan|gadis)\b/.test(t)) return 'Perempuan';
  if (/\b(laki-laki|lelaki|pria|suami|putra|anak laki-laki)\b/.test(t)) return 'Laki-laki';
  return null;
}

// ─── Hubungan pelapor dengan korban ───

// Menebak hubungan pelapor dengan KORBAN — pelapor sering bukan korbannya.
//
// Jebakan utamanya: kerabat yang disebut bisa berperan sebagai PELAKU, bukan
// korban. Bandingkan tiga kalimat ini:
//
//   "anak saya dipukul gurunya"           anak = korban   -> Orang Tua
//   "saya dipukul oleh ayah tiri saya"    ayah = pelaku   -> Diri Sendiri
//   "adik saya dipukuli sama bapak saya"  adik = korban,
//                                         bapak = pelaku  -> Saudara
//
// Penandanya: kerabat yang didahului "oleh"/"sama"/"dari" atau didahului kata
// kekerasan ("dipukul bapak saya") itu pelaku, jadi diabaikan.

const KERABAT_KE_HUBUNGAN = [
  ['anak|putra|putri',        'Orang Tua'],
  ['ibu|ayah|bapak|orang tua', 'Anak'],
  ['kakak|adik|saudara|sepupu', 'Saudara'],
  ['suami|istri',             'Suami/Istri'],
  ['tetangga',                'Tetangga'],
  ['teman|sahabat',           'Teman'],
];

const KATA_KEKERASAN = /(pukul|tampar|tendang|ancam|leceh|paksa|aniaya|hina|cekik|cabul|perkosa|disebar|telantar|bentak)/;

// Diuji terhadap potongan teks TEPAT SEBELUM sebutan kerabat.
const PENANDA_PELAKU = /(?:\boleh|\bsama|\bdari|\w*(?:pukul|tampar|tendang|leceh|aniaya|ancam|hina|bentak|cabul|perkosa|cekik)\w*)\s+$/;

// Cari sebutan kerabat yang berperan sebagai korban. `wajibMilik` = hanya terima
// bentuk kepemilikan ("adik saya"), yang jauh lebih meyakinkan daripada sebutan
// telanjang ("adik") karena tidak mungkin tertukar dengan orang lain di cerita.
function cariKerabatKorban(t, wajibMilik) {
  for (const [kerabat, hubungan] of KERABAT_KE_HUBUNGAN) {
    const akhiran = wajibMilik ? '\\s+(?:\\w+\\s+)?saya\\b' : '\\b';
    const pola = new RegExp(`\\b(?:${kerabat})${akhiran}`, 'g');

    let cocok;
    while ((cocok = pola.exec(t)) !== null) {
      const sebelum = t.slice(Math.max(0, cocok.index - 24), cocok.index);
      if (PENANDA_PELAKU.test(sebelum)) continue; // ini pelaku, bukan korban
      return hubungan;
    }
  }
  return null;
}

function tebakHubungan(teks) {
  const t = normalisasiTeks(teks);

  // Dua lapis: yang meyakinkan dulu ("adik saya"), baru yang longgar ("adik").
  // Tanpa pemisahan ini, kalimat seperti "tetangga saya seorang ibu ditelantarkan"
  // salah terbaca sebagai "Anak" hanya karena kata "ibu" muncul lebih awal.
  return cariKerabatKorban(t, true)
      || cariKerabatKorban(t, false)
      // Sisanya: cerita orang pertama tanpa kerabat sebagai korban.
      || (/\bsaya\b/.test(t) && KATA_KEKERASAN.test(t) ? 'Diri Sendiri' : null);
}

// ─── Jenis kekerasan ───

// Kata kunci -> nama kategori. Nama kategori harus ada di master data
// (MasterKekerasan), makanya daftar master dikirim sebagai parameter.
const KAMUS_KEKERASAN = {
  // 'leceh' dipakai sebagai kata dasar supaya sekaligus menangkap
  // "pelecehan", "dilecehkan", dan "melecehkan".
  'Kekerasan Seksual': ['leceh', 'perkosa', 'seksual', 'dipaksa berhubungan', 'diremas', 'cabul'],
  'Kekerasan Fisik':   ['pukul', 'tampar', 'tendang', 'lempar', 'cekik', 'seret', 'dianiaya', 'jambak', 'dibanting'],
  'Kekerasan Psikis':  ['ancam', 'bentak', 'hina', 'trauma', 'teror', 'dipermalukan', 'dimaki', 'direndahkan'],
  'Penelantaran':      ['telantar', 'tidak diberi makan', 'ditinggal', 'diabaikan', 'tidak dinafkahi'],
  'Cyberbullying':     ['media sosial', 'medsos', 'whatsapp', 'online', 'diunggah', 'disebar', 'foto saya disebar'],
  'KDRT':              ['rumah tangga', 'kdrt'],
};

function tebakJenisKekerasan(teks, masterKekerasan = []) {
  const t = normalisasiTeks(teks);
  const tersedia = new Set(masterKekerasan);

  // Urutan objek dipertahankan: yang lebih spesifik (seksual, fisik) diperiksa
  // lebih dulu daripada yang umum (KDRT), karena cerita KDRT hampir selalu juga
  // memuat kata kekerasan fisik/psikis.
  for (const [kategori, kataKunci] of Object.entries(KAMUS_KEKERASAN)) {
    if (!tersedia.has(kategori)) continue;
    if (kataKunci.some(k => t.includes(k))) return kategori;
  }
  return null;
}

// ─── Kelurahan ───

function cocokkanKelurahan(teks) {
  const t = normalisasiTeks(teks);
  // Yang namanya paling panjang diperiksa dulu supaya "Kampung Salo" tidak
  // kalah oleh pencocokan sepotong.
  const urut = [...SEMUA_KELURAHAN].sort((a, b) => b.length - a.length);
  for (const kel of urut) {
    // \b tidak dipakai karena ada nama bertanda hubung (Wua-Wua); pakai
    // pembatas manual: awal/akhir teks atau karakter non-huruf.
    const pola = new RegExp(`(^|[^a-z])${kel.toLowerCase().replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}([^a-z]|$)`);
    if (pola.test(t)) return kel;
  }
  return null;
}

// ─── Tanggal kejadian ───

// Mengubah frasa waktu jadi tanggal (YYYY-MM-DD). `sekarang` bisa disuntik
// supaya bisa diuji tanpa bergantung tanggal hari ini.
function konversiTanggal(frasa, sekarang = new Date()) {
  if (!frasa) return null;
  const t = normalisasiTeks(String(frasa)).trim();
  const hariIni = new Date(sekarang.getFullYear(), sekarang.getMonth(), sekarang.getDate());

  const format = (d) => {
    // Tanggal kejadian tidak mungkin di masa depan — kalau hasilnya melewati
    // hari ini, anggap gagal daripada mengisi form dengan data mustahil.
    if (d > hariIni) return null;
    const bulan = String(d.getMonth() + 1).padStart(2, '0');
    const tgl = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${bulan}-${tgl}`;
  };

  const geserHari = (n) => {
    const d = new Date(hariIni);
    d.setDate(d.getDate() - n);
    return format(d);
  };

  if (/\b(hari ini|tadi|baru saja|sekarang)\b/.test(t)) return format(hariIni);
  if (/\bkemarin\s+(lusa|dulu)\b/.test(t)) return geserHari(2);
  if (/\bkemarin\b/.test(t)) return geserHari(1);

  // "3 hari lalu", "dua minggu yang lalu", "sejak 3 bulan terakhir"
  const relatif = t.match(/(\d+|se|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh)\s*(hari|minggu|bulan|tahun)\s*(?:yang\s*)?(?:lalu|terakhir|belakangan)/);
  if (relatif) {
    const angkaKata = { se: 1, satu: 1, dua: 2, tiga: 3, empat: 4, lima: 5, enam: 6, tujuh: 7, delapan: 8, sembilan: 9, sepuluh: 10 };
    const n = /^\d+$/.test(relatif[1]) ? Number(relatif[1]) : (angkaKata[relatif[1]] || 1);
    const d = new Date(hariIni);
    if (relatif[2] === 'hari') d.setDate(d.getDate() - n);
    if (relatif[2] === 'minggu') d.setDate(d.getDate() - n * 7);
    if (relatif[2] === 'bulan') d.setMonth(d.getMonth() - n);
    if (relatif[2] === 'tahun') d.setFullYear(d.getFullYear() - n);
    return format(d);
  }

  // "20 Juli 2026" / "20 juli"
  const namaBulan = t.match(/(\d{1,2})\s+([a-z]+)\s*(\d{4})?/);
  if (namaBulan && BULAN[namaBulan[2]] !== undefined) {
    const tahun = namaBulan[3] ? Number(namaBulan[3]) : sekarang.getFullYear();
    const d = new Date(tahun, BULAN[namaBulan[2]], Number(namaBulan[1]));
    // Tanpa tahun eksplisit dan hasilnya di masa depan -> kemungkinan tahun lalu
    if (!namaBulan[3] && d > hariIni) d.setFullYear(tahun - 1);
    return format(d);
  }

  // "20/07/2026" atau "20-7-2026" (urutan Indonesia: hari dulu)
  const angka = t.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (angka) {
    return format(new Date(Number(angka[3]), Number(angka[2]) - 1, Number(angka[1])));
  }

  return null;
}

// ─── Pembersih nilai dari model ───

// Model bisa mengembalikan apa saja; semuanya harus lewat sini sebelum dipakai.
function bersihkanNama(nilai) {
  if (!nilai) return null;
  const s = String(nilai).trim();
  if (!s || s.length > 60) return null;
  if (BUKAN_NAMA.has(s.toLowerCase())) return null;
  // Nama tidak mungkin berisi angka
  if (/\d/.test(s)) return null;
  return s;
}

function bersihkanPilihan(nilai, daftarValid) {
  if (!nilai) return null;
  const s = String(nilai).trim();
  return daftarValid.find(v => v.toLowerCase() === s.toLowerCase()) || null;
}

function bersihkanUsia(nilai) {
  const n = Number(nilai);
  return Number.isInteger(n) && n > 0 && n <= 120 ? n : null;
}

function bersihkanTeksPendek(nilai, maks = 120) {
  if (!nilai) return null;
  const s = String(nilai).trim();
  if (!s || s.length > maks) return null;
  if (BUKAN_NAMA.has(s.toLowerCase())) return null;
  return s;
}

// ─── Ekstraksi lengkap tanpa model ───

function ekstrakDenganAturan(kronologi, { masterKekerasan = [], sekarang = new Date() } = {}) {
  return {
    // Nama tidak diambil dengan regex — terlalu rawan salah. Dua kunci ini tetap
    // ada supaya bentuk objeknya sama dengan hasil model (lihat gabungkan()
    // di analisisController.js, yang menelusuri kunci objek ini).
    namaKorban:       null,
    namaPelapor:      null,
    usiaKorban:       tebakUsia(kronologi),
    jenisKelamin:     tebakJenisKelamin(kronologi),
    hubunganKorban:   tebakHubungan(kronologi),
    jenisKekerasan:   tebakJenisKekerasan(kronologi, masterKekerasan),
    kelurahanKorban:  cocokkanKelurahan(kronologi),
    lokasiKejadian:   null, // butuh pemahaman kalimat — serahkan ke model
    tanggalKejadian:  konversiTanggal(kronologi, sekarang),
  };
}

module.exports = {
  ekstrakDenganAturan,
  normalisasiTeks,
  konversiTanggal,
  cocokkanKelurahan,
  tebakUsia,
  tebakJenisKelamin,
  tebakHubungan,
  tebakJenisKekerasan,
  bersihkanNama,
  bersihkanPilihan,
  bersihkanUsia,
  bersihkanTeksPendek,
  HUBUNGAN_VALID,
  JENIS_KELAMIN_VALID,
};
