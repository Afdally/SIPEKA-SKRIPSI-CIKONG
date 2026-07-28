import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import authService from '../services/authService';
import laporanService from '../services/laporanService';
import kasusService from '../services/kasusService';
import StatCard from '../components/dashboard/StatCard';
import JenisKasusChart from '../components/dashboard/JenisKasusChart';
import DemografiChart from '../components/dashboard/DemografiChart';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import './Dashboard.css';

const MENU_ITEMS = [
  { id: 'dashboard', icon: 'bi-grid-1x2-fill', label: 'Dashboard' },
  { id: 'users', icon: 'bi-people-fill', label: 'Manajemen Petugas' },
  { id: 'master', icon: 'bi-database-fill', label: 'Pusat Kendali Layanan' },
  { id: 'export', icon: 'bi-file-earmark-spreadsheet-fill', label: 'Data Pelaporan' },
];

export default function DashboardSuperAdmin() {
  const navigate = useNavigate();

  // ==================== STATE ====================

  const [user, setUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Laporan & filter-nya (dipakai di tab Dashboard dan Data Pelaporan)
  const [allReports, setAllReports] = useState([]);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Data dari service lain
  const [stats, setStats] = useState({ summary: null, kinerja: [] });
  const [usersList, setUsersList] = useState([]);
  const [masterKekerasan, setMasterKekerasan] = useState([]);
  const [masterMetode, setMasterMetode] = useState([]);

  // State form modal "Manajemen Petugas"
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({ id: '', name: '', email: '', password: '', role: 'petugas_uptd' });

  // State form modal "Pusat Kendali Layanan"
  const [activeMasterTab, setActiveMasterTab] = useState('kekerasan');
  const [showMasterModal, setShowMasterModal] = useState(false);
  const [masterType, setMasterType] = useState(''); // 'kekerasan' | 'metode'
  const [masterForm, setMasterForm] = useState({ id: '', nama: '', deskripsi: '', is_active: true });

  const getToken = () => localStorage.getItem('sipeka_token');

  // ==================== DATA FETCHING ====================
  // Tiap tab menu punya data sendiri, jadi cuma di-fetch pas tab itu aktif.

  const fetchStats = async (tok) => {
    try {
      const [summary, kinerja] = await Promise.all([
        kasusService.getStatsSummary(tok),
        kasusService.getStatsKinerja(tok),
      ]);
      setStats({ summary, kinerja });
    } catch (e) { console.error(e); }
  };

  const fetchUsers = async (tok) => {
    try {
      setUsersList(await authService.getUsers(tok));
    } catch (e) { console.error(e); }
  };

  const fetchMaster = async (tok) => {
    try {
      const [kekerasan, metode] = await Promise.all([
        laporanService.getMasterKekerasanAll(tok),
        kasusService.getMasterMetodeAll(tok),
      ]);
      setMasterKekerasan(kekerasan);
      setMasterMetode(metode);
    } catch (e) { console.error(e); }
  };

  const fetchReportsData = async (tok) => {
    try {
      setAllReports(await laporanService.getAll(tok));
    } catch (e) { console.error(e); }
  };

  const fetchAll = useCallback(async (tok) => {
    const t = tok || getToken();
    // Tab Dashboard butuh allReports juga untuk chart & kartu ringkasan.
    if (activeMenu === 'dashboard') { fetchStats(t); fetchReportsData(t); }
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

  // ==================== ACTIONS: MANAJEMEN PETUGAS ====================

  const saveUser = async (e) => {
    e.preventDefault();
    try {
      if (userForm.id) {
        const payload = { name: userForm.name, email: userForm.email, role: userForm.role };
        if (userForm.password) payload.password = userForm.password;
        await authService.updateUser(getToken(), userForm.id, payload);
      } else {
        await authService.createUser(getToken(), userForm);
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
      await authService.deleteUser(getToken(), id);
      fetchUsers(getToken());
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const openUserModal = (u = null) => {
    if (u) setUserForm({ id: u._id, name: u.name, email: u.email, password: '', role: u.role });
    else setUserForm({ id: '', name: '', email: '', password: '', role: 'petugas_uptd' });
    setShowUserModal(true);
  };

  // ==================== ACTIONS: PUSAT KENDALI LAYANAN ====================

  const saveMaster = async (e) => {
    e.preventDefault();
    try {
      const tok = getToken();
      const payload = masterType === 'kekerasan'
        ? { nama_kategori: masterForm.nama, deskripsi: masterForm.deskripsi, is_active: masterForm.is_active }
        : { nama_metode: masterForm.nama, deskripsi: masterForm.deskripsi, is_active: masterForm.is_active };

      if (masterType === 'kekerasan') {
        if (masterForm.id) await laporanService.updateMasterKekerasan(tok, masterForm.id, payload);
        else await laporanService.createMasterKekerasan(tok, payload);
      } else {
        if (masterForm.id) await kasusService.updateMasterMetode(tok, masterForm.id, payload);
        else await kasusService.createMasterMetode(tok, payload);
      }
      setShowMasterModal(false);
      fetchMaster(tok);
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving master data');
    }
  };

  const deleteMaster = async (type, id) => {
    if (!window.confirm('Yakin hapus data master ini? Bisa berdampak pada history.')) return;
    try {
      const tok = getToken();
      if (type === 'kekerasan') await laporanService.deleteMasterKekerasan(tok, id);
      else await kasusService.deleteMasterMetode(tok, id);
      fetchMaster(tok);
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

  // ==================== ACTIONS: DATA PELAPORAN / EXPORT ====================

  const getFilteredReports = () => {
    return allReports.filter(r => {
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
      if (filterRegion && r.kelurahan_korban !== filterRegion) return false;
      if (filterKategori && r.tipe_laporan !== filterKategori) return false;
      if (filterStatus && r.status !== filterStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match =
          (r.kode_laporan || '').toLowerCase().includes(q) ||
          (r.nama_korban || '').toLowerCase().includes(q) ||
          (r.jenis_kekerasan || '').toLowerCase().includes(q) ||
          (r.kelurahan_korban || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  };

  const handleExportExcel = () => {
    const data = getFilteredReports();
    if (data.length === 0) return alert('Tidak ada data untuk diekspor!');

    let csv = 'Kode Laporan,Tanggal Kejadian,Nama Korban,Usia,Jenis Kelamin,Wilayah,Jenis Kekerasan,Kategori,Status,Kronologi\n';

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
      const kategori = r.tipe_laporan === 'anak' ? 'Anak' : 'Perempuan';

      csv += `${escapeCSV(r.kode_laporan)},${escapeCSV(tgl)},${escapeCSV(r.nama_korban)},${escapeCSV(r.usia_korban)},${escapeCSV(r.jenis_kelamin)},${escapeCSV(r.kelurahan_korban)},${escapeCSV(r.jenis_kekerasan)},${escapeCSV(kategori)},${escapeCSV(r.status)},${escapeCSV(r.kronologi)}\n`;
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
            <h6>
              <img src={logo} alt="Logo" style={{ width: '32px', height: 'auto' }} />
              SUPER ADMIN
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
          <small style={{ color: '#9ca3af', fontSize: '.75rem' }}>SIPEKA Kota Kendari</small>
        </div>
        <nav style={{ marginTop: '1rem', flex: 1 }}>
          {MENU_ITEMS.map(item => (
            <div key={item.id} className={`dashboard-nav-link${activeMenu === item.id ? ' active' : ''}`} onClick={() => { setActiveMenu(item.id); setSidebarOpen(false); }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Hamburger — hanya tampil di mobile */}
            <button
              className="hamburger-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Buka menu"
            >
              <i className="bi bi-list"></i>
            </button>
            <h5 className="fw-bold m-0 text-dark">{MENU_ITEMS.find(m => m.id === activeMenu)?.label}</h5>
          </div>
          <div className="dropdown">
            <button
              className="user-avatar-btn dropdown-toggle"
              type="button"
              id="userDropdown"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <div className="user-avatar-circle">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="user-avatar-name">{user?.name}</span>
              <i className="bi bi-chevron-down user-avatar-chevron"></i>
            </button>
            <div className="dropdown-menu dropdown-menu-end user-dropdown-menu" aria-labelledby="userDropdown">
              {/* Header: info user */}
              <div className="user-dropdown-header">
                <div className="user-dropdown-avatar">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="user-dropdown-info">
                  <div className="user-dropdown-name">{user?.name}</div>
                  <div className="user-dropdown-email">{user?.email}</div>
                  <span className="user-dropdown-role">Super Admin</span>
                </div>
              </div>
              {/* Menu items */}
              <div className="user-dropdown-body">
                <button className="user-dropdown-item">
                  <i className="bi bi-person"></i> Profil Saya
                </button>
                <button className="user-dropdown-item">
                  <i className="bi bi-gear"></i> Pengaturan
                </button>
              </div>
              {/* Sign out */}
              <button className="user-dropdown-signout" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right"></i> Keluar
              </button>
            </div>
          </div>
        </div>

        {/* 1. TAB DASHBOARD (ringkasan eksekutif) */}
        {activeMenu === 'dashboard' && stats.summary && (
          <div className="bento-container">
            <div className="row g-3 mb-4">
              <StatCard icon="bi-file-earmark-text" iconBg="#eff6ff" iconColor="#2563eb" label="Total Laporan" value={allReports.length} />
              <StatCard icon="bi-exclamation-circle" iconBg="#fef2f2" iconColor="#dc2626" label="Menunggu Verifikasi" value={allReports.filter(r => r.status === 'menunggu_registrasi').length} />
              <StatCard icon="bi-briefcase" iconBg="#fffbeb" iconColor="#d97706" label="Sedang Diproses" value={stats.summary.dalam_proses || 0} />
              <StatCard icon="bi-check-circle" iconBg="#f0fdf4" iconColor="#16a34a" label="Kasus Selesai" value={stats.summary.selesai} />
            </div>

            <div className="row g-4 mb-4">
              <div className="col-lg-8"><JenisKasusChart data={allReports} /></div>
              <div className="col-lg-4"><DemografiChart data={allReports} /></div>
            </div>

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
                <ActivityFeed reports={allReports} />
              </div>
            </div>
          </div>
        )}

        {/* 2. TAB MANAJEMEN PETUGAS */}
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

        {/* 3. TAB PUSAT KENDALI LAYANAN (master data) */}
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

        {/* 4. TAB DATA PELAPORAN (filter + export CSV) */}
        {activeMenu === 'export' && (
          <div className="modern-table-card">
            {/* Toolbar */}
            <div className="modern-table-toolbar">
              <div className="d-flex align-items-center gap-3 flex-wrap">
                <h6 className="modern-table-title">Data Pelaporan</h6>
                <button className="btn btn-success btn-sm rounded-pill px-3 fw-bold" onClick={handleExportExcel}>
                  <i className="bi bi-file-earmark-excel me-1"></i> Export Excel
                </button>
              </div>
              <div className="modern-table-controls">
                {/* Search */}
                <div className="modern-table-search">
                  <i className="bi bi-search search-icon"></i>
                  <input
                    type="text"
                    placeholder="Cari laporan..."
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
                {/* Status filter pills */}
                <div className="filter-pills">
                  <button className={`filter-pill ${filterStatus === '' ? 'active' : ''}`} onClick={() => setFilterStatus('')}>Semua Status</button>
                  <button className={`filter-pill ${filterStatus === 'menunggu_registrasi' ? 'active' : ''}`} onClick={() => setFilterStatus('menunggu_registrasi')}>Menunggu</button>
                  <button className={`filter-pill ${filterStatus === 'penanganan' ? 'active' : ''}`} onClick={() => setFilterStatus('penanganan')}>Proses</button>
                  <button className={`filter-pill ${filterStatus === 'selesai' ? 'active' : ''}`} onClick={() => setFilterStatus('selesai')}>Selesai</button>
                </div>
                {/* Reset */}
                {(searchQuery || filterKategori || filterStatus || filterStartDate || filterEndDate || filterRegion) && (
                  <button
                    className="btn btn-sm btn-light text-muted rounded-pill px-3"
                    onClick={() => { setSearchQuery(''); setFilterKategori(''); setFilterStatus(''); setFilterStartDate(''); setFilterEndDate(''); setFilterRegion(''); }}
                  >
                    <i className="bi bi-x-circle me-1"></i>Reset
                  </button>
                )}
              </div>
            </div>

            {/* Date & Region filter row (secondary, subtle) */}
            <div className="d-flex align-items-center gap-2 px-4 py-2 bg-light border-bottom flex-wrap">
              <small className="text-muted fw-bold me-1">Filter Lanjutan:</small>
              <input type="date" className="form-control form-control-sm rounded-pill" style={{ width: 'auto' }} value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} />
              <small className="text-muted">s/d</small>
              <input type="date" className="form-control form-control-sm rounded-pill" style={{ width: 'auto' }} value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} />
              <select className="form-select form-select-sm rounded-pill" style={{ width: 'auto' }} value={filterRegion} onChange={e => setFilterRegion(e.target.value)}>
                <option value="">Semua Wilayah</option>
                {[...new Set(allReports.map(r => r.kelurahan_korban).filter(Boolean))].sort().map(reg => (
                  <option key={reg} value={reg}>{reg}</option>
                ))}
              </select>
              <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-1 ms-auto">
                {getFilteredReports().length} data
              </span>
            </div>

            {/* Table */}
            <div className="table-responsive">
              <table className="table dashboard-table mb-0">
                <thead>
                  <tr>
                    <th>Kode</th>
                    <th>Tgl Kejadian</th>
                    <th>Nama Korban</th>
                    <th>Wilayah</th>
                    <th>Kekerasan</th>
                    <th>Kategori</th>
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
                      <td>
                        <div className="fw-semibold text-dark">{r.nama_korban}</div>
                        <div className="text-muted" style={{ fontSize: '0.76rem' }}>{r.usia_korban} Thn &middot; {r.jenis_kelamin}</div>
                      </td>
                      <td><span style={{ fontSize: '0.82rem' }}>{r.kelurahan_korban}</span></td>
                      <td><span style={{ fontSize: '0.82rem' }}>{r.jenis_kekerasan}</span></td>
                      <td>
                        <span className={`status-pill ${r.tipe_laporan === 'anak' ? 'status-pill-warning' : 'status-pill-info'}`}>
                          {r.tipe_laporan === 'anak' ? 'Anak' : 'Perempuan'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill ${
                          r.status === 'selesai' ? 'status-pill-success' :
                          r.status === 'menunggu_registrasi' ? 'status-pill-danger' :
                          'status-pill-warning'
                        }`}>
                          {r.status === 'selesai' ? 'Selesai' :
                           r.status === 'menunggu_registrasi' ? 'Menunggu' : 'Diproses'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {getFilteredReports().length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center py-5 text-muted">
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
