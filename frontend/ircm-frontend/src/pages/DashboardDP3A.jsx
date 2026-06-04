import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../assets/logo.png';

const API_REPORT = 'http://localhost:8080/api';
const API_CASE = 'http://localhost:8080/api';

const style = `
  :root {
    --primary: #4f46e5;
    --primary-light: #eef2ff;
    --slate-50: #f8fafc;
    --slate-100: #f1f5f9;
  }
  .dp3a-body { background: var(--slate-50); font-family: 'Segoe UI', sans-serif; color: #1e293b; }
  .dp3a-sidebar { width: 260px; min-height: 100vh; background: #0f172a; position: fixed; top: 0; left: 0; z-index: 1000; display: flex; flex-direction: column; }
  .dp3a-sidebar .brand { padding: 2rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
  .dp3a-sidebar .brand h6 { color: #fff; font-weight: 800; letter-spacing: 0.5px; margin: 0; display:flex; align-items:center; gap:10px; }
  .dp3a-nav-link { color: #94a3b8; padding: 1rem 1.5rem; font-size: .95rem; font-weight: 600; display: flex; align-items: center; gap: .75rem; cursor: pointer; transition: .3s; border-radius: 0 2rem 2rem 0; margin-right: 1rem; margin-bottom: 0.25rem;}
  .dp3a-nav-link:hover, .dp3a-nav-link.active { color: #fff; background: rgba(255,255,255,0.05); }
  .dp3a-nav-link.active { color: #38bdf8; position: relative; }
  .dp3a-nav-link.active::after { content:''; position:absolute; right:0; top:20%; bottom:20%; width:3px; background:#38bdf8; border-radius:3px 0 0 3px; }
  
  .dp3a-main { margin-left: 260px; padding: 2rem; }
  .dp3a-topbar { background: transparent; padding: 0 0 2rem 0; display: flex; align-items: center; justify-content: space-between; }
  
  .bento-card { background: #fff; border-radius: 1rem; padding: 1.5rem; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); border: 1px solid var(--slate-100); margin-bottom: 1.5rem; }
  .bento-title { font-weight: 700; color: #0f172a; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 10px; font-size: 1.1rem; }
  
  .dp3a-table th { background: #f8fafc; font-size: .75rem; text-transform: uppercase; color: #64748b; padding: 1rem; border-bottom: 1px solid var(--slate-100); }
  .dp3a-table td { padding: 1.25rem 1rem; font-size: .875rem; vertical-align: middle; border-bottom: 1px solid #f8fafc; color: #334155; }
  
  .badge-soft { padding: 0.35rem 0.65rem; border-radius: 6px; font-weight: 600; font-size: 0.75rem; letter-spacing: 0.3px; }
  .badge-soft-primary { background: #eff6ff; color: #2563eb; }
  .badge-soft-danger { background: #fef2f2; color: #dc2626; }
  .badge-soft-warning { background: #fffbeb; color: #d97706; }
  .badge-soft-success { background: #f0fdf4; color: #16a34a; }

  /* Stepper */
  .stepper-container { display: flex; justify-content: space-between; position: relative; margin-bottom: 2rem; padding: 0 1rem; }
  .stepper-line { position: absolute; top: 15px; left: 5%; right: 5%; height: 2px; background: #e2e8f0; z-index: 1; }
  .stepper-line-active { position: absolute; top: 15px; left: 5%; height: 2px; background: var(--primary); z-index: 2; transition: 0.3s; }
  .stepper-item { position: relative; z-index: 3; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; width: 80px; }
  .stepper-circle { width: 32px; height: 32px; border-radius: 50%; background: #fff; border: 2px solid #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: bold; color: #94a3b8; transition: 0.3s; }
  .stepper-item.completed .stepper-circle { background: var(--primary); border-color: var(--primary); color: #fff; }
  .stepper-item.active .stepper-circle { background: var(--primary); border-color: var(--primary); color: #fff; box-shadow: 0 0 0 4px var(--primary-light); }
  .stepper-label { font-size: 0.7rem; color: #64748b; text-align: center; font-weight: 600; line-height: 1.2; }
  .stepper-item.completed .stepper-label, .stepper-item.active .stepper-label { color: #0f172a; }
  
  .action-form-box { border-radius: 0.75rem; border: 1px solid var(--primary-light); background: #fff; overflow: hidden; }
  .action-form-header { background: var(--primary-light); padding: 1rem 1.5rem; border-bottom: 1px solid #e0e7ff; }
  .action-form-body { padding: 1.5rem; }
  
  /* Analytics UI */
  .border-dashed { border-style: dashed !important; }
  .bar-chart-mini { display: flex; align-items: flex-end; gap: 1rem; height: 200px; padding-top: 1.5rem; border-bottom: 1px dashed #e2e8f0; }
  .bar-item-wrapper { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 8px; height: 100%; position: relative; z-index: 1; }
  .bar-item { width: 100%; max-width: 65px; background: var(--primary-light); border-radius: 6px 6px 2px 2px; transition: 0.3s; position: relative; cursor: pointer; }
  .bar-item:hover { background: var(--primary); }
  .bar-item:hover::after { content: attr(data-val); position: absolute; top: -25px; left: 50%; transform: translateX(-50%); font-size: 11px; font-weight: 800; color: var(--primary); background: #fff; padding: 2px 6px; border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.15); }
  .bar-label { font-size: 0.7rem; color: #64748b; text-align: center; font-weight: 600; }
  
  .donut-chart-container { display: flex; flex-direction: column; align-items: center; gap: 1.5rem; }
  .donut-svg { transform: rotate(-90deg); width: 160px; height: 160px; }
  .donut-legend { width: 100%; }
  .legend-item { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem; font-size: 0.85rem; }
  .legend-color { width: 12px; height: 12px; border-radius: 50%; display: inline-block; margin-right: 8px; }
`;

