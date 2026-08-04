# Perbaikan Chart dan Filter Demografi Dashboard

## Tujuan

- Donut demografi menampilkan proporsi secara akurat dan tetap rapi untuk jumlah kategori sedikit.
- Dashboard petugas memakai chart Sebaran Kelurahan yang sama dengan super admin.
- Kategori Anak dan Perempuan tidak lagi saling eksklusif: korban anak perempuan muncul pada kedua filter.

## Desain

1. Logika kategori dipusatkan dalam helper frontend agar dashboard petugas dan super admin memakai aturan yang sama.
2. Kategori Anak ditentukan dari `tipe_laporan === anak` atau usia korban di bawah 18 tahun. Kategori Perempuan ditentukan dari `jenis_kelamin === Perempuan`.
3. Filter dan badge tabel memakai kategori tersebut; satu laporan dapat memiliki dua badge.
4. Donut memakai segmen SVG tanpa ujung bulat yang mendistorsi irisan kecil, dengan total data aktual dan empty state yang benar.
5. `JenisKasusChart` di dashboard petugas diganti dengan `SebaranKelurahanChart` yang telah dipakai super admin.

## Batasan

- Tidak mengubah skema database atau nilai `tipe_laporan` lama.
- Tidak mengubah proses registrasi/penanganan kasus.
- Tidak menambahkan library chart baru.
