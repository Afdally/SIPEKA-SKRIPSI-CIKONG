# Desain Notifikasi Laporan Baru

## Tujuan

Petugas segera mengetahui adanya laporan baru melalui dashboard, lalu menerima satu email pengingat jika laporan belum diregistrasi dalam 30 menit.

## Notifikasi web

- Badge menu hanya menunjukkan jumlah laporan berstatus `menunggu_registrasi`.
- Banner tampil saat ada laporan baru dan tombolnya memfilter daftar ke laporan baru.
- Baris laporan baru diberi badge `BARU` dan waktu relatif sejak laporan masuk.
- Dashboard mengambil data ulang setiap 60 detik selama halaman terbuka.
- Saat jumlah laporan baru bertambah, tampil toast ringan tanpa detail sensitif.

## Pengingat email

- Reporting Service menentukan laporan yang masih `menunggu_registrasi`, berumur minimal 30 menit, dan belum pernah dikirimi pengingat.
- Case Service memeriksa setiap 5 menit, mengambil semua akun `petugas_uptd`, lalu mengirim email melalui SMTP.
- Email hanya berisi kode laporan, waktu masuk, dan tautan dashboard; identitas, alamat, telepon, serta kronologi tidak disertakan.
- Setelah pengiriman berhasil, laporan ditandai dengan waktu pengiriman agar email tidak berulang.
- Worker tidak dijalankan jika konfigurasi SMTP belum lengkap.

## Keamanan antar-service

Endpoint internal Reporting Service dilindungi `INTERNAL_API_KEY` yang sama pada kedua service dan tidak dilewatkan melalui API Gateway.

