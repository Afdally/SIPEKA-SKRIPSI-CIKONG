
const { SEMUA_KELURAHAN } = require('../data/kelurahan');

const HUBUNGAN_VALID = ['Orang Tua', 'Anak', 'Saudara', 'Suami/Istri', 'Tetangga', 'Teman', 'Diri Sendiri'];
const JENIS_KELAMIN_VALID = ['Laki-laki', 'Perempuan'];


const BUKAN_NAMA = new Set([
  // kata ganti & peran
  'sa', 's', 'ak', 'saya', 'aku', 'dia', 'ia', 'kami', 'kita', 'beliau',
  'korban', 'pelaku', 'pelapor', 'terlapor', 'saksi',
  // kerabat & orang dekat
  'anak', 'anaknya', 'anak kandung', 'anak tiri', 'anak angkat',
  'ibu', 'ibu tiri', 'ibu kandung', 'mama', 'bunda', 'emak',
  'ayah', 'ayah tiri', 'ayah kandung', 'bapak', 'papa', 'abah',
  'orang tua', 'ortu', 'suami', 'istri', 'pasangan', 'pacar', 'mantan',
  'adik', 'adek', 'kakak', 'kak', 'abang', 'bang', 'saudara', 'saudari',
  'sepupu', 'kembaran', 'nenek', 'kakek', 'paman', 'om', 'bibi', 'tante',
  'keponakan', 'ponakan', 'cucu', 'menantu', 'mertua', 'ipar',
  'tetangga', 'teman', 'sahabat', 'guru', 'murid', 'atasan', 'majikan',
  // kata kerja & kata umum yang sering tersangkut jadi "nama" pada laporan
  // pendek tanpa nama sama sekali — model kecil cenderung tetap mengisi field
  // daripada mengosongkannya, dan yang diambil biasanya kata di dekat "saya".
  'lihat', 'melihat', 'dilihat', 'lapor', 'melapor', 'melaporkan', 'cerita',
  'kejadian', 'kekerasan', 'peristiwa', 'masalah', 'kasus',
  'rumah', 'sekolah', 'kos', 'kamar', 'tempat',
  'malam', 'pagi', 'siang', 'sore', 'tadi', 'kemarin', 'sekarang',
  // penanda "tidak ada isinya"
  'tidak', 'tidak ada', 'tidak diketahui', 'tidak disebutkan', 'tidak disebut',
  'kosong', 'null', 'none', 'n/a', '-', '--',
]);

const BULAN = {
  januari: 0, februari: 1, maret: 2, april: 3, mei: 4, juni: 5,
  juli: 6, agustus: 7, september: 8, oktober: 9, november: 10, desember: 11,
};


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


const KERABAT_UNTUK_KU = [
  'bpk', 'bapak', 'bapa', 'pak', 'papa', 'papi', 'ayh', 'ayah',
  'ibu', 'ibuk', 'mama', 'mami', 'ortu', 'orang tua',
  'anak', 'adek', 'ade', 'adk', 'adik', 'kakak', 'kaka', 'kk',
  'suami', 'istri', 'teman', 'tmn', 'tetangga', 'saudara', 'sdr', 'sepupu',
];

