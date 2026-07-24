# Konteks Revisi Skripsi & Website SIPEKA

Dokumen ini merangkum keputusan dari sesi diskusi proposal (pasca-sidang) yang relevan
untuk pekerjaan revisi kode/website. Dibuat 2026-07-22, dikoreksi 2026-07-22 (lihat
catatan koreksi di bawah).

> **KOREKSI PENTING:** Versi awal dokumen ini sempat menyebut "Redis" sebagai saran
> penguji. Itu salah ingat dari user — **saran penguji yang benar adalah message broker
> (RabbitMQ)**, bukan Redis. Redis TIDAK PERNAH benar-benar disarankan penguji. Semua
> bagian di bawah sudah disesuaikan. Jangan pakai versi riwayat lama dokumen ini kalau
> masih menyebut Redis sebagai keputusan final.

## Latar Belakang

Proposal skripsi (`C:\Users\cikoh\Downloads\skripsi afdal.pdf`) sudah melalui sidang
seminar proposal. Studi kasus: DPPPA Kota Kendari (sistem pelaporan & manajemen kasus
kekerasan terhadap perempuan dan anak), traffic riil rendah (perkiraan beberapa laporan
per minggu). GIS ditangani terpisah oleh rekan satu tim (thesis lain) — TAPI lihat
temuan audit kode di bawah, ada endpoint GIS yang sudah ada di reporting-service, status
resminya belum jelas.

Judul lama: "Sistem Integrated Reporting and Case Management ... Menggunakan Arsitektur
Microservices". Judul baru hasil revisi (Bahasa Indonesia penuh):

> Sistem Pelaporan dan Manajemen Kasus Kekerasan terhadap Perempuan dan Anak Berbasis Web
> Menggunakan Arsitektur Microservices (Studi Kasus: DPPPA Kota Kendari)

## Catatan Penguji Sidang Proposal (sudah dikoreksi)

1. **Kenapa microservices untuk traffic sekecil ini?** — Penguji TIDAK meminta ganti
   arsitektur (ganti studi kasus juga tidak memungkinkan sekarang). Arahannya: pertahankan
   microservices, perjelas alasannya, dan tambahkan **message broker (RabbitMQ)** sebagai
   elemen kebaruan. (BUKAN Redis — itu salah ingat sebelumnya.)
2. **Tidak ada novelty** — "menerapkan arsitektur microservices pada sistem pelaporan"
   sudah dilakukan riset lain di rujukan sendiri (terutama Tjahyono dkk., 2022, kasus
   serupa di Kementerian Investasi/BKPM).
3. **Judul & alur kerja** — istilah "Integrated"/"Case Management" (campur bahasa Inggris)
   dianggap kurang jelas; diminta jelaskan alur pelaporan → registrasi → assessment →
   penanganan → selesai secara eksplisit, dan konsisten pakai istilah Indonesia.
4. **`auth-service` tidak perlu jadi microservice tersendiri** — dikonfirmasi juga
   secara konseptual: mengacu ke pola "Decompose by Business Capability" / "Decompose by
   Subdomain" (Chris Richardson, *Microservices Patterns*, Manning 2018;
   microservices.io/patterns/decomposition/) — auth adalah *generic subdomain* (kebutuhan
   teknis dipakai semua service), bukan *business capability* yang dimiliki satu bidang.
   Hanya `reporting-service` (bidang pelaporan) dan `case-service` (bidang manajemen
   kasus) yang layak jadi microservice sendiri.
