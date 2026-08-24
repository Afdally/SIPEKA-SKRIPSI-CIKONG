# Sistem Visual Sidebar Admin SIPEKA

## Arah visual

Dashboard memakai gaya institutional modern: bidang konten terang dan bersih, sidebar navy dengan glass effect terbatas, serta biru sebagai satu-satunya warna aksi utama. Warna hijau, amber, dan merah hanya digunakan untuk status semantik.

## Struktur

- Identitas pengguna dipindahkan dari topbar ke bagian bawah sidebar.
- Blok pengguna menampilkan identitas akun dan tombol ikon Keluar secara langsung tanpa popup.
- Topbar hanya menampilkan tombol drawer pada mobile dan judul halaman.
- Struktur diterapkan konsisten pada Super Admin dan Petugas UPTD.

## Token visual

- Sidebar: deep navy solid `#0b1628`, tanpa transparansi, gradient, atau radial glow agar warna tetap tegas.
- Primary: blue `#2563eb`; hover `#1d4ed8`.
- Canvas: `#f8fafc`; surface: putih; teks utama `#0f172a`; teks sekunder `#64748b`.
- Active navigation memakai lapisan biru transparan dan indikator biru.

## Responsif dan aksesibilitas

- Pada layar kecil sidebar tetap menjadi drawer.
- Target klik profil minimal 44px, fokus keyboard terlihat, dan menu memiliki atribut ARIA.
- Animasi dibatasi 150–250ms serta dimatikan melalui `prefers-reduced-motion`.

## Batasan

- Tidak mengubah fungsi menu, autentikasi, atau data.
- Tidak menerapkan glass effect pada tabel/kartu agar keterbacaan tetap tinggi.
