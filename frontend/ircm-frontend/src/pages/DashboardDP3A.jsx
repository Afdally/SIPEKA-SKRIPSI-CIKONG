import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_REPORT = 'http://localhost:8080/api';
const API_CASE   = 'http://localhost:8080/api';
const API_AUTH   = 'http://localhost:8080/api';

/* ── CSS injected once ── */
const style = `
  :root {
    --biru-utama: #1a56db;
    --biru-gelap: #1e3a8a;
    --biru-muda:  #e8f0fb;
    --border-dp3: #e2e8f0;
  }

  .dp3a-body {
    background: #f8fafc;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }

  /* Sidebar */
  .dp3a-sidebar {
    width: 260px; min-height: 100vh;
    background: var(--biru-gelap);
    position: fixed; top: 0; left: 0; z-index: 100;
    display: flex; flex-direction: column;
  }
  .dp3a-sidebar .brand {
    padding: 1.5rem 1.25rem 1rem;
    border-bottom: 1px solid rgba(255,255,255,0.1);
  }
  .dp3a-sidebar .brand h6 { color: #fff; font-weight: 700; margin: 0; }

  .dp3a-nav-link {
    color: rgba(255,255,255,0.7);
    padding: .8rem 1.25rem; font-size: .875rem;
    display: flex; align-items: center; gap: .75rem;
    cursor: pointer; transition: .2s;
    border-left: 4px solid transparent;
  }
  .dp3a-nav-link:hover,
  .dp3a-nav-link.active {
    color: #fff;
    background: rgba(255,255,255,0.1);
    border-left-color: #60a5fa;
  }

  .dp3a-main { margin-left: 260px; padding: 1.5rem; }

  .dp3a-topbar {
    background: #fff; border-bottom: 1px solid var(--border-dp3);
    padding: .75rem 1.5rem;
    margin: -1.5rem -1.5rem 1.5rem;
    display: flex; align-items: center; justify-content: space-between;
  }

  /* Stat Cards – uniform blue border */
  .dp3a-stat-card {
    background: #fff; border-radius: 12px; padding: 1.25rem;
    border: 2px solid var(--biru-utama);
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    height: 100%;
    transition: all .2s;
  }
  .dp3a-stat-card:hover {
    transform: translateY(-3px);
    border-color: var(--biru-gelap);
    background: var(--biru-muda);
  }
  .dp3a-stat-icon {
    width: 44px; height: 44px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center; font-size: 1.2rem;
    background: var(--biru-muda); color: var(--biru-utama);
  }

  /* Section Card */
  .dp3a-card {
    background: #fff; border-radius: 12px;
    border: 1px solid var(--border-dp3);
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    overflow: hidden; margin-bottom: 1.5rem;
  }
  .dp3a-card-header {
    padding: 1rem 1.25rem; background: #fff;
    border-bottom: 1px solid #f1f5f9;
    display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: .5rem;
  }

  /* Activity items */
  .activity-item {
    padding: 12px 15px;
    border-left: 3px solid var(--biru-utama);
    margin-bottom: 10px; background: #f8faff; border-radius: 0 8px 8px 0;
  }

  /* Progress chart */
  .chart-label {
    font-size: .75rem; font-weight: 600; color: #64748b;
    margin-bottom: 4px; display: flex; justify-content: space-between;
  }
  .custom-progress { height: 8px; background: #f1f5f9; border-radius: 10px; overflow: hidden; margin-bottom: 15px; }
  .progress-fill   { height: 100%; background: var(--biru-utama); border-radius: 10px; }

  /* Table */
  .dp3a-table th {
    background: #f8fafc; font-size: .75rem; text-transform: uppercase;
    color: #64748b; padding: 1rem; border-bottom: 2px solid var(--border-dp3) !important;
  }
  .dp3a-table td { padding: 1rem; font-size: .875rem; vertical-align: middle; }
  .dp3a-table tbody tr:hover { background: var(--biru-muda); }

  /* Metode checkbox */
  .checkbox-item {
    display: flex; align-items: center; padding: 12px;
    border: 1.5px solid #eee; border-radius: 10px;
    margin-bottom: 8px; cursor: pointer; transition: .2s;
  }
  .checkbox-item:hover { border-color: var(--biru-utama); }
  .checkbox-item.selected { background: #f0f7ff; border-color: var(--biru-utama); }
  .checkbox-item input { width: 18px; height: 18px; margin-right: 12px; }

  /* Empty state */
  .dp3a-empty { text-align: center; padding: 4rem 2rem; color: #64748b; }
  .dp3a-empty i { font-size: 3rem; opacity: .2; display: block; margin-bottom: 1rem; }

  /* Metode list item */
  .metode-item {
    display: flex; align-items: center; gap: .75rem;
    padding: .85rem 1rem; border: 1.5px solid #e2e8f0;
    border-radius: 10px; margin-bottom: 8px;
    transition: .2s; background: #fff;
  }
  .metode-item:hover { border-color: var(--biru-utama); background: var(--biru-muda); }
  .metode-icon-box {
    width: 38px; height: 38px; border-radius: 8px;
    background: var(--biru-muda); color: var(--biru-utama);
    display: flex; align-items: center; justify-content: center;
    font-size: 1rem; flex-shrink: 0;
  }
  .btn-icon { background: none; border: none; cursor: pointer; padding: .25rem .4rem; border-radius: 6px; transition: .15s; }
  .btn-icon.edit:hover   { background: #dbeafe; color: var(--biru-utama); }
  .btn-icon.hapus:hover  { background: #fee2e2; color: #dc2626; }

  @media (max-width: 768px) {
    .dp3a-sidebar { width: 100%; min-height: auto; position: relative; }
    .dp3a-main { margin-left: 0; }
  }
`;

