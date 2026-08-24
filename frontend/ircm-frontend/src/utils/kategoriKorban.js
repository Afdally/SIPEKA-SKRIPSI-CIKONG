const normalisasi = (nilai) => String(nilai || '').trim().toLowerCase();

export function kategoriKorban(data = {}) {
  const tipe = normalisasi(data.tipe_laporan);
  const jenisKelamin = normalisasi(data.jenis_kelamin);
  const usia = Number.parseInt(data.usia_korban, 10);
  const usiaDiketahui = Number.isFinite(usia);

  const anak = tipe === 'anak' || (usiaDiketahui && usia < 18);
  // Fallback tipe_laporan menjaga data lama yang belum memiliki jenis_kelamin.
  const perempuan = jenisKelamin === 'perempuan'
    || (!jenisKelamin && tipe === 'perempuan');

  return [anak && 'anak', perempuan && 'perempuan'].filter(Boolean);
}

export function cocokDenganFilterKategori(data, filter) {
  return !filter || filter === 'semua' || kategoriKorban(data).includes(filter);
}

export function labelKategoriKorban(data) {
  return kategoriKorban(data).map((kategori) => (
    kategori === 'anak' ? 'Anak' : 'Perempuan'
  ));
}
