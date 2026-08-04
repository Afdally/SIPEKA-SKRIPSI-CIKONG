// Bar chart "Tren Jenis Kasus" — menghitung jumlah laporan per jenis_kekerasan
// lalu menampilkan 6 jenis terbanyak. `data` cukup array laporan/kasus yang
// masing-masing punya field `jenis_kekerasan`.
import { useState } from 'react';

const BAR_COLOR       = '#10b981'; // teal-500
const BAR_COLOR_HOVER = '#059669'; // teal-600
const GRID_COLOR      = '#f3f4f6';
const LABEL_COLOR     = '#9ca3af';
const CHART_H         = 200;       // px tinggi area grafik
const BAR_GAP         = 0.35;      // 35% lebar kolom untuk gap
// Lebar kolom = lebar plot dibagi jumlah kategori, jadi makin sedikit kategori
// makin lebar batangnya. Dengan satu kategori saja, satu batang memenuhi
// seluruh grafik dan terlihat seperti blok warna, bukan diagram. Batas ini
// menjaga bentuknya tetap wajar berapa pun jumlah datanya.
const MAX_BAR_W       = 56;

export default function JenisKasusChart({ data }) {
  const [hovered, setHovered] = useState(null);

  // Hitung frekuensi per jenis kekerasan
  const counts = {};
  data.forEach((d) => {
    const jenis = d.jenis_kekerasan || 'Lainnya';
    counts[jenis] = (counts[jenis] || 0) + 1;
  });

  const chartData = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const maxValue = Math.max(...chartData.map((d) => d[1]), 1);

  // Grid: 4 garis, nilai Y = 0, max/3, 2*max/3, max (rounded)
  const gridCount = 4;
  const gridValues = Array.from({ length: gridCount }, (_, i) =>
    Math.round((maxValue / (gridCount - 1)) * (gridCount - 1 - i))
  );

  // SVG dimensions
  const SVG_W   = 560;
  const SVG_H   = CHART_H + 60; // + ruang label bawah + Y-axis atas
  const PAD_L   = 40;
  const PAD_R   = 16;
  const PAD_TOP = 20;
  const PAD_BOT = 36;
  const plotW   = SVG_W - PAD_L - PAD_R;
  const plotH   = CHART_H;

  const colW    = plotW / chartData.length;
  const barW    = Math.min(colW * (1 - BAR_GAP), MAX_BAR_W);
  // Batang dipusatkan di kolomnya — kalau dibatasi MAX_BAR_W, sisa ruangnya
  // harus dibagi rata kiri-kanan supaya tetap sejajar dengan label di bawahnya.
  const barOff  = (colW - barW) / 2;
  const RADIUS  = 5;

  return (
    <div className="bento-card h-100" style={{ padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>
          Tren Jenis Kasus
        </div>
        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>
          Distribusi berdasarkan jenis kekerasan
        </div>
      </div>

      {chartData.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#9ca3af', paddingTop: '3rem', fontSize: '0.85rem' }}>
          Belum ada data
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          style={{ width: '100%', overflow: 'visible' }}
          aria-label="Bar chart jenis kasus"
        >
          {/* Y-axis grid lines + labels */}
          {gridValues.map((val, i) => {
            const y = PAD_TOP + (plotH / (gridCount - 1)) * i;
            return (
              <g key={i}>
                <line
                  x1={PAD_L} y1={y}
                  x2={SVG_W - PAD_R} y2={y}
                  stroke={i === gridCount - 1 ? '#e5e7eb' : GRID_COLOR}
                  strokeWidth="1"
                />
                <text
                  x={PAD_L - 6} y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill={LABEL_COLOR}
                  fontFamily="system-ui, sans-serif"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {chartData.map(([label, val], idx) => {
            const barH  = Math.max((val / maxValue) * plotH, 2);
            const x     = PAD_L + idx * colW + barOff;
            const y     = PAD_TOP + plotH - barH;
            const isHov = hovered === idx;
            const fill  = isHov ? BAR_COLOR_HOVER : BAR_COLOR;

            // Rounded-top rect via path
            const r  = Math.min(RADIUS, barH / 2);
            const bW = barW;
            const bX = x;
            const bY = y;
            const bH = barH;
            const path = `
              M ${bX + r} ${bY}
              H ${bX + bW - r}
              Q ${bX + bW} ${bY} ${bX + bW} ${bY + r}
              V ${bY + bH}
              H ${bX}
              V ${bY + r}
              Q ${bX} ${bY} ${bX + r} ${bY}
              Z
            `;

            // Wrap label
            const words  = label.split(' ');
            const line1  = words.slice(0, Math.ceil(words.length / 2)).join(' ');
            const line2  = words.slice(Math.ceil(words.length / 2)).join(' ');
            const labelX = bX + bW / 2;
            const labelY = PAD_TOP + plotH + 14;

            return (
              <g
                key={idx}
                onMouseEnter={() => setHovered(idx)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: 'pointer' }}
              >
                <path d={path} fill={fill} style={{ transition: 'fill 0.15s' }} />

                {/* Tooltip on hover */}
                {isHov && (
                  <g>
                    <rect
                      x={bX + bW / 2 - 22} y={bY - 28}
                      width={44} height={22}
                      rx={6} fill="#111827"
                    />
                    <text
                      x={bX + bW / 2} y={bY - 13}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="700"
                      fill="#fff"
                      fontFamily="system-ui, sans-serif"
                    >
                      {val}
                    </text>
                  </g>
                )}

                {/* X-axis label */}
                <text
                  x={labelX} y={labelY}
                  textAnchor="middle"
                  fontSize="9.5"
                  fill={LABEL_COLOR}
                  fontFamily="system-ui, sans-serif"
                >
                  {line1}
                </text>
                {line2 && (
                  <text
                    x={labelX} y={labelY + 12}
                    textAnchor="middle"
                    fontSize="9.5"
                    fill={LABEL_COLOR}
                    fontFamily="system-ui, sans-serif"
                  >
                    {line2}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
