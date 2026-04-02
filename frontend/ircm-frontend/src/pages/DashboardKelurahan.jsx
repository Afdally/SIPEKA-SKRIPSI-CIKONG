import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_REPORT = 'http://localhost:8080/api';
const API_VERIF  = 'http://localhost:8080/api';
const API_AUTH   = 'http://localhost:8080/api';

/* ── CSS injected once ── */
const style = `
  :root {
    --biru-tua:  #0d3d8e;
    --biru:      #1565c0;
    --biru-muda: #e8f0fb;
    --border:    #c5d6f0;
  }

  .sipeka-body { background: #f4f7fc; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; }

  /* Topbar */
  .sipeka-topbar {
    background: var(--biru-tua); color: #fff;
    padding: .75rem 1.5rem; display: flex;
    align-items: center; justify-content: space-between;
    position: sticky; top: 0; z-index: 100;
    box-shadow: 0 2px 8px rgba(0,0,0,.2);
  }
  .sipeka-brand { font-weight: 700; font-size: .95rem; line-height: 1.2; }
  .sipeka-brand small { font-weight: 400; opacity: .8; font-size: .72rem; display: block; }
  .user-badge {
    background: rgba(255,255,255,.15); border-radius: .5rem;
    padding: .35rem .85rem; font-size: .82rem;
    display: flex; align-items: center; gap: .5rem;
  }

  /* Stat Cards */
  .stat-card {
    background: #fff; border-radius: .8rem;
    padding: 1.2rem 1.4rem; color: #1a1a2e;
    display: flex; align-items: center; gap: 1rem;
    transition: all .2s;
    border: 2px solid var(--biru);
    box-shadow: 0 2px 10px rgba(13,61,142,.05);
    height: 100%;
  }
  .stat-card:hover {
    transform: translateY(-3px);
    border-color: var(--biru-tua);
    background: var(--biru-muda);
  }
  .stat-icon {
    width: 52px; height: 52px;
    background: var(--biru-muda); color: var(--biru);
    border-radius: .6rem;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.5rem; flex-shrink: 0;
  }
  .stat-num { font-size: 1.8rem; font-weight: 800; line-height: 1; color: var(--biru-tua); }
  .stat-lbl { font-size: .78rem; color: #64748b; margin-top: .2rem; font-weight: 600; }

  /* Card */
  .card-custom {
    background: #fff; border-radius: .8rem;
    box-shadow: 0 2px 12px rgba(13,61,142,.08);
    border: none; overflow: hidden;
  }
  .card-header-sipeka {
    background: transparent; border-bottom: 1.5px solid var(--border);
    padding: 1.25rem 1.5rem; font-weight: 700; font-size: .95rem; color: var(--biru-tua);
    display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;
  }

  /* Table */
  .sipeka-table th {
    font-size: .75rem; text-transform: uppercase; letter-spacing: .05em;
    color: #6c757d; background: #f8fafd;
    padding: 1rem; border-bottom: 2px solid var(--border) !important;
  }
  .sipeka-table td { padding: 1rem; font-size: .88rem; vertical-align: middle; }
  .sipeka-table tbody tr:hover { background: var(--biru-muda); }

  /* Status badges */
  .badge-menunggu   { background:#fff3cd; color:#856404; font-size:.7rem; padding:.4em .8em; }
  .badge-verif      { background:#d1e7dd; color:#0a3622; font-size:.7rem; padding:.4em .8em; }
  .badge-tolak      { background:#f8d7da; color:#58151c; font-size:.7rem; padding:.4em .8em; }
  .badge-diteruskan { background:#cfe2ff; color:#084298; font-size:.7rem; padding:.4em .8em; }

  /* Buttons */
  .btn-biru   { background: var(--biru); border: none; color: #fff; font-weight: 600; }
  .btn-biru:hover { background: var(--biru-tua); color: #fff; }
  .btn-detail {
    background: var(--biru-muda); color: var(--biru);
    border: none; font-size: .8rem; padding: .4rem .9rem;
    font-weight: 600; border-radius: 8px; cursor: pointer;
    transition: .15s;
  }
  .btn-detail:hover { background: var(--biru); color: #fff; }

  /* Detail modal */
  .detail-section { margin-bottom: 1.5rem; }
  .detail-section h6 {
    font-size: .75rem; font-weight: 700; letter-spacing: .08em;
    text-transform: uppercase; color: var(--biru); margin-bottom: .8rem;
    padding-bottom: .4rem; border-bottom: 1.5px solid var(--border);
  }
  .detail-row { display: flex; gap: .5rem; margin-bottom: .5rem; font-size: .88rem; }
  .detail-row .lbl { color: #6c757d; min-width: 160px; flex-shrink: 0; }
  .detail-row .val { font-weight: 600; color: #111827; }

  .action-bar {
    background: #f8fafd; border-top: 1.5px solid var(--border);
    padding: 1.25rem 1.5rem; display: flex; gap: .75rem; flex-wrap: wrap; justify-content: flex-end;
  }

  .empty-state { text-align: center; padding: 4rem 2rem; color: #64748b; }
  .empty-state i { font-size: 3.5rem; opacity: .2; display: block; margin-bottom: 1rem; }
`;

