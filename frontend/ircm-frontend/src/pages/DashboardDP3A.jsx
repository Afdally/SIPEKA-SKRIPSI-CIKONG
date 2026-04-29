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
  .dp3a-nav-link { color: #94a3b8; padding: 1rem 1.5rem; font-size: .9rem; font-weight: 500; display: flex; align-items: center; gap: .75rem; cursor: pointer; transition: .3s; }
  .dp3a-nav-link:hover, .dp3a-nav-link.active { color: #fff; background: rgba(255,255,255,0.05); }
  .dp3a-nav-link.active { color: #38bdf8; position: relative; }
  .dp3a-nav-link.active::after { content:''; position:absolute; right:0; top:20%; bottom:20%; width:3px; background:#38bdf8; border-radius:3px 0 0 3px; }
  
  .dp3a-main { margin-left: 260px; padding: 2rem; }
  .dp3a-topbar { background: transparent; padding: 0 0 2rem 0; display: flex; align-items: center; justify-content: space-between; }
  
  /* Bento UI Style */
  .bento-card { background: #fff; border-radius: 1.5rem; padding: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); border: 1px solid var(--slate-100); margin-bottom: 1.5rem; }
  .bento-title { font-weight: 700; color: #0f172a; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 10px; font-size: 1.1rem; }
  
  .bento-stat-card { background: #fff; border-radius: 1.25rem; padding: 1.5rem; border: 1px solid var(--slate-100); display:flex; align-items:center; gap:16px; transition: .3s; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
  .bento-stat-card:hover { transform: translateY(-3px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); border-color: var(--primary); }
  .bento-stat-icon { width: 52px; height: 52px; border-radius: 1rem; background: var(--primary-light); color: var(--primary); display:flex; align-items:center; justify-content:center; font-size: 1.5rem; }
  
  .dp3a-table th { background: #f9fafb; font-size: .75rem; text-transform: uppercase; color: #64748b; padding: 1rem; border-bottom: 1px solid var(--slate-100); }
  .dp3a-table td { padding: 1.25rem 1rem; font-size: .875rem; vertical-align: middle; border-bottom: 1px solid #f8fafc; color: #334155; }
  
  .badge-soft { padding: 0.5rem 0.75rem; border-radius: 8px; font-weight: 600; font-size: 0.7rem; letter-spacing: 0.3px; text-transform: uppercase; }
  .badge-soft-primary { background: #e0e7ff; color: #4338ca; }
  .badge-soft-danger { background: #fee2e2; color: #b91c1c; }
  .badge-soft-warning { background: #fef3c7; color: #92400e; }
  .badge-soft-success { background: #dcfce7; color: #166534; }

  .btn-logout:hover { background-color: #ef4444 !important; color: white !important; }
`;

const METODE_LIST = ['Konsultasi / Mediasi', 'Psikososial', 'Bantuan Hukum'];

const MENU_ITEMS = [
  { id: 'beranda', icon: 'bi-grid-1x2-fill', label: 'Beranda' },
  { id: 'laporan-masuk', icon: 'bi-inbox-fill', label: 'Laporan Keseluruhan' },
  { id: 'assessment', icon: 'bi-clipboard-check', label: 'Proses Assessment' },
  { id: 'penanganan', icon: 'bi-activity', label: 'Dalam Penanganan' },
  { id: 'arsip', icon: 'bi-archive-fill', label: 'Arsip Kasus' },
];

export default function DashboardDP3A() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState('beranda');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Data
  const [reports, setReports] = useState([]);
  const [kasusList, setKasusList] = useState([]);

  // Modals state
  const [showRegModal, setShowRegModal] = useState(false);
  const [showAssModal, setShowAssModal] = useState(false);
  const [showIntModal, setShowIntModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null); // bisa laporan atau kasus

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
      setShowRegModal(false);
      fetchAll();
      setActiveMenu('assessment');
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
      setShowAssModal(false);
      fetchAll();
      setActiveMenu('penanganan');
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
      setShowIntModal(false);
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
      setShowLogModal(false);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  const selesaikanKasus = async (id) => {
    if (!window.confirm('Yakin ingin menutup kasus ini? Kasus akan diarsipkan dan tidak bisa diubah lagi.')) return;
    try {
      await axios.put(`${API_CASE}/penanganan/${id}/selesai`, {}, { headers: { Authorization: `Bearer ${getToken()}` } });
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  if (!user) return null;

  // Filtered Data
  const lapBaru = reports.filter(r => r.status === 'menunggu_registrasi');
  const kasAss = kasusList.filter(k => k.status === 'registrasi'); // Butuh assessment
  const kasInt = kasusList.filter(k => k.status === 'assessment' || k.status === 'penanganan');
  const kasSels = kasusList.filter(k => k.status === 'selesai');

  // Helper untuk mendapatkan data laporan utuh
  const detailData = selectedItem && !selectedItem.kronologi
    ? (reports.find(r => r.kode_laporan === selectedItem.kode_laporan) || selectedItem)
    : selectedItem;

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
          <small style={{ color: 'rgba(255,255,255,0.4)', fontSize: '.75rem', fontWeight: '600' }}>Petugas Penanganan</small>
        </div>
        <nav style={{ marginTop: '1.5rem', flex: 1 }}>
          {MENU_ITEMS.map(item => (
            <div key={item.id} className={`dp3a-nav-link${activeMenu === item.id ? ' active' : ''}`} onClick={() => { setActiveMenu(item.id); fetchAll(); }}>
              <i className={`bi ${item.icon}`}></i> {item.label}
              {item.id === 'laporan-masuk' && lapBaru.length > 0 && <span className="badge bg-danger ms-auto rounded-pill">{lapBaru.length}</span>}
              {item.id === 'assessment' && kasAss.length > 0 && <span className="badge bg-warning text-dark ms-auto rounded-pill">{kasAss.length}</span>}
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
          <h5 className="fw-bold m-0 text-dark">{MENU_ITEMS.find(m => m.id === activeMenu)?.label}</h5>
          <div className="dropdown">
            <button className="btn btn-light d-flex align-items-center gap-2 border-0 bg-transparent shadow-none dropdown-toggle" type="button" id="userDropdownDP3A" data-bs-toggle="dropdown" aria-expanded="false">
              <i className="bi bi-person-circle fs-4 text-primary"></i>
              <span className="fw-bold text-dark">{user?.name}</span>
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

        {/* BERANDA */}
        {activeMenu === 'beranda' && (
          <>
            <div className="row g-3">
              {[
                { icon: 'bi-inbox', lbl: 'Menunggu Registrasi', num: lapBaru.length, color: '#ef4444' },
                { icon: 'bi-clipboard', lbl: 'Perlu Assessment', num: kasAss.length, color: '#f59e0b' },
                { icon: 'bi-activity', lbl: 'Dalam Penanganan', num: kasInt.length, color: '#3b82f6' },
                { icon: 'bi-check-circle', lbl: 'Kasus Selesai', num: kasSels.length, color: '#10b981' },
              ].map((s, i) => (
                <div key={i} className="col-md-3">
                  <div className="bento-stat-card">
                    <div className="bento-stat-icon" style={{ background: `${s.color}15`, color: s.color }}>
                      <i className={`bi ${s.icon}`}></i>
                    </div>
                    <div>
                      <div className="small text-muted fw-bold">{s.lbl}</div>
                      <div className="h4 m-0 fw-bold" style={{ color: '#1e293b' }}>{s.num}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bento-card mt-4">
              <div className="bento-title">
                <i className="bi bi-exclamation-circle-fill text-danger"></i>
                <span>Laporan Masuk (Menunggu Registrasi)</span>
              </div>
              {lapBaru.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-inbox fs-1 text-muted opacity-25"></i>
                  <p className="text-muted mt-2">Tidak ada laporan baru saat ini</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table dp3a-table mb-0">
                    <thead>
                      <tr>
                        <th>Kode Laporan</th>
                        <th>Korban</th>
                        <th>Wilayah</th>
                        <th>Kekerasan</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lapBaru.map(r => (
                        <tr key={r.id || r._id}>
                          <td><code className="fw-bold text-primary" style={{ fontSize: '0.9rem' }}>{r.kode_laporan}</code></td>
                          <td>
                            <div className="fw-bold text-dark">{r.nama_korban}</div>
                            <div className="text-muted small">{r.usia_korban} tahun • {r.jenis_kelamin}</div>
                          </td>
                          <td>{r.kelurahan_korban}</td>
                          <td><span className="badge-soft badge-soft-primary">{r.jenis_kekerasan}</span></td>
                          <td>
                            <div className="d-flex gap-2">
                              <button className="btn btn-sm btn-light border" onClick={() => { setSelectedItem(r); setShowDetailModal(true); }}>
                                <i className="bi bi-eye"></i>
                              </button>
                              <button className="btn btn-sm btn-primary rounded-pill px-3 fw-bold" onClick={() => { setSelectedItem(r); setPesanTindakLanjut(''); setShowRegModal(true); }}>
                                Registrasi
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* LAPORAN KESELURUHAN */}
        {activeMenu === 'laporan-masuk' && (
          <div className="bento-card">
            <div className="bento-title">
              <i className="bi bi-inboxes-fill text-primary"></i>
              <span>Seluruh Laporan Masuk</span>
            </div>
            {reports.length === 0 ? <div className="dp3a-empty"><p>Belum ada data laporan</p></div> : (
              <div className="table-responsive">
                <table className="table dp3a-table mb-0">
                  <thead>
                    <tr>
                      <th>Kode</th>
                      <th>Tgl Melapor</th>
                      <th>Korban</th>
                      <th>Wilayah</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map(r => (
                      <tr key={r.id || r._id}>
                        <td><code className="fw-bold text-primary">{r.kode_laporan}</code></td>
                        <td className="small fw-semibold text-muted">
                          {r.createdAt ? new Date(r.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                        </td>
                        <td>
                          <div className="fw-bold text-dark">{r.nama_korban}</div>
                          <div className="text-muted small">{r.usia_korban} thn • {r.jenis_kelamin}</div>
                        </td>
                        <td>{r.kelurahan_korban}</td>
                        <td>
                          <span className={`badge-soft ${
                            r.status === 'selesai' ? 'badge-soft-success' : 
                            r.status === 'menunggu_registrasi' ? 'badge-soft-danger' : 'badge-soft-warning'
                          }`}>
                            {r.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-light border" onClick={() => { setDetailData(r); setShowDetailModal(true); }}>
                              <i className="bi bi-eye"></i>
                            </button>
                            {r.status === 'menunggu_registrasi' && (
                              <button className="btn btn-sm btn-primary rounded-pill px-3 fw-bold" onClick={() => { setSelectedItem(r); setPesanTindakLanjut(''); setShowRegModal(true); }}>
                                Registrasi
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ASSESSMENT */}
        {activeMenu === 'assessment' && (
          <div className="bento-card">
            <div className="bento-title">
              <i className="bi bi-clipboard-check text-warning"></i>
              <span>Kasus Menunggu Assessment</span>
            </div>
            {kasAss.length === 0 ? <div className="dp3a-empty"><p>Belum ada kasus menunggu assessment</p></div> : (
              <div className="table-responsive">
                <table className="table dp3a-table mb-0">
                  <thead>
                    <tr>
                      <th>Kode Laporan</th>
                      <th>Korban</th>
                      <th>Tgl Registrasi</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kasAss.map(k => (
                      <tr key={k._id}>
                        <td><code className="fw-bold text-primary">{k.kode_laporan}</code></td>
                        <td>
                          <div className="fw-bold text-dark">{k.nama_korban}</div>
                          <div className="text-muted small">{k.usia_korban} thn • {k.jenis_kelamin}</div>
                        </td>
                        <td>{new Date(k.tanggal_registrasi).toLocaleDateString('id-ID')}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-light border" onClick={() => { setSelectedItem(k); setShowDetailModal(true); }}>
                              <i className="bi bi-eye"></i>
                            </button>
                            <button className="btn btn-sm btn-warning rounded-pill px-3 fw-bold text-dark" onClick={() => { setSelectedItem(k); setHasilAssessment(''); setKondisiKorban(''); setKebutuhanKorban(''); setShowAssModal(true); }}>
                              Input Assessment
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* DALAM PENANGANAN */}
        {activeMenu === 'penanganan' && (
          <div className="bento-card">
            <div className="bento-title">
              <i className="bi bi-activity text-info"></i>
              <span>Kasus Dalam Penanganan Aktif</span>
            </div>
            {kasInt.length === 0 ? <div className="dp3a-empty"><p>Tidak ada kasus dalam penanganan</p></div> : (
              <div className="table-responsive">
                <table className="table dp3a-table mb-0">
                  <thead>
                    <tr>
                      <th>Kode</th>
                      <th>Status</th>
                      <th>Metode</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kasInt.map(k => (
                      <tr key={k._id}>
                        <td><code className="fw-bold text-primary">{k.kode_laporan}</code></td>
                        <td><span className="badge-soft badge-soft-warning">{k.status.replace('_', ' ')}</span></td>
                        <td><span className="fw-semibold">{k.metode_penanganan || '-'}</span></td>
                        <td>
                          {k.status === 'assessment' ? (
                            <button className="btn btn-sm btn-primary rounded-pill px-4 fw-bold" onClick={() => { setSelectedItem(k); setMetode(''); setRencana(''); setShowIntModal(true); }}>Tentukan Metode</button>
                          ) : (
                            <div className="d-flex gap-2">
                              <button className="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-bold" onClick={() => { setSelectedItem(k); setCatatanLog(''); setShowLogModal(true); }}>+ Log</button>
                              <button className="btn btn-sm btn-success rounded-pill px-3 fw-bold" onClick={() => selesaikanKasus(k._id)}>Selesaikan</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ARSIP */}
        {activeMenu === 'arsip' && (
          <div className="bento-card">
            <div className="bento-title">
              <i className="bi bi-archive-fill text-secondary"></i>
              <span>Arsip Kasus Selesai</span>
            </div>
            {kasSels.length === 0 ? <div className="dp3a-empty"><p>Arsip kosong</p></div> : (
              <div className="table-responsive">
                <table className="table dp3a-table mb-0">
                  <thead>
                    <tr>
                      <th>Kode Laporan</th>
                      <th>Metode Penanganan</th>
                      <th>Tanggal Selesai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kasSels.map(k => (
                      <tr key={k._id}>
                        <td><code className="fw-bold text-primary">{k.kode_laporan}</code></td>
                        <td><span className="fw-bold">{k.metode_penanganan}</span></td>
                        <td className="text-muted fw-semibold">{new Date(k.tanggal_selesai).toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric' })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODALS */}
      {/* Detail Laporan Modal */}
      {showDetailModal && detailData && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Detail Laporan: {detailData.kode_laporan}</h5>
                <button type="button" className="btn-close" onClick={() => setShowDetailModal(false)}></button>
              </div>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <h6 className="fw-bold border-bottom pb-2 text-primary">Data Pelapor</h6>
                    {detailData.anonim ? (
                      <p className="text-muted fst-italic">Pelapor memilih Anonim (Identitas Dirahasiakan)</p>
                    ) : (
                      <>
                        <p className="mb-1"><strong>Nama:</strong> {detailData.nama_pelapor || '-'}</p>
                        <p className="mb-1"><strong>Telepon:</strong> {detailData.telepon_pelapor || '-'}</p>
                        <p className="mb-1"><strong>Hubungan dg Korban:</strong> {detailData.hubungan_korban || '-'}</p>
                      </>
                    )}
                  </div>
                  <div className="col-md-6">
                    <h6 className="fw-bold border-bottom pb-2 text-primary">Data Korban</h6>
                    <p className="mb-1"><strong>Nama:</strong> {detailData.nama_korban}</p>
                    <p className="mb-1"><strong>Usia:</strong> {detailData.usia_korban} tahun</p>
                    <p className="mb-1"><strong>Jenis Kelamin:</strong> {detailData.jenis_kelamin}</p>
                    <p className="mb-1"><strong>Kelurahan:</strong> {detailData.kelurahan_korban}</p>
                    <p className="mb-1"><strong>Alamat Lengkap:</strong> {detailData.alamat_korban}</p>
                  </div>
                  <div className="col-12 mt-3">
                    <h6 className="fw-bold border-bottom pb-2 text-primary">Detail Kejadian</h6>
                    <p className="mb-1"><strong>Jenis Kekerasan:</strong> {detailData.jenis_kekerasan}</p>
                    <p className="mb-1">
                      <strong>Tanggal Kejadian:</strong>{' '}
                      {(() => {
                        const d = new Date(detailData.tanggal_kejadian);
                        return isNaN(d.getTime()) ? '-' : (detailData.tanggal_kejadian_format || d.toLocaleDateString('id-ID'));
                      })()}
                    </p>
                    <p className="mb-1"><strong>Lokasi Kejadian:</strong> {detailData.lokasi_kejadian}</p>
                    <p className="mb-1">
                      <strong>Preferensi Layanan:</strong>{' '}
                      <span className={`badge ${detailData.preferensi_layanan === 'Datang ke UPTD' ? 'bg-primary' : 'bg-danger'}`}>
                        {detailData.preferensi_layanan || 'Datang ke UPTD'}
                      </span>
                    </p>
                    <p className="mb-2"><strong>Kronologi:</strong></p>
                    <div className="p-3 bg-light rounded text-dark" style={{ whiteSpace: 'pre-wrap' }}>
                      {detailData.kronologi}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>Tutup</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Registrasi Modal */}
      {showRegModal && selectedItem && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Terima Laporan {selectedItem.kode_laporan}</h5>
                <button type="button" className="btn-close" onClick={() => setShowRegModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label small fw-bold">Pesan Tindak Lanjut untuk Pelapor</label>
                  <textarea className="form-control" rows={3} placeholder="Contoh: Silakan datang ke kantor UPTD besok jam 09:00" value={pesanTindakLanjut} onChange={e => setPesanTindakLanjut(e.target.value)}></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowRegModal(false)}>Batal</button>
                <button className="btn btn-primary" onClick={submitRegistrasi} disabled={submitting}>Simpan & Registrasi</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assessment Modal */}
      {showAssModal && selectedItem && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Input Assessment {selectedItem.kode_laporan}</h5>
                <button type="button" className="btn-close" onClick={() => setShowAssModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label small fw-bold">Hasil Assessment / Wawancara</label>
                  <textarea className="form-control" rows={3} value={hasilAssessment} onChange={e => setHasilAssessment(e.target.value)}></textarea>
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Kondisi Korban</label>
                  <input type="text" className="form-control" value={kondisiKorban} onChange={e => setKondisiKorban(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Kebutuhan Mendesak</label>
                  <input type="text" className="form-control" value={kebutuhanKorban} onChange={e => setKebutuhanKorban(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowAssModal(false)}>Batal</button>
                <button className="btn btn-primary" onClick={submitAssessment} disabled={submitting}>Simpan Assessment</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Intervensi Modal */}
      {showIntModal && selectedItem && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Rencana Intervensi {selectedItem.kode_laporan}</h5>
                <button type="button" className="btn-close" onClick={() => setShowIntModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label small fw-bold">Metode Penanganan</label>
                  <select className="form-select" value={metode} onChange={e => setMetode(e.target.value)}>
                    <option value="">-- Pilih --</option>
                    {METODE_LIST.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Rencana Tindakan</label>
                  <textarea className="form-control" rows={3} value={rencana} onChange={e => setRencana(e.target.value)}></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowIntModal(false)}>Batal</button>
                <button className="btn btn-primary" onClick={submitIntervensi} disabled={submitting}>Mulai Penanganan</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Log Modal */}
      {showLogModal && selectedItem && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Tambah Log {selectedItem.kode_laporan}</h5>
                <button type="button" className="btn-close" onClick={() => setShowLogModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label small fw-bold">Catatan Pendampingan</label>
                  <textarea className="form-control" rows={3} value={catatanLog} onChange={e => setCatatanLog(e.target.value)}></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowLogModal(false)}>Batal</button>
                <button className="btn btn-primary" onClick={submitLog} disabled={submitting}>Simpan Log</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
