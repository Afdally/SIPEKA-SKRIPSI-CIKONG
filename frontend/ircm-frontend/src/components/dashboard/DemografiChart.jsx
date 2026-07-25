// Donut chart "Demografi Korban" — mengelompokkan korban jadi 3 kategori
// berdasarkan usia (anak = di bawah 18 tahun) dan jenis kelamin.
// `data` cukup array laporan/kasus yang masing-masing punya
// `usia_korban` dan `jenis_kelamin`.
export default function DemografiChart({ data }) {
  let anakPerempuan = 0, anakLakiLaki = 0, dewasaPerempuan = 0;

  data.forEach((d) => {
    const usia = parseInt(d.usia_korban) || 0;
    const jenisKelamin = (d.jenis_kelamin || '').toLowerCase();
    if (usia < 18) {
      if (jenisKelamin === 'perempuan') anakPerempuan++;
      else anakLakiLaki++;
    } else if (jenisKelamin === 'perempuan') {
      dewasaPerempuan++;
    }
  });

  const total = anakPerempuan + anakLakiLaki + dewasaPerempuan || 1;
  const donutData = [
    { label: 'Perempuan Dewasa', value: dewasaPerempuan, color: '#3b82f6', percent: (dewasaPerempuan / total) * 100 },
    { label: 'Anak Perempuan', value: anakPerempuan, color: '#ec4899', percent: (anakPerempuan / total) * 100 },
    { label: 'Anak Laki-laki', value: anakLakiLaki, color: '#f59e0b', percent: (anakLakiLaki / total) * 100 },
  ];

  // Tiap lingkaran donut digambar sebagai potongan stroke-dasharray;
  // cumulativeDash melacak dari sudut berapa potongan berikutnya harus mulai.
  let cumulativeDash = 0;

  return (
    <div className="bento-card h-100">
      <div className="fw-bold mb-4">Demografi Korban</div>
      <div className="donut-chart-container">
        <svg className="donut-svg" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r="65" fill="transparent" stroke="#f1f5f9" strokeWidth="20" />
          {donutData.map((d, i) => {
            const dashLength = (d.percent / 100) * 408.4;
            const offset = -cumulativeDash;
            cumulativeDash += dashLength;
            if (d.value === 0) return null;
            return (
              <circle
                key={i}
                cx="80" cy="80" r="65"
                fill="transparent"
                stroke={d.color}
                strokeWidth="20"
                strokeDasharray={`${dashLength} 408.4`}
                strokeDashoffset={offset}
                style={{ transition: '0.3s' }}
              />
            );
          })}
        </svg>
        <div className="donut-legend">
          {donutData.map((d, i) => (
            <div key={i} className="legend-item">
              <div>
                <span className="legend-color" style={{ backgroundColor: d.color }}></span>{' '}
                <span className="text-muted">{d.label}</span>
              </div>
              <div className="fw-bold">{d.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