const STATUS_CONFIG = {
  menunggu_verifikasi: { cls:'badge-menunggu', label:'Menunggu Verifikasi' },
  diverifikasi:        { cls:'badge-verif',    label:'Diverifikasi' },
  ditolak:             { cls:'badge-tolak',    label:'Ditolak' },
  diteruskan_dp3a:     { cls:'badge-diteruskan', label:'Diteruskan ke DP3A' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { cls:'', label: status };
  return (
    <span className={`badge rounded-pill ${cfg.cls}`}>{cfg.label}</span>
  );
}

function DetailSection({ title, children }) {
  return (
    <div className="detail-section">
      <h6>{title}</h6>
      {children}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="detail-row">
      <span className="lbl">{label}</span>
      <span className="val">{value || '-'}</span>
    </div>
  );
}

function ConfirmModal({ title, headerBg, iconClass, message, placeholder, catatan, setCatatan, submitting, onConfirm, onCancel, confirmLabel, confirmBtnClass }) {
  return (
    <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.55)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 480 }}>
        <div className="modal-content border-0 rounded-4">
          <div className={`modal-header ${headerBg} text-white`}>
            <h6 className="modal-title fw-bold">{title}</h6>
            <button type="button" className="btn-close btn-close-white" onClick={onCancel}></button>
          </div>
          <div className="modal-body p-4 text-center">
            <i className={`bi ${iconClass} fs-1 mb-3 d-block`}></i>
            <p className="mb-0">{message}</p>
            <textarea className="form-control mt-3" rows={3} placeholder={placeholder}
              value={catatan} onChange={e => setCatatan(e.target.value)} />
          </div>
          <div className="modal-footer border-0">
            <button className="btn btn-light" onClick={onCancel} disabled={submitting}>Batal</button>
            <button className={`btn ${confirmBtnClass} px-4 fw-semibold`} onClick={onConfirm} disabled={submitting}>
              {submitting && <span className="spinner-border spinner-border-sm me-1"></span>}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardKelurahan() {
  const navigate = useNavigate();
  const [user, setUser]                 = useState(null);
  const [reports, setReports]           = useState([]);
  const [filtered, setFiltered]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetail, setShowDetail]     = useState(false);
  const [showVerif, setShowVerif]       = useState(false);
  const [showTolak, setShowTolak]       = useState(false);
  const [showTeruskan, setShowTeruskan] = useState(false);
  const [catatan, setCatatan]           = useState('');
  const [submitting, setSubmitting]     = useState(false);

  const getToken = () => localStorage.getItem('sipeka_token');

  useEffect(() => {
    const rawUser = localStorage.getItem('sipeka_user');
    const tok = getToken();
    if (!tok || !rawUser) { navigate('/login'); return; }
    setUser(JSON.parse(rawUser));
    fetchReports(tok);
  }, [navigate]);

  const fetchReports = async (tok) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_REPORT}/laporan`, {
        headers: { Authorization: `Bearer ${tok || getToken()}` }
      });
      const data = res.data.data || [];
      setReports(data);
      applyFilter(data, filterStatus);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = (data, val) => {
    setFiltered(val ? data.filter(r => r.status === val) : data);
  };

  const handleFilterChange = (val) => {
    setFilterStatus(val);
    applyFilter(reports, val);
  };

  const counts = {
    total:        reports.length,
    menunggu:     reports.filter(r => r.status === 'menunggu_verifikasi').length,
    diverifikasi: reports.filter(r => r.status === 'diverifikasi').length,
    ditolak:      reports.filter(r => r.status === 'ditolak').length,
    diteruskan:   reports.filter(r => r.status === 'diteruskan_dp3a').length,
  };

  const openDetail = async (report) => {
    try {
      const res = await axios.get(`${API_REPORT}/laporan/${report.id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setSelectedReport(res.data.data || report);
    } catch {
      setSelectedReport(report);
    }
    setCatatan('');
    setShowDetail(true);
  };

  const closeAllModals = () => {
    setShowDetail(false); setShowVerif(false);
    setShowTolak(false); setShowTeruskan(false);
    setCatatan('');
  };

  const doAction = async (action) => {
    if (!selectedReport) return;
    setSubmitting(true);
    try {
      const lapId = selectedReport.id || selectedReport._id;
      await axios.post(`${API_VERIF}/verifikasi/${action}`, {
        laporan_id:   String(lapId),
        kode_laporan: selectedReport.kode_laporan,
        catatan
      }, { headers: { Authorization: `Bearer ${getToken()}` } });
      closeAllModals();
      await fetchReports(getToken());
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memproses laporan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    if (!window.confirm('Yakin ingin keluar?')) return;
    localStorage.removeItem('sipeka_token');
    localStorage.removeItem('sipeka_user');
    navigate('/login');
  };

  if (!user) return null;

  const canProcess = selectedReport && selectedReport.status === 'menunggu_verifikasi';
  const tgl = new Date().toLocaleDateString('id-ID', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  const statCards = [
    { icon:'bi-file-earmark-text', num:counts.total,        lbl:'Total Laporan' },
    { icon:'bi-hourglass-split',   num:counts.menunggu,     lbl:'Menunggu Verif' },
    { icon:'bi-patch-check',       num:counts.diverifikasi, lbl:'Diverifikasi' },
    { icon:'bi-x-circle',          num:counts.ditolak,      lbl:'Ditolak' },
    { icon:'bi-send-check',        num:counts.diteruskan,   lbl:'Diteruskan DP3A' },
  ];

  return (
    <div className="sipeka-body" style={{ minHeight: '100vh' }}>
      <style>{style}</style>

      {/* TOPBAR */}
      <div className="sipeka-topbar">
        <div className="sipeka-brand">
          <span><i className="bi bi-shield-check me-2"></i>SIPEKA KENDARI</span>
          <small>Sistem Pelaporan Kekerasan Perempuan &amp; Anak</small>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="user-badge d-none d-sm-flex">
            <i className="bi bi-person-circle"></i>
            <span>{user.name}</span>
          </div>
          <button className="btn btn-outline-light btn-sm fw-bold" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right me-1"></i>Logout
          </button>
        </div>
      </div>

      <div className="container-fluid px-4 py-4">

        {/* GREETING */}
        <div className="mb-4">
          <h4 className="fw-bold mb-1" style={{ color:'var(--biru-tua)' }}>
            Selamat Datang, <span>{user.name}</span>
          </h4>
          <div className="d-flex align-items-center gap-2 text-muted small flex-wrap">
            <i className="bi bi-geo-alt-fill text-primary"></i>
            Kelurahan: <strong>{user.kelurahan || 'Admin Kelurahan'}</strong>
            <span className="mx-2">|</span>
            <i className="bi bi-calendar3 text-primary"></i>
            <span>{tgl}</span>
          </div>
        </div>

        {/* STAT CARDS */}
        <div className="row g-3 mb-4">
          {statCards.map((s, i) => (
            <div key={i} className={i === 4 ? 'col-12 col-xl' : 'col-6 col-xl'}>
              <div className="stat-card">
                <div className="stat-icon"><i className={`bi ${s.icon}`}></i></div>
                <div>
                  <div className="stat-num">{s.num}</div>
                  <div className="stat-lbl">{s.lbl}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* TABLE CARD */}
        <div className="card-custom">
          <div className="card-header-sipeka">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-list-ul fs-5 text-primary"></i>
              <span>Manajemen Laporan Masyarakat</span>
            </div>
            <div className="d-flex gap-2 align-items-center flex-grow-1 flex-sm-grow-0">
              <select className="form-select form-select-sm" style={{ maxWidth: 200 }}
                value={filterStatus} onChange={e => handleFilterChange(e.target.value)}>
                <option value="">Semua Status</option>
                <option value="menunggu_verifikasi">Menunggu Verifikasi</option>
                <option value="diverifikasi">Diverifikasi</option>
                <option value="ditolak">Ditolak</option>
                <option value="diteruskan_dp3a">Diteruskan ke DP3A</option>
              </select>
              <button className="btn btn-biru btn-sm px-3" onClick={() => fetchReports(getToken())}>
                <i className="bi bi-arrow-clockwise me-1"></i>Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5 text-muted">
              <span className="spinner-border spinner-border-sm me-2"></span>Memuat data laporan...
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <i className="bi bi-inbox"></i>
              <p className="fw-semibold">Belum ada laporan masuk</p>
              <small>Laporan dari masyarakat di wilayah Anda akan muncul di sini</small>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0 sipeka-table">
                <thead>
                  <tr>
                    <th className="ps-4">Kode Laporan</th>
                    <th>Nama Korban</th>
                    <th>Jenis Kekerasan</th>
                    <th>Tgl. Kejadian</th>
                    <th>Tgl. Lapor</th>
                    <th>Status</th>
                    <th className="text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id || r._id}>
                      <td className="ps-4 fw-bold font-monospace" style={{ color:'var(--biru)' }}>{r.kode_laporan}</td>
                      <td style={{ fontWeight: 500 }}>{r.nama_korban}</td>
                      <td>{r.jenis_kekerasan}</td>
                      <td className="text-muted">{r.tanggal_kejadian || '-'}</td>
                      <td className="text-muted">
                        {r.tanggal_lapor || (r.createdAt ? new Date(r.createdAt).toLocaleDateString('id-ID') : '-')}
                      </td>
                      <td><StatusBadge status={r.status} /></td>
                      <td className="text-center">
                        <button className="btn-detail" onClick={() => openDetail(r)}>
                          <i className="bi bi-eye me-1"></i>Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── DETAIL MODAL ── */}
      {showDetail && selectedReport && (
        <div className="modal fade show d-block" style={{ background:'rgba(0,0,0,0.55)', zIndex:1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable" style={{ maxWidth:720 }}>
            <div className="modal-content border-0 rounded-4 shadow">
              <div className="modal-header" style={{ background:'#0d3d8e', color:'#fff', borderRadius:'1rem 1rem 0 0' }}>
                <div>
                  <h6 className="modal-title fw-bold mb-0">Detail Berkas Laporan</h6>
                  <small style={{ opacity:.75 }}>{selectedReport.kode_laporan}</small>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowDetail(false)}></button>
              </div>

              <div className="modal-body p-4">
                <div className="text-end mb-4">
                  <StatusBadge status={selectedReport.status} />
                </div>

                <DetailSection title="Data Pelapor">
                  <DetailRow label="Status" value={selectedReport.anonim ? 'Anonim (Identitas Disembunyikan)' : 'Identitas Diketahui'} />
                  {!selectedReport.anonim && <>
                    <DetailRow label="Nama Pelapor"    value={selectedReport.nama_pelapor} />
                    <DetailRow label="No. Telepon"     value={selectedReport.telepon_pelapor} />
                    <DetailRow label="Hubungan Korban" value={selectedReport.hubungan_korban} />
                  </>}
                </DetailSection>

                <DetailSection title="Data Korban">
                  <DetailRow label="Nama Korban"   value={selectedReport.nama_korban} />
                  <DetailRow label="Usia"          value={selectedReport.usia_korban ? `${selectedReport.usia_korban} Tahun` : null} />
                  <DetailRow label="Jenis Kelamin" value={selectedReport.jenis_kelamin} />
                  <DetailRow label="Kelurahan"     value={selectedReport.kelurahan_korban} />
                  <DetailRow label="Alamat"        value={selectedReport.alamat_korban} />
                </DetailSection>

                <DetailSection title="Isi Laporan">
                  <DetailRow label="Jenis Kekerasan"  value={selectedReport.jenis_kekerasan} />
                  <DetailRow label="Tanggal Kejadian" value={
                    selectedReport.tanggal_kejadian
                      ? new Date(selectedReport.tanggal_kejadian).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' })
                      : null
                  } />
                  <DetailRow label="Lokasi Kejadian" value={selectedReport.lokasi_kejadian} />
                </DetailSection>

                <DetailSection title="Kronologi Kejadian">
                  <div className="p-3 rounded-3 bg-light border" style={{ fontSize:'.88rem', lineHeight:1.7 }}>
                    {selectedReport.kronologi || <span className="text-muted fst-italic">Data tidak tersedia.</span>}
                  </div>
                </DetailSection>

                {selectedReport.bukti_file && (
                  <DetailSection title="Bukti Pendukung">
                    <a href={`http://localhost:8080/${selectedReport.bukti_file}`} target="_blank" rel="noreferrer"
                       className="btn btn-sm btn-outline-primary d-inline-flex align-items-center">
                      <i className="bi bi-file-earmark-image me-1"></i>Lihat File Bukti
                    </a>
                  </DetailSection>
                )}

                {selectedReport.catatan && (
                  <div className="alert alert-warning border-0 rounded-3">
                    <strong><i className="bi bi-info-circle me-1"></i>Catatan Petugas:</strong><br/>
                    {selectedReport.catatan}
                  </div>
                )}
              </div>

              <div className="action-bar">
                <button className="btn btn-light btn-sm px-3" onClick={() => setShowDetail(false)}>Tutup</button>
                {canProcess && <>
                  <button className="btn btn-danger btn-sm px-3 fw-semibold"
                    onClick={() => { setShowDetail(false); setCatatan(''); setShowTolak(true); }}>
                    <i className="bi bi-x-circle me-1"></i>Tolak Laporan
                  </button>
                  <button className="btn btn-success btn-sm px-3 fw-semibold"
                    onClick={() => { setShowDetail(false); setCatatan(''); setShowVerif(true); }}>
                    <i className="bi bi-patch-check me-1"></i>Verifikasi Valid
                  </button>
                  <button className="btn btn-primary btn-sm px-3 fw-semibold"
                    onClick={() => { setShowDetail(false); setCatatan(''); setShowTeruskan(true); }}>
                    <i className="bi bi-send-check me-1"></i>Teruskan ke DP3A
                  </button>
                </>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── VERIFIKASI MODAL ── */}
      {showVerif && (
        <ConfirmModal
          title="Konfirmasi Verifikasi"
          headerBg="bg-success"
          iconClass="bi-check-circle-fill text-success"
          message={<>Laporan <strong>{selectedReport?.kode_laporan}</strong> akan ditandai sebagai <strong>Valid</strong>.</>}
          placeholder="Tambahkan catatan verifikasi (opsional)..."
          catatan={catatan} setCatatan={setCatatan}
          submitting={submitting}
          onConfirm={() => doAction('terima')}
          onCancel={() => setShowVerif(false)}
          confirmLabel="Ya, Verifikasi"
          confirmBtnClass="btn-success"
        />
      )}

      {/* ── TOLAK MODAL ── */}
      {showTolak && (
        <ConfirmModal
          title="Tolak Laporan"
          headerBg="bg-danger"
          iconClass="bi-x-circle-fill text-danger"
          message={<>Berikan alasan penolakan untuk laporan <strong>{selectedReport?.kode_laporan}</strong>.</>}
          placeholder="Jelaskan alasan laporan ditolak..."
          catatan={catatan} setCatatan={setCatatan}
          submitting={submitting}
          onConfirm={() => doAction('tolak')}
          onCancel={() => setShowTolak(false)}
          confirmLabel="Tolak Sekarang"
          confirmBtnClass="btn-danger"
        />
      )}

      {/* ── TERUSKAN MODAL ── */}
      {showTeruskan && (
        <ConfirmModal
          title="Teruskan ke DP3A"
          headerBg="bg-primary"
          iconClass="bi-send-check-fill text-primary"
          message={<>Laporan <strong>{selectedReport?.kode_laporan}</strong> akan diteruskan ke Tim DP3A untuk ditindaklanjuti.</>}
          placeholder="Tambahkan catatan untuk DP3A (opsional)..."
          catatan={catatan} setCatatan={setCatatan}
          submitting={submitting}
          onConfirm={() => doAction('teruskan')}
          onCancel={() => setShowTeruskan(false)}
          confirmLabel="Ya, Teruskan ke DP3A"
          confirmBtnClass="btn-primary"
        />
      )}
    </div>
  );
}
