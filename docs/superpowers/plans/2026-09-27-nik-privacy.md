# Rencana Implementasi: Input dan Privasi NIK

## Tugas 1 — Validasi dan sanitasi backend

- File: `backend/reporting-service/src/controllers/laporanController.js`
- Tambahkan validasi NIK 16 digit pada `store`.
- Pastikan laporan anonim menghapus NIK pelapor.
- Tambahkan helper untuk mengembalikan NIK penuh hanya untuk `super_admin`, dan masked untuk role lain.
- Terapkan helper pada endpoint `GET /api/laporan` dan `GET /api/laporan/:id`.
- Verifikasi melalui test unit/helper dan pemeriksaan respons role.

## Tugas 2 — Input NIK pada form publik

- File: `frontend/ircm-frontend/src/pages/LandingPage.jsx`
- Tambahkan input `nikPelapor` dan `nikKorban` dengan `maxLength=16`, input numeric, dan pesan bantuan.
- Pertahankan NIK di luar daftar autofill LLM.
- Kirim NIK pelapor dan korban melalui `FormData`.

## Tugas 3 — Tampilan detail berdasarkan role

- File: `frontend/ircm-frontend/src/pages/DashboardDP3A.jsx`
- Tampilkan NIK masked pada detail laporan untuk Admin/Petugas.

- File: `frontend/ircm-frontend/src/pages/DashboardSuperAdmin.jsx`
- Pastikan detail laporan menampilkan NIK penuh yang diberikan backend.

## Tugas 4 — Pengujian

- Tambahkan test validasi NIK di `backend/reporting-service/test/` jika struktur test mendukung.
- Jalankan test backend/frontend yang relevan.
- Jalankan pemeriksaan lint/build frontend dan verifikasi tidak ada NIK pada endpoint publik.
