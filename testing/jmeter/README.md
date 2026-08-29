# Pengujian Beban — Perbandingan Arsitektur SIPEKA

Instrumen pengujian untuk membandingkan performa sistem SIPEKA pada arsitektur
microservices (produk skripsi) dengan arsitektur monolitik (baseline pembanding).

Monolitik di sini berstatus **instrumen pengujian, bukan produk kedua**. Logika
bisnisnya diambil utuh dari `case-service` dan `reporting-service`; yang berubah
hanya mekanisme komunikasi antar-modul. Dengan begitu selisih yang terukur tidak
bisa dikaitkan ke perbedaan kualitas implementasi, hanya ke arsitekturnya.

## Endpoint yang diuji

| # | Endpoint | Method | Karakter beban |
|---|----------|--------|----------------|
| 1 | `/api/master/kekerasan` | GET | Baseline paling ringan, publik. Yang terukur praktis biaya hop API Gateway |
| 2 | `/api/auth/login` | POST | Terikat CPU (verifikasi bcrypt cost 10) |
| 3 | `/api/laporan` | POST | Tulis publik, jalur utama pelapor |
| 4 | `/api/penanganan` | GET | Baca terproteksi JWT, membaca seluruh koleksi |
| 5 | `/api/penanganan/registrasi` | POST | **Tulis lintas-service** — satu-satunya yang melewati RabbitMQ |

Urutan eksekusinya disengaja: EP4 dijalankan sebelum EP5 karena registrasi
menambah dokumen `Kasus`, yang akan mengubah volume data yang dibaca EP4.

**`POST /api/laporan/analisis-kronologi` sengaja tidak diuji.** Endpoint itu
memanggil model bahasa eksternal dengan timeout 45 detik dan punya pembatas laju
10 permintaan per jendela. Yang akan terukur adalah performa Ollama plus 429
buatan, bukan arsitektur sistem.

## Prasyarat

- Apache JMeter 5.6+ (`jmeter` ada di PATH)
- Node.js 18+
- Kedua arsitektur berjalan lewat Docker Compose

```bash
docker compose up -d --build
```

Sekali saja, pasang dependensi penyiap data:

```bash
npm install
```

## Menjalankan seluruh matriks pengujian

```powershell
.\jalankan-pengujian.ps1
```

Skrip ini menjalankan 6 kombinasi (2 arsitektur × 3 tingkat beban), menyiapkan
ulang data uji sebelum setiap run, dan menulis laporan HTML ke `hasil/`.

## Menjalankan satu run secara manual

```bash
node seed-loadtest-data.js micro --yes
```

```bash
jmeter -n -t sipeka-load-test.jmx -Jport=8080 -Jvu=50 -Jcsvfile=laporan_ids_micro.csv -l hasil/micro-vu50.jtl -e -o hasil/report-micro-vu50
```

Untuk monolitik, ganti `-Jport=8090` dan `-Jcsvfile=laporan_ids_mono.csv`.

### Properti yang tersedia

| Properti | Default | Keterangan |
|----------|---------|------------|
| `host` | `localhost` | Alamat sasaran |
| `port` | `8080` | 8080 = microservices (via gateway), 8090 = monolitik |
| `vu` | `50` | Jumlah virtual user |
| `loops` | `10` | Iterasi per virtual user |
| `rampup` | `10` | Detik untuk menaikkan seluruh thread |
| `csvfile` | `laporan_ids_micro.csv` | Sumber `laporan_id` untuk EP5 |

Jumlah permintaan per endpoint = `vu × loops`. Pada beban tertinggi: 150 × 10 =
1.500 permintaan. Penyiap data membuat 5.000 laporan sasaran, cukup untuk semua
tingkat beban.

## Variabel yang dikontrol

Supaya perbandingannya sah, hal-hal berikut dibuat identik di kedua arsitektur:

- **Volume data.** 500 kasus dan 1.000 laporan latar, disiapkan ulang sebelum
  setiap run. `GET /api/penanganan` membaca seluruh koleksi tanpa paginasi, jadi
  volume yang berbeda langsung menggeser response time.
- **Batas resource kontainer.** 0,5 CPU dan 512 MB per kontainer aplikasi.
- **Logika bisnis.** Controller dan model diambil dari codebase yang sama.
- **Payload permintaan.** Isi dan ukurannya sama.
- **Worker email reminder** dinonaktifkan untuk data uji (`email_reminder_status`
  dikunci `sent`) agar tidak ada pekerjaan latar yang mengganggu pengukuran.

