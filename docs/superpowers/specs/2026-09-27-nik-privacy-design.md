# Desain: Input dan Privasi NIK pada SIPEKA

## Tujuan

Menambahkan input NIK pelapor dan korban pada form pelaporan, menyimpan NIK sebagai data manual, dan membatasi tampilan NIK berdasarkan role.

## Keputusan desain

1. Form publik menampilkan input NIK Pelapor dan NIK Korban. NIK bersifat opsional mengikuti schema yang sudah ada, tetapi jika diisi harus tepat 16 digit.
2. NIK tidak diproses oleh LLM/NLP dan tidak boleh diambil dari teks kronologi.
3. Super Admin menerima NIK penuh dari endpoint daftar/detail laporan.
4. Admin/Petugas menerima NIK yang sudah dimasking dari backend dengan format 4 digit awal + 12 tanda bintang, contoh `7401************`.
5. Masking dilakukan di backend berdasarkan `req.auth_user.role`, bukan hanya melalui CSS atau kondisi React.
6. Endpoint publik cek status dan public GIS tidak menampilkan NIK.
7. Ekspor data Super Admin tidak menambahkan NIK pada perubahan ini agar NIK penuh tidak tersebar ke file unduhan tanpa kebutuhan yang eksplisit.

## Dampak UI

- Tambahkan NIK Pelapor di bagian Data Pelapor ketika laporan tidak anonim.
- Tambahkan NIK Korban di bagian Data Korban.
- Dashboard Admin/Petugas menampilkan NIK masked pada detail laporan.
- Dashboard Super Admin menampilkan NIK penuh pada detail laporan bila data tersedia.

## Validasi dan keamanan

- Nilai kosong disimpan sebagai `null`.
- Nilai tidak kosong harus memenuhi pola `^\\d{16}$`.
- Laporan anonim memaksa `nik_pelapor` menjadi `null`.
- Respons daftar dan detail laporan menggunakan helper pemformatan role-aware.
