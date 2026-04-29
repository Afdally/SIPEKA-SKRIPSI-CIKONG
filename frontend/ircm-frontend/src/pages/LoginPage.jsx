import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

const API_AUTH = 'http://localhost:8080/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto redirect jika sudah login
  useEffect(() => {
    try {
      const userRaw = localStorage.getItem('sipeka_user');
      const token = localStorage.getItem('sipeka_token');
      if (userRaw && token && userRaw !== 'undefined') {
        const user = JSON.parse(userRaw);
        redirectBasedOnRole(user.role);
      }
    } catch(e) {
      localStorage.removeItem('sipeka_user');
      localStorage.removeItem('sipeka_token');
    }
  }, []);

  const redirectBasedOnRole = (role) => {
    if (role === 'super_admin') {
      navigate('/superadmin', { replace: true });
    } else {
      navigate('/dashboard-dp3a', { replace: true });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Email dan password wajib diisi.');
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`${API_AUTH}/auth/login`, { email, password });
      
      localStorage.setItem('sipeka_token', res.data.access_token);
      localStorage.setItem('sipeka_user', JSON.stringify(res.data.user));
      
      redirectBasedOnRole(res.data.user.role);
    } catch (err) {
      if (err.response) {
        setErrorMsg(err.response.data.message || 'Email atau password salah.');
      } else {
        setErrorMsg('Tidak dapat terhubung ke server. Pastikan backend sudah berjalan.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="auth-body">
      {/* Latar Belakang Kiri */}
      <div className="auth-left">
        <div className="auth-left-content">
          <Link to="/" className="auth-logo">
            <div className="auth-logo-icon">
              <svg viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="22" fill="white" fillOpacity=".2"/>
                <path d="M14 34V18l10-8 10 8v16H28v-8h-8v8H14z" fill="white"/>
              </svg>
            </div>
            <div>
              <div className="auth-logo-main">SIPEKA</div>
              <div className="auth-logo-sub">DPPPA Kota Kendari</div>
            </div>
          </Link>
          
          <h2 className="auth-left-title">Portal Pelayanan<br/>Terintegrasi IRCM<br/>Kota Kendari</h2>
          <p className="auth-left-desc">
            Akses khusus bagi Petugas UPTD PPA untuk menerima laporan, melakukan assessment, dan menangani kasus kekerasan secara responsif.
          </p>
        </div>
      </div>

      {/* Bagian Kanan Formulir */}
      <div className="auth-right">
        <div className="auth-form-container">
          <Link to="/" className="auth-back-link">
            <i className="bi bi-arrow-left"></i> Kembali ke Beranda
          </Link>

          <h1 className="auth-form-title">Masuk Petugas / Admin</h1>
          <p className="auth-form-subtitle">Silakan masukkan kredensial Anda untuk melanjutkan.</p>

          {errorMsg && (
            <div className="auth-alert-error fade-in">
              <i className="bi bi-exclamation-circle-fill" style={{marginTop: '2px'}}></i>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group mb-3">
              <label className="form-label-custom">Alamat Email</label>
              <div className="input-wrapper position-relative d-flex align-items-center">
                <span className="input-icon"><i className="bi bi-envelope"></i></span>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="contoh@email.com" 
                  required 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group mb-4">
              <label className="form-label-custom">Password</label>
              <div className="input-wrapper position-relative d-flex align-items-center">
                <span className="input-icon"><i className="bi bi-lock"></i></span>
                <input 
                  type={showPass ? 'text' : 'password'} 
                  className="form-input" 
                  placeholder="Masukkan password" 
                  required 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button type="button" className="input-toggle" onClick={() => setShowPass(!showPass)}>
                  <i className={showPass ? 'bi bi-eye-slash' : 'bi bi-eye'}></i>
                </button>
              </div>
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? (
                <><span className="spinner-sm"></span> Memproses...</>
              ) : (
                'Masuk ke Dashboard'
              )}
            </button>
          </form>

          <p className="text-center mt-4" style={{fontSize: '14px', color: '#6b7280'}}>
            Ingin membuat laporan?{' '}
            <Link to="/" style={{color: '#1a56db', fontWeight: '600', textDecoration: 'none'}}>
              Lapor tanpa akun di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