## Catatan untuk penulisan BAB IV

Total resource kedua arsitektur **tidak sama**, dan ini perlu dilaporkan apa
adanya, bukan disembunyikan:

| Arsitektur | Kontainer aplikasi | Total batas CPU | Komponen pendukung |
|------------|--------------------|-----------------|--------------------|
| Microservices | 2 (case + report) | 1,0 | nginx, RabbitMQ, MongoDB |
| Monolitik | 1 | 0,5 | MongoDB |

Batas per kontainer dibuat sama rata mengikuti pola penelitian rujukan.
Konsekuensinya microservices mendapat total CPU dua kali lipat — dan itu justru
bagian dari yang sedang dievaluasi, karena kebutuhan resource yang lebih besar
memang biaya melekat dari arsitektur ini. Kalau monolitik tetap unggul di
endpoint tertentu meski hanya memakai separuh CPU, temuan itu jauh lebih kuat
daripada kalau resource-nya disamakan.

Dua hal lain yang sebaiknya ikut dijelaskan saat membahas hasil:

- **EP2 (login)** akan terlihat berat di kedua arsitektur. Penyebabnya bcrypt,
  bukan arsitektur. Sebutkan agar angkanya tidak salah dibaca.
- **EP5 (registrasi)** kemungkinan besar lebih cepat di microservices, karena
  publikasi pesan ke antrean langsung mengembalikan respons sementara pembaruan
  status laporan dikerjakan consumer belakangan. Itu bukan kecepatan gratis —
  itu pekerjaan yang ditunda dengan konsekuensi konsistensi eventual. Monolitik
  menanggung penuh biaya tulisnya di dalam permintaan.

## Pengujian kedua: beban campuran

Pengujian di atas menembak endpoint satu per satu, sehingga hanya menjawab
"seberapa cepat tiap endpoint". Pengujian beban campuran menjawab pertanyaan
yang berbeda dan lebih dekat ke pemakaian nyata: **ketika modul penanganan
sedang jenuh oleh petugas, apakah jalur pelaporan masyarakat ikut lumpuh?**

Keempat kelompok beban ditembakkan bersamaan dengan komposisi tetap:

| Kelompok | Endpoint | Service | Porsi |
|---|---|---|---|
| Beban berat petugas | `GET /api/penanganan` | case | 50% |
| Pelaporan publik | `POST /api/laporan` | report | 20% |
| Master data publik | `GET /api/master/kekerasan` | report | 20% |
| Lintas-service | `POST /api/penanganan/registrasi` | case → report | 10% |

Pada monolitik seluruh permintaan berbagi satu proses, sehingga permintaan
berat menyumbat antrean yang sama dengan permintaan ringan. Pada microservices
jalur publik dilayani `report-service` yang terpisah dari `case-service`.

Anggaran komputasi disamakan lewat berkas timpaan, masing-masing 1,0 CPU:

```bash
docker compose -f docker-compose.yml -f docker-compose.campuran.yml up -d
```

```powershell
.\jalankan-beban-campuran.ps1 -JMeterBin "C:\apache-jmeter-5.6.3\bin\jmeter.bat"
```

Hasilnya masuk ke `hasil-campuran/`. Yang dibandingkan bukan angka keseluruhan,
melainkan **waktu respons jalur publik pada kedua arsitektur saat beban berat
berjalan** — itu inti temuannya.

Catatan penting saat menafsirkan: monolitik memakai 1,0 CPU untuk seluruh
permintaan, sedangkan microservices hanya punya 0,5 CPU di `case-service` untuk
melayani beban berat. Jadi monolitik justru diperkirakan unggul pada endpoint
berat. Kalau meski begitu jalur publiknya tetap lebih lambat dibanding
microservices, isolasi beban itulah penjelasannya — bukan perbedaan jatah
komputasi.

## Hubungan dengan pengujian fault-injection

Pengujian di folder ini menjawab pertanyaan **performa**: seberapa jauh
microservices unggul atau tertinggal dibanding monolitik pada beban yang sama.

Pengujian fault-injection RabbitMQ menjawab pertanyaan berbeda — **ketahanan**:
berapa persen pembaruan status laporan yang tetap tersinkron ketika salah satu
service dimatikan. Pengujian itu hanya berlaku pada arsitektur microservices,
karena monolitik berjalan dalam satu proses dan tidak punya mode kegagalan
antar-service yang independen.

Keduanya adalah eksperimen terpisah dengan variabel bebas dan terikat yang
berbeda, dan hasilnya tidak boleh digabung dalam satu tabel.
