import test from 'node:test';
import assert from 'node:assert/strict';
import { pilihLaporanBelumDiregistrasi } from './laporanBaru.js';

test('laporan lama disembunyikan segera setelah kasusnya ada', () => {
  const reports = [
    { _id: 'laporan-1', status: 'menunggu_registrasi' },
    { _id: 'laporan-2', status: 'menunggu_registrasi' },
    { _id: 'laporan-3', status: 'proses_assessment' },
  ];
  const kasus = [{ laporan_id: 'laporan-1', status: 'registrasi' }];

  assert.deepEqual(
    pilihLaporanBelumDiregistrasi(reports, kasus).map(item => item._id),
    ['laporan-2'],
  );
});

test('ID report dan kasus dibandingkan konsisten lintas bentuk data', () => {
  const reports = [
    { id: 101, status: 'menunggu_registrasi' },
    { _id: '102', status: 'menunggu_registrasi' },
  ];
  const kasus = [{ laporan_id: '101' }];

  assert.deepEqual(
    pilihLaporanBelumDiregistrasi(reports, kasus).map(item => String(item._id || item.id)),
    ['102'],
  );
});
