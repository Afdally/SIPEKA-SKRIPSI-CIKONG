import test from 'node:test';
import assert from 'node:assert/strict';

import { kategoriKorban, cocokDenganFilterKategori } from './kategoriKorban.js';

test('anak perempuan masuk kategori Anak dan Perempuan', () => {
  const laporan = { tipe_laporan: 'anak', usia_korban: 10, jenis_kelamin: 'Perempuan' };

  assert.deepEqual(kategoriKorban(laporan), ['anak', 'perempuan']);
  assert.equal(cocokDenganFilterKategori(laporan, 'anak'), true);
  assert.equal(cocokDenganFilterKategori(laporan, 'perempuan'), true);
});

test('anak laki-laki hanya masuk kategori Anak', () => {
  const laporan = { tipe_laporan: 'anak', usia_korban: 8, jenis_kelamin: 'Laki-laki' };

  assert.deepEqual(kategoriKorban(laporan), ['anak']);
  assert.equal(cocokDenganFilterKategori(laporan, 'perempuan'), false);
});

test('perempuan dewasa hanya masuk kategori Perempuan', () => {
  const laporan = { tipe_laporan: 'perempuan', usia_korban: 25, jenis_kelamin: 'Perempuan' };

  assert.deepEqual(kategoriKorban(laporan), ['perempuan']);
});

test('data lama tanpa jenis kelamin tetap mengikuti tipe laporan perempuan', () => {
  assert.deepEqual(kategoriKorban({ tipe_laporan: 'perempuan', usia_korban: 30 }), ['perempuan']);
});