5. **Message broker itu untuk kasus "salah satu SERVICE mati"** (bukan "kalau nginx/
   gateway mati" — itu salah paham yang sempat muncul di diskusi, sudah dikoreksi).
   Istilah yang relevan bukan "production/development" (salah dengar) tapi
   **producer/consumer** — istilah standar dalam message broker.

## Keputusan Final Arsitektur (per 2026-07-22)

- **Microservices dipertahankan HANYA untuk 2 service: `reporting-service` dan
  `case-service`.** Sesuai prinsip business-capability decomposition di atas.
- **`auth-service` sebagai container/deployable tersendiri DIHAPUS (sudah dieksekusi).**
  Logika login/register (hash password, model User, keluarkan JWT) digabung ke
  `case-service` (karena manajemen akun petugas/super admin itu urusan administratif
  internal DPPPA, satu rumpun dengan manajemen kasus), bukan ke `reporting-service` (yang
  sifatnya publik/tanpa login).
- **nginx TETAP hanya berperan sebagai API Gateway murni (reverse-proxy/routing).** Tidak
  perlu nginx menjalankan logika validasi JWT — sudah dicek di kode: `case-service` dan
  `reporting-service` **masing-masing sudah verifikasi JWT secara lokal** lewat
  `src/middleware/auth.js` pakai `JWT_SECRET` yang sama (`ircm_secret_key`). Ini pola yang
  benar (decentralized token verification) — tidak perlu diubah, tinggal disesuaikan
  routing `nginx.conf` setelah `auth-service` dihapus dan rute `/api/auth/*` diarahkan ke
  service yang baru menampungnya.
- **Koreksi klaim lama:** klaim sebelumnya "kalau auth-service down, report/case-service
  ikut lumpuh" **tidak akurat** dan sudah ditarik — karena verifikasi token memang lokal,
  auth-service (versi lama) hanya jadi SPOF untuk login/register baru, bukan untuk operasi
  yang sudah berjalan. Alasan hapus auth-service tetap valid, tapi dasarnya business
  capability, bukan soal SPOF.
- **Hanya RabbitMQ yang ditambahkan sebagai komponen baru — Redis TIDAK dipakai.**
  Keputusan user: fokus satu penambahan yang benar-benar diimplementasi dan diuji dengan
  baik, daripada dua penambahan yang setengah jadi (waktu terbatas, sudah masuk fase
  Construction/Juli, deadline Agustus per Tabel 3.1 proposal). RabbitMQ dipakai untuk
  decoupling komunikasi `case-service` ↔ `report-service`, bukan cache.

## Arah Revisi RabbitMQ yang Disepakati (SUDAH diimplementasi ke kode, 2026-07-22)

> **Koreksi arah producer/consumer:** draf sebelumnya di bagian ini sempat menulis
> "report-service producer, case-service consumer" — itu tidak cocok dengan kopling
> nyata yang ada di kode (`case-service` yang memanggil `report-service`, bukan
> sebaliknya). Setelah audit ulang kode `kasusController.js`, arah yang benar dan yang
> sudah diimplementasi adalah kebalikannya: **`case-service` producer, `report-service`
> consumer**. Lihat penjelasan di bawah.

- **Peran RabbitMQ: decoupling komunikasi antar-service, bukan cache.** Sebelumnya
  `case-service` memanggil `report-service` langsung lewat HTTP synchronous
  (`axios.patch` ke `REPORT_SERVICE_URL`, 3 titik: registrasi → proses_assessment,
  intervensi → dalam_penanganan, selesaikan → selesai) — kalau `report-service` mati saat
  itu, update status **hilang permanen** (cuma di-log, tidak ada retry). Ini titik kopling
  nyata yang diperbaiki.
- **Implementasi:** `case-service` sekarang jadi **producer** — tiap 3 titik di atas
  publish event ke queue durable `kasus_status_updates`
  (`case-service/src/queue/publisher.js`) berisi `{ laporan_id, status, catatan }`,
  gantikan `axios.patch` yang lama. `report-service` jadi **consumer**
  (`reporting-service/src/queue/consumer.js`) yang membaca event itu dan update
  `Laporan.status` miliknya sendiri.
- **Yang dilindungi:** kalau consumer (`report-service`) mati, pesan tetap aman mengantre
  di queue RabbitMQ (durable, `persistent: true`) sampai service hidup lagi dan memproses
  backlog — status laporan tetap akhirnya tersinkron, tidak hilang seperti sebelumnya.
- **Yang TIDAK otomatis dilindungi:** kalau producer (`case-service`) crash SEBELUM sempat
  publish event, event itu memang tidak pernah ada. Tapi ini tidak masalah di sini karena
  perubahan `Kasus` (source of truth untuk status penanganan) sudah disimpan ke MongoDB
  `case-service` terlebih dulu, baru publish event — kalau publish gagal, cuma sinkronisasi
  ke `Laporan.status` yang perlu di-retry/manual, data `Kasus` sendiri tetap aman.
- **RabbitMQ sendiri jadi komponen baru yang berpotensi gagal** (kalau broker down,
  producer-consumer nggak bisa saling kirim pesan). Untuk skala skripsi ini diterima
  sebagai instance tunggal (bukan cluster) — kalau ditanya penguji, jujur akui ini bukan
  menghilangkan semua titik gagal, tapi memindahkan titik kritis ke komponen yang punya
  mekanisme antre/retry built-in (beda dari panggilan HTTP langsung yang gagal instan
  kalau tujuannya tidak merespons).
- **Klarifikasi yang sudah diluruskan:** message broker menjawab skenario "salah satu
  SERVICE (case/report) mati", BUKAN skenario "nginx/API Gateway mati" — itu masalah
  berbeda (butuh multiple instance gateway + load balancer, di luar scope wajar untuk
  skripsi ini).
- **Reframing novelty**: dari "menerapkan arsitektur X" (sudah dilakukan rujukan lain)
  menjadi "evaluasi empiris ketahanan komunikasi antar-service via message broker",
  diuji lewat skenario fault-injection di Load Testing (Apache JMeter, sudah direncanakan
  di proposal) — matikan `report-service` secara sengaja, bandingkan persentase update
  status laporan yang akhirnya berhasil tersinkron dengan vs tanpa RabbitMQ (tanpa: hilang
  permanen; dengan: tertampung di queue lalu diproses begitu service pulih).
- **Reframing skala**: karena traffic riil kecil dan studi kasus tidak bisa diganti,
  klaim diarahkan ke "purwarupa yang dirancang siap untuk skala lebih besar" (potensi
  kelurahan input langsung, replikasi ke DPPPA kabupaten/kota lain, integrasi ke Simfoni
  PPA) — bukan "menyelesaikan masalah performa yang mendesak sekarang".

## Temuan dari Audit Kode (2026-07-22)

- **`verification-service` SUDAH DIHAPUS** (2026-07-22) — folder itu memang cuma berisi
  `.env` kosong, tidak ada `app.js`/`package.json`/`Dockerfile`/`src/`. Modul verifikasi
  yang disebut di proposal tidak pernah benar-benar dibangun sebagai service terpisah.
  Proposal perlu disesuaikan agar tidak lagi menyebut verifikasi sebagai modul/service
  tersendiri — "verifikasi" di alur kerja sekarang adalah tahap `assessment` di dalam
  `case-service`.
- **KLARIFIKASI FINAL soal GIS (2026-07-22):** `test-gis.html` di root repo BUKAN produk
  GIS milik thesis ini — itu cuma alat uji coba milik user sendiri untuk memverifikasi
  bahwa endpoint `/api/laporan/public-gis` menghasilkan data yang valid dan bisa dipakai.
  **Sistem GIS/pemetaan yang sesungguhnya adalah skripsi terpisah milik rekan satu tim**
  ("pemetaan pelaporan"), yang datanya ditarik dari `reporting-service` milik thesis ini
  lewat endpoint `getPublicGis`/`getGisMap` di `laporanController.js`.
  **PENTING — JANGAN klaim visualisasi/pemetaan spasial sebagai kontribusi/novelty thesis
  ini** — itu salah atribusi, berpotensi jadi masalah tumpang tindih klaim dengan skripsi
  rekan. Kontribusi thesis ini dari sisi ini HANYA sebatas: menyediakan endpoint data
  spasial yang sudah dianonimkan (privacy-by-design, identitas korban/pelapor dibuang)
  sebagai titik integrasi untuk sistem lain — ini boleh disebut sebagai detail teknis
  pendukung, BUKAN pilar judul/novelty utama.

## Status Implementasi Kode/Website (per 2026-07-22)

1. ✅ **`auth-service` dihapus sebagai container tersendiri.** `authController.js`,
   `User.js`, `routes/auth.js`, `seed.js` dipindah ke `case-service` (jadi `seedAuth.js`),
   di-mount di `/api/auth`. `nginx.conf` diarahkan ulang: `/api/auth` → upstream `case`.
2. ✅ **Folder `backend/verification-service/` dihapus.**
3. ✅ **RabbitMQ ditambahkan ke `docker-compose.yml`.** Struktur final: `mongodb`,
   `rabbitmq`, `report-service`, `case-service`, `api-gateway` (nginx), `frontend` —
   TIDAK ADA Redis, TIDAK ADA auth-service/verification-service.
4. ✅ Producer di `case-service` (`src/queue/publisher.js`) dan consumer di
   `report-service` (`src/queue/consumer.js`) — arah producer/consumer dikoreksi jadi
   `case-service` → `report-service` (lihat bagian "Arah Revisi RabbitMQ" di atas),
   gantikan `axios.patch` ke `REPORT_SERVICE_URL` yang sekarang sudah dihapus.
5. ⬜ Siapkan skenario pengujian fault-injection untuk JMeter: matikan `report-service`,
   ukur tingkat keberhasilan sinkronisasi status laporan dengan vs tanpa RabbitMQ —
   ini jadi data pembanding untuk BAB IV/V skripsi nanti.
6. ⬜ Rapikan istilah di UI/dokumentasi sistem: hindari campur "Integrated"/"Case
   Management" tanpa padanan Indonesia, selaraskan dengan judul baru.
7. ⬜ Pastikan alur status laporan di UI (pelaporan → registrasi → assessment → dalam
   penanganan → selesai/arsip) konsisten dengan flowchart BAB III proposal.
8. ✅ Status endpoint GIS sudah diklarifikasi user: `public-gis`/`gis-map` murni titik
   integrasi data untuk skripsi GIS milik rekan satu tim, BUKAN kontribusi thesis ini.
   Jangan ditulis sebagai novelty di proposal/BAB IV-V.

## Yang Masih Ditunda (menunggu data lapangan)

Wawancara ke DPPPA Kota Kendari perlu dilakukan dulu sebelum finalisasi detail revisi.
Form wawancara sudah dibuat: `Instrumen_Wawancara_DPPPA_Kendari_v2.docx` (folder Downloads),
isinya konfirmasi soal:
- Struktur organisasi/bidang yang terlibat (menentukan relevansi microservices per-bidang)
- Volume laporan riil per minggu/bulan
- Kewajiban integrasi ke Simfoni PPA
- Rencana replikasi/scale-up ke depan
- Kesiapan infrastruktur (server/hosting, siapa yang maintain pasca-skripsi)

Hasil wawancara ini bisa mengubah detail implementasi RabbitMQ/microservices di atas.
Setelah wawancara + revisi website selesai, rencana selanjutnya: user testing di DPPPA,
baru proposal disusun ulang jadi draft skripsi (BAB IV-V).
