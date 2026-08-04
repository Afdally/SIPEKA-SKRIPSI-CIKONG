# Desain Konfirmasi Pertemuan

## Tujuan

Memudahkan petugas UPTD menghubungi pelapor dan mencatat metode pertemuan yang telah dikonfirmasi tanpa menambah tahap atau status penanganan baru.

## Desain yang disetujui

- Detail laporan menampilkan tombol **Hubungi via WhatsApp** di dekat nomor kontak.
- Tombol membuka `wa.me` dengan pesan awal yang aman dan tidak memuat detail kasus.
- Form registrasi menampilkan pilihan metode pertemuan yang otomatis mengikuti preferensi awal pelapor.
- Petugas dapat mengubah pilihan tersebut berdasarkan hasil komunikasi, lalu menyimpannya bersama registrasi kasus.
- Preferensi awal tetap tersimpan pada laporan; hasil konfirmasi disimpan terpisah pada kasus.
- Tidak ada tombol atau status baru untuk “pertemuan selesai”; pengisian assessment sudah mewakili selesainya pertemuan assessment.

## Data

Kasus menyimpan `metode_pertemuan` dengan salah satu nilai:

- `Datang ke UPTD`
- `Petugas Mendatangi Korban`

