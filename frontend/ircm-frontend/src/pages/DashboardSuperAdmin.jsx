import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../assets/logo.png';

const API_AUTH = 'http://localhost:8080/api/auth';
const API_CASE = 'http://localhost:8080/api';
const API_REPORT = 'http://localhost:8080/api';

import './Dashboard.css';

const MENU_ITEMS = [
  { id: 'dashboard', icon: 'bi-grid-1x2-fill', label: 'Dashboard' },
  { id: 'users', icon: 'bi-people-fill', label: 'Manajemen Petugas' },
  { id: 'master', icon: 'bi-database-fill', label: 'Pusat Kendali Layanan' },
  { id: 'export', icon: 'bi-file-earmark-spreadsheet-fill', label: 'Data Pelaporan' },
];

export default function DashboardSuperAdmin() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState('dashboard');

  // Laporan & Filters (untuk menu Data Pelaporan)
  const [allReports, setAllReports] = useState([]);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterRegion, setFilterRegion] = useState('');

  // Data States
  const [stats, setStats] = useState({ summary: null, kinerja: [] });
  const [usersList, setUsersList] = useState([]);
  const [masterKekerasan, setMasterKekerasan] = useState([]);
  const [masterMetode, setMasterMetode] = useState([]);

  // Form States (Users)
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({ id: '', name: '', email: '', password: '', role: 'petugas_uptd' });

  // Form States (Master)
  const [activeMasterTab, setActiveMasterTab] = useState('kekerasan');
  const [showMasterModal, setShowMasterModal] = useState(false);
  const [masterType, setMasterType] = useState(''); // 'kekerasan' | 'metode'
  const [masterForm, setMasterForm] = useState({ id: '', nama: '', deskripsi: '', is_active: true });

  const getToken = () => localStorage.getItem('sipeka_token');

  const fetchStats = async (tok) => {
    try {
      const hdrs = { headers: { Authorization: `Bearer ${tok}` } };
      const [rSum, rKin, rRep] = await Promise.all([
        axios.get(`${API_CASE}/penanganan/stats/summary`, hdrs),
        axios.get(`${API_CASE}/penanganan/stats/kinerja`, hdrs),
        axios.get(`${API_REPORT}/laporan`, hdrs)
      ]);
      const summaryData = rSum.data;
      summaryData.total_kasus = rRep.data.data.length; // Override agar menghitung seluruh laporan masuk
      setStats({ summary: summaryData, kinerja: rKin.data });
    } catch (e) { console.error(e); }
  };

  const fetchUsers = async (tok) => {
    try {
      const res = await axios.get(`${API_AUTH}/users`, { headers: { Authorization: `Bearer ${tok}` } });
      setUsersList(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchMaster = async (tok) => {
    try {
      const hdrs = { headers: { Authorization: `Bearer ${tok}` } };
      const [rKek, rMet] = await Promise.all([
        axios.get(`${API_REPORT}/master/kekerasan?all=true`, hdrs),
        axios.get(`${API_CASE}/master/metode?all=true`, hdrs)
      ]);
      setMasterKekerasan(rKek.data);
      setMasterMetode(rMet.data);
    } catch (e) { console.error(e); }
  };

  const fetchReportsData = async (tok) => {
    try {
      const res = await axios.get(`${API_REPORT}/laporan`, { headers: { Authorization: `Bearer ${tok}` } });
      setAllReports(res.data.data);
    } catch (e) { console.error(e); }
  };

  const fetchAll = useCallback(async (tok) => {
    const t = tok || getToken();
    if (activeMenu === 'dashboard') fetchStats(t);
    if (activeMenu === 'users') fetchUsers(t);
    if (activeMenu === 'master') fetchMaster(t);
    if (activeMenu === 'export') fetchReportsData(t);
  }, [activeMenu]);

  useEffect(() => {
    const rawUser = localStorage.getItem('sipeka_user');
    const tok = getToken();
    if (!tok || !rawUser) { navigate('/login'); return; }
    setUser(JSON.parse(rawUser));
    fetchAll(tok);
  }, [navigate, fetchAll]);

  const handleLogout = () => {
    if (!window.confirm('Keluar dari Super Admin?')) return;
    localStorage.clear();
    navigate('/login');
  };

  // --- ACTIONS: USERS ---
  const saveUser = async (e) => {
    e.preventDefault();
    try {
      const hdrs = { headers: { Authorization: `Bearer ${getToken()}` } };
      if (userForm.id) {
        // Edit
        const payload = { name: userForm.name, email: userForm.email, role: userForm.role };
        if (userForm.password) payload.password = userForm.password;
        await axios.put(`${API_AUTH}/users/${userForm.id}`, payload, hdrs);
      } else {
        // Create
        await axios.post(`${API_AUTH}/users`, userForm, hdrs);
      }
      setShowUserModal(false);
      fetchUsers(getToken());
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving user');
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Yakin hapus akun petugas ini?')) return;
    try {
      await axios.delete(`${API_AUTH}/users/${id}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      fetchUsers(getToken());
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const openUserModal = (u = null) => {
    if (u) setUserForm({ id: u._id, name: u.name, email: u.email, password: '', role: u.role });
    else setUserForm({ id: '', name: '', email: '', password: '', role: 'petugas_uptd' });
    setShowUserModal(true);
  };

  // --- ACTIONS: MASTER DATA ---
  const saveMaster = async (e) => {
    e.preventDefault();
    try {
      const hdrs = { headers: { Authorization: `Bearer ${getToken()}` } };
      const endpoint = masterType === 'kekerasan' ? `${API_REPORT}/master/kekerasan` : `${API_CASE}/master/metode`;
      const payload = masterType === 'kekerasan'
        ? { nama_kategori: masterForm.nama, deskripsi: masterForm.deskripsi, is_active: masterForm.is_active }
        : { nama_metode: masterForm.nama, deskripsi: masterForm.deskripsi, is_active: masterForm.is_active };

      if (masterForm.id) {
        await axios.put(`${endpoint}/${masterForm.id}`, payload, hdrs);
      } else {
        await axios.post(endpoint, payload, hdrs);
      }
      setShowMasterModal(false);
      fetchMaster(getToken());
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving master data');
    }
  };

  const deleteMaster = async (type, id) => {
    if (!window.confirm('Yakin hapus data master ini? Bisa berdampak pada history.')) return;
    try {
      const endpoint = type === 'kekerasan' ? `${API_REPORT}/master/kekerasan` : `${API_CASE}/master/metode`;
      await axios.delete(`${endpoint}/${id}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      fetchMaster(getToken());
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const openMasterModal = (type, item = null) => {
    setMasterType(type);
    if (item) {
      setMasterForm({
        id: item._id,
        nama: type === 'kekerasan' ? item.nama_kategori : item.nama_metode,
        deskripsi: item.deskripsi || '',
        is_active: item.is_active
      });
    } else {
      setMasterForm({ id: '', nama: '', deskripsi: '', is_active: true });
    }
    setShowMasterModal(true);
  };

  // --- ACTIONS: EXPORT / DATA PELAPORAN ---
  const getFilteredReports = () => {
    return allReports.filter(r => {
      // Filter Tanggal (berdasarkan tanggal_kejadian)
      if (filterStartDate) {
        const rDate = new Date(r.tanggal_kejadian);
        const sDate = new Date(filterStartDate);
        if (rDate < sDate) return false;
      }
      if (filterEndDate) {
        const rDate = new Date(r.tanggal_kejadian);
        const eDate = new Date(filterEndDate);
        eDate.setHours(23, 59, 59, 999);
        if (rDate > eDate) return false;
      }
      // Filter Wilayah
      if (filterRegion && r.kelurahan_korban !== filterRegion) return false;
      return true;
    });
  };

  const handleExportExcel = () => {
    const data = getFilteredReports();
    if (data.length === 0) return alert('Tidak ada data untuk diekspor!');

    let csv = 'Kode Laporan,Tanggal Kejadian,Nama Korban,Usia,Jenis Kelamin,Wilayah,Jenis Kekerasan,Status,Kronologi\n';

    data.forEach(r => {
      const escapeCSV = (str) => {
        if (str === null || str === undefined) return '""';
        const s = String(str);
        if (s.includes(',') || s.includes('\n') || s.includes('"')) {
          return `"${s.replace(/"/g, '""')}"`;
        }
        return `"${s}"`;
      };

      const d = new Date(r.tanggal_kejadian);
      const tgl = isNaN(d.getTime()) ? '-' : (r.tanggal_kejadian_format || d.toLocaleDateString('id-ID'));

      csv += `${escapeCSV(r.kode_laporan)},${escapeCSV(tgl)},${escapeCSV(r.nama_korban)},${escapeCSV(r.usia_korban)},${escapeCSV(r.jenis_kelamin)},${escapeCSV(r.kelurahan_korban)},${escapeCSV(r.jenis_kekerasan)},${escapeCSV(r.status)},${escapeCSV(r.kronologi)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Data_Pelaporan_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!user) return null;

  return (
    <div className="dashboard-body" style={{ display: 'flex', minHeight: '100vh' }}>

      {/* SIDEBAR */}
      <div className="dashboard-sidebar">
        <div className="brand">
          <h6>
            <img src={logo} alt="Logo" style={{ width: '32px', height: 'auto' }} />
            SUPER ADMIN
          </h6>
          <small style={{ color: '#9ca3af', fontSize: '.75rem' }}>SIPEKA Kota Kendari</small>
        </div>
        <nav style={{ marginTop: '1rem', flex: 1 }}>
          {MENU_ITEMS.map(item => (
            <div key={item.id} className={`dashboard-nav-link${activeMenu === item.id ? ' active' : ''}`} onClick={() => setActiveMenu(item.id)}>
              <i className={`bi ${item.icon}`}></i> {item.label}
            </div>
          ))}
        </nav>
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button className="btn btn-sm w-100 fw-bold text-white border-secondary rounded-pill" onClick={handleLogout}><i className="bi bi-box-arrow-right me-2"></i>Keluar</button>
        </div>
      </div>

      {/* MAIN */}
      <div className="dashboard-main" style={{ flex: 1 }}>
        <div className="dashboard-topbar">
          <h5 className="fw-bold m-0 text-dark">{MENU_ITEMS.find(m => m.id === activeMenu)?.label}</h5>
          <div className="dropdown">
            <button className="btn btn-white bg-white border d-flex align-items-center gap-2 rounded-pill shadow-sm dropdown-toggle" type="button" id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false">
              <i className="bi bi-person-circle fs-5 text-primary"></i>
              <span className="fw-bold text-dark small">{user?.name}</span>
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-4" aria-labelledby="userDropdown">
              <li><div className="dropdown-header text-muted">Login sebagai: <br /><strong>{user.email}</strong></div></li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <button className="dropdown-item text-danger fw-bold d-flex align-items-center gap-2 btn-logout" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right"></i> Logout
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* 1. EKSEKUTIF DASHBOARD (Bento UI) */}
        {activeMenu === 'dashboard' && stats.summary && (
          <div className="bento-container">
            {/* ROW 1: Summary Metrics */}
            <div className="row g-3 mb-4">
              <div className="col-md-3">
                <div className="bento-card mb-0 d-flex align-items-center gap-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width:'48px', height:'48px', background: '#eff6ff', color: '#2563eb' }}>
                    <i className="bi bi-file-earmark-text fs-4"></i>
                  </div>
                  <div>
                    <div className="small text-muted fw-bold">Total Laporan</div>
                    <div className="h4 m-0 fw-bold text-dark">{stats.summary.total_kasus}</div>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="bento-card mb-0 d-flex align-items-center gap-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width:'48px', height:'48px', background: '#fef2f2', color: '#dc2626' }}>
                    <i className="bi bi-exclamation-circle fs-4"></i>
                  </div>
                  <div>
                    <div className="small text-muted fw-bold">Menunggu Verifikasi</div>
                    <div className="h4 m-0 fw-bold text-dark">{stats.summary.menunggu_registrasi || 0}</div>
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
                    <div className="h4 m-0 fw-bold text-dark">{(stats.summary.proses_assessment || 0) + (stats.summary.proses_penanganan || 0)}</div>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="bento-card mb-0 d-flex align-items-center gap-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width:'48px', height:'48px', background: '#f0fdf4', color: '#16a34a' }}>
                    <i className="bi bi-check-circle fs-4"></i>
                  </div>
                  <div>
                    <div className="small text-muted fw-bold">Kasus Selesai</div>
                    <div className="h4 m-0 fw-bold text-dark">{stats.summary.selesai}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 2: Main Analytics */}
            <div className="row g-4 mb-4">
              {(() => {
                // Bar Chart Data (Jenis Kasus)
                const jenisKasusCounts = {};
                allReports.forEach(d => {
                  const k = d.jenis_kekerasan || 'Lainnya';
                  jenisKasusCounts[k] = (jenisKasusCounts[k] || 0) + 1;
                });
                const jenisKasusData = Object.entries(jenisKasusCounts).sort((a,b) => b[1] - a[1]).slice(0,4);
                const maxJenisKasus = Math.max(...jenisKasusData.map(d => d[1]), 10);

                // Donut Chart Data (Demografi)
                let anakPr = 0, anakLk = 0, dewasaPr = 0;
                allReports.forEach(d => {
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
                    <div className="col-lg-8">
                      <div className="bento-card h-100">
                        <div className="fw-bold mb-4">Tren Jenis Kasus Tahun Ini</div>
                        <div className="bar-chart-mini position-relative">
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
                  </>
                );
              })()}
            </div>

            {/* ROW 3: Tracking & Kinerja */}
            <div className="row g-4">
              <div className="col-lg-7">
                <div className="bento-card">
                  <div className="bento-title"><i className="bi bi-person-badge text-primary"></i> Kinerja Petugas UPTD</div>
                  <div className="table-responsive">
                    <table className="table table-borderless mb-0 align-middle">
                      <thead className="text-muted small">
                        <tr><th>Petugas</th><th className="text-center">Total</th><th className="text-center">Selesai</th><th>Skor</th></tr>
                      </thead>
                      <tbody className="small fw-semibold">
                        {stats.kinerja.map((k, i) => (
                          <tr key={i} className="border-bottom-0">
                            <td>{k.nama}</td>
                            <td className="text-center"><span className="badge bg-light text-dark">{k.total_kasus}</span></td>
                            <td className="text-center"><span className="badge bg-light text-success">{k.kasus_selesai}</span></td>
                            <td width="100">
                              <div className="progress-bar-bg" style={{ height: '6px' }}><div className="progress-bar-fill bg-primary" style={{ width: `${(k.kasus_selesai / (k.total_kasus || 1)) * 100}%` }}></div></div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="col-lg-5">
                <div className="bento-card">
                  <div className="bento-title"><i className="bi bi-activity text-danger"></i> Aktivitas Penanganan Terbaru</div>
                  <div className="mt-3">
                    <div className="activity-item active">
                      <div className="activity-content">
                        <strong>Petugas Admin</strong> baru saja memverifikasi laporan <span className="text-primary">LP-2026-XQI4Z</span>
                        <span className="activity-time">2 menit yang lalu</span>
                      </div>
                    </div>
                    <div className="activity-item">
                      <div className="activity-content">
                        Kasus <span className="text-primary">LP-2026-WHYM5</span> telah selesai ditangani oleh Petugas UPTD
                        <span className="activity-time">1 jam yang lalu</span>
                      </div>
                    </div>
                    <div className="activity-item">
                      <div className="activity-content">
                        Assessment dimulai untuk laporan <span className="text-primary">LP-2026-1113G</span>
                        <span className="activity-time">3 jam yang lalu</span>
                      </div>
                    </div>
                    <div className="activity-item">
                      <div className="activity-content">
                        Laporan baru diterima dari wilayah <span className="fw-bold">Mandonga</span>
                        <span className="activity-time">5 jam yang lalu</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. MANAJEMEN PETUGAS */}
        {activeMenu === 'users' && (
          <div className="master-card">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="fw-bold m-0" style={{ color: '#111827' }}>Manajemen Petugas</h4>
              <button className="btn btn-dark rounded-pill px-4" onClick={() => openUserModal()}>
                <i className="bi bi-person-plus me-2"></i> Tambah Akun
              </button>
            </div>

            <div className="master-list">
              {usersList.map(u => (
                <div className="master-list-item" key={u._id}>
                  <div className="d-flex align-items-center gap-3">
                    <div className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }}>
                      <i className="bi bi-person text-primary fs-4"></i>
                    </div>
                    <div>
                      <div className="fw-bold text-dark fs-6 mb-0">{u.name}</div>
                      <div className="text-muted small">{u.email}</div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-4">
                    <span className={`badge-soft-${u.role === 'super_admin' ? 'secondary' : 'success'}`}>
                      {u.role === 'super_admin' ? 'SUPER ADMIN' : 'PETUGAS UPTD'}
                    </span>
                    <div className="actions d-flex gap-2">
                      <button className="btn btn-sm btn-light text-primary rounded-circle" style={{ width: '32px', height: '32px' }} onClick={() => openUserModal(u)}><i className="bi bi-pencil"></i></button>
                      <button className="btn btn-sm btn-light text-danger rounded-circle" style={{ width: '32px', height: '32px' }} onClick={() => deleteUser(u._id)} disabled={u._id === user.id}><i className="bi bi-trash"></i></button>
                    </div>
                  </div>
                </div>
              ))}
              {usersList.length === 0 && <div className="text-center py-5 text-muted">Belum ada akun petugas.</div>}
            </div>
          </div>
        )}

        {/* 3. PUSAT KENDALI LAYANAN */}
        {activeMenu === 'master' && (
          <div className="master-card">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="fw-bold m-0" style={{ color: '#111827' }}>Pusat Kendali Layanan</h4>
              <button className="btn btn-dark rounded-pill px-4" onClick={() => openMasterModal(activeMasterTab)}>
                <i className="bi bi-plus-lg me-2"></i> Tambah {activeMasterTab === 'kekerasan' ? 'Kategori' : 'Metode'}
              </button>
            </div>

            <div className="master-tabs">
              <button className={`master-tab ${activeMasterTab === 'kekerasan' ? 'active' : ''}`} onClick={() => setActiveMasterTab('kekerasan')}>Kategori Kekerasan</button>
              <button className={`master-tab ${activeMasterTab === 'metode' ? 'active' : ''}`} onClick={() => setActiveMasterTab('metode')}>Metode Penanganan</button>
            </div>

            <div className="master-list">
              {activeMasterTab === 'kekerasan' && masterKekerasan.map(k => (
                <div className="master-list-item" key={k._id}>
                  <div>
                    <div className="fw-bold text-dark fs-6 mb-1">{k.nama_kategori}</div>
                    <div className="text-muted small">{k.deskripsi || 'Tidak ada deskripsi'}</div>
                  </div>
                  <div className="d-flex align-items-center gap-4">
                    <span className={k.is_active ? 'badge-soft-success' : 'badge-soft-secondary'}>
                      {k.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                    <div className="actions d-flex gap-2">
                      <button className="btn btn-sm btn-light text-primary rounded-circle" style={{ width: '32px', height: '32px' }} onClick={() => openMasterModal('kekerasan', k)}><i className="bi bi-pencil"></i></button>
                      <button className="btn btn-sm btn-light text-danger rounded-circle" style={{ width: '32px', height: '32px' }} onClick={() => deleteMaster('kekerasan', k._id)}><i className="bi bi-trash"></i></button>
                    </div>
                  </div>
                </div>
              ))}

              {activeMasterTab === 'metode' && masterMetode.map(m => (
                <div className="master-list-item" key={m._id}>
                  <div>
                    <div className="fw-bold text-dark fs-6 mb-1">{m.nama_metode}</div>
                    <div className="text-muted small">{m.deskripsi || 'Tidak ada deskripsi'}</div>
                  </div>
                  <div className="d-flex align-items-center gap-4">
                    <span className={m.is_active ? 'badge-soft-success' : 'badge-soft-secondary'}>
                      {m.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                    <div className="actions d-flex gap-2">
                      <button className="btn btn-sm btn-light text-primary rounded-circle" style={{ width: '32px', height: '32px' }} onClick={() => openMasterModal('metode', m)}><i className="bi bi-pencil"></i></button>
                      <button className="btn btn-sm btn-light text-danger rounded-circle" style={{ width: '32px', height: '32px' }} onClick={() => deleteMaster('metode', m._id)}><i className="bi bi-trash"></i></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. DATA PELAPORAN */}
        {activeMenu === 'export' && (
          <div className="master-card">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="fw-bold m-0" style={{ color: '#111827' }}>Data Pelaporan</h4>
              <button className="btn btn-success rounded-pill px-4" onClick={handleExportExcel}>
                <i className="bi bi-file-earmark-excel me-2"></i> Export Excel
              </button>
            </div>

            {/* Filter Section */}
            <div className="row g-3 mb-4 p-3 bg-light rounded-3" style={{ border: '1px solid #e5e7eb' }}>
              <div className="col-md-3">
                <label className="form-label small fw-bold">Dari Tanggal</label>
                <input type="date" className="form-control" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} />
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-bold">Sampai Tanggal</label>
                <input type="date" className="form-control" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} />
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-bold">Wilayah / Kelurahan</label>
                <select className="form-select" value={filterRegion} onChange={e => setFilterRegion(e.target.value)}>
                  <option value="">Semua Wilayah</option>
                  {[...new Set(allReports.map(r => r.kelurahan_korban).filter(Boolean))].sort().map(reg => (
                    <option key={reg} value={reg}>{reg}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3 d-flex align-items-end">
                <button className="btn btn-outline-secondary w-100" onClick={() => { setFilterStartDate(''); setFilterEndDate(''); setFilterRegion(''); }}>
                  Reset Filter
                </button>
              </div>
            </div>

            {/* Tabel */}
            <div className="table-responsive">
              <table className="table dashboard-table mb-0">
                <thead>
                  <tr>
                    <th>Kode</th>
                    <th>Tgl Kejadian</th>
                    <th>Nama Korban</th>
                    <th>Wilayah</th>
                    <th>Kekerasan</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredReports().map(r => (
                    <tr key={r.id}>
                      <td className="fw-bold text-primary">{r.kode_laporan}</td>
                      <td>
                        {(() => {
                          const d = new Date(r.tanggal_kejadian);
                          return isNaN(d.getTime()) ? '-' : (r.tanggal_kejadian_format || d.toLocaleDateString('id-ID'));
                        })()}
                      </td>
                      <td>{r.nama_korban} <br /><span className="text-muted small">{r.usia_korban} Thn - {r.jenis_kelamin}</span></td>
                      <td>{r.kelurahan_korban}</td>
                      <td>{r.jenis_kekerasan}</td>
                      <td>
                        <span className={`badge ${r.status === 'selesai' ? 'bg-success' : r.status === 'menunggu_registrasi' ? 'bg-danger' : 'bg-warning'} text-white`}>
                          {r.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {getFilteredReports().length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-5 text-muted">
                        <i className="bi bi-inbox fs-1 d-block mb-2 opacity-25"></i>
                        Tidak ada data laporan yang sesuai filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* --- MODALS --- */}

      {/* Modal Users */}
      {showUserModal && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <form className="modal-content" onSubmit={saveUser}>
              <div className="modal-header">
                <h5 className="modal-title">{userForm.id ? 'Edit Akun' : 'Tambah Akun Baru'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowUserModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label small fw-bold">Nama Lengkap</label>
                  <input type="text" className="form-control" value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} required />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Email</label>
                  <input type="email" className="form-control" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} required />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Password {userForm.id && '(Kosongkan jika tidak diubah)'}</label>
                  <input type="password" className="form-control" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} required={!userForm.id} />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Role Hak Akses</label>
                  <select className="form-select" value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}>
                    <option value="petugas_uptd">Petugas UPTD PPA</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUserModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Akun</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Master */}
      {showMasterModal && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <form className="modal-content" onSubmit={saveMaster}>
              <div className="modal-header">
                <h5 className="modal-title">{masterForm.id ? 'Edit' : 'Tambah'} {masterType === 'kekerasan' ? 'Kategori Kekerasan' : 'Metode Penanganan'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowMasterModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label small fw-bold">Nama {masterType === 'kekerasan' ? 'Kategori' : 'Metode'}</label>
                  <input type="text" className="form-control" value={masterForm.nama} onChange={e => setMasterForm({ ...masterForm, nama: e.target.value })} required />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Deskripsi (Opsional)</label>
                  <textarea className="form-control" rows="2" value={masterForm.deskripsi} onChange={e => setMasterForm({ ...masterForm, deskripsi: e.target.value })}></textarea>
                </div>
                <div className="form-check form-switch mt-3">
                  <input className="form-check-input" type="checkbox" checked={masterForm.is_active} onChange={e => setMasterForm({ ...masterForm, is_active: e.target.checked })} />
                  <label className="form-check-label small fw-bold">Status Aktif (Ditampilkan di form)</label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowMasterModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Master Data</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