const METODE_LIST = [
  {
    nama: 'Konsultasi / Mediasi',
    icon: 'bi-chat-dots-fill',
    desc: 'Sesi konsultasi atau mediasi antara pihak terkait untuk mendorong penyelesaian secara damai dan kekeluargaan.',
    color: '#1a56db', bg: '#dbeafe',
  },
  {
    nama: 'Psikososial',
    icon: 'bi-heart-pulse-fill',
    desc: 'Dukungan pemulihan psikologis dan sosial bagi korban, termasuk konseling dan pendampingan trauma.',
    color: '#0e7490', bg: '#cffafe',
  },
  {
    nama: 'Bantuan Hukum',
    icon: 'bi-journal-bookmark-fill',
    desc: 'Pendampingan dan bantuan bagi korban dalam menjalani proses hukum bersama tim advokat DP3A.',
    color: '#7c3aed', bg: '#ede9fe',
  },
];

const MENU_ITEMS = [
  { id: 'beranda',           icon: 'bi-grid-1x2-fill',  label: 'Beranda' },
  { id: 'laporan-masuk',     icon: 'bi-inbox-fill',      label: 'Laporan Masuk' },
  { id: 'hasil-klasifikasi', icon: 'bi-journal-check',   label: 'Hasil Klasifikasi' },
  { id: 'metode',            icon: 'bi-tags-fill',        label: 'Kelola Metode' },
];