const METODE_LIST = ['Konsultasi / Mediasi', 'Psikososial', 'Bantuan Hukum'];

const MENU_ITEMS = [
  { id: 'beranda', icon: 'bi-grid-1x2-fill', label: 'Dashboard' },
  { id: 'penanganan', icon: 'bi-briefcase-fill', label: 'Penanganan Kasus' },
  { id: 'arsip', icon: 'bi-archive-fill', label: 'Arsip & Selesai' },
];

const STEP_STAGES = [
  { id: 'pengaduan', label: 'Pengaduan' },
  { id: 'penangguhan', label: 'Penangguhan' },
  { id: 'registrasi', label: 'Registrasi' },
  { id: 'assessment', label: 'Assessment' },
  { id: 'intervensi', label: 'Rencana Intervensi' },
  { id: 'monitoring', label: 'Monitoring' },
  { id: 'terminasi', label: 'Terminasi' }
];

export default function DashboardDP3A() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState('penanganan');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'detail'
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Data
  const [reports, setReports] = useState([]);
  const [kasusList, setKasusList] = useState([]);

  // Detail View State
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeAction, setActiveAction] = useState('detail');

  // Form states
  const [pesanTindakLanjut, setPesanTindakLanjut] = useState('');
  const [hasilAssessment, setHasilAssessment] = useState('');
  const [kondisiKorban, setKondisiKorban] = useState('');
  const [kebutuhanKorban, setKebutuhanKorban] = useState('');
  const [metode, setMetode] = useState('');
  const [rencana, setRencana] = useState('');
  const [catatanLog, setCatatanLog] = useState('');

  const getToken = () => localStorage.getItem('sipeka_token');

  const fetchAll = useCallback(async (tok) => {
    setLoading(true);
    try {
      const [resRep, resKas] = await Promise.all([
        axios.get(`${API_REPORT}/laporan`, { headers: { Authorization: `Bearer ${tok || getToken()}` } }),
        axios.get(`${API_CASE}/penanganan`, { headers: { Authorization: `Bearer ${tok || getToken()}` } })
      ]);
      setReports(resRep.data.data || []);
      setKasusList(resKas.data || []);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const rawUser = localStorage.getItem('sipeka_user');
    const tok = getToken();
    if (!tok || !rawUser) { navigate('/login'); return; }
    setUser(JSON.parse(rawUser));
    fetchAll(tok);
  }, [navigate, fetchAll]);

  const handleLogout = () => {
    if (!window.confirm('Keluar dari dashboard?')) return;
    localStorage.clear();
    navigate('/login');
  };

  // ACTIONS
  const submitRegistrasi = async () => {
    if (!pesanTindakLanjut) return alert('Pesan tindak lanjut wajib diisi');
    setSubmitting(true);
    try {
      await axios.post(`${API_CASE}/penanganan/registrasi`, {
        laporan_id: selectedItem._id || selectedItem.id,
        kode_laporan: selectedItem.kode_laporan,
        pesan_tindak_lanjut: pesanTindakLanjut
      }, { headers: { Authorization: `Bearer ${getToken()}` } });
      setViewMode('list');
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  const submitAssessment = async () => {
    if (!hasilAssessment) return alert('Hasil assessment wajib diisi');
    setSubmitting(true);
    try {
      await axios.put(`${API_CASE}/penanganan/${selectedItem._id}/assessment`, {
        hasil_assessment: hasilAssessment,
        kondisi_korban: kondisiKorban,
        kebutuhan_korban: kebutuhanKorban
      }, { headers: { Authorization: `Bearer ${getToken()}` } });
      setViewMode('list');
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  const submitIntervensi = async () => {
    if (!metode) return alert('Metode wajib dipilih');
    setSubmitting(true);
    try {
      await axios.put(`${API_CASE}/penanganan/${selectedItem._id}/intervensi`, {
        metode_penanganan: metode,
        rencana_tindakan: rencana
      }, { headers: { Authorization: `Bearer ${getToken()}` } });
      setViewMode('list');
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  const submitLog = async () => {
    if (!catatanLog) return alert('Catatan log wajib diisi');
    setSubmitting(true);
    try {
      await axios.post(`${API_CASE}/penanganan/${selectedItem._id}/log`, {
        catatan: catatanLog
      }, { headers: { Authorization: `Bearer ${getToken()}` } });
      setViewMode('list');
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  const selesaikanKasus = async () => {
    if (!window.confirm('Yakin ingin menutup kasus ini? Kasus akan diarsipkan dan tidak bisa diubah lagi.')) return;
    try {
      await axios.put(`${API_CASE}/penanganan/${selectedItem._id}/selesai`, {}, { headers: { Authorization: `Bearer ${getToken()}` } });
      setViewMode('list');
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  if (!user) return null;

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
      jenis_kekerasan: r.jenis_kekerasan
    };
  };

  // Combine reports and cases for the "Penanganan Kasus" active list
  const lapBaru = reports.filter(r => r.status === 'menunggu_registrasi');
  const kasAktif = kasusList.filter(k => k.status !== 'selesai').map(enrichKasus);
  
  // Array of all active items to process
  const allActiveList = [
    ...lapBaru.map(r => ({ ...r, listType: 'laporan', listStatus: 'Registrasi' })),
    ...kasAktif.map(k => {
      let st = 'Monitoring';
      if (k.status === 'registrasi') st = 'Assessment';
      else if (k.status === 'assessment') st = 'Rencana Intervensi';
      return { ...k, listType: 'kasus', listStatus: st };
    })
  ].sort((a,b) => new Date(b.createdAt || b.tanggal_registrasi) - new Date(a.createdAt || a.tanggal_registrasi));

  const kasSels = kasusList.filter(k => k.status === 'selesai').map(enrichKasus);

  // Detail Data Logic
  const detailData = selectedItem && !selectedItem.kronologi
    ? (reports.find(r => r.kode_laporan === selectedItem.kode_laporan) || selectedItem)
    : selectedItem;

  const handleProses = (item) => {
    setSelectedItem(item);
    
    // Determine action from status
    if (item.listType === 'laporan' || item.status === 'menunggu_registrasi') {
      setActiveAction('registrasi');
      setPesanTindakLanjut('');
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

  // Format Helper
  const getInitials = (name) => {
    if (!name) return '-';
    return name.split(' ').map(n => n[0]).join('.').toUpperCase() + '.';
  };

  // Determine Stepper Active Index
  let currentStepIndex = 2; // Default Registrasi
  if (activeAction === 'assessment') currentStepIndex = 3;
  if (activeAction === 'intervensi') currentStepIndex = 4;
  if (activeAction === 'monitoring') currentStepIndex = 5;
  if (activeAction === 'detail' && selectedItem?.status === 'selesai') currentStepIndex = 6;

  return (
    <div className="dp3a-body" style={{ display: 'flex', minHeight: '100vh' }}>
      <style>{style}</style>

      {/* SIDEBAR */}
      <div className="dp3a-sidebar">
        <div className="brand">
          <h6 className="d-flex align-items-center gap-2">
            <img src={logo} alt="Logo" style={{ width: '32px', height: 'auto' }} />
            UPTD PPA
          </h6>
          <small style={{ color: 'rgba(255,255,255,0.4)', fontSize: '.75rem', fontWeight: '600' }}>SIPEKA Kota Kendari</small>
        </div>
        <nav style={{ marginTop: '1.5rem', flex: 1 }}>
          {MENU_ITEMS.map(item => (
            <div key={item.id} className={`dp3a-nav-link${activeMenu === item.id && viewMode === 'list' ? ' active' : ''}`} onClick={() => { setActiveMenu(item.id); setViewMode('list'); fetchAll(); }}>
              <i className={`bi ${item.icon}`}></i> {item.label}
              {item.id === 'penanganan' && allActiveList.length > 0 && <span className="badge bg-danger text-white ms-auto rounded-pill">{allActiveList.length}</span>}
            </div>
          ))}
        </nav>
        <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button className="btn btn-sm w-100 fw-bold text-white border-secondary rounded-pill" onClick={handleLogout}><i className="bi bi-box-arrow-right me-2"></i>Keluar</button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="dp3a-main" style={{ flex: 1 }}>
        <div className="dp3a-topbar">
          <h5 className="fw-bold m-0 text-dark">
            {viewMode === 'detail' ? 'Detail Laporan' : MENU_ITEMS.find(m => m.id === activeMenu)?.label}
          </h5>
          <div className="dropdown">
            <button className="btn btn-white bg-white border d-flex align-items-center gap-2 rounded-pill shadow-sm dropdown-toggle" type="button" id="userDropdownDP3A" data-bs-toggle="dropdown" aria-expanded="false">
              <i className="bi bi-person-circle fs-5 text-primary"></i>
              <span className="fw-bold text-dark small">{user?.name}</span>
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-4" aria-labelledby="userDropdownDP3A">
              <li><div className="dropdown-header text-muted">Petugas: <strong>{user?.email}</strong></div></li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <button className="dropdown-item text-danger fw-bold d-flex align-items-center gap-2" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right"></i> Logout
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* LIST MODE */}
        {viewMode === 'list' && (
          <>
            {activeMenu === 'beranda' && (() => {
              const allDataForCharts = [...lapBaru, ...kasAktif, ...kasSels];
              
              // Bar Chart Data
              const jenisKasusCounts = {};
              allDataForCharts.forEach(d => {
                const k = d.jenis_kekerasan || 'Lainnya';
                jenisKasusCounts[k] = (jenisKasusCounts[k] || 0) + 1;
              });
              const jenisKasusData = Object.entries(jenisKasusCounts).sort((a,b) => b[1] - a[1]).slice(0,4);
              const maxJenisKasus = Math.max(...jenisKasusData.map(d => d[1]), 10);

              // Donut Chart Data
              let anakPr = 0, anakLk = 0, dewasaPr = 0;
              allDataForCharts.forEach(d => {
                const u = parseInt(d.usia_korban) || 0;
                const jk = (d.jenis_kelamin || '').toLowerCase();
                if (u < 18) {
                  if (jk === 'perempuan') anakPr++;
                  else anakLk++;
                } else {
                  if (jk === 'perempuan') dewasaPr++;
                }
              });
              const totalDemo = anakPr + anakLk + dewasaPr || 1;
              const donutData = [
                { label: 'Perempuan Dewasa', value: dewasaPr, color: '#3b82f6', percent: (dewasaPr/totalDemo)*100 },
                { label: 'Anak Perempuan', value: anakPr, color: '#ec4899', percent: (anakPr/totalDemo)*100 },
                { label: 'Anak Laki-laki', value: anakLk, color: '#f59e0b', percent: (anakLk/totalDemo)*100 },
              ];
              let cumulativeDash = 0;

              return (
                <>
                  <div className="row g-3 mb-4">
                    <div className="col-md-3">
                      <div className="bento-card mb-0 d-flex align-items-center gap-3">
                        <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width:'48px', height:'48px', background: '#eff6ff', color: '#2563eb' }}>
                          <i className="bi bi-file-earmark-text fs-4"></i>
                        </div>
                        <div>
                          <div className="small text-muted fw-bold">Total Laporan</div>
                          <div className="h4 m-0 fw-bold text-dark">{allDataForCharts.length}</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="bento-card mb-0 d-flex align-items-center gap-3">
                        <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width:'48px', height:'48px', background: '#fef2f2', color: '#dc2626' }}>
                          <i className="bi bi-exclamation-circle fs-4"></i>
                        </div>
                        <div>
                          <div className="small text-muted fw-bold">Pengaduan Baru</div>
                          <div className="h4 m-0 fw-bold text-dark">{lapBaru.length}</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="bento-card mb-0 d-flex align-items-center gap-3">
                        <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width:'48px', height:'48px', background: '#fffbeb', color: '#d97706' }}>
                          <i className="bi bi-briefcase fs-4"></i>
                        </div>
                        <div>
                          <div className="small text-muted fw-bold">Sedang Diproses</div>
                          <div className="h4 m-0 fw-bold text-dark">{kasAktif.length}</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="bento-card mb-0 d-flex align-items-center gap-3">
                        <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width:'48px', height:'48px', background: '#f0fdf4', color: '#16a34a' }}>
                          <i className="bi bi-check-circle fs-4"></i>
                        </div>
                        <div>
                          <div className="small text-muted fw-bold">Selesai / Terminasi</div>
                          <div className="h4 m-0 fw-bold text-dark">{kasSels.length}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="row g-4 mb-4">
                    <div className="col-lg-8">
                      <div className="bento-card h-100">
                        <div className="fw-bold mb-4">Tren Jenis Kasus Tahun Ini</div>
                        <div className="bar-chart-mini position-relative">
                          {/* Y-Axis lines */}
                          <div className="position-absolute w-100 h-100" style={{ zIndex: 0, left: 0, top: 0, pointerEvents: 'none', display: 'flex', flexDirection: 'column' }}>
                            <div className="border-bottom border-dashed" style={{ flex: 1, opacity: 0.5 }}></div>
                            <div className="border-bottom border-dashed" style={{ flex: 1, opacity: 0.5 }}></div>
                            <div className="border-bottom border-dashed" style={{ flex: 1, opacity: 0.5 }}></div>
                          </div>
                          {jenisKasusData.map(([label, val], idx) => (
                            <div key={idx} className="bar-item-wrapper">
                              <div className="bar-item" style={{ height: `${(val/maxJenisKasus)*100}%` }} data-val={val}></div>
                              <div className="bar-label">{label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-4">
                      <div className="bento-card h-100">
                        <div className="fw-bold mb-4">Demografi Korban</div>
                        <div className="donut-chart-container">
                          <svg className="donut-svg" viewBox="0 0 160 160">
                            <circle cx="80" cy="80" r="65" fill="transparent" stroke="#f1f5f9" strokeWidth="20" />
                            {donutData.map((d, i) => {
                              const dashLength = (d.percent / 100) * 408.4;
                              const offset = -cumulativeDash;
                              cumulativeDash += dashLength;
                              if (d.value === 0) return null;
                              return (
                                <circle key={i} cx="80" cy="80" r="65" fill="transparent" stroke={d.color} strokeWidth="20" strokeDasharray={`${dashLength} 408.4`} strokeDashoffset={offset} style={{ transition: '0.3s' }} />
                              );
                            })}
                          </svg>
                          <div className="donut-legend">
                            {donutData.map((d, i) => (
                              <div key={i} className="legend-item">
                                <div><span className="legend-color" style={{ backgroundColor: d.color }}></span> <span className="text-muted">{d.label}</span></div>
                                <div className="fw-bold">{d.value}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bento-card">
                    <h6 className="fw-bold mb-4">Aktivitas Laporan Terbaru</h6>
                    <div className="table-responsive">
                      <table className="table dp3a-table mb-0">
                        <thead>
                          <tr>
                            <th>ID & Tanggal</th>
                            <th>Inisial Korban</th>
                            <th>Jenis Kasus</th>
                            <th>Status Terakhir</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allActiveList.slice(0,5).map(item => (
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
              <div className="bento-card">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h6 className="fw-bold m-0">Daftar Kasus Menunggu Penanganan</h6>
                  <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-2">{allActiveList.length} Data</span>
                </div>
                
                {allActiveList.length === 0 ? <div className="text-center py-5 text-muted">Belum ada data kasus aktif.</div> : (
                  <div className="table-responsive">
                    <table className="table dp3a-table mb-0">
                      <thead>
                        <tr>
                          <th>ID Laporan</th>
                          <th>Pelapor (Inisial)</th>
                          <th>Korban (Inisial)</th>
                          <th>Tahap Saat Ini</th>
                          <th>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allActiveList.map(item => (
                          <tr key={item.id || item._id}>
                            <td>
                              <div className="fw-bold text-dark">{item.kode_laporan}</div>
                              <div className="small text-muted">{new Date(item.createdAt || item.tanggal_registrasi).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                            </td>
                            <td><span className="fw-semibold">{getInitials(item.nama_pelapor || (item.anonim ? 'Anonim' : '-'))}</span></td>
                            <td><span className="fw-semibold">{getInitials(item.nama_korban)}</span> <span className="small text-muted">({item.jenis_kelamin?.charAt(0)})</span></td>
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
              <div className="bento-card">
                <h6 className="fw-bold mb-4">Arsip Kasus Selesai</h6>
                {kasSels.length === 0 ? <div className="text-center py-5 text-muted">Arsip kosong</div> : (
                  <div className="table-responsive">
                    <table className="table dp3a-table mb-0">
                      <thead>
                        <tr>
                          <th>ID Laporan</th>
                          <th>Tgl Selesai</th>
                          <th>Korban</th>
                          <th>Metode Penanganan</th>
                          <th>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {kasSels.map(k => (
                          <tr key={k._id}>
                            <td><div className="fw-bold text-dark">{k.kode_laporan}</div></td>
                            <td className="small text-muted fw-semibold">{new Date(k.tanggal_selesai).toLocaleDateString('id-ID')}</td>
                            <td>
                              <div className="fw-bold">{getInitials(k.nama_korban)}</div>
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
                          <label className="small text-muted d-block mb-1">No. Telp Pelapor (Untuk Verifikasi)</label>
                          <span className="fw-bold text-primary">{detailData.anonim ? '-' : (detailData.telepon_pelapor || '-')}</span>
                        </div>
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
                        <a href="#!" className="text-primary text-decoration-none fw-semibold"><i className="bi bi-file-earmark-pdf me-1"></i> {detailData.bukti_file || 'Tidak ada file bukti'}</a>
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
