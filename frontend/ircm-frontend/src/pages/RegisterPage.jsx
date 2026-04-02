import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './AuthPages.css'

export default function RegisterPage() {
  const navigate      = useNavigate()
  const { register }  = useAuth()

  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '',
    password: '', password_confirmation: '',
  })
  const [errors, setErrors]   = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
    setApiError('')
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim())    errs.name    = 'Nama lengkap wajib diisi.'
    if (!form.email)          errs.email   = 'Email wajib diisi.'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Format email tidak valid.'
    if (!form.password)       errs.password = 'Password wajib diisi.'
    else if (form.password.length < 8) errs.password = 'Password minimal 8 karakter.'
    if (!form.password_confirmation) errs.password_confirmation = 'Konfirmasi password wajib diisi.'
    else if (form.password !== form.password_confirmation) errs.password_confirmation = 'Konfirmasi password tidak cocok.'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      await register(form)
      navigate('/dashboard')
    } catch (err) {
      if (err?.response?.data?.errors) {
        const serverErrors = {}
        Object.entries(err.response.data.errors).forEach(([key, msgs]) => {
          serverErrors[key] = Array.isArray(msgs) ? msgs[0] : msgs
        })
        setErrors(serverErrors)
      } else {
        setApiError(err?.response?.data?.message || 'Registrasi gagal. Silakan coba lagi.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrapper">
      {/* Left Panel */}
      <div className="auth-left auth-left-purple">
        <div className="auth-left-content">
          <div className="auth-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <div className="auth-logo-icon">
              <svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="22" fill="white" fillOpacity="0.2"/><path d="M14 34V18l10-8 10 8v16H28v-8h-8v8H14z" fill="white"/></svg>
            </div>
            <div>
              <div className="auth-logo-main">IRCM</div>
              <div className="auth-logo-sub">DPPPA Kota Kendari</div>
            </div>
          </div>
          <h2 className="auth-left-title">
            Daftar sebagai<br />Pelapor
          </h2>
          <p className="auth-left-desc">
            Buat akun untuk melaporkan kasus kekerasan dan memantau
            perkembangan laporan Anda secara online.
          </p>
          <div className="auth-left-features">
            <div className="auth-feature"><span className="auth-feature-check">✓</span> Gratis dan mudah digunakan</div>
            <div className="auth-feature"><span className="auth-feature-check">✓</span> Data pribadi dilindungi</div>
            <div className="auth-feature"><span className="auth-feature-check">✓</span> Notifikasi perkembangan kasus</div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="auth-right">
        <div className="auth-form-container auth-form-container-wide">
          <Link to="/" className="auth-back-link">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/></svg>
            Kembali ke Beranda
          </Link>

          <div className="auth-form-header">
            <h1 className="auth-form-title">Buat Akun Baru</h1>
            <p className="auth-form-subtitle">Daftarkan diri Anda sebagai pelapor</p>
          </div>

          {apiError && (
            <div className="auth-alert auth-alert-error">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="form-row">
              <div className={`form-group ${errors.name ? 'has-error' : ''}`}>
                <label className="form-label">Nama Lengkap <span className="required">*</span></label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/></svg>
                  </span>
                  <input type="text" name="name" value={form.name} onChange={handleChange}
                    placeholder="Nama lengkap Anda" className="form-input" autoComplete="name"/>
                </div>
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>

              <div className={`form-group ${errors.email ? 'has-error' : ''}`}>
                <label className="form-label">Alamat Email <span className="required">*</span></label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg>
                  </span>
                  <input type="email" name="email" value={form.email} onChange={handleChange}
                    placeholder="contoh@email.com" className="form-input" autoComplete="email"/>
                </div>
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>
            </div>

            <div className={`form-group ${errors.phone ? 'has-error' : ''}`}>
              <label className="form-label">Nomor Telepon</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
                </span>
                <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                  placeholder="08xx-xxxx-xxxx (opsional)" className="form-input" autoComplete="tel"/>
              </div>
              {errors.phone && <span className="form-error">{errors.phone}</span>}
            </div>

            <div className={`form-group ${errors.address ? 'has-error' : ''}`}>
              <label className="form-label">Alamat</label>
              <div className="input-wrapper">
                <span className="input-icon input-icon-top">
                  <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
                </span>
                <textarea name="address" value={form.address} onChange={handleChange}
                  placeholder="Alamat lengkap (opsional)" className="form-textarea" rows={2}/>
              </div>
              {errors.address && <span className="form-error">{errors.address}</span>}
            </div>

            <div className="form-row">
              <div className={`form-group ${errors.password ? 'has-error' : ''}`}>
                <label className="form-label">Password <span className="required">*</span></label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
                  </span>
                  <input type={showPass ? 'text' : 'password'} name="password" value={form.password}
                    onChange={handleChange} placeholder="Min. 8 karakter" className="form-input"/>
                  <button type="button" className="input-toggle" onClick={() => setShowPass(!showPass)}>
                    {showPass
                      ? <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd"/><path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/></svg>
                      : <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/></svg>
                    }
                  </button>
                </div>
                {errors.password && <span className="form-error">{errors.password}</span>}
              </div>

              <div className={`form-group ${errors.password_confirmation ? 'has-error' : ''}`}>
                <label className="form-label">Konfirmasi Password <span className="required">*</span></label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                  </span>
                  <input type={showPass ? 'text' : 'password'} name="password_confirmation"
                    value={form.password_confirmation} onChange={handleChange}
                    placeholder="Ulangi password" className="form-input"/>
                </div>
                {errors.password_confirmation && <span className="form-error">{errors.password_confirmation}</span>}
              </div>
            </div>

            <div className="form-info-box">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>
              <span>Akun Anda akan didaftarkan sebagai <strong>Pelapor</strong>. Data pribadi Anda dijaga kerahasiaannya.</span>
            </div>

            <button type="submit" className="btn-submit btn-submit-purple" disabled={loading}>
              {loading ? (
                <><span className="spinner" /> Mendaftarkan...</>
              ) : 'Daftar Sekarang'}
            </button>
          </form>

          <p className="auth-switch">
            Sudah punya akun?{' '}
            <Link to="/login" className="auth-switch-link">Masuk di sini</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
