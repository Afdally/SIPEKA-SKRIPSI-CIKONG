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
