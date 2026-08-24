# Revisi UI Manajemen Petugas

## Tujuan

Merapikan identitas role pada daftar akun dan membuat modal tambah/edit akun lebih jelas, aman, dan konsisten dengan sistem visual navy–blue SIPEKA.

## Badge role

- Bentuk pill dengan ikon dan label, bukan blok teks datar.
- Petugas UPTD memakai blue-soft dengan ikon person-badge.
- Super Admin memakai slate-soft dengan ikon shield-lock.
- Warna bukan satu-satunya pembeda; ikon dan teks selalu tersedia.

## Modal akun

- Dialog terpusat dengan lebar maksimal 580px, radius 20px, scrim gelap ber-blur tipis.
- Header memiliki ikon, judul, dan penjelasan konteks tambah/edit.
- Field memiliki label eksplisit, tinggi 48px, autocomplete, dan focus ring biru.
- Password memiliki kontrol tampilkan/sembunyikan dan helper text saat edit.
- Role dipilih melalui dua kartu radio dengan deskripsi hak akses.
- Footer menyediakan Batal dan tombol Simpan dengan loading state.

## Aksesibilitas dan responsif

- Dialog memakai `role=dialog`, `aria-modal`, label judul, dan tombol ikon memiliki aria-label.
- Target klik minimal 44px dan layout role menjadi satu kolom pada layar kecil.
- Tidak mengubah endpoint, payload, atau aturan autentikasi.
