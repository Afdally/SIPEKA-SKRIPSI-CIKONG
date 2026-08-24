import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';
import logo from '../assets/logo.png';

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
        if (user.role === 'super_admin' || user.role === 'petugas_uptd') {
          redirectBasedOnRole(user.role);
        } else {
          localStorage.removeItem('sipeka_user');
          localStorage.removeItem('sipeka_token');
        }
      }
    } catch (e) {
      localStorage.removeItem('sipeka_user');
      localStorage.removeItem('sipeka_token');
    }
  }, []);

  const redirectBasedOnRole = (role) => {
    if (role === 'super_admin') {
      navigate('/superadmin', { replace: true });
    } else if (role === 'petugas_uptd') {
      navigate('/dashboard-dp3a', { replace: true });
    } else {
      localStorage.removeItem('sipeka_token');
      localStorage.removeItem('sipeka_user');
      setErrorMsg('Role akun tidak valid atau sesi kadaluarsa.');
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
      const res = await authService.login(email, password);

      localStorage.setItem('sipeka_token', res.access_token);
      localStorage.setItem('sipeka_user', JSON.stringify(res.user));

      redirectBasedOnRole(res.user.role);
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
    <div className="login-tw-scope tw-flex tw-min-h-screen tw-w-full tw-bg-white">
      {/* Tailwind Preflight dimatikan (lihat index.html) supaya tidak menabrak
          Bootstrap di halaman lain — tapi konsekuensinya class border-* cuma
          nge-set lebar, bukan gaya border. Tanpa ini, border di <input> ikut
          gaya bawaan browser ("inset", timbul sebelah), dan border di elemen
          non-form (div, dsb) malah tidak muncul sama sekali. Baris ini
          menyamakannya jadi solid, scoped ke halaman login saja. */}
      <style>{`.login-tw-scope [class*="tw-border"] { border-style: solid; }`}</style>

      {/* PANEL KIRI — BRANDING (disembunyikan penuh di mobile) */}
      <div
        className="tw-relative tw-hidden tw-w-1/2 tw-flex-col tw-justify-between tw-overflow-hidden tw-p-12 tw-text-white lg:tw-flex"
        style={{ background: 'linear-gradient(150deg, #8c1c3f 0%, #5c1023 55%, #2d0812 100%)' }}
      >
        {/* Elemen dekoratif — radial-gradient samar */}
        <div
          className="tw-pointer-events-none tw-absolute tw-inset-0"
          style={{ background: 'radial-gradient(circle at 15% 15%, rgba(255,255,255,0.10), transparent 45%), radial-gradient(circle at 85% 78%, rgba(255,255,255,0.07), transparent 42%)' }}
        ></div>

        {/* Elemen dekoratif — ombak SVG di bawah */}
        <svg className="tw-pointer-events-none tw-absolute tw-bottom-0 tw-left-0 tw-w-full" viewBox="0 0 500 160" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,90 C120,150 280,30 500,100 L500,160 L0,160 Z" fill="rgba(255,255,255,0.06)" />
          <path d="M0,120 C150,70 350,160 500,70 L500,160 L0,160 Z" fill="rgba(255,255,255,0.045)" />
        </svg>

        {/* Logo + nama aplikasi + kepanjangan */}
        <div className="tw-relative tw-z-10 tw-flex tw-items-center tw-gap-4">
          <div
            className="tw-flex tw-h-24 tw-w-24 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-2xl tw-border tw-border-white/30 tw-backdrop-blur-md"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.08) 60%, rgba(255,255,255,0.16) 100%)' }}
          >
            <img src={logo} alt="Logo SIPEKA" className="tw-h-14 tw-w-14 tw-object-contain" />
          </div>
          <div>
            <div className="tw-text-2xl tw-font-bold tw-tracking-wide">SIPEKA KENDARI</div>
            <p className="tw-mt-1 tw-text-xs tw-leading-snug tw-text-white/70">
              Sistem Pelaporan dan Manajemen Kasus Kekerasan terhadap Perempuan dan Anak<br />
              DPPPA Kota Kendari
            </p>
          </div>
        </div>

        {/* Sapaan */}
        <div className="tw-relative tw-z-10">
          <h1 className="tw-mb-3 tw-text-3xl tw-font-bold tw-leading-snug">
            Selamat Datang,<br />Petugas UPTD PPA
          </h1>
          <p className="tw-max-w-sm tw-text-sm tw-leading-relaxed tw-text-white/75">
            Masuk untuk menerima laporan, melakukan assessment, dan menangani kasus kekerasan perempuan dan anak secara responsif.
          </p>
        </div>

        <div className="tw-relative tw-z-10 tw-text-xs tw-text-white/50">
          © {new Date().getFullYear()} DPPPA Kota Kendari
        </div>
      </div>

      {/* PANEL KANAN — FORM (satu-satunya panel yang tampil di mobile, di tengah) */}
      <div className="tw-flex tw-w-full tw-flex-col tw-items-center tw-justify-center tw-bg-white tw-p-6 sm:tw-p-10 lg:tw-w-1/2">
        <div className="tw-w-full tw-max-w-sm">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="tw-mb-8 tw-inline-flex tw-appearance-none tw-items-center tw-gap-2 tw-border-0 tw-bg-transparent tw-p-0 tw-text-sm tw-font-medium tw-text-gray-500 tw-outline-none tw-transition-colors hover:tw-text-[#8c1c3f]"
          >
            <i className="fa-solid fa-arrow-left"></i> Kembali ke Beranda
          </button>

          <h2 className="tw-mb-1 tw-text-2xl tw-font-bold tw-text-gray-900">Masuk ke Akun Anda</h2>
          <p className="tw-mb-8 tw-text-sm tw-text-gray-500">Silakan masukkan kredensial Anda untuk melanjutkan.</p>

          {errorMsg && (
            <div className="tw-mb-6 tw-flex tw-items-start tw-gap-2 tw-rounded-xl tw-border tw-border-red-200 tw-bg-red-50 tw-p-3 tw-text-sm tw-text-red-600">
              <i className="fa-solid fa-circle-exclamation tw-mt-0.5"></i>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="tw-space-y-5">
            <div>
              <label htmlFor="email" className="tw-mb-1.5 tw-block tw-text-sm tw-font-semibold tw-text-gray-700">Alamat Email</label>
              <div className="tw-relative">
                <i className="fa-solid fa-envelope tw-pointer-events-none tw-absolute tw-left-4 tw-top-1/2 -tw-translate-y-1/2 tw-text-gray-400"></i>
                <input
                  id="email"
                  type="email"
                  placeholder="contoh@email.com"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="tw-w-full tw-rounded-xl tw-border tw-border-gray-300 tw-bg-white tw-py-3 tw-pl-11 tw-pr-4 tw-text-sm tw-text-gray-900 tw-outline-none tw-transition focus:tw-border-[#8c1c3f] focus:tw-ring-4 focus:tw-ring-[#8c1c3f]/10"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="tw-mb-1.5 tw-block tw-text-sm tw-font-semibold tw-text-gray-700">Password</label>
              <div className="tw-relative">
                <i className="fa-solid fa-lock tw-pointer-events-none tw-absolute tw-left-4 tw-top-1/2 -tw-translate-y-1/2 tw-text-gray-400"></i>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="tw-w-full tw-rounded-xl tw-border tw-border-gray-300 tw-bg-white tw-py-3 tw-pl-11 tw-pr-11 tw-text-sm tw-text-gray-900 tw-outline-none tw-transition focus:tw-border-[#8c1c3f] focus:tw-ring-4 focus:tw-ring-[#8c1c3f]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="tw-absolute tw-right-4 tw-top-1/2 tw-flex tw-appearance-none -tw-translate-y-1/2 tw-items-center tw-border-0 tw-bg-transparent tw-p-0 tw-text-gray-400 tw-outline-none tw-transition-colors hover:tw-text-gray-600"
                  aria-label={showPass ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  <i className={showPass ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'}></i>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="tw-mt-2 tw-flex tw-w-full tw-appearance-none tw-items-center tw-justify-center tw-gap-2 tw-rounded-xl tw-border-0 tw-bg-[#8c1c3f] tw-py-3.5 tw-text-sm tw-font-bold tw-text-white tw-outline-none tw-transition hover:tw-bg-[#701731] disabled:tw-cursor-not-allowed disabled:tw-opacity-70"
            >
              {loading ? (
                <>
                  <span className="tw-h-4 tw-w-4 tw-animate-spin tw-rounded-full tw-border-2 tw-border-white/30 tw-border-t-white"></span>
                  Memproses...
                </>
              ) : (
                'Masuk ke Dashboard'
              )}
            </button>
          </form>

          <p className="tw-mt-8 tw-text-center tw-text-sm tw-text-gray-500">
            Ingin membuat laporan?{' '}
            <Link to="/" className="tw-font-semibold tw-text-[#8c1c3f] hover:tw-underline">
              Lapor tanpa akun di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
