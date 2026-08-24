import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import writeExcelFile from 'write-excel-file/browser';
import logo from '../assets/logo.png';
import authService from '../services/authService';
import laporanService from '../services/laporanService';
import kasusService from '../services/kasusService';
import StatCard from '../components/dashboard/StatCard';
import SebaranKelurahanChart from '../components/dashboard/SebaranKelurahanChart';
import DemografiChart from '../components/dashboard/DemografiChart';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import SidebarUserMenu from '../components/dashboard/SidebarUserMenu';
import { beriTahuGagal, beriTahuKurang, konfirmasi } from '../utils/notifikasi';
import { cocokDenganFilterKategori, kategoriKorban, labelKategoriKorban } from '../utils/kategoriKorban';
import './Dashboard.css';

// Status mentah di database -> label yang layak dibaca petugas/pimpinan.
// Menampung dua penamaan yang beredar: milik Laporan (report-service) dan
// milik Kasus (case-service), supaya ekspor tidak pernah menampilkan snake_case.
const STATUS_LABELS = {
  menunggu_registrasi: 'Menunggu Registrasi',
  registrasi: 'Registrasi',
  proses_assessment: 'Proses Assessment',
  assessment: 'Proses Assessment',
  dalam_penanganan: 'Dalam Penanganan',
  penanganan: 'Dalam Penanganan',
  selesai: 'Selesai',
};

const labelStatus = (status) => STATUS_LABELS[status] || status || '-';

