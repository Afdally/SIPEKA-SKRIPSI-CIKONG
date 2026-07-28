// Donut chart "Demografi Korban" — mengelompokkan korban jadi 3 kategori
// berdasarkan usia (anak = di bawah 18 tahun) dan jenis kelamin.
// `data` cukup array laporan/kasus yang masing-masing punya
// `usia_korban` dan `jenis_kelamin`.
import { useState } from 'react';

const COLORS = ['#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6'];
const R_OUTER = 72;
const R_INNER = 44;   // lubang tengah donut
const CX = 90;
const CY = 90;
const CIRC  = 2 * Math.PI * ((R_OUTER + R_INNER) / 2);

export default function DemografiChart({ data }) {
  const [hovered, setHovered] = useState(null);

  let anakPerempuan = 0, anakLakiLaki = 0, dewasaPerempuan = 0;

  data.forEach((d) => {
    const usia = parseInt(d.usia_korban) || 0;
    const jk   = (d.jenis_kelamin || '').toLowerCase();
    if (usia < 18) {
      if (jk === 'perempuan') anakPerempuan++;
      else anakLakiLaki++;
    } else if (jk === 'perempuan') {
      dewasaPerempuan++;
    }
  });

  const total = anakPerempuan + anakLakiLaki + dewasaPerempuan || 1;
  const donutData = [
    { label: 'Perempuan Dewasa', value: dewasaPerempuan, color: COLORS[0] },
    { label: 'Anak Perempuan',   value: anakPerempuan,   color: COLORS[1] },
    { label: 'Anak Laki-laki',   value: anakLakiLaki,    color: COLORS[2] },
  ].filter(d => d.value > 0);

  const SVG_SIZE  = 180;
  const STROKE_W  = R_OUTER - R_INNER;
  const r         = (R_OUTER + R_INNER) / 2;
  const circumf   = 2 * Math.PI * r;
  const GAP       = 3; // px gap antar segmen

  // Build segments
  let accumulated = 0;
  const segments = donutData.map((d, i) => {
    const frac      = d.value / total;
    const arcLen    = frac * circumf - GAP;
    const offset    = circumf - accumulated;
    const seg       = { ...d, frac, arcLen, offset, idx: i };
    accumulated    += frac * circumf;
    return seg;
  });

  // Hovered segment yang ditampilkan di tengah
  const activeIdx = hovered !== null ? hovered : null;
  const activeItem = activeIdx !== null ? donutData[activeIdx] : null;

  return (
    <div className="bento-card h-100" style={{ padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>
          Demografi Korban
        </div>
        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>
          Distribusi usia dan jenis kelamin
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
        {/* SVG Donut */}
        <div style={{ position: 'relative', width: SVG_SIZE, height: SVG_SIZE }}>
          <svg
            width={SVG_SIZE}
            height={SVG_SIZE}
            viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
            style={{ transform: 'rotate(-90deg)' }}
          >
            {/* Background ring */}
            <circle
              cx={CX} cy={CY} r={r}
              fill="none"
              stroke="#f3f4f6"
              strokeWidth={STROKE_W}
            />
            {/* Segments */}
            {segments.map((seg) => (
              <circle
                key={seg.idx}
                cx={CX} cy={CY} r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth={hovered === seg.idx ? STROKE_W + 5 : STROKE_W}
                strokeDasharray={`${seg.arcLen} ${circumf}`}
                strokeDashoffset={-seg.offset + circumf}
                strokeLinecap="round"
                style={{
                  cursor: 'pointer',
                  transition: 'stroke-width 0.2s, stroke-dashoffset 0.4s',
                  filter: hovered === seg.idx
                    ? `drop-shadow(0 0 6px ${seg.color}88)`
                    : 'none',
                }}
                onMouseEnter={() => setHovered(seg.idx)}
                onMouseLeave={() => setHovered(null)}
              />
            ))}
          </svg>

          {/* Center label */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            transition: 'opacity 0.2s',
          }}>
            {activeItem ? (
              <>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: activeItem.color, lineHeight: 1 }}>
                  {activeItem.value}
                </span>
                <span style={{ fontSize: '0.62rem', color: '#6b7280', textAlign: 'center', marginTop: 4, maxWidth: 60 }}>
                  {activeItem.label}
                </span>
              </>
            ) : (
              <>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>
                  {anakPerempuan + anakLakiLaki + dewasaPerempuan}
                </span>
                <span style={{ fontSize: '0.65rem', color: '#9ca3af', marginTop: 4 }}>Total</span>
              </>
            )}
          </div>
        </div>

        {/* Legend */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {donutData.map((d, i) => {
            const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
            return (
              <div
                key={i}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  padding: '0.3rem 0.5rem',
                  borderRadius: '0.5rem',
                  background: hovered === i ? '#f9fafb' : 'transparent',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    width: 10, height: 10,
                    borderRadius: '50%',
                    background: d.color,
                    flexShrink: 0,
                    display: 'inline-block',
                  }} />
                  <span style={{ fontSize: '0.78rem', color: '#374151', fontWeight: 500 }}>
                    {d.label}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#111827' }}>
                    {d.value}
                  </span>
                  <span style={{
                    fontSize: '0.68rem', color: '#fff',
                    background: d.color,
                    borderRadius: 999,
                    padding: '0.1rem 0.45rem',
                    fontWeight: 700,
                  }}>
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
          {donutData.length === 0 && (
            <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.82rem' }}>Belum ada data</p>
          )}
        </div>
      </div>
    </div>
  );
}
