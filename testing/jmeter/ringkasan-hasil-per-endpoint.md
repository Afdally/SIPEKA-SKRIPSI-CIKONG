# Ringkasan Hasil — Pengujian Per Endpoint

Rekapan dari 6 run (`hasil/*.jtl`, terhapus 2026-08-27). Angka ini yang jadi
dasar tabel/pembahasan BAB IV bagian load testing per endpoint. Kalau butuh
data mentah lagi (mis. lampiran atau ada yang meragukan), jalankan ulang:

```
.\jalankan-pengujian.ps1 -JMeterBin "C:\apache-jmeter-5.6.3\bin\jmeter.bat"
```

Konkurensi tercapai penuh di semua kombinasi kecuali `micro-vu100` versi
pertama (sudah diulang dan valid).

## Rata-rata response time (ms) / throughput (rps) / error rate (%)

| Endpoint | VU | Microservices | Monolitik |
|---|---|---|---|
| EP1 GET /api/master/kekerasan | 50 | 251 / 183.9 / 0 | 264 / 175.6 / 0 |
| | 100 | 681 / 135.2 / 0 | 477 / 193.8 / 0 |
| | 150 | 742 / 172.0 / 0 | 753 / 183.9 / 0 |
| EP2 POST /api/auth/login | 50 | 7086 / 6.2 / 0 | 7112 / 6.2 / 0 |
| | 100 | 13557 / 5.8 / 0 | 12646 / 6.3 / 0 |
| | 150 | 17241 / 6.2 / 0 | 18707 / 6.0 / 0 |
| EP3 POST /api/laporan | 50 | 288 / 161.1 / 0.11 | 291 / 159.2 / 0.07 |
| | 100 | 749 / 122.9 / 0.07 | 587 / 157.8 / 0.20 |
| | 150 | 746 / 171.5 / 0.15 | 776 / 178.1 / 0.12 |
| EP4 GET /api/penanganan | 50 | 10446 / 4.1 / 0 | 8876 / 4.7 / 0 |
| | 100 | 17046 / 4.7 / 0 | 16890 / 4.6 / 0 |
| | 150 | 23405 / 4.4 / 1.95 | 23589 / 4.9 / 7.21 |
| EP5 POST /api/penanganan/registrasi | 50 | 560 / 82.7 / 0 | 646 / 71.8 / 0 |
| | 100 | 1200 / 76.8 / 0.07 | 1332 / 69.3 / 0 |
| | 150 | 1479 / 86.1 / 0 | 2324 / 59.3 / 0 |

## Catatan interpretasi

- Selisih di EP1–EP4 umumnya di bawah 10% dan berganti arah antar-tingkat
  beban — masuk kategori ragam pengukuran, bukan pola arsitektur.
- EP5 satu-satunya yang konsisten dimenangkan microservices di ketiga
  tingkat beban (13%–36% lebih cepat) — satu-satunya endpoint yang melewati
  komunikasi antar-service (RabbitMQ). Harga di baliknya: konsistensi
  eventual, bukan kecepatan gratis.
- Kedua arsitektur gagal memenuhi ambang Tabel 3.5 pada beban tinggi
  (login & GET penanganan meleset 17–20x dari target ≤1000/1200 ms) —
  ini temuan yang relevan untuk kerangka evaluasi arsitektur, bukan
  kegagalan pengujian.
- Sumber daya TIDAK setara pada pengujian ini: microservices 2 kontainer
  = 1,0 CPU total, monolitik 1 kontainer = 0,5 CPU. Baru disetarakan pada
  pengujian beban campuran (lihat `hasil-campuran/`).
