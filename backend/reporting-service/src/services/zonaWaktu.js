const ZONA_WAKTU_DEFAULT = 'Asia/Makassar';

// Mengubah sebuah instant menjadi Date yang komponen kalender lokalnya mengikuti
// zona aplikasi. Date hasilnya dipakai hanya sebagai "jam dinding" oleh aturan
// tanggal relatif, bukan untuk disimpan sebagai timestamp absolut.
function waktuDiZona(sumber = new Date(), zona = process.env.APP_TIMEZONE || ZONA_WAKTU_DEFAULT) {
  const bagian = new Intl.DateTimeFormat('en-CA', {
    timeZone: zona,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(sumber);

  const nilai = Object.fromEntries(
    bagian.filter(({ type }) => type !== 'literal').map(({ type, value }) => [type, Number(value)]),
  );

  return new Date(
    nilai.year,
    nilai.month - 1,
    nilai.day,
    nilai.hour,
    nilai.minute,
    nilai.second,
  );
}

module.exports = { waktuDiZona, ZONA_WAKTU_DEFAULT };

