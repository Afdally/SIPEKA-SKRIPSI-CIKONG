[# SIPEKA-SKRIPSI-CIKONG](https://cyan-parks-brake.loca.lt/# Dokumentasi API GIS SIPEKA Kendari

Dokumen ini berisi panduan untuk mengintegrasikan data spasial dari Sistem Pelaporan Kasus Kekerasan (SIPEKA) ke dalam aplikasi Web GIS eksternal.

---

## Endpoint Utama (Public GIS)

Endpoint ini digunakan untuk mengambil seluruh data laporan kasus yang relevan untuk dipetakan ke dalam aplikasi GIS. **Endpoint ini bersifat publik dan anonim** (Data sensitif seperti nama korban, NIK, No. HP, dan nama pelapor tidak disertakan demi menjaga privasi).

- **Method:** `GET`
- **URL Path:** `/api/laporan/public-gis`
- **Tipe Konten:** `application/json`

*(Catatan: Jika server dijalankan secara lokal di PC pengembang, URL lengkapnya adalah `http://localhost:8080/api/laporan/public-gis` atau link Localtunnel/Ngrok yang sedang aktif).*

---

## Contoh Response Berhasil (200 OK)

```json
{
  "message": "Data Spasial Laporan SIPEKA (Anonim)",
  "count": 2,
  "data": [
    {
      "kode_laporan": "LP-2026-XQ3K1",
      "jenis_kekerasan": "Kekerasan Psikis",
      "tanggal_kejadian": "2026-06-05T00:00:00.000Z",
      "lokasi_kejadian": "Jalan MT Haryono No. 12",
      "kelurahan_korban": "Mandonga",
      "latitude": -3.9778,
      "longitude": 122.5144,
      "status": "proses_assessment",
      "createdAt": "2026-06-08T08:30:00.000Z"
    },
    {
      "kode_laporan": "LA-2026-YTR12",
      "jenis_kekerasan": "Penelantaran",
      "tanggal_kejadian": "2026-06-01T00:00:00.000Z",
      "lokasi_kejadian": "Kawasan Pasar Baru",
      "kelurahan_korban": "Bande",
      "latitude": null,
      "longitude": null,
      "status": "menunggu_registrasi",
      "createdAt": "2026-06-08T09:15:00.000Z"
    }
  ]
}
```

---

## Deskripsi Field / Struktur Data

| Nama Field | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `kode_laporan` | String | ID Unik pelaporan (contoh: LP-2026-XXXX). Berguna untuk referensi jika ada kecocokan data. |
| `jenis_kekerasan` | String | Kategori kasus (contoh: Kekerasan Psikis, Fisik, Seksual, dll). Berguna untuk menentukan warna *marker* di peta. |
| `tanggal_kejadian` | DateTime | Tanggal kapan kasus tersebut terjadi. |
| `kelurahan_korban` | String | Kelurahan tempat domisili korban atau tempat kejadian perkara. |
| `lokasi_kejadian` | String | Alamat kejadian secara deskriptif (input manual dari pelapor). |
| `latitude` | Number / Null | Titik kordinat Lintang. **Bisa bernilai null**. |
| `longitude` | Number / Null | Titik kordinat Bujur. **Bisa bernilai null**. |
| `status` | String | Status terkini (*menunggu_registrasi*, *proses_assessment*, *proses_intervensi*, *selesai*). |
| `createdAt` | DateTime | Kapan laporan ini pertama kali di-submit ke sistem. |

---

## Panduan Implementasi untuk Developer GIS

1. **Pemetaan Koordinat Langsung:** 
   Saat melakukan *looping* pada array `data`, cek terlebih dahulu apakah nilai `latitude` dan `longitude` tidak sama dengan `null`. Jika ada nilainya, Anda bisa langsung menaruh marker/pin ke dalam *instance* Leaflet atau Mapbox Anda.
   
2. **Penanganan Koordinat Kosong (Geocoding):** 
   Sistem pelaporan SIPEKA saat ini belum mewajibkan pelapor untuk melampirkan GPS secara presisi, sehingga nilai `latitude` dan `longitude` mungkin `null`. 
   
   Sebagai solusinya, aplikasi GIS disarankan untuk memanfaatkan string dari field `kelurahan_korban`. Anda dapat menggunakan layanan Geocoding API pihak ketiga (seperti Google Maps Geocoding API atau Nominatim OpenStreetMap) di dalam script Anda untuk mengonversi nama "Kelurahan [Nama Kelurahan], Kota Kendari" menjadi titik koordinat agar tetap dapat diplot ke dalam peta.

3. **Indikator Visual (Opsional tapi Direkomendasikan):**
   Anda bisa mengatur agar warna *Marker* di peta berbeda berdasarkan `jenis_kekerasan` atau `status` penanganan, guna membuat Peta Kerawanan yang lebih informatif.)
