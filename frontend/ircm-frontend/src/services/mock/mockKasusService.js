import { mockDb } from './mockDb';

// Di sistem asli, perubahan status kasus disinkronkan ke laporan lewat RabbitMQ
// (case-service -> report-service). Di mode mock semuanya di satu browser saja,
// jadi disederhanakan: langsung update kedua "tabel" localStorage sekaligus.
function syncStatusLaporan(laporanList, laporanId, status, catatan) {
  const idx = laporanList.findIndex((l) => (l.id || l._id) === laporanId);
  if (idx >= 0) {
    laporanList[idx].status = status;
    laporanList[idx].catatan = catatan;
    laporanList[idx].updatedAt = new Date().toISOString();
  }
}

export const mockKasusService = {
  getAll: async () => {
    mockDb.seedIfNeeded();
    await mockDb.delay();
    return mockDb.load(mockDb.KEYS.kasus, []);
  },

  registrasi: async (_token, payload) => {
    await mockDb.delay();
    const { laporan_id, kode_laporan, pesan_tindak_lanjut } = payload;
    if (!laporan_id || !kode_laporan || !pesan_tindak_lanjut) {
      throw mockDb.mockError('laporan_id, kode_laporan, dan pesan_tindak_lanjut wajib diisi');
    }

    const kasusList = mockDb.load(mockDb.KEYS.kasus, []);
    if (kasusList.some((k) => k.laporan_id === laporan_id)) {
      throw mockDb.mockError('Laporan ini sudah diregistrasi sebelumnya');
    }

    const user = mockDb.currentUser();
    const kasus = {
      _id: mockDb.uid(),
      laporan_id, kode_laporan,
      petugas_id: user?.id, petugas_name: user?.name,
      pesan_tindak_lanjut,
      tanggal_registrasi: new Date().toISOString(),
      status: 'registrasi',
      activity_log: [],
      hasil_assessment: null, kondisi_korban: null, kebutuhan_korban: null, tanggal_assessment: null,
      metode_penanganan: null, rencana_tindakan: null, tanggal_mulai: null,
      tanggal_selesai: null, arsip: false,
    };
    kasusList.push(kasus);
    mockDb.save(mockDb.KEYS.kasus, kasusList);

    const laporanList = mockDb.load(mockDb.KEYS.laporan, []);
    syncStatusLaporan(laporanList, laporan_id, 'proses_assessment', pesan_tindak_lanjut);
    mockDb.save(mockDb.KEYS.laporan, laporanList);

    return { message: 'Laporan berhasil diregistrasi dan dijadwalkan assessment', kasus };
  },

  assessment: async (_token, id, payload) => {
    await mockDb.delay();
    const kasusList = mockDb.load(mockDb.KEYS.kasus, []);
    const idx = kasusList.findIndex((k) => k._id === id);
    if (idx < 0) throw mockDb.mockError('Kasus tidak ditemukan');
    kasusList[idx] = {
      ...kasusList[idx],
      hasil_assessment: payload.hasil_assessment,
      kondisi_korban: payload.kondisi_korban || null,
      kebutuhan_korban: payload.kebutuhan_korban || null,
      tanggal_assessment: new Date().toISOString(),
      status: 'assessment',
    };
    mockDb.save(mockDb.KEYS.kasus, kasusList);
    return { message: 'Hasil assessment berhasil disimpan', kasus: kasusList[idx] };
  },

  intervensi: async (_token, id, payload) => {
    await mockDb.delay();
    const kasusList = mockDb.load(mockDb.KEYS.kasus, []);
    const idx = kasusList.findIndex((k) => k._id === id);
    if (idx < 0) throw mockDb.mockError('Kasus tidak ditemukan');
    kasusList[idx] = {
      ...kasusList[idx],
      metode_penanganan: payload.metode_penanganan,
      rencana_tindakan: payload.rencana_tindakan || null,
      tanggal_mulai: new Date().toISOString(),
      status: 'penanganan',
    };
    mockDb.save(mockDb.KEYS.kasus, kasusList);

    const laporanList = mockDb.load(mockDb.KEYS.laporan, []);
    syncStatusLaporan(laporanList, kasusList[idx].laporan_id, 'dalam_penanganan', `Dalam penanganan: ${payload.metode_penanganan}`);
    mockDb.save(mockDb.KEYS.laporan, laporanList);

    return { message: 'Rencana intervensi berhasil disimpan', kasus: kasusList[idx] };
  },

  addLog: async (_token, id, payload) => {
    await mockDb.delay();
    const kasusList = mockDb.load(mockDb.KEYS.kasus, []);
    const idx = kasusList.findIndex((k) => k._id === id);
    if (idx < 0) throw mockDb.mockError('Kasus tidak ditemukan');
    const user = mockDb.currentUser();
    kasusList[idx].activity_log = [
      ...(kasusList[idx].activity_log || []),
      { catatan: payload.catatan, tanggal: new Date().toISOString(), petugas_name: user?.name },
    ];
    mockDb.save(mockDb.KEYS.kasus, kasusList);
    return { message: 'Log aktivitas berhasil ditambahkan', kasus: kasusList[idx] };
  },

  selesaikan: async (_token, id) => {
    await mockDb.delay();
    const kasusList = mockDb.load(mockDb.KEYS.kasus, []);
    const idx = kasusList.findIndex((k) => k._id === id);
    if (idx < 0) throw mockDb.mockError('Kasus tidak ditemukan');
    kasusList[idx] = {
      ...kasusList[idx],
      status: 'selesai',
      tanggal_selesai: new Date().toISOString(),
      arsip: true,
    };
    mockDb.save(mockDb.KEYS.kasus, kasusList);

    const laporanList = mockDb.load(mockDb.KEYS.laporan, []);
    syncStatusLaporan(laporanList, kasusList[idx].laporan_id, 'selesai', `Kasus selesai ditangani (${kasusList[idx].metode_penanganan || 'N/A'})`);
    mockDb.save(mockDb.KEYS.laporan, laporanList);

    return { message: 'Kasus berhasil diselesaikan dan diarsipkan', kasus: kasusList[idx] };
  },

  getStatsSummary: async () => {
    await mockDb.delay();
    const kasusList = mockDb.load(mockDb.KEYS.kasus, []);
    const dalam_proses = kasusList.filter((k) => ['registrasi', 'assessment', 'penanganan'].includes(k.status)).length;
    const selesai = kasusList.filter((k) => k.status === 'selesai').length;
    const perMetodeMap = {};
    kasusList.forEach((k) => {
      if (k.metode_penanganan) perMetodeMap[k.metode_penanganan] = (perMetodeMap[k.metode_penanganan] || 0) + 1;
    });
    const per_metode = Object.entries(perMetodeMap).map(([metode, jumlah]) => ({ metode, jumlah }));
    return { total_kasus: kasusList.length, dalam_proses, selesai, per_metode };
  },

  getStatsKinerja: async () => {
    await mockDb.delay();
    const kasusList = mockDb.load(mockDb.KEYS.kasus, []);
    const byPetugas = {};
    kasusList.forEach((k) => {
      const key = k.petugas_id || 'unknown';
      if (!byPetugas[key]) byPetugas[key] = { petugas_id: key, nama: k.petugas_name, total_kasus: 0, kasus_selesai: 0 };
      byPetugas[key].total_kasus++;
      if (k.status === 'selesai') byPetugas[key].kasus_selesai++;
    });
    return Object.values(byPetugas);
  },

  getMasterMetodeAll: async () => {
    await mockDb.delay();
    return mockDb.load(mockDb.KEYS.masterMetode, []);
  },

  createMasterMetode: async (_token, payload) => {
    await mockDb.delay();
    const list = mockDb.load(mockDb.KEYS.masterMetode, []);
    if (list.some((m) => m.nama_metode === payload.nama_metode)) {
      throw mockDb.mockError('Metode penanganan sudah ada');
    }
    const item = { _id: mockDb.uid(), is_active: true, ...payload };
    list.push(item);
    mockDb.save(mockDb.KEYS.masterMetode, list);
    return { message: 'Metode berhasil ditambahkan', data: item };
  },

  updateMasterMetode: async (_token, id, payload) => {
    await mockDb.delay();
    const list = mockDb.load(mockDb.KEYS.masterMetode, []);
    const idx = list.findIndex((m) => m._id === id);
    if (idx < 0) throw mockDb.mockError('Metode tidak ditemukan');
    list[idx] = { ...list[idx], ...payload };
    mockDb.save(mockDb.KEYS.masterMetode, list);
    return { message: 'Metode berhasil diupdate', data: list[idx] };
  },

  deleteMasterMetode: async (_token, id) => {
    await mockDb.delay();
    const list = mockDb.load(mockDb.KEYS.masterMetode, []).filter((m) => m._id !== id);
    mockDb.save(mockDb.KEYS.masterMetode, list);
    return { message: 'Metode berhasil dihapus' };
  },
};
