// Daftar "Aktivitas Penanganan Terbaru" di dashboard Super Admin.
// Diturunkan langsung dari data laporan asli (bukan teks statis) —
// diurutkan dari yang paling baru diperbarui, diambil 4 teratas.

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const menit = Math.floor(diffMs / 60000);
  if (menit < 1) return 'Baru saja';
  if (menit < 60) return `${menit} menit yang lalu`;
  const jam = Math.floor(menit / 60);
  if (jam < 24) return `${jam} jam yang lalu`;
  return `${Math.floor(jam / 24)} hari yang lalu`;
}

function describeActivity(r) {
  switch (r.status) {
    case 'menunggu_registrasi':
      return <>Laporan baru diterima dari wilayah <span className="fw-bold">{r.kelurahan_korban || '-'}</span></>;
    case 'proses_assessment':
      return <>Assessment dimulai untuk laporan <span className="text-primary">{r.kode_laporan}</span></>;
    case 'dalam_penanganan':
      return <>Kasus <span className="text-primary">{r.kode_laporan}</span> sedang dalam penanganan</>;
    case 'selesai':
      return <>Kasus <span className="text-primary">{r.kode_laporan}</span> telah selesai ditangani</>;
    default:
      return <>Laporan <span className="text-primary">{r.kode_laporan}</span> status diperbarui</>;
  }
}

export default function ActivityFeed({ reports }) {
  const recent = [...reports]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 4);

  return (
    <div className="bento-card">
      <div className="bento-title"><i className="bi bi-activity text-danger"></i> Aktivitas Penanganan Terbaru</div>
      <div className="mt-3">
        {recent.map((r, i) => (
          <div className={`activity-item${i === 0 ? ' active' : ''}`} key={r.id || r._id}>
            <div className="activity-content">
              {describeActivity(r)}
              <span className="activity-time">{timeAgo(r.updatedAt || r.createdAt)}</span>
            </div>
          </div>
        ))}
        {reports.length === 0 && (
          <div className="text-center text-muted small py-3">Belum ada aktivitas.</div>
        )}
      </div>
    </div>
  );
}
