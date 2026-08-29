import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import laporanService from '../services/laporanService';
import kasusService from '../services/kasusService';
import { gatewayAssetUrl } from '../services/apiClient';
import StatCard from '../components/dashboard/StatCard';
import SebaranKelurahanChart from '../components/dashboard/SebaranKelurahanChart';
import DemografiChart from '../components/dashboard/DemografiChart';
import SidebarUserMenu from '../components/dashboard/SidebarUserMenu';
import { beriTahuGagal, beriTahuKurang, konfirmasi, toastInfo, toastSukses } from '../utils/notifikasi';
import { pilihLaporanBelumDiregistrasi } from '../utils/laporanBaru';
import { cocokDenganFilterKategori, kategoriKorban } from '../utils/kategoriKorban';
import './Dashboard.css';

const METODE_LIST = ['Konsultasi / Mediasi', 'Psikososial', 'Bantuan Hukum'];
const METODE_PERTEMUAN_LIST = ['Datang ke DP3A/UPTD', 'Petugas Mendatangi Korban'];

const MENU_ITEMS = [
  { id: 'beranda', icon: 'bi-grid-1x2-fill', label: 'Dashboard' },
  { id: 'penanganan', icon: 'bi-briefcase-fill', label: 'Penanganan Kasus' },
  { id: 'arsip', icon: 'bi-archive-fill', label: 'Arsip Laporan' },
];

const STEP_STAGES = [
  { id: 'pengaduan', label: 'Pengaduan' },
  { id: 'registrasi', label: 'Registrasi' },
  { id: 'assessment', label: 'Assessment' },
  { id: 'intervensi', label: 'Rencana Intervensi' },
  { id: 'monitoring', label: 'Monitoring' },
  { id: 'terminasi', label: 'Terminasi' }
];