export default function DashboardDP3A() {
  const navigate = useNavigate();
  const [user, setUser]             = useState(null);
  const [activeMenu, setActiveMenu] = useState('beranda');
  const [reports, setReports]       = useState([]);
  const [penanganan, setPenanganan] = useState([]);
  const [loading, setLoading]       = useState(false);

  /* Modal klasifikasi laporan */
  const [showDetailModal, setShowDetailModal]         = useState(false);
  const [showMetodeModal, setShowMetodeModal]         = useState(false);
  const [selectedLaporan, setSelectedLaporan]         = useState(null);
  const [selectedMetode, setSelectedMetode]           = useState('');
  const [keterangan, setKeterangan]                   = useState('');
  const [tanggalPenanganan, setTanggalPenanganan]     = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting]                   = useState(false);

  /* Modal tambah/edit metode */
  const [showMetodeMasterModal, setShowMetodeMasterModal] = useState(false);
  const [metodeList, setMetodeList]                       = useState([
    { id: 1, nama: 'Konsultasi / Mediasi',  deskripsi: 'Sesi konsultasi atau mediasi antara pihak terkait untuk mendorong penyelesaian secara damai.' },
    { id: 2, nama: 'Psikososial',           deskripsi: 'Dukungan pemulihan psikologis dan sosial bagi korban, termasuk konseling dan pendampingan trauma.' },
    { id: 3, nama: 'Bantuan Hukum',         deskripsi: 'Pendampingan dan bantuan bagi korban dalam menjalani proses hukum bersama tim advokat DP3A.' },
  ]);
  const [editingMetode, setEditingMetode]   = useState(null);   // null = tambah baru
  const [inpMetodeNama, setInpMetodeNama]   = useState('');
  const [inpMetodeDesc, setInpMetodeDesc]   = useState('');

  const getToken = () => localStorage.getItem('sipeka_token');

  const fetchAll = useCallback(async (tok) => {
    setLoading(true);
    try {
      const [rReports, rPenanganan] = await Promise.all([
        axios.get(`${API_REPORT}/laporan`,  { headers: { Authorization: `Bearer ${tok || getToken()}` } }),
        axios.get(`${API_CASE}/penanganan`, { headers: { Authorization: `Bearer ${tok || getToken()}` } }),
      ]);
      const dp3aReports = (rReports.data.data || []).filter(
        r => ['diteruskan_dp3a','sedang_ditangani','selesai'].includes(r.status)
      );
      setReports(dp3aReports);
      setPenanganan(rPenanganan.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const rawUser = localStorage.getItem('sipeka_user');
    const tok = getToken();
    if (!tok || !rawUser) { navigate('/login'); return; }
    setUser(JSON.parse(rawUser));
    fetchAll(tok);
  }, [navigate, fetchAll]);

  const openDetailLaporan = (laporan) => {
    setSelectedLaporan(laporan);
    setSelectedMetode('');
    setKeterangan('');
    setTanggalPenanganan(new Date().toISOString().split('T')[0]);
    setShowDetailModal(true);
  };

  const openKlasifikasiModal = () => {
    setShowDetailModal(false);
    setTimeout(() => setShowMetodeModal(true), 300);
  };

  const submitPenanganan = async () => {
    if (!selectedMetode) return alert('Pilih metode penanganan terlebih dahulu.');
    setSubmitting(true);
    try {
      await axios.post(`${API_CASE}/penanganan`, {
        laporan_id:        String(selectedLaporan.id || selectedLaporan._id),
        kode_laporan:      selectedLaporan.kode_laporan,
        metode:            selectedMetode,
        keterangan,
        tanggal_penanganan: tanggalPenanganan,
      }, { headers: { Authorization: `Bearer ${getToken()}` } });
      setShowMetodeModal(false);
      await fetchAll(getToken());
      setActiveMenu('hasil-klasifikasi');
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan penanganan.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Kelola Metode helpers ── */
  const openTambahMetode = () => {
    setEditingMetode(null);
    setInpMetodeNama('');
    setInpMetodeDesc('');
    setShowMetodeMasterModal(true);
  };

  const openEditMetode = (m) => {
    setEditingMetode(m);
    setInpMetodeNama(m.nama);
    setInpMetodeDesc(m.deskripsi);
    setShowMetodeMasterModal(true);
  };

  const saveMetode = () => {
    if (!inpMetodeNama.trim()) return alert('Nama metode tidak boleh kosong.');
    if (editingMetode) {
      setMetodeList(prev => prev.map(m =>
        m.id === editingMetode.id ? { ...m, nama: inpMetodeNama.trim(), deskripsi: inpMetodeDesc.trim() } : m
      ));
    } else {
      const newId = Date.now();
      setMetodeList(prev => [...prev, { id: newId, nama: inpMetodeNama.trim(), deskripsi: inpMetodeDesc.trim() }]);
    }
    setShowMetodeMasterModal(false);
  };

  const hapusMetode = (id) => {
    if (!window.confirm('Hapus metode ini?')) return;
    setMetodeList(prev => prev.filter(m => m.id !== id));
  };

  const handleLogout = () => {
    if (!window.confirm('Keluar dari dashboard?')) return;
    localStorage.removeItem('sipeka_token');
    localStorage.removeItem('sipeka_user');
    navigate('/login');
  };

  const goTo = (id) => {
    setActiveMenu(id);
    fetchAll(getToken());
  };

  if (!user) return null;

  const laporanMasuk    = reports.filter(r => r.status === 'diteruskan_dp3a');
  const sedangDitangani = reports.filter(r => r.status === 'sedang_ditangani');
  const totalPenanganan = penanganan.length;
  const tgl = new Date().toLocaleDateString('id-ID', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  /* Sebaran per jenis kekerasan dari semua laporan */
  const allKlasifikasi = reports;
  const jenisGroups = ['Fisik','Psikis','Seksual','Penelantaran'];
  const jenisCount = jenisGroups.map(j => ({
    label: `Kekerasan ${j}`,
    count: allKlasifikasi.filter(r => r.jenis_kekerasan?.toLowerCase().includes(j.toLowerCase())).length,
  }));
  const totalJenis = allKlasifikasi.length || 1;

  /* Progress bar colors */
  const progressColors = ['var(--biru-utama)','#3b82f6','#ef4444','#f59e0b'];

  /* Recent klasifikasi */
  const recentKlas = [...penanganan].reverse().slice(0, 3);

  const metodeStats = METODE_LIST.map(m => ({
    ...m,
    count: penanganan.filter(p => p.metode === m.nama).length,
  }));

  return (
    <div className="dp3a-body" style={{ display:'flex', minHeight:'100vh' }}>
      <style>{style}</style>

      {/* ── SIDEBAR ── */}
      <div className="dp3a-sidebar">
        <div className="brand">
          <h6><i className="bi bi-shield-fill-check me-2" style={{ color:'#60a5fa' }}></i>SIPEKA DP3A</h6>
          <small style={{ color:'rgba(255,255,255,0.5)', fontSize:'.78rem' }}>Kota Kendari</small>
        </div>

        <nav style={{ marginTop:'1rem', flex:1 }}>
          {MENU_ITEMS.map(item => (
            <div key={item.id}
              className={`dp3a-nav-link${activeMenu === item.id ? ' active' : ''}`}
              onClick={() => goTo(item.id)}>
              <i className={`bi ${item.icon}`}></i>
              {item.label}
              {item.id === 'laporan-masuk' && laporanMasuk.length > 0 && (
                <span className="badge bg-warning text-dark ms-auto" style={{ fontSize:'.7rem' }}>
                  {laporanMasuk.length}
                </span>
              )}
            </div>
          ))}
        </nav>

        <div style={{ padding:'1rem 1.25rem', borderTop:'1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ color:'rgba(255,255,255,0.7)', fontSize:'.8rem', marginBottom:'.75rem', display:'flex', alignItems:'center', gap:'.5rem' }}>
            <i className="bi bi-person-circle"></i>{user.name}
          </div>
          <button className="btn btn-sm w-100 fw-semibold"
            style={{ background:'rgba(255,255,255,0.1)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)' }}
            onClick={handleLogout}>
            <i className="bi bi-box-arrow-right me-2"></i>Keluar
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="dp3a-main" style={{ flex:1, minWidth:0 }}>
        <div className="dp3a-topbar">
          <h5 className="fw-bold m-0" id="page-title">
            {MENU_ITEMS.find(m => m.id === activeMenu)?.label || 'Dashboard'}
          </h5>
          <span className="text-muted small">{tgl}</span>
        </div>

        {/* ══ BERANDA ══ */}
        {activeMenu === 'beranda' && (
          <div>
            {/* Stat Cards */}
            <div className="row g-3 mb-4">
              {[
                { icon:'bi-inbox',        lbl:'LAPORAN BARU',    num: laporanMasuk.length },
                { icon:'bi-check-circle', lbl:'DIPROSES',        num: sedangDitangani.length },
                { icon:'bi-geo-alt',      lbl:'WILAYAH',         num: 64 },
                { icon:'bi-people',       lbl:'TOTAL KASUS',     num: totalPenanganan },
              ].map((s, i) => (
                <div key={i} className="col-6 col-md-3">
                  <div className="dp3a-stat-card">
                    <div className="d-flex align-items-center gap-3">
                      <div className="dp3a-stat-icon"><i className={`bi ${s.icon}`}></i></div>
                      <div>
                        <div className="small text-muted fw-bold">{s.lbl}</div>
                        <div className="h4 m-0 fw-bold">{s.num}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="row g-4">
              {/* Sebaran Jenis Kekerasan */}
              <div className="col-lg-6">
                <div className="dp3a-card p-4 h-100">
                  <h6 className="fw-bold mb-4">
                    <i className="bi bi-bar-chart-line me-2 text-primary"></i>Sebaran Jenis Kekerasan
                  </h6>
                  {jenisCount.map((j, i) => {
                    const pct = Math.round((j.count / totalJenis) * 100) || 0;
                    return (
                      <div key={j.label}>
                        <div className="chart-label"><span>{j.label}</span><span>{pct}%</span></div>
                        <div className="custom-progress">
                          <div className="progress-fill" style={{ width:`${pct}%`, background: progressColors[i] }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Klasifikasi Terbaru */}
              <div className="col-lg-6">
                <div className="dp3a-card p-4 h-100">
                  <h6 className="fw-bold mb-4">
                    <i className="bi bi-clock-history me-2 text-primary"></i>Klasifikasi Terbaru
                  </h6>
                  {recentKlas.length === 0 ? (
                    <p className="text-muted small text-center">Belum ada data klasifikasi.</p>
                  ) : recentKlas.map(r => (
                    <div key={r._id} className="activity-item">
                      <div className="d-flex justify-content-between align-items-start">
                        <span className="fw-bold small text-primary">{r.kode_laporan}</span>
                        <span className="text-muted" style={{ fontSize:'.65rem' }}>
                          {r.tanggal_penanganan ? new Date(r.tanggal_penanganan).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' }) : '-'}
                        </span>
                      </div>
                      <div className="small text-dark mt-1">Metode: <strong>{r.metode}</strong></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ LAPORAN MASUK ══ */}
        {activeMenu === 'laporan-masuk' && (
          <div className="dp3a-card">
            <div className="dp3a-card-header">
              <span className="fw-bold">
                <i className="bi bi-inbox-fill me-2 text-primary"></i>Laporan Status: DITERUSKAN
              </span>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => fetchAll(getToken())}>
                <i className="bi bi-arrow-clockwise me-1"></i>Refresh
              </button>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <span className="spinner-border spinner-border-sm me-2"></span>Memuat...
              </div>
            ) : laporanMasuk.length === 0 ? (
              <div className="dp3a-empty">
                <i className="bi bi-inbox"></i>
                <p className="fw-semibold mb-1">Belum ada laporan yang diteruskan</p>
                <small>Laporan dengan status "Diteruskan ke DP3A" akan muncul di sini.</small>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle mb-0 dp3a-table">
                  <thead>
                    <tr>
                      <th>Kode</th>
                      <th>Korban</th>
                      <th>Jenis Kekerasan</th>
                      <th>Kelurahan</th>
                      <th className="text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {laporanMasuk.map(r => (
                      <tr key={r.id || r._id}>
                        <td><code className="text-primary fw-bold">{r.kode_laporan}</code></td>
                        <td className="fw-medium">{r.nama_korban}</td>
                        <td>
                          <span className="badge border border-primary text-primary px-2">{r.jenis_kekerasan}</span>
                        </td>
                        <td>{r.kelurahan_korban || '-'}</td>
                        <td className="text-center">
                          <button className="btn btn-sm btn-primary fw-semibold" onClick={() => openDetailLaporan(r)}>
                            Tinjau &amp; Klasifikasi
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

        {/* ══ HASIL KLASIFIKASI ══ */}
        {activeMenu === 'hasil-klasifikasi' && (
          <div className="dp3a-card">
            <div className="dp3a-card-header">
              <span className="fw-bold">
                <i className="bi bi-journal-check me-2 text-primary"></i>Laporan Terklasifikasi
              </span>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => fetchAll(getToken())}>
                <i className="bi bi-arrow-clockwise me-1"></i>Refresh
              </button>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <span className="spinner-border spinner-border-sm me-2"></span>Memuat...
              </div>
            ) : penanganan.length === 0 ? (
              <div className="dp3a-empty">
                <i className="bi bi-journal-x"></i>
                <p className="fw-semibold mb-1">Belum ada data penanganan</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle mb-0 dp3a-table">
                  <thead>
                    <tr>
                      <th>Kode</th>
                      <th>Metode Terpilih</th>
                      <th>Tgl Input</th>
                      <th>Petugas</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {penanganan.map(p => {
                      const m = METODE_LIST.find(x => x.nama === p.metode) || {};
                      return (
                        <tr key={p._id}>
                          <td><code className="text-primary fw-bold">{p.kode_laporan}</code></td>
                          <td>
                            <span className="badge border border-primary text-primary px-2">{p.metode}</span>
                          </td>
                          <td className="text-muted">
                            {p.tanggal_penanganan
                              ? new Date(p.tanggal_penanganan).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' })
                              : '-'}
                          </td>
                          <td style={{ fontSize:'.85rem' }}>{p.admin_name || '-'}</td>
                          <td>
                            <span className={`badge rounded-pill px-3 fw-semibold ${p.status === 'selesai' ? 'bg-success' : 'bg-warning text-dark'}`}
                              style={{ fontSize:'.75rem' }}>
                              {p.status === 'selesai' ? 'Selesai' : 'Sedang Proses'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══ KELOLA METODE ══ */}
        {activeMenu === 'metode' && (
          <div className="dp3a-card">
            <div className="dp3a-card-header">
              <span className="fw-bold">
                <i className="bi bi-gear-fill me-2 text-primary"></i>Master Metode Penanganan
              </span>
              <button className="btn btn-sm btn-primary px-3" onClick={openTambahMetode}>
                <i className="bi bi-plus-lg me-1"></i>Tambah Metode
              </button>
            </div>
            <div className="p-4">
              {metodeList.length === 0 ? (
                <div className="dp3a-empty">
                  <i className="bi bi-tags"></i>
                  <p className="fw-semibold">Belum ada metode</p>
                </div>
              ) : (
                metodeList.map(m => {
                  const base = METODE_LIST.find(x => x.nama === m.nama);
                  const usedCount = penanganan.filter(p => p.metode === m.nama).length;
                  return (
                    <div key={m.id} className="metode-item">
                      <div className="metode-icon-box">
                        <i className={`bi ${base?.icon || 'bi-tag-fill'}`}></i>
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-bold small">{m.nama}</div>
                        <div className="text-muted" style={{ fontSize:'.75rem' }}>{m.deskripsi}</div>
                      </div>
                      <span className="badge rounded-pill px-3 fw-semibold me-2"
                        style={{ background: base?.bg || '#f1f5f9', color: base?.color || '#374151', fontSize:'.75rem' }}>
                        {usedCount} Kasus
                      </span>
                      <button className="btn-icon edit" title="Edit" onClick={() => openEditMetode(m)}>
                        <i className="bi bi-pencil text-primary"></i>
                      </button>
                      <button className="btn-icon hapus" title="Hapus" onClick={() => hapusMetode(m.id)}>
                        <i className="bi bi-trash text-danger"></i>
                      </button>
                    </div>
                  );
                })
              )}
              <div className="alert alert-info border-0 rounded-3 small mt-3 mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Metode penanganan ditetapkan berdasarkan kebijakan DPPPA Kota Kendari.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL DETAIL LAPORAN ── */}
      {showDetailModal && selectedLaporan && (
        <div className="modal fade show d-block" style={{ background:'rgba(0,0,0,0.55)', zIndex:1050 }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content border-0 rounded-4 shadow">
              <div className="modal-header" style={{ background:'#1e3a8a', color:'#fff' }}>
                <h6 className="modal-title fw-bold">Detail Laporan</h6>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowDetailModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="row g-3">
                  <div className="col-md-6">
                    <small className="text-muted">Kode Laporan</small>
                    <div className="fw-bold font-monospace text-primary">{selectedLaporan.kode_laporan}</div>
                  </div>
                  <div className="col-md-6">
                    <small className="text-muted">Kelurahan</small>
                    <div className="fw-bold">{selectedLaporan.kelurahan_korban || '-'}</div>
                  </div>
                  <div className="col-md-6">
                    <small className="text-muted">Nama Korban</small>
                    <div className="fw-bold">{selectedLaporan.nama_korban}</div>
                  </div>
                  <div className="col-md-6">
                    <small className="text-muted">Jenis Kekerasan</small>
                    <div className="fw-bold">{selectedLaporan.jenis_kekerasan}</div>
                  </div>
                  <div className="col-12">
                    <small className="text-muted">Kronologi</small>
                    <div className="p-3 border rounded bg-light small mt-1" style={{ lineHeight:1.7 }}>
                      {selectedLaporan.kronologi || <span className="text-muted fst-italic">Tidak tersedia.</span>}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-light" onClick={() => setShowDetailModal(false)}>Tutup</button>
                <button className="btn btn-primary w-100" onClick={openKlasifikasiModal}>
                  Pilih Metode Penanganan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL TAMBAH / EDIT METODE ── */}
      {showMetodeMasterModal && (
        <div className="modal fade show d-block" style={{ background:'rgba(0,0,0,0.55)', zIndex:1070 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth:480 }}>
            <div className="modal-content border-0 rounded-4 shadow">
              <div className="modal-header border-0 pb-0">
                <h6 className="modal-title fw-bold">
                  {editingMetode ? 'Edit Metode' : 'Tambah Metode'}
                </h6>
                <button type="button" className="btn-close" onClick={() => setShowMetodeMasterModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="mb-3">
                  <label className="form-label small fw-bold">Nama Metode <span className="text-danger">*</span></label>
                  <input type="text" className="form-control"
                    placeholder="Contoh: Konsultasi"
                    value={inpMetodeNama}
                    onChange={e => setInpMetodeNama(e.target.value)} />
                </div>
                <div className="mb-0">
                  <label className="form-label small fw-bold">Deskripsi</label>
                  <textarea className="form-control" rows={3}
                    placeholder="Detail layanan..."
                    value={inpMetodeDesc}
                    onChange={e => setInpMetodeDesc(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button className="btn btn-light btn-sm" onClick={() => setShowMetodeMasterModal(false)}>Batal</button>
                <button className="btn btn-primary btn-sm px-4" onClick={saveMetode}>
                  <i className="bi bi-check-circle me-1"></i>
                  {editingMetode ? 'Simpan Perubahan' : 'Tambah Metode'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL PILIH METODE ── */}
      {showMetodeModal && selectedLaporan && (
        <div className="modal fade show d-block" style={{ background:'rgba(0,0,0,0.55)', zIndex:1060 }}>
          <div className="modal-dialog" style={{ maxWidth:540 }}>
            <div className="modal-content border-0 rounded-4 shadow">
              <div className="modal-header" style={{ background:'#1e3a8a', color:'#fff' }}>
                <div>
                  <h6 className="modal-title fw-bold mb-0">Klasifikasi Penanganan</h6>
                  <small style={{ opacity:.7 }}>{selectedLaporan.kode_laporan}</small>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowMetodeModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <p className="small text-muted mb-3">
                  Tentukan metode untuk laporan <strong>{selectedLaporan.kode_laporan}</strong>
                </p>

                {metodeList.map(m => {
                  const base = METODE_LIST.find(x => x.nama === m.nama);
                  return (
                    <div key={m.id}
                      className={`checkbox-item${selectedMetode === m.nama ? ' selected' : ''}`}
                      onClick={() => setSelectedMetode(m.nama)}>
                      <input type="checkbox" readOnly checked={selectedMetode === m.nama}
                        style={{ accentColor: base?.color || '#1a56db' }} />
                      <div>
                        <div className="small fw-bold" style={{ color: selectedMetode === m.nama ? (base?.color || '#1a56db') : '#111827' }}>
                          <i className={`bi ${base?.icon || 'bi-tag-fill'} me-1`}></i>{m.nama}
                        </div>
                        <div className="text-muted" style={{ fontSize:'.75rem', marginTop:2 }}>{m.deskripsi}</div>
                      </div>
                    </div>
                  );
                })}

                <div className="mt-4 row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Tanggal Penanganan <span className="text-danger">*</span></label>
                    <input type="date" className="form-control"
                      value={tanggalPenanganan}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={e => setTanggalPenanganan(e.target.value)} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Catatan Penanganan</label>
                    <textarea className="form-control" rows={3} style={{ resize:'none' }}
                      placeholder="Catatan tambahan..."
                      value={keterangan} onChange={e => setKeterangan(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-light btn-sm" onClick={() => setShowMetodeModal(false)} disabled={submitting}>
                  Batal
                </button>
                <button className="btn btn-success btn-sm px-4 fw-semibold" onClick={submitPenanganan} disabled={submitting}>
                  {submitting
                    ? <><span className="spinner-border spinner-border-sm me-1"></span>Menyimpan...</>
                    : <><i className="bi bi-check-circle me-1"></i>Simpan Klasifikasi</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