function normalisasiTeks(teks) {
  let t = String(teks).toLowerCase();

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

// Pasangan dari PENANDA_PELAKU untuk kalimat AKTIF, diuji ke potongan teks TEPAT
// SESUDAH sebutan kerabat: "istri saya sering mengancam saya".
//
// Perlu keduanya karena letak pelaku berpindah mengikuti bentuk kalimat:
//   pasif  "saya diancam oleh istri saya"      -> pelaku SESUDAH kata kekerasan
//   aktif  "istri saya sering mengancam saya"  -> pelaku SEBELUM kata kekerasan
// PENANDA_PELAKU hanya melihat ke belakang, jadi tanpa ini pelaku dalam kalimat
// aktif terbaca sebagai korban.
//
// Bentuk aktifnya ditulis utuh (bukan kata dasar + awalan) karena imbuhan meN-
// meluluhkan huruf pertama: pukul->memukul, tampar->menampar. Mencocokkan kata
// dasar tidak akan kena.
//
// Sisipan di tengah dibatasi daftar keterangan, bukan \w+, supaya kalimat seperti
// "istri saya menangis karena adik memukul" tidak salah dianggap menunjuk pelaku.
//
// Kata milik ikut diizinkan di depan karena cariKerabatKorban memanggil ini dua
// kali: pada lapis longgar (wajibMilik=false) yang tercocok cuma "istri", jadi
// "saya" masih tersisa di awal potongan.
const MILIK = '(?:saya|aku|kami|kita|dia|nya|itu|tersebut)';
const KETERANGAN = '(?:sering|selalu|kerap|suka|terus|sudah|sempat|pernah|kadang|kembali|lagi|juga|sekali|saja|itu|tersebut|yang|bahkan|malah|tiba-tiba)';
const PENANDA_PELAKU_AKTIF = new RegExp(
  `^\\s+(?:${MILIK}\\s+)?(?:${KETERANGAN}\\s+){0,3}(?:memukul|menampar|menendang|mengancam|menghina|membentak|melecehkan|menganiaya|mencekik|memperkosa|mencabuli|menelantarkan|memaki|merendahkan|menjambak|membanting|menyeret|meneror|mempermalukan)\\b`
);

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
      if (PENANDA_PELAKU.test(sebelum)) continue; // pelaku (kalimat pasif)

      const sesudah = t.slice(cocok.index + cocok[0].length, cocok.index + cocok[0].length + 48);
      if (PENANDA_PELAKU_AKTIF.test(sesudah)) continue; // pelaku (kalimat aktif)

      return hubungan;
    }
  }
  return null;
}

// Kekerasan yang jelas-jelas mengarah ke pelapor sendiri.
//
// Diperiksa lebih dulu daripada pencarian kerabat karena penanda ini jauh lebih
// kuat. Pada "bapakku mabuk dan melakukan hal tidak senonoh ke saya", kerabat
// yang tersebut (bapak) adalah PELAKU, tapi dia lolos dari kedua penyaring
// PENANDA_PELAKU: bentuknya aktif, dan kata kerjanya ("mabuk dan melakukan")
// tidak ada di daftar. Menyandarkan diri pada daftar kata kerja tidak akan
// pernah lengkap — arah sasarannya ("... ke saya") jauh lebih dapat diandalkan.
const KEKERASAN_KE_PELAPOR = [
  // pasif: "saya dipukul", "saya sering ditampar"
  //
  // "saya" wajib berada di awal klausa. Tanpa syarat itu, "adik saya dipukuli"
  // ikut tertangkap — padahal di sana "saya" adalah kata MILIK kepunyaan adik,
  // bukan sasaran kekerasan, dan korbannya adik.
  new RegExp(`(?:^|[.,;]\\s*|\\b(?:dan|lalu|kemudian|karena|sedangkan|tapi|tetapi|namun)\\s+)saya\\s+(?:${KETERANGAN}\\s+){0,3}di\\w*(?:pukul|tampar|tendang|leceh|aniaya|ancam|hina|bentak|cabul|perkosa|cekik|maki|paksa|raba)`),
  // aktif dengan sasaran: "berbuat senonoh ke saya", "mengancam kepada saya"
  /(?:pukul|tampar|tendang|leceh|senonoh|aniaya|ancam|hina|bentak|cabul|perkosa|cekik|maki|raba)\w*\s+(?:\w+\s+){0,3}?(?:ke|kepada|terhadap|sama)\s+saya\b/,
];

function korbanAdalahPelapor(teks) {
  const t = normalisasiTeks(teks);
  return KEKERASAN_KE_PELAPOR.some(pola => pola.test(t));
}

function tebakHubungan(teks) {
  const t = normalisasiTeks(teks);

  // Dua lapis: yang meyakinkan dulu ("adik saya"), baru yang longgar ("adik").
  // Tanpa pemisahan ini, kalimat seperti "tetangga saya seorang ibu ditelantarkan"
  // salah terbaca sebagai "Anak" hanya karena kata "ibu" muncul lebih awal.
  return (korbanAdalahPelapor(teks) ? 'Diri Sendiri' : null)
      || cariKerabatKorban(t, true)
      || cariKerabatKorban(t, false)
      // Sisanya: cerita orang pertama tanpa kerabat sebagai korban.
      || (/\bsaya\b/.test(t) && KATA_KEKERASAN.test(t) ? 'Diri Sendiri' : null);
}

