import React from 'react';
import contactUsIllustration from '../../assets/contact-us-illustration.svg';

// Ilustrasi "Contact us" dari Storyset (gaya Pana), di-recolor manual ke
// palet pink/sand brand SIPEKA (lihat src/assets/contact-us-illustration.svg
// — warna netral & aksen sudah diganti, warna kulit karakter dibiarkan asli).
// Lisensi Freepik: gratis dipakai asal ada atribusi — link-nya ada di
// footer LandingPage.jsx, jangan dihapus.
// Ukuran & posisi diatur di Public.css lewat .hero-illustration-wrap svg/img
// (bukan inline style di sini) supaya cuma ada satu tempat buat diubah.
export default function HeroIllustration() {
  return (
    <>
      <svg viewBox="0 0 520 460" aria-hidden="true">
        <defs>
          <linearGradient id="blobGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--pink-100)" />
            <stop offset="100%" stopColor="var(--pink-200)" />
          </linearGradient>
        </defs>
        {/* Blob organik asimetris sebagai backdrop */}
        <path
          d="M96 118C58 62 148 6 240 16C336 26 442 34 470 118C500 206 466 322 384 384C304 444 176 442 104 380C34 320 26 216 96 118Z"
          fill="url(#blobGrad)"
        />
      </svg>
      <img src={contactUsIllustration} alt="Ilustrasi petugas menerima laporan lewat panggilan" />
    </>
  );
}
