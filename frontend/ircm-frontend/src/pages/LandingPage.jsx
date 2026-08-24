import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import laporanService from '../services/laporanService';
import CeritaKejadianStep from '../components/landing/CeritaKejadianStep';
import HeroIllustration from '../components/landing/HeroIllustration';
import { beriTahuGagal, beriTahuKurang, toastSukses } from '../utils/notifikasi';
import './Public.css';
import logo from '../assets/logo.png';

// Field formulir yang boleh diisi dari hasil analisis cerita. Namanya sengaja
// dibuat sama dengan kunci yang dikembalikan report-service, jadi pemetaannya
// langsung tanpa tabel penerjemah.
//
// NIK sengaja TIDAK ada di daftar ini: nomornya tidak akan muncul di cerita, dan
// NIK yang salah berbahaya karena laporan ini jadi dasar penanganan kasus.
const FIELD_AUTOFILL = [
  'namaKorban',
  'namaPelapor',
  'usiaKorban',
  'jenisKelamin',
  'hubunganKorban',
  'jenisKekerasan',
  'kelurahanKorban',
  'lokasiKejadian',
  'tanggalKejadian',
];

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

  // Alur "cerita dulu, form auto-fill"
  const [showCeritaStep, setShowCeritaStep] = useState(true);
  // null (isi manual) | 'model' (Ollama) | 'aturan' | 'lokal' | 'failed'
  const [autoFillNotice, setAutoFillNotice] = useState(null);
  // Nama field yang nilainya berasal dari analisis — dipakai untuk menandai
  // input mana yang perlu diteliti ulang pelapor.
  const [fieldTerisiOtomatis, setFieldTerisiOtomatis] = useState([]);

  // Dikumpulkan di langkah awal (CeritaKejadianStep), dikirim bersama laporan
  const [preferensiLayanan, setPreferensiLayanan] = useState('');
  const [pernyataanBenar, setPernyataanBenar] = useState(false);

  // Laporan form state (Single-step)
  const [isAnonim, setIsAnonim] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [fotoBukti, setFotoBukti] = useState(null);
  const [formData, setFormData] = useState({
    namaPelapor: '', nikPelapor: '', teleponPelapor: '', hubunganKorban: '',
    namaKorban: '', nikKorban: '', usiaKorban: '', jenisKelamin: '', alamatKorban: '', kelurahanKorban: '',
    jenisKekerasan: '', tanggalKejadian: '', lokasiKejadian: '', kronologi: ''
  });

  useEffect(() => {
    laporanService.getMasterKekerasan()
      .then(setMasterKekerasan)
      .catch(err => console.error('Gagal memuat kategori:', err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Begitu pelapor menyunting sendiri, tanda "diisi otomatis" dilepas —
    // nilainya sudah jadi tanggung jawab dia, bukan usulan sistem lagi.
    setFieldTerisiOtomatis(prev => prev.filter(f => f !== name));
  };

  // Tempelkan penanda visual pada input yang nilainya berasal dari analisis.
  const kelasInput = (dasar, nama) =>
    fieldTerisiOtomatis.includes(nama) ? `${dasar} terisi-otomatis` : dasar;
  const handleFileChange = (e) => setFotoBukti(e.target.files[0] || null);

  // Dipanggil CeritaKejadianStep setelah analisis selesai (berhasil ataupun gagal).
  // `analisis` = { sumber, catatan, hasil, terisi } dari nlpService.
  const handleCeritaSelesai = ({ kronologi, telepon, preferensi, setuju, analisis, gagal }) => {
    const usulan = (!gagal && analisis?.hasil) || {};
    // Hanya field yang benar-benar ada nilainya yang ditimpa, sisanya biarkan
    // apa adanya supaya isian pelapor sebelumnya tidak terhapus.
    const terisi = FIELD_AUTOFILL.filter(f => usulan[f] !== null && usulan[f] !== undefined && usulan[f] !== '');

    setFormData(prev => {
      const berikut = { ...prev, kronologi, teleponPelapor: telepon || prev.teleponPelapor };
      terisi.forEach(f => { berikut[f] = String(usulan[f]); });
      return berikut;
    });

    setFieldTerisiOtomatis(terisi);
    setPreferensiLayanan(preferensi);
    setPernyataanBenar(setuju);
    setAutoFillNotice(gagal ? 'failed' : (analisis?.sumber || 'success'));
    setShowCeritaStep(false);
  };

  const handleCekStatus = async (e) => {
    e.preventDefault();
    if (!kodeLaporan) return;
    setLoadingStatus(true);
    setErrorStatus('');
    try {
      setStatusResult(await laporanService.cekStatus(kodeLaporan));
    } catch (err) {
      setErrorStatus(`Laporan ${kodeLaporan} tidak ditemukan.`);
      setStatusResult(null);
    } finally {
      setLoadingStatus(false);
    }
  };

  // Preferensi layanan & pernyataan kebenaran sudah dikonfirmasi di langkah awal
  // (CeritaKejadianStep), jadi submit di sini langsung jalan tanpa modal lagi.
  const handleSubmitLaporan = async (e) => {
    e.preventDefault();
    if (formData.kronologi.length < 50) return beriTahuKurang('Kronologi minimal 50 karakter.');

    const usiaCek = parseInt(formData.usiaKorban);
    if (usiaCek < 18 && isAnonim) {
      return beriTahuKurang('Untuk korban anak-anak (di bawah 18 tahun), laporan wajib mencantumkan identitas pelapor/wali.');
    }

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
    fd.append('preferensi_layanan', preferensiLayanan);
    fd.append('pernyataan_benar', String(pernyataanBenar));
    if (fotoBukti) fd.append('bukti_file', fotoBukti);

    try {
      const res = await laporanService.submitLaporan(fd);
      setSubmitResult(res.kode_laporan || res?.data?.kode_laporan);
    } catch (err) {
      beriTahuGagal(err.response?.data?.message || err.message, 'Laporan gagal dikirim');
    } finally {
      setLoadingSubmit(false);
    }
  };

  const copyKode = () => {
    navigator.clipboard.writeText(submitResult);
    toastSukses('Kode laporan disalin');
  };

  // Dipakai tombol CTA header & hero: pindah ke tab yang relevan lalu
  // scroll halus ke panel form (murni navigasi tampilan, bukan logic baru).
  const scrollToPanel = (tab) => {
    setActiveTab(tab);
    document.getElementById('panel-laporan')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="landing-wrapper">
      {/* HEADER */}
      <header className="header-premium">
        <div className="container h-100 d-flex align-items-center justify-content-between" style={{ minHeight: '84px' }}>
          <div className="d-flex align-items-center gap-3">
            <img src={logo} alt="Logo" className="header-logo" />
            <div>
              <div className="header-brand-name">SIPEKA KENDARI</div>
              <div className="header-brand-tagline">Pelaporan Kekerasan Perempuan & Anak</div>
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            <button onClick={() => navigate('/login')} className="header-cta-btn d-none d-sm-inline-flex">
              <i className="bi bi-person-circle"></i> Login Admin
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="hero-landing" id="beranda">
        <div className="container position-relative">
          <div className="row align-items-center">
            <div className="col-lg-6 mb-5 mb-lg-0">
              <h1 className="hero-title">Laporkan Kekerasan Perempuan dan Anak</h1>
              <p className="hero-desc">
                Laporan Anda dijamin rahasia dan ditangani langsung oleh petugas UPTD PPA Kota Kendari.
              </p>
              <div className="hero-cta-group">
                <button className="btn-hero-primary" onClick={() => scrollToPanel('lapor')}>
                  <i className="bi bi-pencil-fill"></i> Buat Laporan
                </button>
                <button className="btn-hero-secondary" onClick={() => scrollToPanel('status')}>
                  <i className="bi bi-compass"></i> Cek Status
                </button>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="hero-illustration-wrap">
                <HeroIllustration />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN FORM */}
      <div className="container pb-5" style={{ marginTop: '-40px', position: 'relative', zIndex: 20 }}>
        <div className="form-card p-0" id="panel-laporan">
          <div className="tab-header">
            <button onClick={() => setActiveTab('lapor')} className={`tab-btn ${activeTab === 'lapor' ? 'active' : 'inactive'}`}>
              <i className="bi bi-plus-circle-fill"></i> Buat Laporan Baru
            </button>
            <button onClick={() => setActiveTab('status')} className={`tab-btn ${activeTab === 'status' ? 'active' : 'inactive'}`}>
              <i className="bi bi-compass"></i> Cek Status Laporan
            </button>
          </div>

          <div className="p-4 p-md-5">
            {/* TAB CEK STATUS */}
            {activeTab === 'status' && (
              <div>
                <h4 className="fw-bold mb-1">Lacak Penanganan Kasus</h4>
                <p className="small text-muted mb-4">Masukkan kode unik yang Anda dapatkan setelah mengirimkan laporan untuk melihat progresnya.</p>
                
                <form onSubmit={handleCekStatus}>
                  <div className="input-group mb-4 shadow-sm" style={{ borderRadius: '0.75rem', overflow: 'hidden' }}>
                    <span className="input-group-text bg-light border-end-0 text-muted"><i className="bi bi-key-fill"></i></span>
                    <input type="text" className="form-control form-control-lg border-start-0 bg-light fw-bold font-monospace text-uppercase" placeholder="Contoh: LP-2026-XYZ" value={kodeLaporan} onChange={e => setKodeLaporan(e.target.value)} required style={{ fontSize: '1rem' }} />
                    <button className="btn btn-primary px-4 fw-bold" type="submit" disabled={loadingStatus}>
                      {loadingStatus ? 'Mencari...' : 'Lacak Status'}
                    </button>
                  </div>
                </form>

                {errorStatus && <div className="alert alert-danger rounded-3"><i className="bi bi-exclamation-circle-fill me-2"></i> {errorStatus}</div>}

                {statusResult && (
                  <div className="p-4 rounded-4 border bg-light text-start shadow-sm mt-4">
                    <div className="d-flex flex-wrap align-items-center justify-content-between border-bottom pb-3 mb-4">
                      <div>
                        <span className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Status Pengaduan</span>
                        <div className="d-flex align-items-center gap-2 mt-1">
                          <span className="fw-bold fs-5">Kasus:</span>
                          <span className="badge bg-warning text-dark px-3 py-2 rounded-pill text-uppercase fw-bold shadow-sm">{statusResult.status.replace(/_/g, ' ')}</span>
                        </div>
                      </div>
                      <div className="px-3 py-2 bg-secondary bg-opacity-10 rounded-3 font-monospace fw-bold text-dark">
                        #{statusResult.kode_laporan}
                      </div>
                    </div>

                    {/* STEPPER PROGRESS */}
                    <div className="mb-5 mt-4 px-3">
                      <div className="tracker-stepper">
                        <div className="tracker-line">
                          <div className="tracker-line-fill" style={{
                            width: statusResult.status === 'selesai' ? '100%' :
                                   statusResult.status === 'dalam_penanganan' ? '66%' :
                                   statusResult.status === 'proses_assessment' ? '33%' : '0%'
                          }}></div>
                        </div>

                        {[
                          { id: 'menunggu_registrasi', label: 'Terkirim', icon: 'bi-send-fill' },
                          { id: 'proses_assessment', label: 'Assessment', icon: 'bi-clipboard-check-fill' },
                          { id: 'dalam_penanganan', label: 'Penanganan', icon: 'bi-activity' },
                          { id: 'selesai', label: 'Selesai', icon: 'bi-check-circle-fill' }
                        ].map((step, idx, arr) => {
                          const isCompleted = arr.findIndex(s => s.id === statusResult.status) >= idx;
                          return (
                            <div key={step.id} className="tracker-step">
                              <div className={`tracker-circle ${isCompleted ? 'completed' : ''}`}>
                                <i className={`fs-5 ${step.icon}`}></i>
                              </div>
                              <span className={`tracker-label ${isCompleted ? 'completed' : ''}`}>{step.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="row g-3 bg-white p-3 rounded-3 border">
                      <div className="col-sm-6">
                        <span className="d-block text-muted fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Tanggal Lapor</span>
                        <span className="fw-bold small">{statusResult.createdAt ? new Date(statusResult.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}</span>
                      </div>
                      <div className="col-sm-6">
                        <span className="d-block text-muted fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Nama Korban</span>
                        <span className="fw-bold small">{statusResult.nama_korban}</span>
                      </div>
                      {statusResult.catatan && (
                        <div className="col-12 mt-3 pt-3 border-top">
                          <span className="d-block text-primary fw-bold small mb-1"><i className="bi bi-chat-left-dots-fill me-2"></i>Pesan dari Petugas:</span>
                          <p className="mb-0 small bg-light p-2 rounded border-start border-primary border-4 text-dark fst-italic">{statusResult.catatan}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB LAPOR - Langkah 1: Cerita bebas + auto-isi lewat nlpService */}
            {activeTab === 'lapor' && !submitResult && showCeritaStep && (
              <CeritaKejadianStep
                masterKekerasan={masterKekerasan}
                teleponAwal={formData.teleponPelapor}
                onSelesai={handleCeritaSelesai}
              />
            )}

            {/* TAB LAPOR - Langkah 2: Form detail (sudah ada sebelumnya, tetap sama;
                cuma sekarang bisa datang dalam keadaan sudah terisi sebagian) */}
            {activeTab === 'lapor' && !submitResult && !showCeritaStep && (
              <form onSubmit={handleSubmitLaporan}>
                {['model', 'aturan', 'lokal', 'success'].includes(autoFillNotice) && (
                  <div className="alert-callout mb-4" style={{ backgroundColor: 'var(--pink-50)', borderColor: 'var(--pink-200)' }}>
                    <i className="bi bi-stars fs-4" style={{ color: 'var(--pink-600)' }}></i>
                    <div>
                      <h5 className="fw-bold mb-1" style={{ fontSize: '0.875rem', color: 'var(--pink-700)' }}>
                        {fieldTerisiOtomatis.length > 0
                          ? `${fieldTerisiOtomatis.length} Data Terisi Otomatis`
                          : 'Tidak Ada Data yang Bisa Diisi Otomatis'}
                      </h5>
                      <p className="mb-0" style={{ fontSize: '0.875rem', color: 'var(--pink-700)', opacity: 0.85 }}>
                        {fieldTerisiOtomatis.length > 0
                          ? 'Kolom yang bertanda pink diisi dari cerita Anda — ini hanya usulan sistem. Mohon periksa dan koreksi kalau ada yang kurang tepat sebelum mengirim.'
                          : 'Cerita Anda sudah tersimpan, tapi sistem belum menemukan keterangan yang cukup jelas. Silakan lengkapi formulir di bawah.'}
                        {autoFillNotice !== 'model' && ' (Analisis lengkap sedang tidak tersedia, dipakai pembacaan sederhana.)'}
                      </p>
                    </div>
                  </div>
                )}
                {autoFillNotice === 'failed' && (
                  <div className="alert-callout mb-4" style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a' }}>
                    <i className="bi bi-exclamation-triangle-fill fs-4 text-warning"></i>
                    <div>
                      <h5 className="fw-bold mb-1" style={{ fontSize: '0.875rem', color: '#92400e' }}>Pengisian Otomatis Sedang Tidak Tersedia</h5>
                      <p className="mb-0" style={{ fontSize: '0.875rem', color: '#92400e' }}>Tidak masalah — cerita Anda sudah tersimpan, silakan lengkapi bagian lain di form ini secara manual.</p>
                    </div>
                  </div>
                )}
                <div className="alert-callout mb-4">
                  <i className="bi bi-info-circle-fill fs-4 text-success"></i>
                  <div>
                    <h5 className="fw-bold text-success mb-1" style={{ fontSize: '0.875rem' }}>Peringatan Penting</h5>
                    <p className="mb-0 text-success text-opacity-75" style={{ fontSize: '0.875rem' }}>Isilah formulir ini dengan data yang sebenar-benarnya. Anda dapat menyembunyikan identitas Anda (Anonim) demi keamanan jika merasa terancam.</p>
                  </div>
                </div>

                {/* DATA PELAPOR */}
                <div className="form-section-title">
                  <div className="section-number">1</div>
                  <h4 className="fw-bold m-0 text-dark" style={{ fontSize: '1.1rem' }}>Data Pelapor</h4>
                </div>
                
                {parseInt(formData.usiaKorban) < 18 ? (
                  <div className="alert alert-warning py-3 mb-4 rounded-3 fw-bold small d-flex align-items-center gap-3 border-warning">
                    <i className="bi bi-exclamation-triangle-fill text-warning fs-4"></i>
                    Korban anak-anak wajib melapor melalui Wali/Pelapor (Tidak bisa Anonim)
                  </div>
                ) : (
                  <div className="switch-wrapper mb-4">
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-primary bg-opacity-10 text-primary rounded-3 d-flex align-items-center justify-content-center" style={{ width: '2.5rem', height: '2.5rem' }}>
                        <i className={isAnonim ? "bi bi-eye-slash-fill fs-5" : "bi bi-person-check-fill fs-5"}></i>
                      </div>
                      <div>
                        <label className="fw-bold text-dark m-0" style={{ cursor: 'pointer' }} htmlFor="anonimSwitch">Laporkan Secara Anonim</label>
                        <p className="text-muted m-0" style={{ fontSize: '0.75rem' }}>Identitas asli Anda akan disembunyikan dari petugas lapangan</p>
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" id="anonimSwitch" checked={isAnonim} onChange={(e) => setIsAnonim(e.target.checked)} />
                      <span className="slider"></span>
                    </label>
                  </div>
                )}

                <div className="row g-4 mb-5">
                  {!isAnonim && (
                    <div className="col-md-12">
                      <label className="form-label-premium">Nama Lengkap Pelapor <span className="text-danger">*</span></label>
                      <input name="namaPelapor" type="text" className={kelasInput('form-control-premium', 'namaPelapor')} required value={formData.namaPelapor} onChange={handleChange} placeholder="Masukkan nama pelapor" />
                    </div>
                  )}
                  
                  <div className="col-md-6">
                    <label className="form-label-premium">No. Telepon / WhatsApp <span className="text-danger">*</span></label>
                    <input name="teleponPelapor" type="tel" className="form-control-premium" placeholder="Contoh: 08xxxxxxxxxx" required value={formData.teleponPelapor} onChange={handleChange} />
                    <p className="text-muted mt-1 fst-italic m-0" style={{ fontSize: '0.7rem' }}>*) Digunakan khusus oleh petugas untuk tindak lanjut</p>
                  </div>

                  {!isAnonim && (
                    <div className="col-md-6">
                      <label className="form-label-premium">Hubungan dg Korban <span className="text-danger">*</span></label>
                      <select name="hubunganKorban" className={kelasInput('form-select-premium', 'hubunganKorban')} required value={formData.hubunganKorban} onChange={handleChange}>
                        <option value="">-- Pilih --</option>
                        <option>Orang Tua</option><option>Anak</option><option>Saudara</option><option>Suami/Istri</option><option>Tetangga</option><option>Teman</option><option>Diri Sendiri</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* DATA KORBAN */}
                <div className="form-section-title">
                  <div className="section-number">2</div>
                  <h4 className="fw-bold m-0 text-dark" style={{ fontSize: '1.1rem' }}>Data Korban</h4>
                </div>
                <div className="row g-4 mb-5">
                  <div className="col-md-6">
                    <label className="form-label-premium">Nama Korban <span className="text-danger">*</span></label>
                    <input name="namaKorban" type="text" className={kelasInput('form-control-premium', 'namaKorban')} required value={formData.namaKorban} onChange={handleChange} placeholder="Masukkan nama korban" />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label-premium">Usia <span className="text-danger">*</span></label>
                    <input name="usiaKorban" type="number" className={kelasInput('form-control-premium text-center', 'usiaKorban')} min={0} required value={formData.usiaKorban} onChange={handleChange} placeholder="Th" />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label-premium">Jenis Kelamin <span className="text-danger">*</span></label>
                    <select name="jenisKelamin" className={kelasInput('form-select-premium', 'jenisKelamin')} required value={formData.jenisKelamin} onChange={handleChange}>
                      <option value="">-- Pilih --</option><option>Laki-laki</option><option>Perempuan</option>
                    </select>
                  </div>
                  <div className="col-md-7">
                    <label className="form-label-premium">Alamat Detail Korban <span className="text-danger">*</span></label>
                    <textarea name="alamatKorban" className="form-control-premium" rows={2} required value={formData.alamatKorban} onChange={handleChange} placeholder="Nama jalan, nomor rumah, RT/RW, dsb." />
                  </div>
                  <div className="col-md-5">
                    <label className="form-label-premium">Kelurahan Kejadian <span className="text-danger">*</span></label>
                    <select name="kelurahanKorban" className={kelasInput('form-select-premium', 'kelurahanKorban')} required value={formData.kelurahanKorban} onChange={handleChange}>
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
                <div className="form-section-title">
                  <div className="section-number">3</div>
                  <h4 className="fw-bold m-0 text-dark" style={{ fontSize: '1.1rem' }}>Detail Kejadian</h4>
                </div>
                <div className="row g-4 mb-4">
                  <div className="col-md-6">
                    <label className="form-label-premium">Jenis Kasus / Kekerasan <span className="text-danger">*</span></label>
                    <select name="jenisKekerasan" className={kelasInput('form-select-premium', 'jenisKekerasan')} required value={formData.jenisKekerasan} onChange={handleChange}>
                      <option value="">-- Pilih --</option>
                      {masterKekerasan.map(k => (
                        <option key={k._id} value={k.nama_kategori}>{k.nama_kategori}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label-premium">Tanggal Kejadian <span className="text-danger">*</span></label>
                    <input name="tanggalKejadian" type="date" max={new Date().toISOString().split('T')[0]} className={kelasInput('form-control-premium', 'tanggalKejadian')} required value={formData.tanggalKejadian} onChange={handleChange} />
                  </div>
                  <div className="col-md-12">
                    <label className="form-label-premium">Lokasi Spesifik Kejadian <span className="text-danger">*</span></label>
                    <input name="lokasiKejadian" type="text" className={kelasInput('form-control-premium', 'lokasiKejadian')} required value={formData.lokasiKejadian} onChange={handleChange} placeholder="Contoh: Rumah pelaku, Kos Paperu, Jalan raya, dsb." />
                  </div>
                  <div className="col-md-12">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label-premium m-0">Kronologi Kejadian <span className="text-danger">*</span></label>
                      <span className="fw-bold text-muted" style={{ fontSize: '0.7rem' }}>{formData.kronologi.length} / 1000 huruf</span>
                    </div>
                    <textarea name="kronologi" className="form-control-premium" rows={5} minLength={50} maxLength={1000} required value={formData.kronologi} onChange={handleChange} placeholder="Ceritakan urutan kejadian secara kronologis (minimal 50 huruf)..." />
                    {formData.kronologi.length > 0 && formData.kronologi.length < 50 && <small className="text-danger mt-1 d-block">Minimal 50 huruf.</small>}
                  </div>
                  <div className="col-md-12">
                    <label className="form-label-premium">Upload Bukti Foto/Dokumen <span className="text-muted fw-normal text-lowercase">(Opsional)</span></label>
                    <input type="file" className="form-control-premium" accept="image/*,.pdf" onChange={handleFileChange} />
                    {fotoBukti && (
                      <div className="mt-3 p-3 border rounded-4 bg-light text-center shadow-sm">
                        <label className="small text-muted d-block mb-3 fw-bold border-bottom pb-2">Preview Lampiran:</label>
                        {fotoBukti.type.startsWith('image/') ? (
                          <img src={URL.createObjectURL(fotoBukti)} alt="Preview" className="img-fluid rounded border shadow-sm" style={{ maxHeight: '250px', objectFit: 'contain' }} />
                        ) : fotoBukti.type === 'application/pdf' ? (
                          <div className="d-flex flex-column align-items-center gap-2 text-primary fw-bold">
                            <i className="bi bi-file-earmark-pdf-fill text-danger" style={{ fontSize: '4rem' }}></i>
                            <span className="text-dark">{fotoBukti.name}</span>
                            <span className="badge bg-secondary">{(fotoBukti.size / 1024 / 1024).toFixed(2)} MB</span>
                          </div>
                        ) : (
                          <div className="d-flex flex-column align-items-center gap-2">
                            <i className="bi bi-file-earmark fs-1 text-muted"></i>
                            <span className="text-muted fst-italic">File siap diunggah ({fotoBukti.name})</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-top d-flex flex-column flex-sm-row align-items-center justify-content-between gap-4 mt-5">
                  <div className="d-flex align-items-center gap-2 text-muted fw-bold" style={{ fontSize: '0.75rem' }}>
                    <i className="bi bi-shield-check text-success fs-5"></i>
                    Keamanan data terjamin 100%
                  </div>
                  <button type="submit" className="btn btn-primary btn-lg fw-bold px-5 py-3 shadow w-100" style={{ borderRadius: '0.75rem', maxWidth: '300px' }} disabled={loadingSubmit}>
                    {loadingSubmit ? 'Mengirim Data...' : <><i className="bi bi-send-fill me-2"></i> Kirim Laporan Pengaduan</>}
                  </button>
                </div>
              </form>
            )}

            {/* RESULT STATE */}
            {submitResult && (
              <div className="text-center py-5">
                <div className="mb-4 text-success"><i className="bi bi-check-circle-fill" style={{ fontSize: '5rem' }}></i></div>
                <h2 className="fw-bolder text-dark mb-3">Laporan Berhasil Terkirim!</h2>
                <p className="text-muted mb-5">Data Anda telah terenkripsi aman di pangkalan data rahasia kami.</p>

                <div className="bg-light border rounded-4 p-4 mx-auto shadow-sm" style={{ maxWidth: '400px' }}>
                  <span className="text-primary fw-bold text-uppercase d-block mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>Kode Pelacakan Anda</span>
                  <div className="kode-highlight user-select-all mb-2">{submitResult}</div>
                  <p className="text-muted small m-0">Simpan kode di atas baik-baik untuk memantau perkembangan kasus Anda.</p>
                </div>

                <div className="mt-5 d-flex justify-content-center gap-3">
                  <button className="btn btn-outline-secondary fw-bold px-4 py-3" style={{ borderRadius: '0.75rem' }} onClick={copyKode}>
                    <i className="bi bi-copy me-2"></i>Salin Kode
                  </button>
                  <button className="btn btn-primary fw-bold px-4 py-3 shadow" style={{ borderRadius: '0.75rem' }} onClick={() => { setSubmitResult(null); setActiveTab('status'); }}>
                    Lacak Status Sekarang <i className="bi bi-arrow-right ms-2"></i>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="text-center py-5 mt-5" style={{ backgroundColor: 'var(--pink-900)', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <div className="container">
          <p className="text-white fw-semibold mb-2" style={{ color: 'rgba(253, 242, 248, 0.8)' }}>
            Sistem Pelaporan Kekerasan Perempuan & Anak Kota Kendari (SIPEKA)
          </p>
          <p className="m-0" style={{ fontSize: '0.7rem', color: 'rgba(253, 242, 248, 0.5)' }}>
            © 2026 Dinas Pemberdayaan Perempuan & Perlindungan Anak Kota Kendari. Hak Cipta Dilindungi Undang-Undang.
          </p>
        </div>
      </footer>
    </div>
  );
}
