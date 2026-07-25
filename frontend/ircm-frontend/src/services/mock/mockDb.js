// "Database" palsu berbasis localStorage — dipakai HANYA saat VITE_MOCK_MODE=true
// (mis. build khusus buat user testing yang di-hosting di Vercel/Netlify tanpa
// backend microservices beneran). Tidak dipakai sama sekali di build normal.

const KEYS = {
  users: 'sipeka_mock_users',
  laporan: 'sipeka_mock_laporan',
  kasus: 'sipeka_mock_kasus',
  masterKekerasan: 'sipeka_mock_master_kekerasan',
  masterMetode: 'sipeka_mock_master_metode',
  seeded: 'sipeka_mock_seeded_v1',
};

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function generateKodeLaporan(tipeLaporan) {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let rand = '';
  for (let i = 0; i < 5; i++) rand += chars[Math.floor(Math.random() * chars.length)];
  const prefix = tipeLaporan === 'anak' ? 'LA' : 'LP';
  return `${prefix}-${year}-${rand}`;
}

function currentUser() {
  try {
    const raw = localStorage.getItem('sipeka_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function mockError(message) {
  const err = new Error(message);
  err.response = { data: { message } };
  return err;
}

function delay(ms = 400) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Data contoh biar dashboard tidak kosong pas pertama kali dibuka user testing.
function seedIfNeeded() {
  if (load(KEYS.seeded, false)) return;

  save(KEYS.users, [
    { _id: 'u-petugas', name: 'Petugas UPTD PPA Kendari', email: 'petugas@uptd-ppa.kendari.go.id', password: 'petugas123456', role: 'petugas_uptd' },
    { _id: 'u-admin', name: 'Super Admin IRCM', email: 'superadmin@kendari.go.id', password: 'superadmin123', role: 'super_admin' },
  ]);

  save(KEYS.masterKekerasan, [
    { _id: 'mk-1', nama_kategori: 'Kekerasan Fisik', deskripsi: 'Tindakan yang mengakibatkan rasa sakit atau luka fisik', is_active: true },
    { _id: 'mk-2', nama_kategori: 'Kekerasan Psikis', deskripsi: 'Tindakan yang mengakibatkan ketakutan, hilangnya rasa percaya diri', is_active: true },
    { _id: 'mk-3', nama_kategori: 'Kekerasan Seksual', deskripsi: 'Pemaksaan hubungan seksual yang tidak dikehendaki', is_active: true },
    { _id: 'mk-4', nama_kategori: 'KDRT', deskripsi: 'Kekerasan Dalam Rumah Tangga', is_active: true },
    { _id: 'mk-5', nama_kategori: 'Penelantaran', deskripsi: 'Penelantaran rumah tangga atau anak', is_active: true },
    { _id: 'mk-6', nama_kategori: 'Cyberbullying', deskripsi: 'Perundungan melalui media digital', is_active: true },
  ]);

  save(KEYS.masterMetode, [
    { _id: 'mm-1', nama_metode: 'Konsultasi / Mediasi', deskripsi: 'Penyelesaian masalah melalui konsultasi atau mediasi', is_active: true },
    { _id: 'mm-2', nama_metode: 'Psikososial', deskripsi: 'Pendampingan psikologis untuk pemulihan trauma', is_active: true },
    { _id: 'mm-3', nama_metode: 'Bantuan Hukum', deskripsi: 'Bantuan jalur litigasi atau pelaporan kepolisian', is_active: true },
  ]);

  const now = Date.now();
  const daysAgo = (n) => new Date(now - n * 86400000).toISOString();

  save(KEYS.laporan, [
    {
      id: 'lap-1', _id: 'lap-1', kode_laporan: 'LP-2026-A1B2C', tipe_laporan: 'perempuan', anonim: false,
      nama_pelapor: 'Siti Rahma', telepon_pelapor: '081234567001', hubungan_korban: 'Diri Sendiri',
      nama_korban: 'Siti Rahma', usia_korban: 27, jenis_kelamin: 'Perempuan',
      alamat_korban: 'Jl. Melati No. 5', kelurahan_korban: 'Mandonga',
      jenis_kekerasan: 'KDRT', tanggal_kejadian: daysAgo(6), lokasi_kejadian: 'Rumah korban',
      kronologi: 'Korban mengalami kekerasan dari suami secara berulang dalam beberapa bulan terakhir.',
      status: 'menunggu_registrasi', catatan: null, createdAt: daysAgo(6), updatedAt: daysAgo(6),
    },
    {
      id: 'lap-2', _id: 'lap-2', kode_laporan: 'LA-2026-D3E4F', tipe_laporan: 'anak', anonim: true,
      nama_pelapor: 'ANONIM', telepon_pelapor: '081234567002', hubungan_korban: null,
      nama_korban: 'Anak R', usia_korban: 12, jenis_kelamin: 'Laki-laki',
      alamat_korban: 'Jl. Anggrek No. 9', kelurahan_korban: 'Kadia',
      jenis_kekerasan: 'Kekerasan Fisik', tanggal_kejadian: daysAgo(4), lokasi_kejadian: 'Lingkungan sekolah',
      kronologi: 'Korban mengalami tindak kekerasan fisik dari teman sekelas di lingkungan sekolah.',
      status: 'proses_assessment', catatan: 'Laporan sudah diregistrasi, menunggu jadwal assessment.',
      createdAt: daysAgo(4), updatedAt: daysAgo(3),
    },
    {
      id: 'lap-3', _id: 'lap-3', kode_laporan: 'LP-2026-G5H6I', tipe_laporan: 'perempuan', anonim: false,
      nama_pelapor: 'Ani Wulandari', telepon_pelapor: '081234567003', hubungan_korban: 'Diri Sendiri',
      nama_korban: 'Ani Wulandari', usia_korban: 31, jenis_kelamin: 'Perempuan',
      alamat_korban: 'Jl. Kenanga No. 2', kelurahan_korban: 'Kambu',
      jenis_kekerasan: 'Kekerasan Psikis', tanggal_kejadian: daysAgo(15), lokasi_kejadian: 'Rumah korban',
      kronologi: 'Korban sering menerima ancaman dan intimidasi dari pasangan.',
      status: 'dalam_penanganan', catatan: 'Dalam penanganan: Psikososial', createdAt: daysAgo(15), updatedAt: daysAgo(8),
    },
    {
      id: 'lap-4', _id: 'lap-4', kode_laporan: 'LP-2026-J7K8L', tipe_laporan: 'perempuan', anonim: false,
      nama_pelapor: 'Dewi Lestari', telepon_pelapor: '081234567004', hubungan_korban: 'Diri Sendiri',
      nama_korban: 'Dewi Lestari', usia_korban: 24, jenis_kelamin: 'Perempuan',
      alamat_korban: 'Jl. Cendana No. 8', kelurahan_korban: 'Poasia',
      jenis_kekerasan: 'Kekerasan Seksual', tanggal_kejadian: daysAgo(40), lokasi_kejadian: 'Kos korban',
      kronologi: 'Korban mengalami pelecehan seksual oleh rekan kerja.',
      status: 'selesai', catatan: 'Kasus selesai ditangani (Bantuan Hukum)', createdAt: daysAgo(40), updatedAt: daysAgo(20),
    },
  ]);

  save(KEYS.kasus, [
    {
      _id: 'kas-2', laporan_id: 'lap-2', kode_laporan: 'LA-2026-D3E4F',
      petugas_id: 'u-petugas', petugas_name: 'Petugas UPTD PPA Kendari',
      pesan_tindak_lanjut: 'Laporan tervalidasi, dijadwalkan assessment minggu ini.',
      tanggal_registrasi: daysAgo(3), status: 'registrasi', activity_log: [],
      hasil_assessment: null, kondisi_korban: null, kebutuhan_korban: null, tanggal_assessment: null,
      metode_penanganan: null, rencana_tindakan: null, tanggal_mulai: null,
      tanggal_selesai: null, arsip: false,
    },
    {
      _id: 'kas-3', laporan_id: 'lap-3', kode_laporan: 'LP-2026-G5H6I',
      petugas_id: 'u-petugas', petugas_name: 'Petugas UPTD PPA Kendari',
      pesan_tindak_lanjut: 'Laporan tervalidasi, assessment dijadwalkan.',
      tanggal_registrasi: daysAgo(14), status: 'penanganan',
      hasil_assessment: 'Korban menunjukkan kondisi cemas berlebih, butuh pendampingan psikologis rutin.',
      kondisi_korban: 'Cemas, sulit tidur', kebutuhan_korban: 'Pendampingan psikolog',
      tanggal_assessment: daysAgo(12),
      metode_penanganan: 'Psikososial', rencana_tindakan: 'Pendampingan psikolog mingguan selama 1 bulan.',
      tanggal_mulai: daysAgo(8),
      activity_log: [{ catatan: 'Sesi pendampingan pertama berjalan lancar.', tanggal: daysAgo(5), petugas_name: 'Petugas UPTD PPA Kendari' }],
      tanggal_selesai: null, arsip: false,
    },
    {
      _id: 'kas-4', laporan_id: 'lap-4', kode_laporan: 'LP-2026-J7K8L',
      petugas_id: 'u-petugas', petugas_name: 'Petugas UPTD PPA Kendari',
      pesan_tindak_lanjut: 'Laporan tervalidasi.',
      tanggal_registrasi: daysAgo(39), status: 'selesai',
      hasil_assessment: 'Korban memerlukan pendampingan hukum untuk proses pelaporan ke kepolisian.',
      kondisi_korban: 'Stabil', kebutuhan_korban: 'Pendampingan hukum',
      tanggal_assessment: daysAgo(35),
      metode_penanganan: 'Bantuan Hukum', rencana_tindakan: 'Pendampingan proses hukum di kepolisian.',
      tanggal_mulai: daysAgo(30),
      activity_log: [
        { catatan: 'Laporan polisi telah dibuat, proses penyidikan berjalan.', tanggal: daysAgo(25), petugas_name: 'Petugas UPTD PPA Kendari' },
        { catatan: 'Kasus dinyatakan selesai, korban dalam kondisi baik.', tanggal: daysAgo(20), petugas_name: 'Petugas UPTD PPA Kendari' },
      ],
      tanggal_selesai: daysAgo(20), arsip: true,
    },
  ]);

  save(KEYS.seeded, true);
}

export const mockDb = {
  KEYS, load, save, uid, generateKodeLaporan, currentUser, mockError, delay, seedIfNeeded,
};
