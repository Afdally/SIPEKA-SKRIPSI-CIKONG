// Bar chart "Tren Jenis Kasus" — menghitung jumlah laporan per jenis_kekerasan
// lalu menampilkan 4 jenis terbanyak. `data` cukup array laporan/kasus yang
// masing-masing punya field `jenis_kekerasan`.
export default function JenisKasusChart({ data }) {
  const counts = {};
  data.forEach((d) => {
    const jenis = d.jenis_kekerasan || 'Lainnya';
    counts[jenis] = (counts[jenis] || 0) + 1;
  });

  const chartData = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const maxValue = Math.max(...chartData.map((d) => d[1]), 10);

  return (
    <div className="bento-card h-100">
      <div className="fw-bold mb-4">Tren Jenis Kasus Tahun Ini</div>
      <div className="bar-chart-mini position-relative">
        {/* Garis bantu horizontal di belakang bar */}
        <div
          className="position-absolute w-100 h-100"
          style={{ zIndex: 0, left: 0, top: 0, pointerEvents: 'none', display: 'flex', flexDirection: 'column' }}
        >
          <div className="border-bottom border-dashed" style={{ flex: 1, opacity: 0.5 }}></div>
          <div className="border-bottom border-dashed" style={{ flex: 1, opacity: 0.5 }}></div>
          <div className="border-bottom border-dashed" style={{ flex: 1, opacity: 0.5 }}></div>
        </div>
        {chartData.map(([label, val], idx) => (
          <div key={idx} className="bar-item-wrapper">
            <div className="bar-item" style={{ height: `${(val / maxValue) * 100}%` }} data-val={val}></div>
            <div className="bar-label">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