// ─── Jenis kelamin ───
//
// Yang dicari jenis kelamin KORBAN — bukan sekadar "ada kata gender di teks".
// Dalam satu laporan ada sampai tiga orang, jadi memindai seluruh kalimat itu
// keliru. Pada "adik saya dipukuli oleh ibu saya", kata "ibu" itu PELAKU, dan
// jenis kelamin adik tidak disebutkan sama sekali.
//
// Persoalannya sama dengan yang sudah ditangani cariKerabatKorban di atas —
// menautkan sebutan ke perannya — jadi penyaring PENANDA_PELAKU yang sama
// dipakai ulang di sini.
//
// Hanya dua sumber yang diterima, selebihnya null. Ini disengaja: di formulir
// laporan kekerasan, field kosong lebih aman daripada field salah. Yang kosong
// pasti diisi pelapor; yang telanjur terisi keliru bisa lolos tanpa diperiksa
// lalu menjadi data resmi.

// Kata yang benar-benar menyifati jenis kelamin ("anak perempuan saya").
// Sebutan kerabat (ibu/ayah/suami/istri) sengaja TIDAK masuk sini — itu
// menyatakan hubungan, bukan jenis kelamin korban.
const GENDER_LANGSUNG = [
  [/\b(perempuan|wanita|putri|gadis)\b/g, 'Perempuan'],
  [/\b(laki-laki|lelaki|pria|putra)\b/g, 'Laki-laki'],
];

// Pasangan -> jenis kelamin PELAPOR. Cuma sah dipakai kalau pelapor memang
// korbannya sendiri; di luar itu pasangan yang disebut adalah pasangan pelapor
// dan tidak mengatakan apa pun tentang korban.
const PASANGAN_KE_GENDER = [
  [/\bsuami\b/, 'Perempuan'],
  [/\bistri\b/, 'Laki-laki'],
];

function tebakJenisKelamin(teks, hubungan = null) {
  const t = normalisasiTeks(teks);

  // 1. Kata gender yang menempel pada korban, dengan yang menempel pada pelaku
  //    ("dipukul oleh pria itu") dibuang.
  for (const [pola, hasil] of GENDER_LANGSUNG) {
    pola.lastIndex = 0; // pola ber-flag /g dipakai berulang; indeksnya harus direset
    let cocok;
    while ((cocok = pola.exec(t)) !== null) {
      const sebelum = t.slice(Math.max(0, cocok.index - 24), cocok.index);
      if (PENANDA_PELAKU.test(sebelum)) continue;
      return hasil;
    }
  }

  // 2. Penyimpulan lewat pasangan — hanya saat pelapor adalah korbannya sendiri.
  //    Mengandaikan pasangan lawan jenis: asumsi yang memadai untuk isian yang
  //    masih dikoreksi pelapor, tapi jangan diperluas melampaui kondisi ini.
  if (hubungan === 'Diri Sendiri') {
    for (const [pola, hasil] of PASANGAN_KE_GENDER) {
      if (pola.test(t)) return hasil;
    }
  }

  return null;
}

// Apakah teks memuat kata yang benar-benar menyifati jenis kelamin?
//
// Dipakai analisisController untuk menolak jawaban model yang tidak berpijak
// pada teks. Model kecil cenderung tetap mengisi field daripada mengosongkannya:
// pada laporan yang sama sekali tidak menyebut jenis kelamin, qwen2.5:3b masih
// menjawab "Perempuan" — kemungkinan karena mayoritas contoh laporan kekerasan
// memang begitu. Tebakan semacam itu tidak boleh masuk formulir.
//
// Sebutan kerabat sengaja tidak dihitung: "bapakku" memberi tahu jenis kelamin
// PELAKU, bukan korban.
function adaPenandaGender(teks) {
  const t = normalisasiTeks(teks);
  return GENDER_LANGSUNG.some(([pola]) => {
    pola.lastIndex = 0; // pola ber-flag /g; test() memajukan lastIndex
    return pola.test(t);
  });
}

// ─── Jenis kekerasan ───

