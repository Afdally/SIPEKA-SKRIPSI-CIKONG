import { mockDb } from './mockDb';

function getField(formData, key) {
  return formData.get ? formData.get(key) : formData[key];
}

export const mockLaporanService = {
  getMasterKekerasan: async () => {
    mockDb.seedIfNeeded();
    await mockDb.delay();
    return mockDb.load(mockDb.KEYS.masterKekerasan, []).filter((m) => m.is_active);
  },

  getMasterKekerasanAll: async () => {
    await mockDb.delay();
    return mockDb.load(mockDb.KEYS.masterKekerasan, []);
  },

  cekStatus: async (kodeLaporan) => {
    await mockDb.delay();
    const laporanList = mockDb.load(mockDb.KEYS.laporan, []);
    const laporan = laporanList.find((l) => l.kode_laporan?.toUpperCase() === kodeLaporan.toUpperCase());
    if (!laporan) throw mockDb.mockError('Laporan tidak ditemukan');
    return {
      kode_laporan: laporan.kode_laporan,
      status: laporan.status,
      jenis_kekerasan: laporan.jenis_kekerasan,
      tanggal_lapor: new Date(laporan.createdAt).toLocaleDateString('id-ID'),
      createdAt: laporan.createdAt,
      nama_korban: laporan.nama_korban,
      catatan: laporan.catatan,
    };
  },

  // Catatan: file bukti tidak benar-benar disimpan di mode mock (tidak ada
  // server penyimpanan) — cukup diabaikan supaya UX submit tetap bisa dicoba.
  submitLaporan: async (formData) => {
    await mockDb.delay(700);
    const laporanList = mockDb.load(mockDb.KEYS.laporan, []);
    const tipe_laporan = getField(formData, 'tipe_laporan');
    const kode_laporan = mockDb.generateKodeLaporan(tipe_laporan);
    const now = new Date().toISOString();
    const anonimRaw = getField(formData, 'anonim');

    const laporan = {
      id: mockDb.uid(), _id: mockDb.uid(), kode_laporan,
      tipe_laporan, anonim: anonimRaw === 'true' || anonimRaw === true,
      nama_pelapor: getField(formData, 'nama_pelapor'),
      nik_pelapor: getField(formData, 'nik_pelapor'),
      telepon_pelapor: getField(formData, 'telepon_pelapor'),
      hubungan_korban: getField(formData, 'hubungan_korban'),
      nama_korban: getField(formData, 'nama_korban'),
      nik_korban: getField(formData, 'nik_korban'),
      usia_korban: getField(formData, 'usia_korban'),
      jenis_kelamin: getField(formData, 'jenis_kelamin'),
      alamat_korban: getField(formData, 'alamat_korban'),
      kelurahan_korban: getField(formData, 'kelurahan_korban'),
      jenis_kekerasan: getField(formData, 'jenis_kekerasan'),
      tanggal_kejadian: getField(formData, 'tanggal_kejadian'),
      lokasi_kejadian: getField(formData, 'lokasi_kejadian'),
      kronologi: getField(formData, 'kronologi'),
      preferensi_layanan: getField(formData, 'preferensi_layanan'),
      bukti_file: null,
      status: 'menunggu_registrasi', catatan: null,
      createdAt: now, updatedAt: now,
    };
    laporanList.unshift(laporan);
    mockDb.save(mockDb.KEYS.laporan, laporanList);
    return { message: 'Laporan berhasil dikirim', kode_laporan };
  },

  getAll: async () => {
    await mockDb.delay();
    return mockDb.load(mockDb.KEYS.laporan, []);
  },

  createMasterKekerasan: async (_token, payload) => {
    await mockDb.delay();
    const list = mockDb.load(mockDb.KEYS.masterKekerasan, []);
    if (list.some((m) => m.nama_kategori === payload.nama_kategori)) {
      throw mockDb.mockError('Kategori kekerasan sudah ada');
    }
    const item = { _id: mockDb.uid(), is_active: true, ...payload };
    list.push(item);
    mockDb.save(mockDb.KEYS.masterKekerasan, list);
    return { message: 'Kategori berhasil ditambahkan', data: item };
  },

  updateMasterKekerasan: async (_token, id, payload) => {
    await mockDb.delay();
    const list = mockDb.load(mockDb.KEYS.masterKekerasan, []);
    const idx = list.findIndex((m) => m._id === id);
    if (idx < 0) throw mockDb.mockError('Kategori tidak ditemukan');
    list[idx] = { ...list[idx], ...payload };
    mockDb.save(mockDb.KEYS.masterKekerasan, list);
    return { message: 'Kategori berhasil diupdate', data: list[idx] };
  },

  deleteMasterKekerasan: async (_token, id) => {
    await mockDb.delay();
    const list = mockDb.load(mockDb.KEYS.masterKekerasan, []).filter((m) => m._id !== id);
    mockDb.save(mockDb.KEYS.masterKekerasan, list);
    return { message: 'Kategori berhasil dihapus' };
  },
};