export default function DashboardDP3A() {
  const navigate = useNavigate();

  // ==================== STATE ====================

  const [user, setUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState('beranda');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'detail'
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data mentah dari backend: laporan (report-service) & kasus (case-service)
  const [reports, setReports] = useState([]);
  const [kasusList, setKasusList] = useState([]);

  // State untuk mode detail/proses satu laporan/kasus
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeAction, setActiveAction] = useState('detail');
  const [filterKategori, setFilterKategori] = useState('');
  const [hanyaLaporanBaru, setHanyaLaporanBaru] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bannerLaporanDitutup, setBannerLaporanDitutup] = useState(false);
  const jumlahLaporanBaruSebelumnya = useRef(null);
  const generasiFetch = useRef(0);

  // State form tiap tahap penanganan
  const [pesanTindakLanjut, setPesanTindakLanjut] = useState('');
  const [metodePertemuan, setMetodePertemuan] = useState('');
  const [hasilAssessment, setHasilAssessment] = useState('');
  const [kondisiKorban, setKondisiKorban] = useState('');
  const [kebutuhanKorban, setKebutuhanKorban] = useState('');
  const [metode, setMetode] = useState('');
  const [rencana, setRencana] = useState('');
  const [catatanLog, setCatatanLog] = useState('');

  const getToken = () => localStorage.getItem('sipeka_token');

  // ==================== DATA FETCHING ====================

  const fetchAll = useCallback(async (tok) => {
    const generasi = ++generasiFetch.current;
    setLoading(true);
    try {
      const [reportsData, kasusData] = await Promise.all([
        laporanService.getAll(tok || getToken()),
        kasusService.getAll(tok || getToken()),
      ]);
      if (generasi !== generasiFetch.current) return;
      setReports(reportsData || []);
      setKasusList(kasusData || []);

      const jumlahBaru = (reportsData || []).filter(r => r.status === 'menunggu_registrasi').length;
      if (jumlahLaporanBaruSebelumnya.current !== null && jumlahBaru > jumlahLaporanBaruSebelumnya.current) {
        toastInfo(`Ada ${jumlahBaru - jumlahLaporanBaruSebelumnya.current} laporan baru yang masuk.`);
        setBannerLaporanDitutup(false);
      }
      jumlahLaporanBaruSebelumnya.current = jumlahBaru;
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      }
    } finally {
      if (generasi === generasiFetch.current) setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const rawUser = localStorage.getItem('sipeka_user');
    const tok = getToken();
    if (!tok || !rawUser) { navigate('/login'); return; }
    setUser(JSON.parse(rawUser));
    fetchAll(tok);
  }, [navigate, fetchAll]);

  useEffect(() => {
    if (!user) return undefined;
    const intervalId = window.setInterval(() => fetchAll(), 60_000);
    return () => window.clearInterval(intervalId);
  }, [user, fetchAll]);

  const handleLogout = async () => {
    if (!await konfirmasi('Keluar dari dashboard?', { teksSetuju: 'Ya, keluar' })) return;
    localStorage.clear();
    navigate('/login');
  };

  // ==================== ACTIONS: ALUR PENANGANAN KASUS ====================
  // Tahap 1 (registrasi) -> 2 (assessment) -> 3 (intervensi) -> 4 (monitoring/selesai)

  const submitRegistrasi = async () => {
    if (!pesanTindakLanjut) return beriTahuKurang('Pesan tindak lanjut wajib diisi');
    if (!metodePertemuan) return beriTahuKurang('Metode pertemuan wajib dikonfirmasi');
    setSubmitting(true);
    try {
      const hasilRegistrasi = await kasusService.registrasi(getToken(), {
        laporan_id: selectedItem._id || selectedItem.id,
        kode_laporan: selectedItem.kode_laporan,
        pesan_tindak_lanjut: pesanTindakLanjut,
        metode_pertemuan: metodePertemuan
      });

      // Respons Case Service sudah menjadi sumber kebenaran bahwa registrasi
      // berhasil. Perbarui tampilan langsung tanpa menunggu event RabbitMQ
      // menyinkronkan status salinan laporan di Reporting Service.
      const kasusBaru = hasilRegistrasi.kasus;
      if (kasusBaru) {
        // Batalkan hak commit fetch/polling yang dimulai sebelum mutasi ini.
        generasiFetch.current += 1;
        setKasusList(sebelumnya => [
          kasusBaru,
          ...sebelumnya.filter(kasus => kasus._id !== kasusBaru._id),
        ]);
        setReports(sebelumnya => sebelumnya.map(report =>
          String(report._id || report.id) === String(kasusBaru.laporan_id)
            ? { ...report, status: 'proses_assessment' }
            : report,
        ));
      }
      setViewMode('list');
      fetchAll();
    } catch (err) {
      beriTahuGagal(err.response?.data?.message || 'Terjadi kesalahan pada sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitAssessment = async () => {
    if (!hasilAssessment) return beriTahuKurang('Hasil assessment wajib diisi');
    setSubmitting(true);
    try {
      await kasusService.assessment(getToken(), selectedItem._id, {
        hasil_assessment: hasilAssessment,
        kondisi_korban: kondisiKorban,
        kebutuhan_korban: kebutuhanKorban
      });
      setViewMode('list');
      fetchAll();
    } catch (err) {
      beriTahuGagal(err.response?.data?.message || 'Terjadi kesalahan pada sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitIntervensi = async () => {
    if (!metode) return beriTahuKurang('Metode wajib dipilih');
    setSubmitting(true);
    try {
      await kasusService.intervensi(getToken(), selectedItem._id, {
        metode_penanganan: metode,
        rencana_tindakan: rencana
      });
      setViewMode('list');
      fetchAll();
    } catch (err) {
      beriTahuGagal(err.response?.data?.message || 'Terjadi kesalahan pada sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitLog = async () => {
    if (!catatanLog) return beriTahuKurang('Catatan log wajib diisi');
    setSubmitting(true);
    try {
      const hasil = await kasusService.addLog(getToken(), selectedItem._id, { catatan: catatanLog });
      const kasusDiperbarui = hasil.kasus;

      if (kasusDiperbarui) {
        setKasusList(sebelumnya => sebelumnya.map(kasus =>
          kasus._id === kasusDiperbarui._id ? kasusDiperbarui : kasus,
        ));
        setSelectedItem(sebelumnya => ({ ...sebelumnya, ...kasusDiperbarui }));
      }

      setCatatanLog('');
      toastSukses('Log progress berhasil disimpan.');
    } catch (err) {
      beriTahuGagal(err.response?.data?.message || 'Terjadi kesalahan pada sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  const selesaikanKasus = async () => {
    const setuju = await konfirmasi(
      'Kasus akan diarsipkan dan tidak bisa diubah lagi.',
      { judul: 'Tutup kasus ini?', teksSetuju: 'Ya, tutup kasus', berbahaya: true },
    );
    if (!setuju) return;
    try {
      await kasusService.selesaikan(getToken(), selectedItem._id);
      setViewMode('list');
      fetchAll();
    } catch (err) {
      beriTahuGagal(err.response?.data?.message || 'Terjadi kesalahan pada sistem.');
    }
  };

  if (!user) return null;

  // ==================== DERIVED DATA ====================
  // Data mentah (reports, kasusList) digabung/difilter di sini untuk keperluan tampilan.
  // Tidak ada state terpisah supaya selalu konsisten dengan data terbaru dari fetchAll().

  // Laporan report-service tidak menyimpan detail korban, jadi ditempel dari data laporan aslinya.
  const enrichKasus = (k) => {
    const r = reports.find(rep => rep.kode_laporan === k.kode_laporan) || {};
    return {
      ...k,
      nama_korban: r.nama_korban,
      usia_korban: r.usia_korban,
      jenis_kelamin: r.jenis_kelamin,
      kelurahan_korban: r.kelurahan_korban,
      tgl_melapor: r.createdAt,
      nama_pelapor: r.nama_pelapor,
      anonim: r.anonim,
      jenis_kekerasan: r.jenis_kekerasan,
      tipe_laporan: r.tipe_laporan
    };
  };

  const lapBaru = pilihLaporanBelumDiregistrasi(reports, kasusList);
  const kasAktif = kasusList.filter(k => k.status !== 'selesai').map(enrichKasus);

  // Gabungan laporan yang belum diregistrasi + kasus yang masih aktif, untuk tab "Penanganan Kasus"
  const allActiveList = [
    ...lapBaru.map(r => ({ ...r, listType: 'laporan', listStatus: 'Registrasi' })),
    ...kasAktif.map(k => {
      let st = 'Monitoring';
      if (k.status === 'registrasi') st = 'Assessment';
      else if (k.status === 'assessment') st = 'Rencana Intervensi';
      return { ...k, listType: 'kasus', listStatus: st };
    })
  ].sort((a, b) => new Date(b.createdAt || b.tanggal_registrasi) - new Date(a.createdAt || a.tanggal_registrasi));

  const kasSels = kasusList.filter(k => k.status === 'selesai').map(enrichKasus);

  // Filter kategori (Anak/Perempuan) khusus untuk tampilan tabel, tidak mengubah data asli
  const filteredActiveList = allActiveList.filter(item => {
    if (hanyaLaporanBaru && item.listType !== 'laporan') return false;
    if (!cocokDenganFilterKategori(item, filterKategori)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        (item.kode_laporan || '').toLowerCase().includes(q) ||
        (item.nama_korban || '').toLowerCase().includes(q) ||
        (item.jenis_kekerasan || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });
  const filteredKasSels = kasSels.filter(k => {
    if (!cocokDenganFilterKategori(k, filterKategori)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        (k.kode_laporan || '').toLowerCase().includes(q) ||
        (k.nama_korban || '').toLowerCase().includes(q) ||
        (k.metode_penanganan || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Data lengkap untuk detail satu laporan/kasus yang lagi dibuka
  let detailData = null;
  if (selectedItem) {
    const reportMatch = reports.find(r => r.kode_laporan === selectedItem.kode_laporan) || {};
    const caseMatch = kasusList.find(k => k.kode_laporan === selectedItem.kode_laporan) || {};
    detailData = { ...reportMatch, ...caseMatch, ...selectedItem };
  }

  // Klik "Proses" -> tentukan form tahap berikutnya berdasarkan status kasus saat ini
  const handleProses = (item) => {
    setSelectedItem(item);

    if (item.listType === 'laporan' || item.status === 'menunggu_registrasi') {
      setActiveAction('registrasi');
      setPesanTindakLanjut('');
      setMetodePertemuan(item.preferensi_layanan || '');
    } else if (item.status === 'registrasi') {
      setActiveAction('assessment');
      setHasilAssessment(''); setKondisiKorban(''); setKebutuhanKorban('');
    } else if (item.status === 'assessment') {
      setActiveAction('intervensi');
      setMetode(''); setRencana('');
    } else if (item.status === 'penanganan') {
      setActiveAction('monitoring');
      setCatatanLog('');
    } else {
      setActiveAction('detail');
    }

    setViewMode('detail');
  };

  // ==================== HELPERS ====================

  const getInitials = (name) => {
    if (!name) return '-';
    return name.split(' ').map(n => n[0]).join('.').toUpperCase() + '.';
  };

  const waktuRelatif = (tanggal) => {
    const selisihMenit = Math.max(0, Math.floor((Date.now() - new Date(tanggal).getTime()) / 60_000));
    if (selisihMenit < 1) return 'Baru saja';
    if (selisihMenit < 60) return `${selisihMenit} menit lalu`;
    const jam = Math.floor(selisihMenit / 60);
    if (jam < 24) return `${jam} jam lalu`;
    return `${Math.floor(jam / 24)} hari lalu`;
  };

  const lihatLaporanBaru = () => {
    setActiveMenu('penanganan');
    setViewMode('list');
    setHanyaLaporanBaru(true);
    setFilterKategori('');
    setSearchQuery('');
  };

  const normalizeNomorWhatsApp = (nomor) => {
    const digit = String(nomor || '').replace(/\D/g, '');
    if (digit.startsWith('0')) return `62${digit.slice(1)}`;
    if (digit.startsWith('62')) return digit;
    if (digit.startsWith('8')) return `62${digit}`;
    return digit;
  };

  const hubungiViaWhatsApp = (nomor) => {
    const nomorWhatsApp = normalizeNomorWhatsApp(nomor);
    if (!nomorWhatsApp) return beriTahuKurang('Nomor WhatsApp pelapor tidak tersedia');

    const pesan = 'Halo, kami petugas UPTD PPA. Kami menghubungi Anda untuk menindaklanjuti laporan yang telah dikirim. Apakah saat ini aman bagi Anda untuk berkomunikasi melalui WhatsApp?';
    window.open(`https://wa.me/${nomorWhatsApp}?text=${encodeURIComponent(pesan)}`, '_blank', 'noopener,noreferrer');
  };

  // Posisi stepper di halaman detail: index 0-5 sesuai STEP_STAGES
  let currentStepIndex = 1; // Default: Registrasi
  if (activeAction === 'assessment') currentStepIndex = 2;
  if (activeAction === 'intervensi') currentStepIndex = 3;
  if (activeAction === 'monitoring') currentStepIndex = 4;
  if (activeAction === 'detail' && selectedItem?.status === 'selesai') currentStepIndex = 5;

  // ==================== RENDER ====================

  return (
    <div className="dashboard-body" style={{ display: 'flex', minHeight: '100vh' }}>

      {/* OVERLAY MOBILE */}
      <div
        className={`sidebar-overlay${sidebarOpen ? ' open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* SIDEBAR */}
      <div className={`dashboard-sidebar${sidebarOpen ? ' mobile-open' : ''}`}>
        <div className="brand">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h6 className="d-flex align-items-center gap-2">
              <img src={logo} alt="Logo" style={{ width: '32px', height: 'auto' }} />
              DP3A Kota Kendari
            </h6>
            {/* Tombol tutup sidebar di mobile */}
            <button
              className="hamburger-btn"
              style={{ border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff' }}
              onClick={() => setSidebarOpen(false)}
              aria-label="Tutup menu"
            >
              <i className="bi bi-x"></i>
            </button>
          </div>
          <small style={{ color: 'rgba(255,255,255,0.4)', fontSize: '.75rem', fontWeight: '600' }}>SIPEKA Kota Kendari</small>
        </div>
        <nav style={{ marginTop: '1.5rem', flex: 1 }}>
          {MENU_ITEMS.map(item => (
            <div key={item.id} className={`dashboard-nav-link${activeMenu === item.id && viewMode === 'list' ? ' active' : ''}`} onClick={() => { setActiveMenu(item.id); setViewMode('list'); fetchAll(); setSidebarOpen(false); }}>
              <i className={`bi ${item.icon}`}></i> {item.label}
              {item.id === 'penanganan' && lapBaru.length > 0 && <span className="badge bg-danger text-white ms-auto rounded-pill">{lapBaru.length} baru</span>}
            </div>
          ))}
        </nav>
        <SidebarUserMenu user={user} roleLabel="Petugas" onLogout={handleLogout} />
      </div>

      {/* MAIN CONTENT */}
      <div className="dashboard-main" style={{ flex: 1 }}>
        <div className="dashboard-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Hamburger — hanya tampil di mobile */}
            <button
              className="hamburger-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Buka menu"
            >
              <i className="bi bi-list"></i>
            </button>
            <h5 className="fw-bold m-0 text-dark">
              {viewMode === 'detail' ? 'Detail Laporan' : MENU_ITEMS.find(m => m.id === activeMenu)?.label}
            </h5>
          </div>
        </div>

        {/* LIST MODE */}
        {viewMode === 'list' && (
          <>
            {lapBaru.length > 0 && activeMenu === 'beranda' && !bannerLaporanDitutup && (
              <div className="alert alert-warning border-warning border-opacity-50 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 rounded-4 shadow-sm mb-4 new-report-banner" role="alert">
                <button type="button" className="new-report-banner-close" onClick={() => setBannerLaporanDitutup(true)} aria-label="Tutup pemberitahuan laporan baru" title="Tutup">
                  <i className="bi bi-x-lg" aria-hidden="true"></i>
                </button>
                <div className="d-flex align-items-start gap-3">
                  <div className="rounded-circle bg-warning bg-opacity-25 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '44px', height: '44px' }}>
                    <i className="bi bi-bell-fill text-warning-emphasis fs-5"></i>
                  </div>
                  <div>
                    <div className="fw-bold text-dark">Ada {lapBaru.length} laporan baru yang perlu ditindaklanjuti</div>
                    <div className="small text-muted">Laporan tertua masuk {waktuRelatif(lapBaru[lapBaru.length - 1]?.createdAt)}.</div>
                  </div>
                </div>
                <button type="button" className="btn btn-warning fw-bold rounded-3 px-4 flex-shrink-0" onClick={lihatLaporanBaru}>
                  Lihat Laporan Baru <i className="bi bi-arrow-right ms-1"></i>
                </button>
              </div>
            )}

            {activeMenu === 'beranda' && (() => {
              const allDataForCharts = [...lapBaru, ...kasAktif, ...kasSels];

              return (
                <>
                  <div className="row g-3 mb-4">
                    <StatCard icon="bi-file-earmark-text" iconBg="#fdf2f5" iconColor="#8c1c3f" label="Total Laporan" value={allDataForCharts.length} />
                    <StatCard icon="bi-exclamation-circle" iconBg="#fef2f2" iconColor="#dc2626" label="Pengaduan Baru" value={lapBaru.length} />
                    <StatCard icon="bi-briefcase" iconBg="#fffbeb" iconColor="#d97706" label="Sedang Diproses" value={kasAktif.length} />
                    <StatCard icon="bi-check-circle" iconBg="#f0fdf4" iconColor="#16a34a" label="Selesai / Terminasi" value={kasSels.length} />
                  </div>

                  <div className="row g-4 mb-4">
                    <div className="col-lg-8"><SebaranKelurahanChart data={allDataForCharts} /></div>
                    <div className="col-lg-4"><DemografiChart data={allDataForCharts} /></div>
                  </div>

                  <div className="bento-card">
                    <h6 className="fw-bold mb-4">Aktivitas Laporan Terbaru</h6>
                    <div className="table-responsive">
                      <table className="table dashboard-table mb-0">
                        <thead>
                          <tr>
                            <th>ID & Tanggal</th>
                            <th>Inisial Korban</th>
                            <th>Jenis Kasus</th>
                            <th>Status Terakhir</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allActiveList.slice(0, 5).map(item => (
                            <tr key={item.id || item._id}>
                              <td>
                                <div className="fw-bold text-dark">{item.kode_laporan}</div>
                                <div className="small text-muted">{new Date(item.createdAt || item.tanggal_registrasi).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                              </td>
                              <td><span className="fw-semibold">{getInitials(item.nama_korban)}</span> <span className="small text-muted">({item.jenis_kelamin?.charAt(0)})</span></td>
                              <td><span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1">{item.jenis_kekerasan || '-'}</span></td>
                              <td><span className="badge-soft badge-soft-primary">{item.listStatus}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              );
            })()}

            {activeMenu === 'penanganan' && (
              <div className="modern-table-card">
                {/* Toolbar */}
                <div className="modern-table-toolbar">
                  <h6 className="modern-table-title">Daftar Kasus Menunggu Penanganan</h6>
                  <div className="modern-table-controls">
                    {/* Search */}
                    <div className="modern-table-search">
                      <i className="bi bi-search search-icon"></i>
                      <input
                        type="text"
                        placeholder="Cari kasus..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                      />
                    </div>
                    {/* Kategori filter pills */}
                    <div className="filter-pills">
                      <button className={`filter-pill ${filterKategori === '' && !hanyaLaporanBaru ? 'active' : ''}`} onClick={() => { setFilterKategori(''); setHanyaLaporanBaru(false); }}>Semua</button>
                      <button className={`filter-pill ${hanyaLaporanBaru ? 'active' : ''}`} onClick={() => { setHanyaLaporanBaru(true); setFilterKategori(''); }}>Baru ({lapBaru.length})</button>
                      <button className={`filter-pill ${filterKategori === 'anak' && !hanyaLaporanBaru ? 'active' : ''}`} onClick={() => { setFilterKategori('anak'); setHanyaLaporanBaru(false); }}>Anak</button>
                      <button className={`filter-pill ${filterKategori === 'perempuan' && !hanyaLaporanBaru ? 'active' : ''}`} onClick={() => { setFilterKategori('perempuan'); setHanyaLaporanBaru(false); }}>Perempuan</button>
                    </div>
                    {/* Badge count */}
                    <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-1">{filteredActiveList.length} Data</span>
                    {loading && <span className="small text-muted"><span className="spinner-border spinner-border-sm me-1"></span>Memperbarui</span>}
                    {/* Reset */}
                    {(searchQuery || filterKategori || hanyaLaporanBaru) && (
                      <button
                        className="btn btn-sm btn-light text-muted rounded-pill px-3"
                        onClick={() => { setSearchQuery(''); setFilterKategori(''); setHanyaLaporanBaru(false); }}
                      >
                        <i className="bi bi-x-circle me-1"></i>Reset
                      </button>
                    )}
                  </div>
                </div>

                {filteredActiveList.length === 0 ? <div className="text-center py-5 text-muted">Belum ada data kasus aktif.</div> : (
                  <div className="table-responsive">
                    <table className="table dashboard-table mb-0">
                      <thead>
                        <tr>
                          <th>ID Laporan</th>
                          <th>Pelapor (Inisial)</th>
                          <th>Korban (Inisial)</th>
                          <th>Kategori</th>
                          <th>Tahap Saat Ini</th>
                          <th>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredActiveList.map(item => (
                          <tr key={item.id || item._id}>
                            <td>
                              <div className="fw-bold text-dark">{item.kode_laporan}</div>
                              <div className="small text-muted">{new Date(item.createdAt || item.tanggal_registrasi).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                              {item.listType === 'laporan' && (
                                <div className="mt-1 d-flex flex-wrap align-items-center gap-1">
                                  <span className="badge bg-danger rounded-pill">BARU</span>
                                  <span className="small text-danger fw-semibold">{waktuRelatif(item.createdAt)}</span>
                                </div>
                              )}
                            </td>
                            <td><span className="fw-semibold">{getInitials(item.nama_pelapor || (item.anonim ? 'Anonim' : '-'))}</span></td>
                            <td><span className="fw-semibold">{getInitials(item.nama_korban)}</span> <span className="small text-muted">({item.jenis_kelamin?.charAt(0)})</span></td>
                            <td>
                              {kategoriKorban(item).map(kategori => (
                                <span key={kategori} className={`status-pill me-1 ${kategori === 'anak' ? 'status-pill-warning' : 'status-pill-info'}`}>
                                  {kategori === 'anak' ? 'Anak' : 'Perempuan'}
                                </span>
                              ))}
                            </td>
                            <td>
                              <span className="badge-soft badge-soft-primary">
                                {item.listStatus}
                              </span>
                            </td>
                            <td>
                              <button className="btn btn-sm btn-outline-primary fw-bold px-4 rounded-3" onClick={() => handleProses(item)}>
                                Proses
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeMenu === 'arsip' && (
              <div className="modern-table-card">
                {/* Toolbar */}
                <div className="modern-table-toolbar">
                  <h6 className="modern-table-title">Arsip Kasus Selesai</h6>
                  <div className="modern-table-controls">
                    {/* Search */}
                    <div className="modern-table-search">
                      <i className="bi bi-search search-icon"></i>
                      <input
                        type="text"
                        placeholder="Cari arsip..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                      />
                    </div>
                    {/* Kategori filter pills */}
                    <div className="filter-pills">
                      <button className={`filter-pill ${filterKategori === '' ? 'active' : ''}`} onClick={() => setFilterKategori('')}>Semua</button>
                      <button className={`filter-pill ${filterKategori === 'anak' ? 'active' : ''}`} onClick={() => setFilterKategori('anak')}>Anak</button>
                      <button className={`filter-pill ${filterKategori === 'perempuan' ? 'active' : ''}`} onClick={() => setFilterKategori('perempuan')}>Perempuan</button>
                    </div>
                    {(searchQuery || filterKategori) && (
                      <button
                        className="btn btn-sm btn-light text-muted rounded-pill px-3"
                        onClick={() => { setSearchQuery(''); setFilterKategori(''); }}
                      >
                        <i className="bi bi-x-circle me-1"></i>Reset
                      </button>
                    )}
                  </div>
                </div>
                {filteredKasSels.length === 0 ? <div className="text-center py-5 text-muted">Arsip kosong</div> : (
                  <div className="table-responsive">
                    <table className="table dashboard-table mb-0">
                      <thead>
                        <tr>
                          <th>ID Laporan</th>
                          <th>Tgl Selesai</th>
                          <th>Korban</th>
                          <th>Kategori</th>
                          <th>Metode Penanganan</th>
                          <th>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredKasSels.map(k => (
                          <tr key={k._id}>
                            <td><div className="fw-bold text-dark">{k.kode_laporan}</div></td>
                            <td className="small text-muted fw-semibold">{new Date(k.tanggal_selesai).toLocaleDateString('id-ID')}</td>
                            <td>
                              <div className="fw-bold">{getInitials(k.nama_korban)}</div>
                            </td>
                            <td>
                              {kategoriKorban(k).map(kategori => (
                                <span key={kategori} className={`status-pill me-1 ${kategori === 'anak' ? 'status-pill-warning' : 'status-pill-info'}`}>
                                  {kategori === 'anak' ? 'Anak' : 'Perempuan'}
                                </span>
                              ))}
                            </td>
                            <td><span className="fw-semibold small">{k.metode_penanganan}</span></td>
                            <td>
                              <button className="btn btn-sm btn-light border fw-bold px-3 rounded-3" onClick={() => { setSelectedItem(k); setActiveAction('detail'); setViewMode('detail'); }}>
                                Detail
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* DETAIL MODE (FULL PAGE) */}
        {viewMode === 'detail' && detailData && (
          <div className="fade-in">
            <button className="btn btn-sm btn-white bg-white border shadow-sm mb-4 fw-bold text-dark px-3 py-2 rounded-3" onClick={() => setViewMode('list')}>
              <i className="bi bi-arrow-left me-2"></i> Kembali ke Daftar
            </button>

            <div className="bento-card p-4 p-md-5">
              <div className="d-flex justify-content-between align-items-start border-bottom pb-3 mb-4">
                <div>
                  <h4 className="fw-bold mb-1">Detail Laporan {detailData.kode_laporan}</h4>
                  <small className="text-muted">Data sensitif (Nama Lengkap/Alamat Pelapor) disamarkan sesuai protokol keamanan.</small>
                </div>
                <div>
                  <span className="badge bg-primary bg-opacity-10 text-primary border border-primary px-3 py-2 rounded-pill fs-6">Status: {STEP_STAGES[currentStepIndex].label}</span>
                </div>
              </div>

              {/* STEPPER */}
              <div className="stepper-container my-5">
                <div className="stepper-line"></div>
                <div className="stepper-line-active" style={{ width: `${(currentStepIndex / (STEP_STAGES.length - 1)) * 90}%` }}></div>

                {STEP_STAGES.map((step, idx) => {
                  let statusClass = '';
                  if (idx < currentStepIndex) statusClass = 'completed';
                  else if (idx === currentStepIndex) statusClass = 'active';

                  return (
                    <div key={step.id} className={`stepper-item ${statusClass}`}>
                      <div className="stepper-circle">
                        {statusClass === 'completed' ? <i className="bi bi-check-lg"></i> : (idx + 1)}
                      </div>
                      <span className="stepper-label mt-2">{step.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* INFO CARDS */}
              <div className="row g-4 mb-4">
                <div className="col-md-6">
                  <div className="card h-100 border rounded-4 shadow-none">
                    <div className="card-body p-4">
                      <h6 className="fw-bold mb-4 d-flex align-items-center gap-2"><i className="bi bi-people fs-5"></i> Identitas Subjek</h6>
                      <div className="row g-4">
                        <div className="col-6">
                          <label className="small text-muted d-block mb-1">Inisial Pelapor</label>
                          <span className="fw-bold">{detailData.anonim ? 'Anonim' : getInitials(detailData.nama_pelapor)}</span>
                        </div>
                        <div className="col-6">
                          <label className="small text-muted d-block mb-1">Inisial Korban</label>
                          <span className="fw-bold">{getInitials(detailData.nama_korban)}</span>
                        </div>
                        <div className="col-6">
                          <label className="small text-muted d-block mb-1">Gender Korban</label>
                          <span className="fw-bold">{detailData.jenis_kelamin}</span>
                        </div>
                        <div className="col-6">
                          <label className="small text-muted d-block mb-1">Usia Korban</label>
                          <span className="fw-bold">{detailData.usia_korban} Tahun</span>
                        </div>
                        <div className="col-6">
                          <label className="small text-muted d-block mb-1">Pekerjaan Korban</label>
                          <span className="fw-bold">Data tidak tersedia</span>
                        </div>
                        <div className="col-6">
                          <label className="small text-muted d-block mb-1">Status Perkawinan</label>
                          <span className="fw-bold">Data tidak tersedia</span>
                        </div>
                        <div className="col-12">
                          <label className="small text-muted d-block mb-2">Kontak Pelapor (Untuk Tindak Lanjut)</label>
                          <div className="d-flex flex-wrap align-items-center gap-2">
                            <span className="fw-bold text-primary">{detailData.telepon_pelapor || '-'}</span>
                            {detailData.telepon_pelapor && (
                              <button
                                type="button"
                                className="btn btn-sm btn-success fw-bold rounded-3 px-3"
                                onClick={() => hubungiViaWhatsApp(detailData.telepon_pelapor)}
                              >
                                <i className="bi bi-whatsapp me-1"></i> Hubungi via WhatsApp
                              </button>
                            )}
                          </div>
                          <small className="text-muted d-block mt-2">Pastikan kondisi pelapor aman sebelum membahas laporan.</small>
                        </div>
                        <div className="col-12">
                          <label className="small text-muted d-block mb-1">Preferensi Pertemuan (Dipilih Pelapor)</label>
                          {detailData.preferensi_layanan === 'Petugas Mendatangi Korban' ? (
                            <span className="badge bg-warning bg-opacity-25 text-dark border border-warning border-opacity-50 px-2 py-1">
                              <i className="bi bi-geo-alt-fill me-1"></i> Petugas Mendatangi Korban
                            </span>
                          ) : (
                            <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1">
                              <i className="bi bi-building-fill me-1"></i> {detailData.preferensi_layanan || 'Datang ke UPTD'}
                            </span>
                          )}
                        </div>
                        {detailData.metode_pertemuan && (
                          <div className="col-12">
                            <label className="small text-muted d-block mb-1">Metode Pertemuan (Hasil Konfirmasi)</label>
                            <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1">
                              <i className="bi bi-check-circle-fill me-1"></i> {detailData.metode_pertemuan}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="card h-100 border rounded-4 shadow-none">
                    <div className="card-body p-4">
                      <h6 className="fw-bold mb-4 d-flex align-items-center gap-2"><i className="bi bi-file-earmark-text fs-5"></i> Informasi Kejadian</h6>

                      <div className="mb-4">
                        <label className="small text-muted d-block mb-1">Jenis Kasus</label>
                        <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1">{detailData.jenis_kekerasan}</span>
                      </div>

                      <div className="mb-4">
                        <label className="small text-muted d-block mb-1">Alamat Kejadian / Domisili Korban</label>
                        <span className="fw-semibold">{detailData.lokasi_kejadian}, {detailData.kelurahan_korban}</span>
                      </div>

                      <div>
                        <label className="small text-muted d-block mb-1">Bukti Terlampir</label>
                        {!detailData.bukti_file ? (
                          <span className="text-muted fst-italic">Tidak ada lampiran bukti</span>
                        ) : (
                          <div className="mt-2 border rounded p-2 bg-light text-center">
                            {detailData.bukti_file.toLowerCase().match(/\.(jpeg|jpg|gif|png)$/) ? (
                              <a href={gatewayAssetUrl(detailData.bukti_file)} target="_blank" rel="noreferrer">
                                <img src={gatewayAssetUrl(detailData.bukti_file)} alt="Bukti Terlampir" className="img-fluid rounded border" style={{ maxHeight: '300px', objectFit: 'contain' }} />
                              </a>
                            ) : detailData.bukti_file.toLowerCase().endsWith('.pdf') ? (
                              <div className="d-flex align-items-center justify-content-center gap-3 p-3">
                                <i className="bi bi-file-earmark-pdf-fill text-danger" style={{ fontSize: '3rem' }}></i>
                                <div className="text-start">
                                  <a href={gatewayAssetUrl(detailData.bukti_file)} target="_blank" rel="noreferrer" className="fw-bold text-primary text-decoration-none d-block fs-5">Lihat Dokumen PDF</a>
                                  <small className="text-muted">{detailData.bukti_file.split('/').pop()}</small>
                                </div>
                              </div>
                            ) : (
                              <a href={gatewayAssetUrl(detailData.bukti_file)} target="_blank" rel="noreferrer" className="btn btn-outline-primary fw-semibold mt-2"><i className="bi bi-file-earmark-arrow-down me-2"></i> Unduh File Lampiran</a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* KRONOLOGI */}
              <div className="card border rounded-4 shadow-none mb-5 bg-light">
                <div className="card-body p-4">
                  <div className="row g-4">
                    <div className="col-md-5 border-end">
                      <label className="small text-muted fw-bold d-block mb-2">Detail Singkat Kasus</label>
                      <div className="bg-white p-3 border rounded-3 text-dark small" style={{ minHeight: '80px' }}>
                         Laporan masuk terkait dugaan kasus {detailData.jenis_kekerasan} yang terjadi di wilayah {detailData.kelurahan_korban}.
                      </div>
                    </div>
                    <div className="col-md-7">
                      <label className="small text-muted fw-bold d-block mb-2">Kronologi (Dari Pelapor)</label>
                      <div className="bg-white p-3 border rounded-3 text-dark small" style={{ minHeight: '80px', whiteSpace: 'pre-wrap' }}>
                        {detailData.kronologi}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIWAYAT TAHAPAN — kasus arsip juga menampilkan seluruh log monitoring */}
              {(detailData.hasil_assessment || detailData.metode_penanganan || detailData.status === 'selesai') && (
                <div className="card border rounded-4 shadow-none mb-5">
                  <div className="card-header bg-white border-bottom p-4">
                    <h6 className="fw-bold m-0"><i className="bi bi-journal-check text-primary me-2"></i>Riwayat Pengisian Tahapan Kasus</h6>
                  </div>
                  <div className="card-body p-4 bg-light">
                    <div className="row g-4">
                      {detailData.hasil_assessment && (
                        <div className="col-12 border-bottom pb-4">
                          <h6 className="fw-bold text-dark mb-3 small text-uppercase"><i className="bi bi-check-circle-fill text-success me-2"></i>Tahap Assessment</h6>
                          <div className="row g-3">
                            <div className="col-md-6">
                              <label className="small text-muted d-block mb-1">Hasil Wawancara / Assessment</label>
                              <div className="bg-white p-3 border rounded-3 text-dark small">{detailData.hasil_assessment}</div>
                            </div>
                            <div className="col-md-3">
                              <label className="small text-muted d-block mb-1">Kondisi Korban Saat Ini</label>
                              <div className="bg-white p-3 border rounded-3 text-dark small">{detailData.kondisi_korban || '-'}</div>
                            </div>
                            <div className="col-md-3">
                              <label className="small text-muted d-block mb-1">Kebutuhan Mendesak</label>
                              <div className="bg-white p-3 border rounded-3 text-dark small">{detailData.kebutuhan_korban || '-'}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {detailData.metode_penanganan && (
                        <div className={`col-12 pb-4 ${detailData.status === 'selesai' ? 'border-bottom' : ''}`}>
                          <h6 className="fw-bold text-dark mb-3 small text-uppercase"><i className="bi bi-check-circle-fill text-success me-2"></i>Tahap Rencana Intervensi</h6>
                          <div className="row g-3">
                            <div className="col-md-4">
                              <label className="small text-muted d-block mb-2">Metode Penanganan Dipilih</label>
                              <span className="badge-soft badge-soft-primary px-3 py-2 border border-primary">{detailData.metode_penanganan}</span>
                            </div>
                            <div className="col-md-8">
                              <label className="small text-muted d-block mb-1">Rencana Tindakan / Layanan</label>
                              <div className="bg-white p-3 border rounded-3 text-dark small">{detailData.rencana_tindakan || '-'}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {detailData.status === 'selesai' && (
                        <div className="col-12 pb-2">
                          <div className="monitoring-history-heading">
                            <div>
                              <h6><i className="bi bi-activity" aria-hidden="true"></i>Tahap Monitoring</h6>
                              <p>Catatan perkembangan dan tindakan selama pemantauan kasus.</p>
                            </div>
                            <span>{detailData.activity_log?.length || 0} catatan</span>
                          </div>

                          {detailData.activity_log?.length > 0 ? (
                            <div className="monitoring-history-list">
                              {detailData.activity_log.map((log, idx) => (
                                <div className="monitoring-history-item" key={log._id || idx}>
                                  <span className="monitoring-history-marker" aria-hidden="true"><i className="bi bi-check2"></i></span>
                                  <div className="monitoring-history-content">
                                    <div className="monitoring-history-meta">
                                      <time dateTime={log.tanggal}>{new Date(log.tanggal).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Makassar' })} WITA</time>
                                      <span><i className="bi bi-person" aria-hidden="true"></i>{log.petugas_name || 'Petugas UPTD'}</span>
                                    </div>
                                    <p>{log.catatan}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="monitoring-history-empty">
                              <i className="bi bi-journal-x" aria-hidden="true"></i>
                              Tidak ada catatan monitoring yang tersimpan pada kasus ini.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ACTION FORM */}
              {activeAction !== 'detail' && (
                <div className="action-form-box shadow-sm mt-4">
                  <div className="action-form-header">
                    <h5 className="fw-bold text-primary m-0">Formulir Aksi: Tahap {STEP_STAGES[currentStepIndex].label}</h5>
                    <small className="text-muted">Lengkapi data berikut untuk melanjutkan ke tahap selanjutnya.</small>
                  </div>
                  <div className="action-form-body">

                    {activeAction === 'registrasi' && (
                      <>
                        <div className="mb-4">
                          <label className="form-label fw-bold">Metode Pertemuan yang Dikonfirmasi</label>
                          <select className="form-select" value={metodePertemuan} onChange={e => setMetodePertemuan(e.target.value)}>
                            <option value="">-- Pilih Metode Pertemuan --</option>
                            {METODE_PERTEMUAN_LIST.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                          <div className="form-text">
                            Pilihan awal pelapor: <strong>{detailData.preferensi_layanan || 'Tidak tersedia'}</strong>. Ubah hanya jika pelapor menyepakati metode lain.
                          </div>
                        </div>
                        <div className="mb-4">
                          <label className="form-label fw-bold">Pesan Tindak Lanjut untuk Pelapor</label>
                          <textarea className="form-control" rows={3} placeholder="Contoh: Laporan tervalidasi. Siapkan jadwal assessment..." value={pesanTindakLanjut} onChange={e => setPesanTindakLanjut(e.target.value)}></textarea>
                        </div>
                        <div className="d-flex justify-content-end">
                          <button className="btn btn-primary px-4 py-2 rounded-3 fw-bold" onClick={submitRegistrasi} disabled={submitting}>Simpan & Lanjut ke Assessment <i className="bi bi-chevron-right ms-1"></i></button>
                        </div>
                      </>
                    )}

                    {activeAction === 'assessment' && (
                      <>
                        <div className="row g-3 mb-4">
                          <div className="col-12">
                            <label className="form-label fw-bold">Hasil Assessment / Wawancara</label>
                            <textarea className="form-control" rows={3} value={hasilAssessment} onChange={e => setHasilAssessment(e.target.value)}></textarea>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label fw-bold">Kondisi Korban Saat Ini</label>
                            <input type="text" className="form-control" value={kondisiKorban} onChange={e => setKondisiKorban(e.target.value)} />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label fw-bold">Kebutuhan Mendesak</label>
                            <input type="text" className="form-control" value={kebutuhanKorban} onChange={e => setKebutuhanKorban(e.target.value)} />
                          </div>
                        </div>
                        <div className="d-flex justify-content-end">
                          <button className="btn btn-primary px-4 py-2 rounded-3 fw-bold" onClick={submitAssessment} disabled={submitting}>Simpan & Lanjut ke Intervensi <i className="bi bi-chevron-right ms-1"></i></button>
                        </div>
                      </>
                    )}

                    {activeAction === 'intervensi' && (
                      <>
                        <div className="mb-3">
                          <label className="form-label fw-bold">Metode Penanganan</label>
                          <select className="form-select" value={metode} onChange={e => setMetode(e.target.value)}>
                            <option value="">-- Pilih Metode --</option>
                            {METODE_LIST.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </div>
                        <div className="mb-4">
                          <label className="form-label fw-bold">Rencana Tindakan / Layanan</label>
                          <textarea className="form-control" rows={3} value={rencana} onChange={e => setRencana(e.target.value)}></textarea>
                        </div>
                        <div className="d-flex justify-content-end">
                          <button className="btn btn-primary px-4 py-2 rounded-3 fw-bold" onClick={submitIntervensi} disabled={submitting}>Simpan & Lanjut ke Monitoring <i className="bi bi-chevron-right ms-1"></i></button>
                        </div>
                      </>
                    )}

                    {activeAction === 'monitoring' && (
                      <>
                        {selectedItem.activity_log && selectedItem.activity_log.length > 0 && (
                          <div className="mb-4 p-3 bg-light rounded border">
                            <h6 className="fw-bold mb-3 small text-muted">Riwayat Log Sebelumnya</h6>
                            {selectedItem.activity_log.map((log, idx) => (
                              <div key={idx} className="mb-2 pb-2 border-bottom">
                                <span className="small text-muted me-2 border-end pe-2">{new Date(log.tanggal).toLocaleDateString('id-ID')}</span>
                                <span className="small text-dark fw-semibold">{log.catatan}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="mb-4">
                          <label className="form-label fw-bold">Tambah Catatan Baru / Progress Kasus</label>
                          <textarea className="form-control" rows={3} value={catatanLog} onChange={e => setCatatanLog(e.target.value)} placeholder="Tulis perkembangan kasus..."></textarea>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <button className="btn btn-outline-danger px-4 py-2 rounded-3 fw-bold" onClick={selesaikanKasus}>Akhiri / Terminasi Kasus</button>
                          <button className="btn btn-primary px-4 py-2 rounded-3 fw-bold" onClick={submitLog} disabled={submitting}>Simpan Log Progress <i className="bi bi-check2 ms-1"></i></button>
                        </div>
                      </>
                    )}

                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
