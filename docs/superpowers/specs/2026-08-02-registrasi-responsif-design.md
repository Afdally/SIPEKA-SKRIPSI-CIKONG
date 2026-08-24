# Desain Registrasi Responsif

## Masalah

- Registrasi sudah tersimpan di Case Service, tetapi status laporan di Reporting Service diperbarui asinkron melalui RabbitMQ.
- Selama sinkronisasi, frontend dapat menampilkan laporan lama bersama kasus baru atau tetap terlihat pada tahap Registrasi.
- Baris laporan baru diberi latar kuning, padahal badge `BARU` dan waktu relatif sudah cukup.

## Perbaikan

- Hapus latar kuning pada baris laporan baru.
- Setelah API registrasi sukses, masukkan kasus hasil respons langsung ke state frontend dan keluarkan laporan tersebut dari state laporan baru.
- Saat menggabungkan data dari dua service, laporan `menunggu_registrasi` yang sudah memiliki `Kasus.laporan_id` selalu disaring.
- Fetch ulang tetap dilakukan untuk rekonsiliasi dengan server, tetapi perpindahan tampilan tidak menunggu sinkronisasi RabbitMQ.