// Kata kunci -> nama kategori. Nama kategori harus ada di master data
// (MasterKekerasan), makanya daftar master dikirim sebagai parameter.
const KAMUS_KEKERASAN = {
  // 'leceh' dipakai sebagai kata dasar supaya sekaligus menangkap
  // "pelecehan", "dilecehkan", dan "melecehkan".
  // 'senonoh' menangkap "hal tidak senonoh" / "berbuat senonoh" — ungkapan halus
  // yang justru paling sering dipakai pelapor untuk kekerasan seksual, karena
  // menyebutnya secara langsung terasa berat. Tanpa ini laporan seperti itu
  // hanya tertangkap lewat kata "trauma" dan salah masuk ke Kekerasan Psikis.
  'Kekerasan Seksual': ['leceh', 'perkosa', 'seksual', 'dipaksa berhubungan', 'diremas', 'cabul',
                        'senonoh', 'digagahi', 'disetubuhi', 'ditelanjangi', 'diraba'],
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

  // "tadi malam" dan "semalam" menunjuk malam KEMARIN, bukan hari ini. Harus
  // diperiksa lebih dulu: aturan \btadi\b di bawah akan menangkap "tadi malam"
  // dan memajukan kejadiannya sehari. Beda dengan "tadi pagi"/"tadi sore" yang
  // memang hari ini.
  if (/\b(tadi malam|semalam|semalem|kemarin malam)\b/.test(t)) return geserHari(1);

  if (/\b(hari ini|tadi|baru saja|barusan|sekarang)\b/.test(t)) return format(hariIni);
  if (/\bkemarin\s+(lusa|dulu)\b/.test(t)) return geserHari(2);
  if (/\bkemarin\b/.test(t)) return geserHari(1);

  // "3 hari lalu", "dua minggu yang lalu", "sejak 3 bulan terakhir", "minggu lalu"
  //
  // Jumlahnya opsional karena pelapor sering menghilangkannya ("minggu lalu",
  // "bulan lalu"); tanpa itu frasa yang sangat umum ini tidak terbaca sama sekali.
  //
  // Tapi jumlah yang KABUR ("beberapa bulan terakhir") tetap ditolak lewat
  // lookbehind: memakai nilai bawaan 1 di situ bukan membaca, melainkan menebak,
  // dan tebakannya justru memperpendek rentang kejadian yang sebenarnya panjang.
  const relatif = t.match(/(?<!\b(?:beberapa|bbrp|banyak|sekian|byk)\s)(?:(\d+|se|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh)\s*)?(hari|minggu|bulan|tahun)\s*(?:yang\s*)?(?:lalu|terakhir|belakangan)/);
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

  // Nama tidak mungkin berisi angka
  if (/\d/.test(s)) return null;

  // Inisial satu huruf ("adek s dipukuli") bukan nama yang bisa dipakai —
  // ini yang dijanjikan ke model lewat contoh few-shot di ollamaClient.
  if (s.replace(/[^a-zA-Z]/g, '').length < 2) return null;

  // Kata milik yang ikut terbawa dibuang dulu, supaya "adik saya" tetap
  // tersaring oleh daftar di bawah dan tidak lolos hanya karena ada "saya".
  const inti = s.toLowerCase().replace(/\s+(saya|aku|kami|kita|nya|itu|tersebut)$/, '').trim();
  if (BUKAN_NAMA.has(inti)) return null;

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
  // Dihitung lebih dulu karena jenis kelamin ikut bergantung padanya
  // (lihat tebakJenisKelamin).
  const hubungan = tebakHubungan(kronologi);

  return {
    // Nama tidak diambil dengan regex — terlalu rawan salah. Dua kunci ini tetap
    // ada supaya bentuk objeknya sama dengan hasil model (lihat gabungkan()
    // di analisisController.js, yang menelusuri kunci objek ini).
    namaKorban:       null,
    namaPelapor:      null,
    usiaKorban:       tebakUsia(kronologi),
    jenisKelamin:     tebakJenisKelamin(kronologi, hubungan),
    hubunganKorban:   hubungan,
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
  adaPenandaGender,
  tebakHubungan,
  korbanAdalahPelapor,
  tebakJenisKekerasan,
  bersihkanNama,
  bersihkanPilihan,
  bersihkanUsia,
  bersihkanTeksPendek,
  HUBUNGAN_VALID,
  JENIS_KELAMIN_VALID,
};
