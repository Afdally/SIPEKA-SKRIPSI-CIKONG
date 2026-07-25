// Satu kartu angka ringkasan di bagian atas dashboard (Total Laporan, Kasus Selesai, dst).
// Dipakai di DashboardDP3A dan DashboardSuperAdmin supaya tampilannya konsisten.
export default function StatCard({ icon, iconBg, iconColor, label, value }) {
  return (
    <div className="col-md-3">
      <div className="bento-card mb-0 d-flex align-items-center gap-3">
        <div
          className="rounded-circle d-flex align-items-center justify-content-center"
          style={{ width: '48px', height: '48px', background: iconBg, color: iconColor }}
        >
          <i className={`bi ${icon} fs-4`}></i>
        </div>
        <div>
          <div className="small text-muted fw-bold">{label}</div>
          <div className="h4 m-0 fw-bold text-dark">{value}</div>
        </div>
      </div>
    </div>
  );
}
