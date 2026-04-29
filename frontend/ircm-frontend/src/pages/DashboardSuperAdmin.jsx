import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../assets/logo.png';

const API_AUTH = 'http://localhost:8080/api/auth';
const API_CASE = 'http://localhost:8080/api';
const API_REPORT = 'http://localhost:8080/api';

const style = `
  :root {
    --ungu-utama: #4f46e5;
    --ungu-gelap: #3730a3;
    --ungu-muda:  #eef2ff;
    --border-sa:  #f1f5f9;
    --bg-slate-50: #f8fafc;
  }
  .sa-body { background: var(--bg-slate-50); font-family: 'Segoe UI', sans-serif; color: #1e293b; }
  .sa-sidebar { width: 260px; min-height: 100vh; background: #0f172a; position: fixed; top: 0; left: 0; z-index: 100; display: flex; flex-direction: column; }
  .sa-sidebar .brand { padding: 2rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
  .sa-sidebar .brand h6 { color: #fff; font-weight: 800; letter-spacing: 0.5px; margin: 0; display:flex; align-items:center; gap:10px; }
  .sa-nav-link { color: #94a3b8; padding: 1rem 1.5rem; font-size: .9rem; font-weight: 500; display: flex; align-items: center; gap: .75rem; cursor: pointer; transition: .3s; }
  .sa-nav-link:hover, .sa-nav-link.active { color: #fff; background: rgba(255,255,255,0.05); }
  .sa-nav-link.active { color: #38bdf8; position: relative; }
  .sa-nav-link.active::after { content:''; position:absolute; right:0; top:20%; bottom:20%; width:3px; background:#38bdf8; border-radius:3px 0 0 3px; }
  
  .sa-main { margin-left: 260px; padding: 2rem; }
  .sa-topbar { background: transparent; padding: 0 0 2rem 0; display: flex; align-items: center; justify-content: space-between; }
  
  /* Bento UI Cards */
  .bento-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; }
  .bento-card { background: #fff; border-radius: 1.5rem; padding: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -2px rgba(0,0,0,0.02); border: 1px solid rgba(0,0,0,0.03); transition: transform 0.3s ease; }
  .bento-card:hover { transform: translateY(-5px); }
  .bento-title { font-size: 1.1rem; font-weight: 700; color: #0f172a; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 8px; }
  
  .stat-label { font-size: .85rem; color: #64748b; font-weight: 600; margin-bottom: 0.5rem; display: block; }
  .stat-value { font-size: 2rem; font-weight: 800; color: #0f172a; line-height: 1; }
  
  /* Graph Placeholders */
  .bar-chart-mini { display: flex; align-items: flex-end; gap: 8px; height: 150px; padding-top: 20px; }
  .bar-item { flex: 1; background: var(--ungu-muda); border-radius: 6px 6px 2px 2px; transition: 0.3s; position: relative; }
  .bar-item:hover { background: var(--ungu-utama); }
  .bar-item:hover::after { content: attr(data-val); position: absolute; top: -25px; left: 50%; transform: translateX(-50%); font-size: 10px; font-weight: 700; }

  .progress-stack { display: flex; flex-direction: column; gap: 1rem; }
  .progress-row { display: flex; flex-direction: column; gap: 4px; }
  .progress-info { display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 600; }
  .progress-bar-bg { height: 8px; background: #f1f5f9; border-radius: 10px; overflow: hidden; }
  .progress-bar-fill { height: 100%; border-radius: 10px; transition: width 1s ease-in-out; }

  .activity-item { display: flex; gap: 12px; padding-bottom: 1.25rem; border-left: 2px solid #f1f5f9; margin-left: 7px; padding-left: 1.5rem; position: relative; }
  .activity-item::before { content:''; position:absolute; left: -6px; top: 0; width: 10px; height: 10px; border-radius: 50%; background: #cbd5e1; border: 2px solid #fff; }
  .activity-item.active::before { background: var(--ungu-utama); }
  .activity-content { font-size: 0.85rem; color: #475569; }
  .activity-time { font-size: 0.75rem; color: #94a3b8; display: block; margin-top: 2px; }
  
  @media (max-width: 1024px) {
    .bento-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 768px) {
    .sa-sidebar { display: none; }
    .sa-main { margin-left: 0; }
    .bento-grid { grid-template-columns: 1fr; }
  }
  
  .btn-sa { background: var(--ungu-utama); color: white; border: none; }
  .btn-sa:hover { background: var(--ungu-gelap); color: white; }
  
  .btn-logout:hover, .btn-logout:active, .btn-logout:focus {
    background-color: #dc3545 !important;
    color: white !important;
  }
  
  /* Redesign Pusat Kendali Layanan */
  .master-card { background: #fff; border-radius: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.02); border: 1px solid #f3f4f6; padding: 2rem; }
  .master-tabs { display: flex; gap: 2rem; border-bottom: 1px solid #e5e7eb; margin-bottom: 1.5rem; }
  .master-tab { background: none; border: none; padding: 0.75rem 0; font-weight: 600; color: #6b7280; font-size: 1rem; position: relative; transition: 0.2s; cursor: pointer; }
  .master-tab:hover { color: #111827; }
  .master-tab.active { color: var(--ungu-utama); }
  .master-tab.active::after { content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 3px; background: var(--ungu-utama); border-radius: 3px 3px 0 0; }
  .master-list-item { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1rem; border-bottom: 1px solid #f3f4f6; transition: 0.2s; border-radius: 0.75rem; }
  .master-list-item:last-child { border-bottom: none; }
  .master-list-item:hover { background: #f8fafc; }
  .badge-soft-success { background: #dcfce7; color: #166534; font-weight: 600; padding: 0.4rem 0.8rem; border-radius: 999px; font-size: 0.75rem; }
  .badge-soft-secondary { background: #f3f4f6; color: #4b5563; font-weight: 600; padding: 0.4rem 0.8rem; border-radius: 999px; font-size: 0.75rem; }
`;

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
    <div className="sa-body" style={{ display: 'flex', minHeight: '100vh' }}>
      <style>{style}</style>

      {/* SIDEBAR */}
      <div className="sa-sidebar">
        <div className="brand">
          <h6>
            <img src={logo} alt="Logo" style={{ width: '32px', height: 'auto' }} />
            SUPER ADMIN
          </h6>
          <small style={{ color: '#9ca3af', fontSize: '.75rem' }}>SIPEKA Kota Kendari</small>
        </div>
        <nav style={{ marginTop: '1rem', flex: 1 }}>
          {MENU_ITEMS.map(item => (
            <div key={item.id} className={`sa-nav-link${activeMenu === item.id ? ' active' : ''}`} onClick={() => setActiveMenu(item.id)}>
              <i className={`bi ${item.icon}`}></i> {item.label}
            </div>
          ))}
        </nav>
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button className="btn btn-sm w-100 fw-bold text-white border-secondary" onClick={handleLogout}><i className="bi bi-box-arrow-right me-2"></i>Keluar</button>
        </div>
      </div>

      {/* MAIN */}
      <div className="sa-main" style={{ flex: 1 }}>
        <div className="sa-topbar">
          <h5 className="fw-bold m-0 text-dark">{MENU_ITEMS.find(m => m.id === activeMenu)?.label}</h5>
          <div className="dropdown">
            <button className="btn btn-light d-flex align-items-center gap-2 border-0 bg-transparent shadow-none dropdown-toggle" type="button" id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false">
              <i className="bi bi-person-circle fs-5 text-primary"></i>
              <span className="fw-semibold text-dark">{user.name}</span>
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0" aria-labelledby="userDropdown">
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
            <div className="bento-grid mb-4">
              <div className="bento-card">
                <span className="stat-label"><i className="bi bi-journal-text me-2"></i>Total Laporan</span>
                <div className="stat-value text-primary">{stats.summary.total_kasus}</div>
              </div>
              <div className="bento-card border-start border-4 border-danger">
                <span className="stat-label"><i className="bi bi-hourglass-split me-2"></i>Menunggu Verifikasi</span>
                <div className="stat-value text-danger">{stats.summary.menunggu_registrasi || 0}</div>
              </div>
              <div className="bento-card border-start border-4 border-warning">
                <span className="stat-label"><i className="bi bi-clock-history me-2"></i>Sedang Diproses</span>
                <div className="stat-value text-warning">{(stats.summary.proses_assessment || 0) + (stats.summary.proses_penanganan || 0)}</div>
              </div>
              <div className="bento-card border-start border-4 border-success">
                <span className="stat-label"><i className="bi bi-check-circle-fill me-2"></i>Kasus Selesai</span>
                <div className="stat-value text-success">{stats.summary.selesai}</div>
              </div>
            </div>

            {/* ROW 2: Main Analytics */}
            <div className="row g-4 mb-4">
              <div className="col-lg-8">
                <div className="bento-card h-100">
                  <div className="bento-title"><i className="bi bi-graph-up text-primary"></i> Tren Pelaporan Kasus (Tahun Ini)</div>
                  <div className="bar-chart-mini">
                    {[35, 45, 30, 60, 85, 40, 55, 75, 50, 45, 65, 80].map((h, i) => (
                      <div key={i} className="bar-item" style={{ height: `${h}%` }} data-val={h}></div>
                    ))}
                  </div>
                  <div className="d-flex justify-content-between mt-3 text-muted small fw-bold">
                    <span>Jan</span><span>Mar</span><span>Mei</span><span>Jul</span><span>Sep</span><span>Des</span>
                  </div>
                </div>
              </div>
              <div className="col-lg-4">
                <div className="bento-card h-100">
                  <div className="bento-title"><i className="bi bi-pie-chart text-info"></i> Distribusi Kategori</div>
                  <div className="progress-stack">
                    {(() => {
                      const counts = {};
                      allReports.forEach(r => {
                        const cat = r.jenis_kekerasan || 'Lainnya';
                        counts[cat] = (counts[cat] || 0) + 1;
                      });
                      const total = allReports.length || 1;
                      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
                      const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

                      return sorted.map(([label, count], i) => (
                        <div key={i} className="progress-row">
                          <div className="progress-info">
                            <span>{label}</span>
                            <span className="text-dark fw-bold">{Math.round((count / total) * 100)}%</span>
                          </div>
                          <div className="progress-bar-bg">
                            <div className="progress-bar-fill" style={{ width: `${(count / total) * 100}%`, background: colors[i % colors.length] }}></div>
                          </div>
                          <small className="text-muted" style={{ fontSize: '0.7rem' }}>{count} Kasus</small>
                        </div>
                      ));
                    })()}
                    {allReports.length === 0 && <div className="text-center py-4 text-muted small">Belum ada data distribusi</div>}
                  </div>
                </div>
              </div>
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
              <table className="table sa-table mb-0">
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
