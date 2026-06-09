import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../assets/logo.png';

const API_REPORT = 'http://localhost:8080/api';
const API_CASE = 'http://localhost:8080/api';

import './Dashboard.css';

const METODE_LIST = ['Konsultasi / Mediasi', 'Psikososial', 'Bantuan Hukum'];

const MENU_ITEMS = [
  { id: 'beranda', icon: 'bi-grid-1x2-fill', label: 'Dashboard' },
  { id: 'penanganan', icon: 'bi-briefcase-fill', label: 'Penanganan Kasus' },
  { id: 'arsip', icon: 'bi-archive-fill', label: 'Arsip & Selesai' },
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
  let detailData = null;
  if (selectedItem) {
    const reportMatch = reports.find(r => r.kode_laporan === selectedItem.kode_laporan) || {};
    const caseMatch = kasusList.find(k => k.kode_laporan === selectedItem.kode_laporan) || {};
    detailData = { ...reportMatch, ...caseMatch, ...selectedItem };
  }

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
  let currentStepIndex = 1; // Default Registrasi
  if (activeAction === 'assessment') currentStepIndex = 2;
  if (activeAction === 'intervensi') currentStepIndex = 3;
  if (activeAction === 'monitoring') currentStepIndex = 4;
  if (activeAction === 'detail' && selectedItem?.status === 'selesai') currentStepIndex = 5;

  return (
    <div className="dashboard-body" style={{ display: 'flex', minHeight: '100vh' }}>

      {/* SIDEBAR */}
      <div className="dashboard-sidebar">
        <div className="brand">
          <h6 className="d-flex align-items-center gap-2">
            <img src={logo} alt="Logo" style={{ width: '32px', height: 'auto' }} />
            UPTD PPA
          </h6>
          <small style={{ color: 'rgba(255,255,255,0.4)', fontSize: '.75rem', fontWeight: '600' }}>SIPEKA Kota Kendari</small>
        </div>
        <nav style={{ marginTop: '1.5rem', flex: 1 }}>
          {MENU_ITEMS.map(item => (
            <div key={item.id} className={`dashboard-nav-link${activeMenu === item.id && viewMode === 'list' ? ' active' : ''}`} onClick={() => { setActiveMenu(item.id); setViewMode('list'); fetchAll(); }}>
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
      <div className="dashboard-main" style={{ flex: 1 }}>
        <div className="dashboard-topbar">
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
                    <table className="table dashboard-table mb-0">
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
                    <table className="table dashboard-table mb-0">
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
                        {!detailData.bukti_file ? (
                          <span className="text-muted fst-italic">Tidak ada lampiran bukti</span>
                        ) : (
                          <div className="mt-2 border rounded p-2 bg-light text-center">
                            {detailData.bukti_file.toLowerCase().match(/\.(jpeg|jpg|gif|png)$/) ? (
                              <a href={`http://localhost:8080/${detailData.bukti_file}`} target="_blank" rel="noreferrer">
                                <img src={`http://localhost:8080/${detailData.bukti_file}`} alt="Bukti Terlampir" className="img-fluid rounded border" style={{ maxHeight: '300px', objectFit: 'contain' }} />
                              </a>
                            ) : detailData.bukti_file.toLowerCase().endsWith('.pdf') ? (
                              <div className="d-flex align-items-center justify-content-center gap-3 p-3">
                                <i className="bi bi-file-earmark-pdf-fill text-danger" style={{ fontSize: '3rem' }}></i>
                                <div className="text-start">
                                  <a href={`http://localhost:8080/${detailData.bukti_file}`} target="_blank" rel="noreferrer" className="fw-bold text-primary text-decoration-none d-block fs-5">Lihat Dokumen PDF</a>
                                  <small className="text-muted">{detailData.bukti_file.split('/').pop()}</small>
                                </div>
                              </div>
                            ) : (
                              <a href={`http://localhost:8080/${detailData.bukti_file}`} target="_blank" rel="noreferrer" className="btn btn-outline-primary fw-semibold mt-2"><i className="bi bi-file-earmark-arrow-down me-2"></i> Unduh File Lampiran</a>
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

              {/* RIWAYAT TAHAPAN (Muncul jika Assessment / Intervensi sudah diisi) */}
              {(detailData.hasil_assessment || detailData.metode_penanganan) && (
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
                        <div className="col-12 pb-2">
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
