import React from 'react';

// Ilustrasi flat khas Storyset/unDraw, di-recolor ke palet pink brand
// SIPEKA. Murni dekoratif untuk hero — petugas dengan headset menerima
// laporan lewat panggilan, ditemani asisten kecil. Semua warna diambil
// dari token --pink-*/--ink-* (App.css) supaya ikut kalau brand berubah.
export default function HeroIllustration() {
  return (
    <svg viewBox="0 0 520 460" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ilustrasi petugas menerima laporan">
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

      {/* Bayangan lantai */}
      <ellipse cx="262" cy="404" rx="150" ry="12" fill="var(--pink-900)" opacity="0.08" />

      {/* Kartu kecil "penelepon" pojok kanan atas */}
      <g>
        <rect x="392" y="48" width="104" height="92" rx="18" fill="#fff" stroke="var(--pink-200)" strokeWidth="2" />
        <circle cx="424" cy="86" r="16" fill="var(--pink-100)" />
        <circle cx="424" cy="81" r="7" fill="var(--pink-400)" />
        <path d="M411 100c3-7 22-7 25 0" stroke="var(--pink-500)" strokeWidth="3" strokeLinecap="round" fill="none" />
        <rect x="452" y="70" width="30" height="24" rx="10" fill="var(--pink-50)" stroke="var(--pink-300)" strokeWidth="1.5" />
        <text x="467" y="88" fontSize="16" fontWeight="700" fill="var(--pink-600)" textAnchor="middle">?</text>
      </g>

      {/* Chat bubble di atas kepala petugas */}
      <g>
        <path d="M336 108h84a14 14 0 0 1 14 14v28a14 14 0 0 1-14 14h-52l-18 16v-16h-14a14 14 0 0 1-14-14v-28a14 14 0 0 1 14-14Z" fill="#fff" stroke="var(--pink-200)" strokeWidth="2" />
        <circle cx="362" cy="136" r="5" fill="var(--pink-400)" />
        <circle cx="380" cy="136" r="5" fill="var(--pink-400)" />
        <circle cx="398" cy="136" r="5" fill="var(--pink-400)" />
      </g>

      {/* Meja + laptop */}
      <rect x="140" y="330" width="230" height="14" rx="7" fill="var(--pink-200)" />
      <rect x="160" y="300" width="190" height="34" rx="8" fill="#fff" stroke="var(--pink-300)" strokeWidth="2" />
      <rect x="180" y="216" width="150" height="98" rx="12" fill="#fff" stroke="var(--ink-900)" strokeWidth="3" />
      <rect x="196" y="232" width="118" height="10" rx="5" fill="var(--pink-200)" />
      <rect x="196" y="250" width="90" height="8" rx="4" fill="var(--pink-100)" />
      <rect x="196" y="264" width="100" height="8" rx="4" fill="var(--pink-100)" />

      {/* Petugas duduk */}
      <path d="M198 300c0-46 30-78 67-78s67 32 67 78" fill="var(--pink-500)" />
      <circle cx="265" cy="164" r="44" fill="var(--pink-50)" stroke="var(--ink-900)" strokeWidth="2.5" />
      <path d="M221 156c-4-40 30-64 66-56 30 6 42 30 40 56 0-30-20-46-52-46-30 0-52 18-54 46Z" fill="var(--pink-900)" />
      {/* Headset */}
      <path d="M223 150a42 42 0 0 1 84 0" fill="none" stroke="var(--ink-900)" strokeWidth="4" strokeLinecap="round" />
      <circle cx="223" cy="160" r="9" fill="var(--pink-600)" />
      <circle cx="307" cy="160" r="9" fill="var(--pink-600)" />
      <path d="M223 168c-6 18 6 30 22 32" stroke="var(--ink-900)" strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="247" cy="200" r="4" fill="var(--ink-900)" />
      {/* Wajah */}
      <circle cx="250" cy="160" r="4" fill="var(--ink-900)" />
      <circle cx="280" cy="160" r="4" fill="var(--ink-900)" />
      <path d="M250 180c8 8 22 8 30 0" stroke="var(--pink-700)" strokeWidth="3" strokeLinecap="round" fill="none" />

      {/* Asisten robot kecil */}
      <g>
        <rect x="66" y="326" width="66" height="58" rx="16" fill="var(--pink-400)" stroke="var(--ink-900)" strokeWidth="2" />
        <line x1="99" y1="326" x2="99" y2="308" stroke="var(--ink-900)" strokeWidth="3" />
        <circle cx="99" cy="302" r="6" fill="var(--pink-600)" />
        <circle cx="86" cy="352" r="7" fill="#fff" />
        <circle cx="86" cy="352" r="3" fill="var(--ink-900)" />
        <circle cx="112" cy="352" r="7" fill="#fff" />
        <circle cx="112" cy="352" r="3" fill="var(--ink-900)" />
        <rect x="84" y="366" width="30" height="6" rx="3" fill="var(--pink-100)" />
      </g>

      {/* Tanaman kecil */}
      <g>
        <rect x="420" y="360" width="34" height="26" rx="6" fill="var(--pink-600)" />
        <path d="M437 360c-4-22-26-30-34-26 2 14 16 28 34 26Z" fill="var(--pink-300)" />
        <path d="M437 360c6-20 26-24 32-18-4 12-18 22-32 18Z" fill="var(--pink-400)" />
      </g>

      {/* Tumpukan buku kecil */}
      <g>
        <rect x="356" y="378" width="56" height="12" rx="3" fill="var(--pink-300)" />
        <rect x="362" y="366" width="46" height="12" rx="3" fill="var(--pink-500)" />
        <rect x="368" y="354" width="36" height="12" rx="3" fill="var(--pink-200)" />
      </g>
    </svg>
  );
}
