// Sebaran laporan per kelurahan, untuk pandangan tingkat kota di dashboard
// Super Admin.
//
// Batangnya horizontal, bukan vertikal seperti JenisKasusChart. Kendari punya
// 26 kelurahan dengan nama panjang ("Kampung Salo", "Puunggaloba") — kalau
// ditulis di bawah batang vertikal, namanya harus dipotong atau dimiringkan dan
// jadi sulit dibaca. Ditaruh di kiri, nama sepanjang apa pun tetap terbaca.
import { useState } from 'react';
import { cocokDenganFilterKategori } from '../../utils/kategoriKorban';

const BAR_COLOR = '#8c1c3f'; // maroon, seirama --primary dashboard
const JUMLAH_TAMPIL = 8;

// Nilainya mengikuti enum tipe_laporan di model Laporan (report-service).
// "perempuan" di sini berarti perempuan dewasa — penggolongannya dari usia
// korban (di bawah 18 tahun = anak), bukan dari jenis kelamin.
const FILTER = [
  { id: 'semua', label: 'Semua' },
  { id: 'anak', label: 'Anak' },
  { id: 'perempuan', label: 'Perempuan' },
];

export default function SebaranKelurahanChart({ data }) {
  const [filter, setFilter] = useState('semua');

  // Laporan lama bisa belum punya tipe_laporan, jadi disimpulkan dari usia
  // supaya data lama tetap ikut terhitung, bukan hilang dari grafik.
  const terpilih = data.filter((d) => cocokDenganFilterKategori(d, filter));

  const jumlah = {};
  terpilih.forEach((d) => {
    const kel = d.kelurahan_korban || 'Tidak diketahui';
    jumlah[kel] = (jumlah[kel] || 0) + 1;
  });

  const baris = Object.entries(jumlah)
    .sort((a, b) => b[1] - a[1])
    .slice(0, JUMLAH_TAMPIL);

  const maks = Math.max(...baris.map((b) => b[1]), 1);
  const total = terpilih.length;
  const kelurahanTerdampak = Object.keys(jumlah).length;

  return (
    <div className="bento-card h-100" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>
            Sebaran Kasus per Kelurahan
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>
            {JUMLAH_TAMPIL} kelurahan dengan laporan terbanyak
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          {FILTER.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              style={{
                border: `1px solid ${filter === f.id ? BAR_COLOR : '#e5e7eb'}`,
                background: filter === f.id ? BAR_COLOR : '#fff',
                color: filter === f.id ? '#fff' : '#6b7280',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Total ikut disaring, supaya angkanya selalu cocok dengan batang di bawahnya */}
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', lineHeight: 1.1 }}>{total}</div>
          <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>Total laporan</div>
        </div>
        <div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', lineHeight: 1.1 }}>{kelurahanTerdampak}</div>
          <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>Kelurahan terdampak</div>
        </div>
      </div>

      {baris.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#9ca3af', paddingTop: '2rem', fontSize: '0.85rem' }}>
          Belum ada data untuk filter ini
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {baris.map(([kel, nilai]) => (
            <div key={kel} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{ width: '110px', flexShrink: 0, fontSize: '0.75rem', color: '#374151', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                title={kel}
              >
                {kel}
              </div>
              <div style={{ flex: 1, background: '#f3f4f6', borderRadius: '4px', height: '18px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${(nilai / maks) * 100}%`,
                    minWidth: '3px',
                    height: '100%',
                    background: BAR_COLOR,
                    borderRadius: '4px',
                    transition: 'width 0.25s',
                  }}
                />
              </div>
              <div style={{ width: '24px', flexShrink: 0, fontSize: '0.78rem', fontWeight: 700, color: '#111827' }}>
                {nilai}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
