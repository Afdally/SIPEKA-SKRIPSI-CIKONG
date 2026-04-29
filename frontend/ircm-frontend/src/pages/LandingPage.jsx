import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Landing.css';
import logo from '../assets/logo.png';

const API_REPORT = 'http://localhost:8080/api';

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('lapor');

  // Status form state
  const [kodeLaporan, setKodeLaporan] = useState('');
  const [statusResult, setStatusResult] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [errorStatus, setErrorStatus] = useState('');

  // Master Data State
  const [masterKekerasan, setMasterKekerasan] = useState([]);

  // Laporan form state (Single-step)
  const [isAnonim, setIsAnonim] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [showPrefModal, setShowPrefModal] = useState(false);
  const [fotoBukti, setFotoBukti] = useState(null);
  const [formData, setFormData] = useState({
    namaPelapor: '', nikPelapor: '', teleponPelapor: '', hubunganKorban: '',
    namaKorban: '', nikKorban: '', usiaKorban: '', jenisKelamin: '', alamatKorban: '', kelurahanKorban: '',
    jenisKekerasan: '', tanggalKejadian: '', lokasiKejadian: '', kronologi: ''
  });

  useEffect(() => {
    axios.get(`${API_REPORT}/master/kekerasan?all=false`)
      .then(res => setMasterKekerasan(res.data))
      .catch(err => console.error('Gagal memuat kategori:', err));
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setFotoBukti(e.target.files[0] || null);

  const handleCekStatus = async (e) => {
    e.preventDefault();
    if (!kodeLaporan) return;
    setLoadingStatus(true);
    setErrorStatus('');
    try {
      const res = await axios.get(`${API_REPORT}/laporan/status/${kodeLaporan}`);
      setStatusResult(res.data);
    } catch (err) {
      setErrorStatus(`Laporan ${kodeLaporan} tidak ditemukan.`);
      setStatusResult(null);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handlePreSubmit = (e) => {
    e.preventDefault();
    if (formData.kronologi.length < 50) return alert('Kronologi minimal 50 karakter');
    
    const usia = parseInt(formData.usiaKorban);
    if (usia < 18 && isAnonim) {
      return alert('Untuk korban anak-anak (di bawah 18 tahun), laporan wajib mencantumkan identitas pelapor/wali.');
    }
    
    setShowPrefModal(true);
  };

  const finalSubmit = async (pref) => {
    setShowPrefModal(false);
    setLoadingSubmit(true);
    const fd = new FormData();
    const usia = parseInt(formData.usiaKorban);
    const tipeLaporan = usia < 18 ? 'anak' : 'perempuan';
    
    fd.append('tipe_laporan', tipeLaporan);
    fd.append('anonim', isAnonim);
    
    if (isAnonim) {
      fd.append('nama_pelapor', 'ANONIM');
      fd.append('telepon_pelapor', formData.teleponPelapor); // Tetap dikirim untuk tracking
    } else {
      fd.append('nama_pelapor', formData.namaPelapor);
      fd.append('nik_pelapor', formData.nikPelapor);
      fd.append('telepon_pelapor', formData.teleponPelapor);
      fd.append('hubungan_korban', formData.hubunganKorban);
    }

    fd.append('nama_korban', formData.namaKorban);
    if (formData.nikKorban) fd.append('nik_korban', formData.nikKorban);
    fd.append('usia_korban', formData.usiaKorban);
    fd.append('jenis_kelamin', formData.jenisKelamin);
    fd.append('alamat_korban', formData.alamatKorban);
    fd.append('kelurahan_korban', formData.kelurahanKorban);
    fd.append('jenis_kekerasan', formData.jenisKekerasan);
    fd.append('tanggal_kejadian', formData.tanggalKejadian);
    fd.append('lokasi_kejadian', formData.lokasiKejadian);
    fd.append('kronologi', formData.kronologi);
    fd.append('preferensi_layanan', pref);
    if (fotoBukti) fd.append('bukti_file', fotoBukti);

    try {
      const res = await axios.post(`${API_REPORT}/laporan`, fd);
      setSubmitResult(res.data.kode_laporan || res.data?.data?.kode_laporan);
    } catch (err) {
      alert('Gagal: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoadingSubmit(false);
    }
  };

  const copyKode = () => {
    navigator.clipboard.writeText(submitResult);
    alert('Kode Laporan disalin!');
  };

  return (
    <div>
      {/* NAVBAR */}
      <nav className="navbar navbar-dark py-3" style={{ background: '#0d3d8e' }}>
        <div className="container">
          <a className="navbar-brand d-flex align-items-center gap-3" href="#">
            <img src={logo} alt="Logo" style={{ width: '80px', height: 'auto' }} />
            <span className="navbar-brand-text">
              SIPEKA KENDARI<br />
              <span className="navbar-brand-sub" style={{ fontSize: '0.75rem', opacity: 0.8 }}>Sistem Pelaporan Kekerasan Perempuan & Anak Kota Kendari</span>
            </span>
          </a>
          <button onClick={() => navigate('/login')} className="btn btn-outline-light btn-sm fw-semibold">
            <i className="bi bi-box-arrow-in-right me-1"></i>Login Admin
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="hero-landing">
        <div className="container py-5 text-center text-md-start">
          <div className="row align-items-center">
            <div className="col-lg-7 text-white">
              <h1 className="display-5 fw-bold mb-3 landing-title">Laporkan Kekerasan, <span className="text-warning">Lindungi Sesama</span></h1>
              <p className="lead opacity-75 mb-4 pe-lg-5">
                Jangan takut untuk bersuara. Kami menyediakan layanan perlindungan khusus yang dijaga 100% kerahasiaannya oleh DPPPA Kota Kendari. Keselamatan Anda adalah prioritas kami.
              </p>

              <div className="d-flex flex-wrap gap-3 justify-content-center justify-content-md-start">
                <a href="#form-section" onClick={() => setActiveTab('lapor')} className="btn btn-warning btn-lg fw-bold rounded-pill text-dark shadow px-4">
                  <i className="bi bi-megaphone-fill me-2"></i> Laporkan Kasus
                </a>
                <a href="#form-section" onClick={() => setActiveTab('status')} className="btn btn-outline-light btn-lg fw-bold rounded-pill shadow px-4">
                  <i className="bi bi-search me-2"></i> Lacak Status
                </a>
              </div>
            </div>
            <div className="col-lg-5 mt-5 mt-lg-0 d-none d-lg-block">
              <div className="glass-card p-4 text-center rounded-4 border border-light border-opacity-25 shadow-lg">
                <i className="bi bi-shield-lock text-warning display-1 mb-3"></i>
                <h4 className="text-white fw-bold">100% Rahasia & Aman</h4>
                <p className="text-white text-opacity-75 mb-0 small">Bebas laporkan secara anonim. Identitas pelapor tidak akan dipublikasikan dan dijaga oleh hukum yang berlaku.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT (FORM / STATUS) */}
      <div className="container pb-5" id="form-section">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="form-card">

              <div className="d-flex border-bottom mb-4">
                <button
                  className={`btn flex-grow-1 fw-bold py-3 rounded-0 ${activeTab === 'lapor' ? 'btn-primary' : 'btn-light text-muted'}`}
                  onClick={() => setActiveTab('lapor')}>
                  Buat Laporan Baru
                </button>
                <button
                  className={`btn flex-grow-1 fw-bold py-3 rounded-0 ${activeTab === 'status' ? 'btn-primary' : 'btn-light text-muted'}`}
                  onClick={() => setActiveTab('status')}>
                  Cek Status Laporan
                </button>
              </div>

              {/* CEK STATUS TAB */}
              {activeTab === 'status' && (
                <div>
                  <h4 className="fw-bold mb-3">Lacak Penanganan Kasus</h4>
                  <p className="small text-muted mb-4">Masukkan kode unik yang Anda dapatkan saat melapor.</p>
                  <form onSubmit={handleCekStatus}>
                    <div className="input-group mb-4">
                      <input type="text" className="form-control form-control-lg" placeholder="Contoh: LAP-12345" value={kodeLaporan} onChange={e => setKodeLaporan(e.target.value)} required />
                      <button className="btn btn-primary px-4 fw-bold" type="submit" disabled={loadingStatus}>
                        {loadingStatus ? 'Mencari...' : 'Lacak Status'}
                      </button>
                    </div>
                  </form>

                  {errorStatus && <div className="alert alert-danger">{errorStatus}</div>}

                  {statusResult && (
                    <div className="p-4 rounded border bg-light text-start">
                      <h5 className="fw-bold mb-4 border-bottom pb-3 d-flex align-items-center justify-content-between">
                        <span>Status Kasus: <span className="text-primary text-uppercase">{statusResult.status.replace(/_/g, ' ')}</span></span>
                        <span className="badge bg-secondary">#{statusResult.kode_laporan}</span>
                      </h5>

                      {/* STEPPER PROGRESS */}
                      <div className="mb-5 mt-2">
                        <div className="d-flex justify-content-between position-relative mb-4 px-2">
                          {/* Line Background */}
                          <div className="position-absolute top-50 start-0 translate-middle-y w-100" style={{ height: '2px', background: '#e2e8f0', zIndex: 1 }}></div>
                          {/* Active Line */}
                          <div className="position-absolute top-50 start-0 translate-middle-y transition-all" style={{ 
                            height: '2px', 
                            background: '#0d3d8e', 
                            zIndex: 2,
                            width: 
                              statusResult.status === 'selesai' ? '100%' :
                              statusResult.status === 'proses_penanganan' ? '66%' :
                              statusResult.status === 'proses_assessment' ? '33%' : '0%'
                          }}></div>

                          {[
                            { id: 'menunggu_registrasi', label: 'Terkirim', icon: 'bi-send' },
                            { id: 'proses_assessment', label: 'Assessment', icon: 'bi-clipboard-check' },
                            { id: 'proses_penanganan', label: 'Penanganan', icon: 'bi-activity' },
                            { id: 'selesai', label: 'Selesai', icon: 'bi-check-circle-fill' }
                          ].map((step, idx, arr) => {
                            const isCompleted = arr.findIndex(s => s.id === statusResult.status) >= idx;
                            return (
                              <div key={step.id} className="text-center position-relative" style={{ zIndex: 3, width: '60px' }}>
                                <div className={`rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2 shadow-sm transition-all ${isCompleted ? 'bg-primary text-white' : 'bg-white text-muted border'}`} 
                                  style={{ width: '40px', height: '40px', fontSize: '1.2rem' }}>
                                  <i className={`bi ${step.icon}`}></i>
                                </div>
                                <span className={`small fw-bold d-block ${isCompleted ? 'text-primary' : 'text-muted'}`} style={{ fontSize: '0.65rem' }}>{step.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="row g-3 text-sm">
                        <div className="col-6"><p className="mb-0 text-muted">Tanggal Lapor</p><p className="fw-bold">{statusResult.createdAt ? new Date(statusResult.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}</p></div>
                        <div className="col-6"><p className="mb-0 text-muted">Korban</p><p className="fw-bold">{statusResult.nama_korban}</p></div>
                        {statusResult.pesan_tindak_lanjut && (
                          <div className="col-12 mt-3 p-3 rounded bg-white border">
                            <p className="mb-1 text-primary fw-bold small"><i className="bi bi-chat-left-dots-fill me-2"></i>Pesan dari Petugas:</p>
                            <p className="mb-0">{statusResult.pesan_tindak_lanjut}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* LAPOR TAB */}
              {activeTab === 'lapor' && !submitResult && (
                <form onSubmit={handlePreSubmit}>
                  <div className="alert alert-info d-flex align-items-center mb-4">
                    <i className="bi bi-info-circle-fill fs-4 me-3"></i>
                    <div>
                      <strong>Perhatian:</strong> Isilah formulir ini dengan data yang sebenar-benarnya. Anda dapat menyembunyikan identitas Anda (Anonim) jika merasa terancam.
                    </div>
                  </div>

                  {/* DATA PELAPOR */}
                  <h5 className="mb-3 text-primary border-bottom pb-2 fw-bold">Data Pelapor</h5>
                  
                  {parseInt(formData.usiaKorban) < 18 ? (
                    <div className="alert alert-warning py-2 mb-3 small fw-bold">
                      <i className="bi bi-exclamatation-triangle-fill me-2"></i>
                      Korban anak-anak wajib melapor melalui Wali/Pelapor (Tidak bisa Anonim)
                    </div>
                  ) : (
                    <div className="form-check form-switch mb-3 fs-5">
                      <input className="form-check-input" type="checkbox" checked={isAnonim} onChange={(e) => setIsAnonim(e.target.checked)} id="anonimSwitch" />
                      <label className="form-check-label fw-bold" htmlFor="anonimSwitch">Laporkan Secara Anonim (Identitas Dirahasiakan)</label>
                    </div>
                  )}

                  <div className="row g-3 mb-4">
                    {!isAnonim && (
                      <div className="col-md-12">
                        <label className="form-label fw-semibold text-secondary">Nama Lengkap Pelapor <span className="text-danger">*</span></label>
                        <input name="namaPelapor" type="text" className="form-control" required value={formData.namaPelapor} onChange={handleChange} />
                      </div>
                    )}
                    
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-secondary">No. Telepon {isAnonim && '(Untuk Tracking Petugas)'} <span className="text-danger">*</span></label>
                      <input name="teleponPelapor" type="tel" className="form-control" placeholder="08xxxxxxxxxx" required value={formData.teleponPelapor} onChange={handleChange} />
                    </div>

                    {!isAnonim && (
                      <div className="col-md-6">
                        <label className="form-label fw-semibold text-secondary">Hubungan dg Korban <span className="text-danger">*</span></label>
                        <select name="hubunganKorban" className="form-select" required value={formData.hubunganKorban} onChange={handleChange}>
                          <option value="">-- Pilih --</option>
                          <option>Orang Tua</option><option>Anak</option><option>Saudara</option><option>Suami/Istri</option><option>Tetangga</option><option>Teman</option><option>Diri Sendiri</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* DATA KORBAN */}
                  <h5 className="mb-3 text-primary border-bottom pb-2 fw-bold">Data Korban</h5>
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-secondary">Nama Korban <span className="text-danger">*</span></label>
                      <input name="namaKorban" type="text" className="form-control" required value={formData.namaKorban} onChange={handleChange} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold text-secondary">Usia <span className="text-danger">*</span></label>
                      <input name="usiaKorban" type="number" className="form-control" min={0} required value={formData.usiaKorban} onChange={handleChange} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold text-secondary">Jenis Kelamin <span className="text-danger">*</span></label>
                      <select name="jenisKelamin" className="form-select" required value={formData.jenisKelamin} onChange={handleChange}>
                        <option value="">-- Pilih --</option><option>Laki-laki</option><option>Perempuan</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-secondary">Alamat Detail Korban <span className="text-danger">*</span></label>
                      <textarea name="alamatKorban" className="form-control" rows={2} required value={formData.alamatKorban} onChange={handleChange} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-secondary">Kelurahan Kejadian <span className="text-danger">*</span></label>
                      <select name="kelurahanKorban" className="form-select" required value={formData.kelurahanKorban} onChange={handleChange}>
                        <option value="">-- Pilih Kelurahan --</option>
                        <optgroup label="Kec. Mandonga"><option>Mandonga</option><option>Alolama</option><option>Labibia</option><option>Korumba</option></optgroup>
                        <optgroup label="Kec. Kendari"><option>Kandai</option><option>Gunung Jati</option><option>Kampung Salo</option></optgroup>
                        <optgroup label="Kec. Kendari Barat"><option>Wawombalata</option><option>Bende</option><option>Kemaraya</option></optgroup>
                        <optgroup label="Kec. Puuwatu"><option>Puuwatu</option><option>Punggaloba</option></optgroup>
                        <optgroup label="Kec. Wua-Wua"><option>Wua-Wua</option><option>Bonggoeya</option></optgroup>
                        <optgroup label="Kec. Kadia"><option>Kadia</option><option>Wowawanggu</option></optgroup>
                        <optgroup label="Kec. Baruga"><option>Baruga</option><option>Watubangga</option></optgroup>
                        <optgroup label="Kec. Poasia"><option>Poasia</option><option>Anduonohu</option></optgroup>
                        <optgroup label="Kec. Kambu"><option>Kambu</option><option>Mokoau</option></optgroup>
                        <optgroup label="Kec. Abeli"><option>Abeli</option><option>Lapulu</option></optgroup>
                        <optgroup label="Kec. Nambo"><option>Nambo</option><option>Bungkutoko</option></optgroup>
                      </select>
                    </div>
                  </div>

                  {/* DETAIL KEJADIAN */}
                  <h5 className="mb-3 text-primary border-bottom pb-2 fw-bold">Detail Kejadian</h5>
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-secondary">Jenis Kasus/Kekerasan <span className="text-danger">*</span></label>
                      <select name="jenisKekerasan" className="form-select" required value={formData.jenisKekerasan} onChange={handleChange}>
                        <option value="">-- Pilih --</option>
                        {masterKekerasan.map(k => (
                          <option key={k._id} value={k.nama_kategori}>{k.nama_kategori}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-secondary">Tanggal Kejadian <span className="text-danger">*</span></label>
                      <input name="tanggalKejadian" type="date" max={new Date().toISOString().split('T')[0]} className="form-control" required value={formData.tanggalKejadian} onChange={handleChange} />
                    </div>
                    <div className="col-md-12">
                      <label className="form-label fw-semibold text-secondary">Lokasi Kejadian (Tempat) <span className="text-danger">*</span></label>
                      <input name="lokasiKejadian" type="text" className="form-control" required value={formData.lokasiKejadian} onChange={handleChange} placeholder="Contoh: Di rumah, di jalan raya, dsb." />
                    </div>
                    <div className="col-md-12">
                      <label className="form-label fw-semibold text-secondary">Kronologi Kejadian <span className="text-danger">*</span></label>
                      <textarea name="kronologi" className="form-control" rows={5} minLength={50} required value={formData.kronologi} onChange={handleChange} placeholder="Ceritakan urutan kejadian secara kronologis (minimal 50 huruf)..." />
                      <div className="text-end mt-1"><small className={formData.kronologi.length < 50 ? 'text-danger' : 'text-success'}>{formData.kronologi.length} / 50 huruf</small></div>
                    </div>
                    <div className="col-md-12">
                      <label className="form-label fw-semibold text-secondary">Upload Bukti Foto/Dokumen <span className="text-muted fw-normal">(Opsional)</span></label>
                      <input type="file" className="form-control" accept="image/*,.pdf" onChange={handleFileChange} />
                    </div>
                  </div>

                  <div className="d-grid mt-4">
                    <button type="submit" className="btn btn-primary btn-lg fw-bold rounded-pill" disabled={loadingSubmit}>
                      {loadingSubmit ? 'Mengirim Data...' : 'Kirim Laporan Kasus'}
                    </button>
                  </div>
                </form>
              )}

              {/* RESULT STATE */}
              {submitResult && (
                <div className="text-center py-5">
                  <div className="mb-4 text-success" style={{ fontSize: '4rem' }}><i className="bi bi-check-circle-fill"></i></div>
                  <h3 className="fw-bold mb-3">Laporan Berhasil Terkirim!</h3>
                  <p className="text-muted">Simpan kode laporan ini baik-baik. Anda membutuhkannya untuk melacak status kasus.</p>

                  <div className="kode-highlight user-select-all">{submitResult}</div>

                  <div className="mt-4">
                    <button className="btn btn-outline-primary rounded-pill px-4 me-2" onClick={copyKode}><i className="bi bi-copy me-2"></i>Salin Kode</button>
                    <button className="btn btn-primary rounded-pill px-4" onClick={() => { setSubmitResult(null); setActiveTab('status'); }}><i className="bi bi-search me-2"></i>Lacak Status</button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* MODAL PREFERENSI LAYANAN */}
      {showPrefModal && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold w-100 text-center">Konfirmasi Layanan UPTD</h5>
                <button type="button" className="btn-close" onClick={() => setShowPrefModal(false)}></button>
              </div>
              <div className="modal-body text-center pt-3 pb-4 px-4">
                <p className="mb-4 text-muted">Satu langkah lagi! Apakah Anda bersedia datang langsung ke kantor UPTD, atau Anda ingin pihak UPTD mendatangi lokasi Anda?</p>
                <div className="d-grid gap-3">
                  <button type="button" className="btn btn-primary py-2 fw-bold" onClick={() => finalSubmit('Datang ke UPTD')}>
                    <i className="bi bi-building me-2"></i> Saya Akan Datang ke UPTD
                  </button>
                  <button type="button" className="btn btn-outline-primary py-2 fw-bold" onClick={() => finalSubmit('Petugas Mendatangi Korban')}>
                    <i className="bi bi-geo-alt me-2"></i> Petugas Datang ke Lokasi
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
