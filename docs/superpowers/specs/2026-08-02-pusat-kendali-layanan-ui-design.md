# Revisi UI Pusat Kendali Layanan

## Tujuan

Membuat pengelolaan kategori kekerasan dan metode penanganan lebih terstruktur, mudah dipindai, serta konsisten dengan modal dan pola interaksi Manajemen Petugas.

## Halaman

- Header berisi konteks tab aktif, jumlah total, jumlah aktif, dan tombol tambah.
- Tab memakai segmented control dengan ikon dan jumlah data.
- Daftar menggunakan satu pola item bersama: ikon jenis data, nama, deskripsi, badge status dengan titik, serta tombol edit/hapus 40px.
- Empty state menjelaskan saat tab belum memiliki data.

## Modal master

- Menggunakan scrim, radius, header ikon, dan footer yang konsisten dengan modal akun.
- Nama dan deskripsi memiliki label, ikon, placeholder, serta focus state.
- Status aktif ditampilkan sebagai kartu switch dengan penjelasan dampak.
- Tombol simpan memiliki loading state dan teks kontekstual.

## Responsif dan aksesibilitas

- Tab, statistik, status, dan aksi membungkus dengan rapi di layar kecil.
- Status dibedakan menggunakan warna, titik, dan label.
- Tombol ikon memiliki `aria-label`; kontrol status memiliki label yang terhubung.
- Tidak mengubah API, model, atau payload master data.
