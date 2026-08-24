import apiClient from './apiClient'

// Analisis cerita pelapor untuk mengusulkan isi formulir.
//
// Pekerjaan sebenarnya ada di report-service (`POST /api/laporan/analisis-kronologi`),
// yang memanggil model bahasa lewat Ollama lalu memvalidasi hasilnya. Di sini
// tinggal memanggil endpoint itu.
//
// Kalau endpoint-nya sendiri tidak bisa dihubungi (backend mati, jaringan putus),
// masih ada tebakan kasar di bawah supaya pelapor tidak kehilangan bantuan sama
// sekali — cuma seadanya, dan hasilnya ditandai `sumber: 'lokal'`.

// Kata kunci -> nama kategori kekerasan. Harus cocok dengan master data di
// database, makanya masterKekerasan dikirim sebagai parameter, bukan hardcode.
const KAMUS_KEKERASAN = {
  'Kekerasan Seksual': ['pelecehan', 'diperkosa', 'perkosa', 'seksual', 'dipaksa berhubungan', 'dicabuli'],
  'Kekerasan Fisik':   ['pukul', 'tampar', 'tendang', 'lempar', 'cekik', 'seret', 'dianiaya', 'jambak'],
  'Kekerasan Psikis':  ['ancam', 'bentak', 'hina', 'trauma', 'teror', 'dipermalukan', 'dimaki'],
  'Penelantaran':      ['telantar', 'tidak diberi makan', 'ditinggal', 'diabaikan'],
  'Cyberbullying':     ['media sosial', 'medsos', 'online', 'diunggah', 'disebar'],
  'KDRT':              ['rumah tangga', 'kdrt'],
}

function tebakUsia(teks) {
  const m = teks.match(/(?:umur|usia|berumur|berusia)?\s*(\d{1,2})\s*(?:tahun|thn|th\b)/i)
  return m ? Number(m[1]) : null
}

// Yang dicari jenis kelamin KORBAN. Sebutan kerabat (ibu/ayah/suami/istri)
// sengaja TIDAK dipakai: dalam satu laporan ada sampai tiga orang, dan kata itu
// lebih sering menunjuk pelaku. "adik saya dipukuli oleh ibu saya" bukan berarti
// korbannya perempuan — jenis kelamin adik tidak disebutkan sama sekali.
//
// Pembedaan peran yang sesungguhnya dikerjakan backend (ekstraksiRule.js, yang
// menautkan tiap sebutan ke perannya). Lapisan ini cuma jaring terakhir saat
// backend tak terjangkau, jadi dibuat seadanya tapi tidak menyesatkan: lebih
// baik kosong lalu diisi pelapor daripada terisi keliru lalu lolos tanpa
// diperiksa dan menjadi data resmi.
function tebakJenisKelamin(teks) {
  const t = teks.toLowerCase()
  if (/\b(perempuan|wanita|putri|gadis)\b/.test(t)) return 'Perempuan'
  if (/\b(laki-laki|lelaki|pria|putra)\b/.test(t)) return 'Laki-laki'
  return null
}

function tebakJenisKekerasan(teks, masterKekerasan) {
  const t = teks.toLowerCase()
  const tersedia = new Set(masterKekerasan.map(m => m.nama_kategori))
  for (const [kategori, kataKunci] of Object.entries(KAMUS_KEKERASAN)) {
    if (!tersedia.has(kategori)) continue
    if (kataKunci.some(k => t.includes(k))) return kategori
  }
  return null
}

function analisisLokal(kronologi, masterKekerasan) {
  const hasil = {
    namaKorban: null,
    usiaKorban: tebakUsia(kronologi),
    jenisKelamin: tebakJenisKelamin(kronologi),
    hubunganKorban: null,
    jenisKekerasan: tebakJenisKekerasan(kronologi, masterKekerasan),
    kelurahanKorban: null,
    lokasiKejadian: null,
    tanggalKejadian: null,
  }
  return {
    sumber: 'lokal',
    catatan: 'Analisis otomatis tidak tersedia, formulir diisi seadanya dari kata kunci.',
    hasil,
    terisi: Object.keys(hasil).filter(k => hasil[k] !== null && hasil[k] !== ''),
  }
}

// Mengembalikan { sumber, catatan, hasil, terisi, durasi_ms }.
// `sumber`: 'model' (Ollama), 'aturan' (Ollama tak terjangkau dari backend),
//           atau 'lokal' (backend sendiri tak terjangkau).
export async function analisisKronologi(kronologi, { masterKekerasan = [], forceFail = false } = {}) {
  if (forceFail) {
    throw new Error('Simulasi: analisis kronologi tidak dapat dihubungi')
  }

  try {
    const res = await apiClient.post('/laporan/analisis-kronologi', { kronologi })
    return res.data
  } catch (err) {
    // 422/429 itu penolakan yang disengaja — biar pemanggil yang menampilkan pesannya.
    const status = err.response?.status
    if (status === 422 || status === 429) throw err
    return analisisLokal(kronologi, masterKekerasan)
  }
}

export default { analisisKronologi }
