export function pilihLaporanBelumDiregistrasi(reports, kasusList) {
  const laporanSudahMenjadiKasus = new Set(
    (kasusList || []).map(kasus => String(kasus.laporan_id)),
  );

  return (reports || []).filter(report =>
    report.status === 'menunggu_registrasi'
    && !laporanSudahMenjadiKasus.has(String(report._id || report.id)),
  );
}

