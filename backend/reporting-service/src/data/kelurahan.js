// Daftar kelurahan Kota Kendari — acuan untuk mencocokkan nama wilayah yang
// muncul di cerita pelapor.
//
// PENTING: nilai di sini harus sama persis (huruf per huruf) dengan pilihan
// <option> pada select "Kelurahan Kejadian" di LandingPage.jsx. Kalau beda,
// hasil pencocokan tidak akan terpilih di form.
//
// Pencocokan kelurahan sengaja dikerjakan kode, bukan model bahasa: daftarnya
// tertutup dan tidak berubah, jadi pencocokan string lebih cepat, gratis, dan
// yang terpenting tidak mungkin mengarang nama kelurahan yang tidak ada.

const KELURAHAN_PER_KECAMATAN = {
  'Mandonga':      ['Mandonga', 'Alolama', 'Labibia', 'Korumba'],
  'Kendari':       ['Kandai', 'Gunung Jati', 'Kampung Salo'],
  'Kendari Barat': ['Wawombalata', 'Bende', 'Kemaraya'],
  'Puuwatu':       ['Puuwatu', 'Punggaloba'],
  'Wua-Wua':       ['Wua-Wua', 'Bonggoeya'],
  'Kadia':         ['Kadia', 'Wowawanggu'],
  'Baruga':        ['Baruga', 'Watubangga'],
  'Poasia':        ['Poasia', 'Anduonohu'],
  'Kambu':         ['Kambu', 'Mokoau'],
  'Abeli':         ['Abeli', 'Lapulu'],
  'Nambo':         ['Nambo', 'Bungkutoko'],
};

const SEMUA_KELURAHAN = Object.values(KELURAHAN_PER_KECAMATAN).flat();

module.exports = { KELURAHAN_PER_KECAMATAN, SEMUA_KELURAHAN };
