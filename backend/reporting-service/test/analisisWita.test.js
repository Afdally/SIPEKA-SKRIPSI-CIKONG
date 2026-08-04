const test = require('node:test');
const assert = require('node:assert/strict');
const { waktuDiZona } = require('../src/services/zonaWaktu');
const { ekstrakDenganAturan, tebakHubungan } = require('../src/services/ekstraksiRule');

test('pukul terdeteksi fisik dan kemarin mengikuti tanggal WITA', () => {
  // 1 Agustus 16:30 UTC sudah 2 Agustus 00:30 WITA.
  const sekarangWita = waktuDiZona(new Date('2026-08-01T16:30:00.000Z'), 'Asia/Makassar');
  const hasil = ekstrakDenganAturan(
    'sa lihat bapaku kemarin pukul adeku yang baru berumur 5 tahun, dia pukul pakai balok balok. saya tidak bisa melawan',
    {
      masterKekerasan: ['Kekerasan Fisik', 'Kekerasan Psikis'],
      sekarang: sekarangWita,
    },
  );

  assert.equal(hasil.jenisKekerasan, 'Kekerasan Fisik');
  assert.equal(hasil.tanggalKejadian, '2026-08-01');
  assert.equal(hasil.hubunganKorban, 'Saudara');
});

test('peran korban tetap benar pada bentuk aktif dan pasif', () => {
  const contoh = [
    ['bapak saya memukul adik saya', 'Saudara'],
    ['bapak saya kemarin pukul adik saya', 'Saudara'],
    ['adik saya dipukuli oleh ibu saya', 'Saudara'],
    ['adik saya memukul bapak saya', 'Anak'],
    ['saya dipukul oleh bapak saya', 'Diri Sendiri'],
    ['saya kena pukul bapak saya', 'Diri Sendiri'],
  ];

  for (const [kalimat, hubungan] of contoh) {
    assert.equal(tebakHubungan(kalimat), hubungan, kalimat);
  }
});
