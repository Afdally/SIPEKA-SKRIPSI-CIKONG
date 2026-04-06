import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Landing.css';

const API_REPORT = 'http://localhost:8080/api';

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('lapor');
  
  // Status form state
  const [kodeLaporan, setKodeLaporan] = useState('');
  const [statusResult, setStatusResult] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [errorStatus, setErrorStatus] = useState('');

  // Laporan form state
  const [isAnonim, setIsAnonim] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [fotoBukti, setFotoBukti] = useState(null);
  const [formData, setFormData] = useState({
    namaPelapor: '', nikPelapor: '', teleponPelapor: '', hubunganKorban: '',
    namaKorban: '', nikKorban: '', usiaKorban: '', jenisKelamin: '', alamatKorban: '', kelurahanKorban: '',
    jenisKekerasan: '', tanggalKejadian: '', lokasiKejadian: '', kronologi: ''
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setFotoBukti(e.target.files[0] || null);

  const handleCekStatus = async () => {
    if (!kodeLaporan || kodeLaporan.length < 10) {
      setErrorStatus('Masukkan kode laporan yang valid. Contoh: LP-2026-AB3C7');
      setStatusResult(null);
      return;
    }
    
    setLoadingStatus(true);
    setErrorStatus('');
    try {
      const res = await axios.get(`${API_REPORT}/laporan/status/${kodeLaporan}`);
      setStatusResult(res.data);
    } catch (err) {
      setErrorStatus(`Laporan ${kodeLaporan} tidak ditemukan. Periksa kembali kode Anda.`);
      setStatusResult(null);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleSubmitLaporan = async (e) => {
    e.preventDefault();
    if (formData.kronologi.length < 50) return alert('Kronologi minimal 50 karakter');

    setLoadingSubmit(true);

    const fd = new FormData();
    fd.append('anonim', isAnonim);
    if (!isAnonim) {
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
    if (fotoBukti) fd.append('bukti_file', fotoBukti);

    try {
      const res = await axios.post(`${API_REPORT}/laporan`, fd);
      setSubmitResult(res.data.kode_laporan || res.data?.data?.kode_laporan);
    } catch (err) {
      alert('Gagal: ' + (err.response?.data?.message || err.message));
      console.log(err.response?.data?.message || err.message)
    } finally {
      setLoadingSubmit(false);
    }
  };

  const copyKode = () => {
    navigator.clipboard.writeText(submitResult);
    alert('Kode tersalin!');
  };

  const resetFormD = () => {
    setSubmitResult(null);
    setFotoBukti(null);
    setFormData({
      namaPelapor: '', nikPelapor: '', teleponPelapor: '', hubunganKorban: '',
      namaKorban: '', nikKorban: '', usiaKorban: '', jenisKelamin: '', alamatKorban: '', kelurahanKorban: '',
      jenisKekerasan: '', tanggalKejadian: '', lokasiKejadian: '', kronologi: ''
    });
  };

  return (
    <>
      <nav className="navbar navbar-dark py-3" style={{ background: '#0d3d8e' }}>
        <div className="container">
          <a className="navbar-brand d-flex align-items-center gap-2" href="#">
            <i className="bi bi-shield-check fs-4"></i>
            <span className="navbar-brand-text">
              SIPEKA KENDARI<br />
              <span className="navbar-brand-sub" style={{fontSize:'0.75rem', opacity:0.8}}>Sistem Pelaporan Kekerasan Perempuan & Anak Kota Kendari</span>
            </span>
          </a>
          <button onClick={() => navigate('/login')} className="btn btn-outline-light btn-sm fw-semibold">
            <i className="bi bi-box-arrow-in-right me-1"></i>Login Admin
          </button>
        </div>
      </nav>

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
                  <i className="bi bi-megaphone-fill me-2"></i> Laporkan Segera ke DP3A
                </a>
                <a href="tel:112" className="btn btn-outline-light btn-lg fw-bold rounded-pill shadow px-4">
                  <i className="bi bi-telephone-fill me-2"></i> Hotline Darurat 112
                </a>
              </div>
            </div>
            <div className="col-lg-5 mt-5 mt-lg-0 d-none d-lg-block">
               {/* Optional illustration / trust badges */}
               <div className="glass-card p-4 text-center rounded-4 border border-light border-opacity-25 shadow-lg">
                  <i className="bi bi-shield-lock text-warning display-1 mb-3"></i>
                  <h4 className="text-white fw-bold">100% Rahasia & Aman</h4>
                  <p className="text-white text-opacity-75 mb-0 small">Bebas laporkan secara anonim. Identitas pelapor tidak akan dipublikasikan dan dijaga oleh hukum yang berlaku.</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mb-5 pb-5" id="form-section">
        <div className="bg-white rounded-4 shadow-sm p-3 p-md-5" style={{ marginTop: '-40px', position: 'relative', zIndex: 10 }}>
          
          <ul className="nav nav-pills nav-fill gap-2 mb-4">
            <li className="nav-item">
              <button 
                className={`nav-link fw-bold border border-primary border-opacity-25 ${activeTab === 'lapor' ? 'active shadow-sm' : ''}`}
                onClick={() => setActiveTab('lapor')}
                style={{ borderRadius: '12px' }}>
                <i className="bi bi-pencil-square me-2"></i>Buat Laporan Baru
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link fw-bold border border-primary border-opacity-25 ${activeTab === 'cek' ? 'active shadow-sm' : ''}`}
                onClick={() => setActiveTab('cek')}
                style={{ borderRadius: '12px' }}>
                <i className="bi bi-search me-2"></i>Cek Status Laporan
              </button>
            </li>
          </ul>

          {activeTab === 'lapor' && !submitResult && (
            <div className="fade-in">
              <div className="alert alert-info rounded-3 border-0 bg-opacity-10 bg-primary d-flex align-items-center mb-4">
                <i className="bi bi-incognito fs-3 text-primary me-3"></i>
                <div className="form-check form-switch mb-0 fs-5">
                  <input className="form-check-input" type="checkbox" role="switch" id="anonimToggle" checked={isAnonim} onChange={(e) => setIsAnonim(e.target.checked)} />
                  <label className="form-check-label fw-semibold text-primary" htmlFor="anonimToggle" style={{cursor:'pointer'}}>
                    Lapor secara Anonim (Sembunyikan Identitas)
                  </label>
                  <div className="fs-6 text-muted mt-1">Jika diaktifkan, nama Anda tidak akan diserahkan kepada pihak terlapor.</div>
                </div>
              </div>

              <form onSubmit={handleSubmitLaporan}>
                {!isAnonim && (
                  <>
                    <h5 className="mb-3 text-primary border-bottom pb-2 fw-bold">Data Diri Pelapor</h5>
                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold text-secondary">Nama Lengkap <span className="text-danger">*</span></label>
                        <input name="namaPelapor" type="text" className="form-control" placeholder="Jhon Doe" required={!isAnonim} value={formData.namaPelapor} onChange={handleChange} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold text-secondary">NIK <span className="text-danger">*</span></label>
                        <input name="nikPelapor" type="text" className="form-control" placeholder="16 Digit NIK" minLength={16} maxLength={16} required={!isAnonim} value={formData.nikPelapor} onChange={handleChange} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold text-secondary">No. Telepon <span className="text-danger">*</span></label>
                        <input name="teleponPelapor" type="tel" className="form-control" placeholder="08xxxxxxxxxx" required={!isAnonim} value={formData.teleponPelapor} onChange={handleChange} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold text-secondary">Hubungan dg Korban <span className="text-danger">*</span></label>
                        <select name="hubunganKorban" className="form-select" required={!isAnonim} value={formData.hubunganKorban} onChange={handleChange}>
                          <option value="">-- Pilih --</option>
                          <option>Orang Tua</option><option>Anak</option><option>Saudara</option><option>Suami/Istri</option><option>Tetangga</option><option>Teman</option><option>Diri Sendiri</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

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
                    <label className="form-label fw-semibold text-secondary">Alamat Detail <span className="text-danger">*</span></label>
                    <textarea name="alamatKorban" className="form-control" rows={2} required value={formData.alamatKorban} onChange={handleChange} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-secondary">Pilih Kelurahan Korban <span className="text-danger">*</span></label>
                    <select name="kelurahanKorban" className="form-select" required value={formData.kelurahanKorban} onChange={handleChange}>
                      <option value="">-- Pilih Kelurahan --</option>
                      <optgroup label="Kec. Mandonga">
                        <option>Mandonga</option><option>Alolama</option><option>Labibia</option>
                        <option>Korumba</option><option>Anggilowu</option><option>Wawowanggu</option>
                      </optgroup>
                      <optgroup label="Kec. Kendari">
                        <option>Kandai</option><option>Gunung Jati</option><option>Kampung Salo</option>
                        <option>Purirano</option><option>Kampung Baru</option>
                      </optgroup>
                      <optgroup label="Kec. Kendari Barat">
                        <option>Wawombalata</option><option>Bende</option><option>Kemaraya</option>
                        <option>Tipulu</option><option>Sodohoa</option><option>Dapu-Dapura</option>
                      </optgroup>
                      <optgroup label="Kec. Puuwatu">
                        <option>Puuwatu</option><option>Punggaloba</option><option>Watulondo</option><option>Tobuuha</option>
                      </optgroup>
                      <optgroup label="Kec. Wua-Wua">
                        <option>Wua-Wua</option><option>Bonggoeya</option><option>Lawulo</option><option>Mataiwoi</option>
                      </optgroup>
                      <optgroup label="Kec. Kadia">
                        <option>Kadia</option><option>Wowawanggu</option><option>Anaiwoi</option>
                        <option>Pondambea</option><option>Benuanirae</option>
                      </optgroup>
                      <optgroup label="Kec. Baruga">
                        <option>Baruga</option><option>Watubangga</option><option>Lepo-Lepo</option><option>Wundudopi</option>
                      </optgroup>
                      <optgroup label="Kec. Poasia">
                        <option>Poasia</option><option>Anduonohu</option><option>Rahandouna</option><option>Matabubu</option>
                      </optgroup>
                      <optgroup label="Kec. Kambu">
                        <option>Kambu</option><option>Mokoau</option><option>Padaleu</option><option>Lalolara</option>
                      </optgroup>
                      <optgroup label="Kec. Abeli">
                        <option>Abeli</option><option>Lapulu</option><option>Benua-Benua</option>
                        <option>Tondonggeu</option><option>Tobimeita</option><option>Petoaha</option>
                      </optgroup>
                      <optgroup label="Kec. Nambo">
                        <option>Nambo</option><option>Bungkutoko</option><option>Puday</option><option>Sambuli</option>
                      </optgroup>
                    </select>
                    <div className="small text-muted mt-1"><i className="bi bi-geo-alt-fill text-primary me-1"></i>Pilih kelurahan sesuai lokasi kejadian. Ini menentukan petugas yang menerima laporan.</div>
                  </div>
                </div>

                <h5 className="mb-3 text-primary border-bottom pb-2 fw-bold">Detail Kejadian</h5>
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-secondary">Jenis Kasus/Kekerasan <span className="text-danger">*</span></label>
                    <select name="jenisKekerasan" className="form-select" required value={formData.jenisKekerasan} onChange={handleChange}>
                      <option value="">-- Pilih --</option><option>Fisik</option><option>Psikis</option><option>Seksual</option><option>Ekonomi</option><option>KDRT</option><option>TPPO</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-secondary">Waktu Kejadian <span className="text-danger">*</span></label>
                    <input name="tanggalKejadian" type="date" max={new Date().toISOString().split('T')[0]} className="form-control" required value={formData.tanggalKejadian} onChange={handleChange} />
                  </div>
                  <div className="col-md-12">
                    <label className="form-label fw-semibold text-secondary">Lokasi Kejadian <span className="text-danger">*</span></label>
                    <input name="lokasiKejadian" type="text" className="form-control" required value={formData.lokasiKejadian} onChange={handleChange} />
                  </div>
                  <div className="col-md-12">
                    <label className="form-label fw-semibold text-secondary">Kronologi Kejadian <span className="text-danger">*</span></label>
                    <textarea name="kronologi" className="form-control" rows={5} minLength={50} required value={formData.kronologi} onChange={handleChange} placeholder="Ceritakan detail kejadian secara kronologis (minimal 50 huruf)..." />
                    <small className={formData.kronologi.length < 50 ? 'text-danger' : 'text-success'}>{formData.kronologi.length} / 50 huruf minimum</small>
                  </div>
                  <div className="col-md-12">
                    <label className="form-label fw-semibold text-secondary">
                      Foto / Bukti Pendukung <span className="badge bg-secondary fw-normal ms-1" style={{fontSize:'0.7rem'}}>Opsional</span>
                    </label>
                    <input
                      type="file"
                      className="form-control"
                      accept="image/jpeg,image/png,image/jpg,image/webp,application/pdf"
                      onChange={handleFileChange}
                    />
                    <div className="small text-muted mt-1">
                      <i className="bi bi-image me-1"></i>Format: JPG, PNG, WEBP, PDF. Maks. 5 MB. Contoh: foto bukti cedera, screenshot percakapan, atau dokumen pendukung.
                    </div>
                    {fotoBukti && (
                      <div className="mt-1 text-success small fw-semibold">
                        <i className="bi bi-check-circle me-1"></i>File dipilih: {fotoBukti.name}
                        <button type="button" className="btn btn-sm btn-link text-danger p-0 ms-2" onClick={()=>setFotoBukti(null)}>Hapus</button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-center mt-5">
                  <button type="submit" disabled={loadingSubmit} className="btn btn-primary btn-lg rounded-pill px-5 py-3 shadow-lg fw-bold w-100 mb-3" style={{maxWidth: '400px'}}>
                    {loadingSubmit ? 'MENGIRIM...' : 'KIRIM LAPORAN SEKARANG'} <i className="bi bi-send-fill ms-2"></i>
                  </button>
                  <p className="text-muted small"><i className="bi bi-lock-fill me-1"></i> Data dan Privasi dilindungi undang-undang</p>
                </div>
              </form>
            </div>
          )}

          {/* SUCCESS MODAL / VIEW */}
          {submitResult && (
            <div className="text-center py-5 fade-in">
              <i className="bi bi-check-circle-fill text-success display-1 mb-3"></i>
              <h2 className="fw-bold mb-3">Laporan Berhasil Diajukan!</h2>
              <p className="text-muted mb-4">Laporan Anda akan segera ditinjau oleh pihak berwenang. Mohon simpan Nomor Registrasi Anda untuk mengecek status.</p>
              
              <div className="bg-light p-4 rounded-4 d-inline-block border border-success border-opacity-25 shadow-sm mb-4">
                <div className="text-muted fw-bold mb-2">NOMOR REGISTRASI</div>
                <h1 className="fw-bolder text-primary mb-0 font-monospace">{submitResult}</h1>
              </div>
              
              <div className="d-flex justify-content-center gap-3">
                <button onClick={copyKode} className="btn btn-outline-primary fw-bold"><i className="bi bi-clipboard me-2"></i> Salin Nomor</button>
                <button onClick={resetFormD} className="btn btn-primary fw-bold">Kembali ke Beranda</button>
              </div>
            </div>
          )}

          {/* CEK STATUS TAB */}
          {activeTab === 'cek' && (
            <div className="py-md-4 fade-in">
              <div className="row justify-content-center">
                <div className="col-md-8 text-center">
                  <i className="bi bi-search text-primary display-4 mb-3 opacity-75"></i>
                  <h3 className="fw-bold mb-3">Pantau Status Laporan</h3>
                  
                  <div className="input-group input-group-lg shadow-sm border rounded-pill overflow-hidden mt-4 mb-3">
                    <input type="text" className="form-control border-0 px-4 text-center font-monospace fw-bold" placeholder="LP-202X-XXXXXX" value={kodeLaporan} onChange={e=>setKodeLaporan(e.target.value.toUpperCase())} onKeyDown={e => e.key==='Enter'&&handleCekStatus()}/>
                    <button className="btn btn-primary px-4 fw-bold" onClick={handleCekStatus} disabled={loadingStatus}>
                      {loadingStatus ? 'Mencari...' : 'Cek Status'}
                    </button>
                  </div>
                  
                  {errorStatus && <div className="alert alert-danger rounded-4">{errorStatus}</div>}
                  
                  {statusResult && (
                    <div className="card border-0 shadow-sm rounded-4 mt-5 text-start bg-light">
                      <div className="card-body p-4 p-md-5">
                       <h5 className="text-muted fw-bold tracking-wider mb-2">HASIL PELACAKAN</h5>
                       <h2 className="text-primary fw-bolder mb-4">{statusResult.kode_laporan}</h2>
                       
                       <div className="row g-4 mb-4">
                         <div className="col-sm-6">
                           <div className="text-muted small">Waktu Laporan</div>
                           <div className="fw-bold">{statusResult.tanggal_lapor}</div>
                         </div>
                         <div className="col-sm-6">
                           <div className="text-muted small">Status Penanganan</div>
                           <div className="fw-bold fs-5 text-warning">{statusResult.status.replace(/_/g, ' ').toUpperCase()}</div>
                         </div>
                       </div>
                       
                       {statusResult.catatan && (
                         <div className="alert alert-warning border-0 p-4 rounded-3 d-flex align-items-start gap-3">
                           <i className="bi bi-info-circle-fill pt-1"></i>
                           <div>
                             <strong className="d-block mb-1">Catatan Petugas:</strong>
                             {statusResult.catatan}
                           </div>
                         </div>
                       )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
      
      <footer className="text-center py-4 bg-dark text-white opacity-75">
        <p className="mb-0">&copy; {new Date().getFullYear()} DPPPA Kota Kendari. Hak Cipta Dilindungi.</p>
      </footer>
    </>
  );
}
