// Pemilih penyedia model bahasa.
//
// analisisController cukup memanggil satu pintu ini dan tidak perlu tahu model
// mana yang sedang dipakai. Pergantian penyedia dilakukan lewat env
// LLM_PROVIDER, bukan dengan mengedit kode — supaya bisa bolak-balik antara
// cepat (awan, saat mengembangkan) dan privat (lokal, saat demo dan pemakaian
// nyata) tanpa mengubah apa pun yang perlu di-commit.
//
// Bawaannya sengaja 'ollama': kalau env belum disetel sama sekali, sistem
// berjalan dengan jalur yang tidak mengirim data ke mana-mana.

const ollamaClient = require('./ollamaClient');
const geminiClient = require('./geminiClient');
const grokClient = require('./grokClient');

const PENYEDIA = {
  ollama: ollamaClient,
  gemini: geminiClient,
  grok: grokClient,
};

const nama = (process.env.LLM_PROVIDER || 'ollama').toLowerCase();
const terpilih = PENYEDIA[nama];

if (!terpilih) {
  // Salah ketik nama penyedia lebih baik ketahuan saat service dinyalakan
  // daripada muncul sebagai kegagalan analisis yang terlihat seperti gangguan
  // model — itu jenis kesalahan yang bisa berjam-jam dicari.
  throw new Error(
    `LLM_PROVIDER "${nama}" tidak dikenal. Pilihan: ${Object.keys(PENYEDIA).join(', ')}`
  );
}

console.log(`🧠 Penyedia analisis: ${nama} (${terpilih.MODEL || terpilih.OLLAMA_MODEL})`);

module.exports = {
  analisisKronologi: terpilih.analisisKronologi,
  penyedia: nama,
};