// Kolom file ekspor. `width` dalam satuan lebar karakter Excel.
const EXPORT_COLUMNS = [
  { key: 'kode_laporan',    header: 'Kode Laporan',     width: 18 },
  { key: 'tanggal',         header: 'Tanggal Kejadian', width: 16, type: Date, format: 'dd/mm/yyyy' },
  { key: 'nama_korban',     header: 'Nama Korban',      width: 24 },
  { key: 'usia_korban',     header: 'Usia',             width: 7,  type: Number, align: 'center' },
  { key: 'jenis_kelamin',   header: 'Jenis Kelamin',    width: 14 },
  { key: 'kelurahan_korban', header: 'Wilayah',         width: 18 },
  { key: 'jenis_kekerasan', header: 'Jenis Kekerasan',  width: 20 },
  { key: 'kategori',        header: 'Kategori',         width: 12 },
  { key: 'status',          header: 'Status',           width: 20 },
  { key: 'kronologi',       header: 'Kronologi',        width: 60, wrap: true },
];

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
  const [exporting, setExporting] = useState(false);

  // Data dari service lain
  const [stats, setStats] = useState({ summary: null, kinerja: [] });
  const [usersList, setUsersList] = useState([]);
  const [masterKekerasan, setMasterKekerasan] = useState([]);
  const [masterMetode, setMasterMetode] = useState([]);

  // State form modal "Manajemen Petugas"
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({ id: '', name: '', email: '', password: '', role: 'petugas_uptd' });
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [savingUser, setSavingUser] = useState(false);

  // State form modal "Pusat Kendali Layanan"
  const [activeMasterTab, setActiveMasterTab] = useState('kekerasan');
  const [showMasterModal, setShowMasterModal] = useState(false);
  const [masterType, setMasterType] = useState(''); // 'kekerasan' | 'metode'
  const [masterForm, setMasterForm] = useState({ id: '', nama: '', deskripsi: '', is_active: true });
  const [savingMaster, setSavingMaster] = useState(false);

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

  const handleLogout = async () => {
    if (!await konfirmasi('Keluar dari Super Admin?', { teksSetuju: 'Ya, keluar' })) return;
    localStorage.clear();
    navigate('/login');
  };

  // ==================== ACTIONS: MANAJEMEN PETUGAS ====================

  const saveUser = async (e) => {
    e.preventDefault();
    setSavingUser(true);
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
      beriTahuGagal(err.response?.data?.message || 'Akun petugas gagal disimpan.');
    } finally {
      setSavingUser(false);
    }
  };

  const deleteUser = async (id) => {
    const setuju = await konfirmasi('Akun petugas ini akan dihapus permanen.', { judul: 'Hapus akun petugas?', teksSetuju: 'Ya, hapus', berbahaya: true });
    if (!setuju) return;
    try {
      await authService.deleteUser(getToken(), id);
      fetchUsers(getToken());
    } catch (err) { beriTahuGagal(err.response?.data?.message || 'Terjadi kesalahan pada sistem.'); }
  };

  const openUserModal = (u = null) => {
    if (u) setUserForm({ id: u._id, name: u.name, email: u.email, password: '', role: u.role });
    else setUserForm({ id: '', name: '', email: '', password: '', role: 'petugas_uptd' });
    setShowUserPassword(false);
    setShowUserModal(true);
  };

  // ==================== ACTIONS: PUSAT KENDALI LAYANAN ====================

  const saveMaster = async (e) => {
    e.preventDefault();
    setSavingMaster(true);
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
      beriTahuGagal(err.response?.data?.message || 'Data master gagal disimpan.');
    } finally {
      setSavingMaster(false);
    }
  };

  const deleteMaster = async (type, id) => {
    const setuju = await konfirmasi('Data ini dipakai laporan lama, menghapusnya bisa berdampak pada riwayat kasus.', { judul: 'Hapus data master?', teksSetuju: 'Ya, hapus', berbahaya: true });
    if (!setuju) return;
    try {
      const tok = getToken();
      if (type === 'kekerasan') await laporanService.deleteMasterKekerasan(tok, id);
      else await kasusService.deleteMasterMetode(tok, id);
      fetchMaster(tok);
    } catch (err) { beriTahuGagal(err.response?.data?.message || 'Terjadi kesalahan pada sistem.'); }
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
      if (!cocokDenganFilterKategori(r, filterKategori)) return false;
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

  // Ekspor .xlsx asli (bukan CSV yang diberi nama .xlsx), supaya kolom tanggal
  // dan usia tetap bertipe tanggal/angka di Excel — bisa langsung disortir dan
  // difilter. Yang diekspor adalah data hasil filter yang sedang tampil.
  const handleExportExcel = async () => {
    const data = getFilteredReports();
    if (data.length === 0) return beriTahuKurang('Tidak ada data untuk diekspor.');

    const headerRow = EXPORT_COLUMNS.map(col => ({
      value: col.header,
      fontWeight: 'bold',
      backgroundColor: '#1a56db',
      textColor: '#ffffff',
      align: 'center',
      wrap: true,
    }));

    const bodyRows = data.map(r => {
      const tgl = new Date(r.tanggal_kejadian);
      const nilai = {
        ...r,
        tanggal: isNaN(tgl.getTime()) ? null : tgl,
        usia_korban: Number.isFinite(Number(r.usia_korban)) ? Number(r.usia_korban) : null,
        kategori: labelKategoriKorban(r).join(', '),
        status: labelStatus(r.status),
      };

      return EXPORT_COLUMNS.map(col => ({
        value: nilai[col.key] ?? null,
        type: col.type,
        format: col.format,
        align: col.align,
        wrap: col.wrap,
      }));
    });

    setExporting(true);
    try {
      await writeExcelFile([headerRow, ...bodyRows], {
        sheet: 'Data Pelaporan',
        columns: EXPORT_COLUMNS.map(col => ({ width: col.width })),
        stickyRowsCount: 1, // baris judul tetap terlihat saat digulir
      }).toFile(`Data_Pelaporan_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      beriTahuGagal(err.message, 'Gagal membuat file Excel');
    } finally {
      setExporting(false);
    }
  };

  if (!user) return null;

  // ==================== RENDER ====================

  const activeMasterItems = (activeMasterTab === 'kekerasan' ? masterKekerasan : masterMetode).map(item => ({
    ...item,
    masterType: activeMasterTab,
    masterName: activeMasterTab === 'kekerasan' ? item.nama_kategori : item.nama_metode,
    masterDescription: item.deskripsi || 'Belum ada deskripsi untuk data ini.',
  }));
  const activeMasterCount = activeMasterItems.filter(item => item.is_active).length;

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
        <SidebarUserMenu user={user} roleLabel="Super Admin" onLogout={handleLogout} />
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
              <div className="col-lg-8"><SebaranKelurahanChart data={allReports} /></div>
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
          <div className="master-card service-control-card">
            <div className="service-control-header">
              <div>
                <h4>Manajemen Petugas</h4>
                <p>Kelola Petugas Yang Menangani Pelaporan dan Manajemen Kasus.</p>
              </div>
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
                    <span className={`user-role-badge ${u.role === 'super_admin' ? 'is-admin' : 'is-officer'}`}>
                      <i className={`bi ${u.role === 'super_admin' ? 'bi-shield-lock' : 'bi-person-badge'}`} aria-hidden="true"></i>
                      {u.role === 'super_admin' ? 'Super Admin' : 'Petugas UPTD'}
                    </span>
                    <div className="actions d-flex gap-2">
                      <button type="button" className="user-action-button edit" onClick={() => openUserModal(u)} aria-label={`Edit akun ${u.name}`} title="Edit akun"><i className="bi bi-pencil" aria-hidden="true"></i></button>
                      <button type="button" className="user-action-button delete" onClick={() => deleteUser(u._id)} disabled={u._id === user.id} aria-label={`Hapus akun ${u.name}`} title="Hapus akun"><i className="bi bi-trash" aria-hidden="true"></i></button>
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
          <div className="master-card service-control-card">
            <div className="service-control-header">
              <div>
                <h4>Pusat Kendali Layanan</h4>
                <p>Kelola pilihan yang digunakan dalam pelaporan dan penanganan kasus.</p>
              </div>
              <button type="button" className="btn service-add-button" onClick={() => openMasterModal(activeMasterTab)}>
                <i className="bi bi-plus-lg" aria-hidden="true"></i> Tambah {activeMasterTab === 'kekerasan' ? 'Kategori' : 'Metode'}
              </button>
            </div>

            <div className="service-control-toolbar">
              <div className="service-segmented-tabs" role="tablist" aria-label="Jenis master data">
                <button type="button" role="tab" aria-selected={activeMasterTab === 'kekerasan'} className={activeMasterTab === 'kekerasan' ? 'active' : ''} onClick={() => setActiveMasterTab('kekerasan')}>
                  <i className="bi bi-shield-exclamation" aria-hidden="true"></i>
                  Kategori Kekerasan <span>{masterKekerasan.length}</span>
                </button>
                <button type="button" role="tab" aria-selected={activeMasterTab === 'metode'} className={activeMasterTab === 'metode' ? 'active' : ''} onClick={() => setActiveMasterTab('metode')}>
                  <i className="bi bi-heart-pulse" aria-hidden="true"></i>
                  Metode Penanganan <span>{masterMetode.length}</span>
                </button>
              </div>
              <div className="service-control-stats" aria-label="Ringkasan data aktif">
                <span><strong>{activeMasterItems.length}</strong> Total</span>
                <span><strong>{activeMasterCount}</strong> Aktif</span>
              </div>
            </div>

            <div className="master-list service-control-list" role="tabpanel">
              {activeMasterItems.map(item => (
                <div className="master-list-item service-control-item" key={item._id}>
                  <div className={`service-item-icon ${item.masterType}`}>
                    <i className={`bi ${item.masterType === 'kekerasan' ? 'bi-shield-exclamation' : 'bi-heart-pulse'}`} aria-hidden="true"></i>
                  </div>
                  <div className="service-item-copy">
                    <strong>{item.masterName}</strong>
                    <p>{item.masterDescription}</p>
                  </div>
                  <div className="service-item-controls">
                    <span className={`service-status-badge ${item.is_active ? 'active' : 'inactive'}`}>
                      <span aria-hidden="true"></span>{item.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                    <div className="actions d-flex gap-2">
                      <button type="button" className="user-action-button edit" onClick={() => openMasterModal(item.masterType, item)} aria-label={`Edit ${item.masterName}`} title="Edit"><i className="bi bi-pencil" aria-hidden="true"></i></button>
                      <button type="button" className="user-action-button delete" onClick={() => deleteMaster(item.masterType, item._id)} aria-label={`Hapus ${item.masterName}`} title="Hapus"><i className="bi bi-trash" aria-hidden="true"></i></button>
                    </div>
                  </div>
                </div>
              ))}
              {activeMasterItems.length === 0 && (
                <div className="service-empty-state">
                  <span><i className="bi bi-inbox" aria-hidden="true"></i></span>
                  <strong>Belum ada {activeMasterTab === 'kekerasan' ? 'kategori kekerasan' : 'metode penanganan'}</strong>
                  <p>Tambahkan data agar dapat digunakan pada alur layanan SIPEKA.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. TAB DATA PELAPORAN (filter + export .xlsx) */}
        {activeMenu === 'export' && (
          <div className="modern-table-card">
            {/* Toolbar: judul di kiri, pencarian + filter + ekspor di kanan */}
            <div className="modern-table-toolbar">
              <h6 className="modern-table-title">Data Pelaporan</h6>

              <div className="modern-table-controls">
                <div className="modern-table-search">
                  <i className="bi bi-search search-icon"></i>
                  <input
                    type="text"
                    placeholder="Cari laporan..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>

                <select className="toolbar-select" value={filterKategori} onChange={e => setFilterKategori(e.target.value)}>
                  <option value="">Semua Kategori</option>
                  <option value="anak">Anak</option>
                  <option value="perempuan">Perempuan</option>
                </select>

                <select className="toolbar-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="">Semua Status</option>
                  <option value="menunggu_registrasi">Menunggu Registrasi</option>
                  <option value="proses_assessment">Proses Assessment</option>
                  <option value="dalam_penanganan">Dalam Penanganan</option>
                  <option value="selesai">Selesai</option>
                </select>

                <button
                  className="btn btn-success btn-sm rounded-pill px-3 fw-bold"
                  onClick={handleExportExcel}
                  disabled={exporting}
                >
                  <i className="bi bi-file-earmark-excel me-1"></i>
                  {exporting ? 'Menyiapkan...' : 'Export Excel'}
                </button>
              </div>
            </div>

            {/* Filter lanjutan: rentang tanggal & wilayah */}
            <div className="d-flex align-items-center gap-2 px-4 py-2 bg-light border-bottom flex-wrap">
              <small className="text-muted fw-bold me-1">Filter Lanjutan:</small>
              <input type="date" className="form-control form-control-sm rounded-pill" style={{ width: 'auto' }} value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} />
              <small className="text-muted">s/d</small>
              <input type="date" className="form-control form-control-sm rounded-pill" style={{ width: 'auto' }} value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} />
              <select className="toolbar-select" value={filterRegion} onChange={e => setFilterRegion(e.target.value)}>
                <option value="">Semua Wilayah</option>
                {[...new Set(allReports.map(r => r.kelurahan_korban).filter(Boolean))].sort().map(reg => (
                  <option key={reg} value={reg}>{reg}</option>
                ))}
              </select>

              {(searchQuery || filterKategori || filterStatus || filterStartDate || filterEndDate || filterRegion) && (
                <button
                  className="btn btn-sm btn-light text-muted rounded-pill px-3"
                  onClick={() => { setSearchQuery(''); setFilterKategori(''); setFilterStatus(''); setFilterStartDate(''); setFilterEndDate(''); setFilterRegion(''); }}
                >
                  <i className="bi bi-x-circle me-1"></i>Reset
                </button>
              )}

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
                        {kategoriKorban(r).map(kategori => (
                          <span key={kategori} className={`status-pill me-1 ${kategori === 'anak' ? 'status-pill-warning' : 'status-pill-info'}`}>
                            {kategori === 'anak' ? 'Anak' : 'Perempuan'}
                          </span>
                        ))}
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
        <div className="modal fade show d-block admin-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="user-modal-title">
          <div className="modal-dialog modal-dialog-centered account-modal-dialog">
            <form className="modal-content account-modal" onSubmit={saveUser}>
              <div className="account-modal-header">
                <div className="account-modal-heading">
                  <span className="account-modal-icon"><i className={`bi ${userForm.id ? 'bi-person-gear' : 'bi-person-plus'}`} aria-hidden="true"></i></span>
                  <div>
                    <h5 id="user-modal-title">{userForm.id ? 'Edit akun petugas' : 'Tambah akun petugas'}</h5>
                    <p>{userForm.id ? 'Perbarui identitas dan hak akses akun.' : 'Buat akun baru untuk mengakses layanan SIPEKA.'}</p>
                  </div>
                </div>
                <button type="button" className="account-modal-close" onClick={() => setShowUserModal(false)} aria-label="Tutup modal">
                  <i className="bi bi-x-lg" aria-hidden="true"></i>
                </button>
              </div>
              <div className="account-modal-body">
                <div className="account-form-field">
                  <label htmlFor="account-name">Nama lengkap</label>
                  <div className="account-input-wrap">
                    <i className="bi bi-person" aria-hidden="true"></i>
                    <input id="account-name" type="text" className="form-control" autoComplete="name" placeholder="Contoh: Nur Aisyah" value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} required />
                  </div>
                </div>
                <div className="account-form-field">
                  <label htmlFor="account-email">Alamat email</label>
                  <div className="account-input-wrap">
                    <i className="bi bi-envelope" aria-hidden="true"></i>
                    <input id="account-email" type="email" className="form-control" autoComplete="email" placeholder="nama@kendari.go.id" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} required />
                  </div>
                </div>
                <div className="account-form-field">
                  <label htmlFor="account-password">Password</label>
                  <div className="account-input-wrap has-action">
                    <i className="bi bi-lock" aria-hidden="true"></i>
                    <input id="account-password" type={showUserPassword ? 'text' : 'password'} className="form-control" autoComplete="new-password" placeholder={userForm.id ? 'Masukkan hanya jika ingin diubah' : 'Minimal 6 karakter'} value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} required={!userForm.id} minLength={userForm.password ? 6 : undefined} />
                    <button type="button" className="account-password-toggle" onClick={() => setShowUserPassword(nilai => !nilai)} aria-label={showUserPassword ? 'Sembunyikan password' : 'Tampilkan password'}>
                      <i className={`bi ${showUserPassword ? 'bi-eye-slash' : 'bi-eye'}`} aria-hidden="true"></i>
                    </button>
                  </div>
                  {userForm.id && <small>Kosongkan jika password tidak ingin diubah.</small>}
                </div>
                <fieldset className="account-role-fieldset">
                  <legend>Hak akses</legend>
                  <div className="account-role-grid">
                    <label className={`account-role-option ${userForm.role === 'petugas_uptd' ? 'selected' : ''}`}>
                      <input type="radio" name="account-role" value="petugas_uptd" checked={userForm.role === 'petugas_uptd'} onChange={e => setUserForm({ ...userForm, role: e.target.value })} />
                      <span className="account-role-icon"><i className="bi bi-person-badge" aria-hidden="true"></i></span>
                      <span><strong>Petugas UPTD</strong><small>Menangani dan memperbarui proses kasus.</small></span>
                      <i className="bi bi-check-circle-fill account-role-check" aria-hidden="true"></i>
                    </label>
                    <label className={`account-role-option ${userForm.role === 'super_admin' ? 'selected' : ''}`}>
                      <input type="radio" name="account-role" value="super_admin" checked={userForm.role === 'super_admin'} onChange={e => setUserForm({ ...userForm, role: e.target.value })} />
                      <span className="account-role-icon"><i className="bi bi-shield-lock" aria-hidden="true"></i></span>
                      <span><strong>Super Admin</strong><small>Mengelola akun, layanan, dan seluruh data.</small></span>
                      <i className="bi bi-check-circle-fill account-role-check" aria-hidden="true"></i>
                    </label>
                  </div>
                </fieldset>
              </div>
              <div className="account-modal-footer">
                <button type="button" className="btn account-btn-secondary" onClick={() => setShowUserModal(false)} disabled={savingUser}>Batal</button>
                <button type="submit" className="btn account-btn-primary" disabled={savingUser}>
                  {savingUser ? <><span className="spinner-border spinner-border-sm" aria-hidden="true"></span> Menyimpan...</> : <><i className="bi bi-check2" aria-hidden="true"></i> {userForm.id ? 'Simpan perubahan' : 'Buat akun'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Master */}
      {showMasterModal && (
        <div className="modal fade show d-block admin-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="master-modal-title">
          <div className="modal-dialog modal-dialog-centered account-modal-dialog">
            <form className="modal-content account-modal service-master-modal" onSubmit={saveMaster}>
              <div className="account-modal-header">
                <div className="account-modal-heading">
                  <span className="account-modal-icon"><i className={`bi ${masterType === 'kekerasan' ? 'bi-shield-plus' : 'bi-heart-pulse'}`} aria-hidden="true"></i></span>
                  <div>
                    <h5 id="master-modal-title">{masterForm.id ? 'Edit' : 'Tambah'} {masterType === 'kekerasan' ? 'kategori kekerasan' : 'metode penanganan'}</h5>
                    <p>{masterType === 'kekerasan' ? 'Atur kategori yang tersedia pada formulir pelaporan.' : 'Atur metode yang dapat dipilih dalam penanganan kasus.'}</p>
                  </div>
                </div>
                <button type="button" className="account-modal-close" onClick={() => setShowMasterModal(false)} disabled={savingMaster} aria-label="Tutup modal">
                  <i className="bi bi-x-lg" aria-hidden="true"></i>
                </button>
              </div>
              <div className="account-modal-body">
                <div className="account-form-field">
                  <label htmlFor="master-name">Nama {masterType === 'kekerasan' ? 'kategori' : 'metode'}</label>
                  <div className="account-input-wrap">
                    <i className={`bi ${masterType === 'kekerasan' ? 'bi-shield-exclamation' : 'bi-heart-pulse'}`} aria-hidden="true"></i>
                    <input id="master-name" type="text" className="form-control" placeholder={masterType === 'kekerasan' ? 'Contoh: Kekerasan Fisik' : 'Contoh: Bantuan Hukum'} value={masterForm.nama} onChange={e => setMasterForm({ ...masterForm, nama: e.target.value })} required />
                  </div>
                </div>
                <div className="account-form-field">
                  <label htmlFor="master-description">Deskripsi <span className="service-optional-label">Opsional</span></label>
                  <div className="account-input-wrap service-textarea-wrap">
                    <i className="bi bi-text-left" aria-hidden="true"></i>
                    <textarea id="master-description" className="form-control" rows="3" placeholder="Tuliskan penjelasan singkat agar mudah dipahami petugas." value={masterForm.deskripsi} onChange={e => setMasterForm({ ...masterForm, deskripsi: e.target.value })}></textarea>
                  </div>
                </div>
                <label className={`service-status-card ${masterForm.is_active ? 'selected' : ''}`} htmlFor="master-active">
                  <span className="service-status-card-icon"><i className={`bi ${masterForm.is_active ? 'bi-eye' : 'bi-eye-slash'}`} aria-hidden="true"></i></span>
                  <span className="service-status-card-copy">
                    <strong>{masterForm.is_active ? 'Aktif dan ditampilkan' : 'Nonaktif dan disembunyikan'}</strong>
                    <small>{masterForm.is_active ? 'Data dapat dipilih pada proses layanan terkait.' : 'Data lama tetap tersimpan, tetapi tidak tersedia untuk pilihan baru.'}</small>
                  </span>
                  <span className="form-check form-switch service-status-switch">
                    <input id="master-active" className="form-check-input" type="checkbox" role="switch" checked={masterForm.is_active} onChange={e => setMasterForm({ ...masterForm, is_active: e.target.checked })} />
                  </span>
                </label>
              </div>
              <div className="account-modal-footer">
                <button type="button" className="btn account-btn-secondary" onClick={() => setShowMasterModal(false)} disabled={savingMaster}>Batal</button>
                <button type="submit" className="btn account-btn-primary" disabled={savingMaster}>
                  {savingMaster ? <><span className="spinner-border spinner-border-sm" aria-hidden="true"></span> Menyimpan...</> : <><i className="bi bi-check2" aria-hidden="true"></i> {masterForm.id ? 'Simpan perubahan' : 'Tambah data'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
