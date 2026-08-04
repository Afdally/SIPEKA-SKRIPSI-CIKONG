# Desain Perbaikan Analisis dan Tanggal WITA

## Masalah

- Frontend jatuh ke ekstraksi lokal ketika API Gateway masih menyimpan alamat container Reporting Service lama setelah recreate.
- Reporting Service menghitung `new Date()` dalam UTC. Pada 2 Agustus dini hari WITA, server masih menganggap 1 Agustus sehingga “kemarin” menjadi 31 Juli.

## Perbaikan

- Gateway memakai DNS resolver Docker dinamis untuk Reporting Service dan Case Service.
- Waktu referensi analisis dikonversi eksplisit ke zona `Asia/Makassar` sebelum frasa relatif dihitung.
- Zona waktu dapat dikonfigurasi melalui `APP_TIMEZONE`, dengan default `Asia/Makassar`.
- Pengujian mencakup kalimat pada laporan: `pukul` menjadi `Kekerasan Fisik` dan “kemarin” pada `2026-08-01T16:30:00Z` menjadi `2026-08-01` di WITA.

