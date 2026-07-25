// MOCK SEMENTARA — belum ada model NLP/Ollama beneran (masih tahap desain UX).
// Fungsi di sini cuma mensimulasikan hasil analisis kronologi pakai heuristik kata
// kunci sederhana (bukan AI asli), supaya tampilan alur "cerita dulu, form terisi
// otomatis" bisa dicoba lebih dulu. Kalau nlp-service asli sudah ada, cukup ganti
// isi analisisKronologi() ini jadi panggilan API ke nlp-service — komponen yang
// memakainya (CeritaKejadianStep.jsx) tidak perlu diubah sama sekali.

function tebakUsia(teks) {
  const match = teks.match(/(\d{1,2})\s*(tahun|thn|th\b)/i);
  return match ? match[1] : '';
}

function tebakJenisKelamin(teks) {
  const t = teks.toLowerCase();
  if (/\b(perempuan|wanita|istri|anak perempuan)\b/.test(t)) return 'Perempuan';
  if (/\b(laki-laki|pria|suami|anak laki-laki)\b/.test(t)) return 'Laki-laki';
  return '';
}

// Pencocokan kata kunci -> nama kategori kekerasan (harus cocok sama data master
// di database, makanya masterKekerasan dikirim sebagai parameter, bukan hardcode).
function tebakJenisKekerasan(teks, masterKekerasan) {
  const t = teks.toLowerCase();
  const kamusKataKunci = {
    'Kekerasan Fisik': ['pukul', 'tampar', 'tendang', 'lempar', 'cekik', 'seret', 'dianiaya'],
    'Kekerasan Psikis': ['ancam', 'bentak', 'hina', 'trauma', 'teror', 'dipermalukan'],
    'Kekerasan Seksual': ['pelecehan', 'diperkosa', 'seksual', 'dipaksa berhubungan'],
    'KDRT': ['suami', 'istri', 'rumah tangga', 'pasangan'],
    'Penelantaran': ['telantar', 'tidak diberi makan', 'ditinggal', 'diabaikan'],
    'Cyberbullying': ['media sosial', 'medsos', 'chat', 'online', 'diunggah', 'disebar'],
  };

  for (const [label, kataKunci] of Object.entries(kamusKataKunci)) {
    if (kataKunci.some((k) => t.includes(k))) {
      const cocok = masterKekerasan.find((m) => m.nama_kategori === label);
      if (cocok) return cocok.nama_kategori;
    }
  }
  return '';
}

// Simulasi waktu proses model (nanti diganti panggilan HTTP ke nlp-service).
const WAKTU_SIMULASI_MS = 1800;

export async function analisisKronologi(teks, { masterKekerasan = [], forceFail = false } = {}) {
  await new Promise((resolve) => setTimeout(resolve, WAKTU_SIMULASI_MS));

  if (forceFail) {
    throw new Error('Simulasi: nlp-service tidak dapat dihubungi');
  }

  return {
    usiaKorban: tebakUsia(teks),
    jenisKelamin: tebakJenisKelamin(teks),
    jenisKekerasan: tebakJenisKekerasan(teks, masterKekerasan),
  };
}
