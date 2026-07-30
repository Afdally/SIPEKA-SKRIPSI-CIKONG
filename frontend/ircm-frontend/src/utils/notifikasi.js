import Swal from 'sweetalert2'

// Pembungkus tipis SweetAlert2, menggantikan alert()/confirm() bawaan browser.
//
// Dikumpulkan di satu berkas supaya warna, ukuran, dan bahasa tombolnya seragam
// di seluruh aplikasi — kalau dipanggil langsung dari 24 tempat yang tersebar,
// perbedaan kecil pasti menyelinap masuk.

const WARNA_UTAMA = '#4f46e5'  // --primary di Dashboard.css
const WARNA_BAHAYA = '#dc2626'

const dasar = {
  confirmButtonColor: WARNA_UTAMA,
  cancelButtonColor: '#6b7280',
  // Tombol batal ditaruh di kiri dan tombol setuju di kanan, mengikuti
  // kebiasaan dialog di Windows.
  reverseButtons: true,
}

export function beriTahuGagal(pesan, judul = 'Gagal') {
  return Swal.fire({ ...dasar, icon: 'error', title: judul, text: pesan, confirmButtonText: 'Tutup' })
}

// Untuk validasi form: isian belum lengkap, bukan kesalahan sistem.
export function beriTahuKurang(pesan) {
  return Swal.fire({ ...dasar, icon: 'warning', title: 'Belum Lengkap', text: pesan, confirmButtonText: 'Mengerti' })
}

export function beriTahuSukses(pesan, judul = 'Berhasil') {
  return Swal.fire({ ...dasar, icon: 'success', title: judul, text: pesan, confirmButtonText: 'Tutup' })
}

// Notifikasi ringan yang hilang sendiri, untuk hal sepele yang tidak perlu
// menghentikan pekerjaan petugas (mis. "kode tersalin").
export function toastSukses(pesan) {
  return Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    title: pesan,
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
  })
}

// Mengembalikan true kalau pengguna menekan tombol setuju.
//
// PENTING: tidak seperti confirm() bawaan yang menghentikan eksekusi, ini
// asinkron — pemanggilnya wajib `await`, dan fungsinya harus `async`.
export async function konfirmasi(pesan, { judul = 'Konfirmasi', teksSetuju = 'Ya, lanjutkan', berbahaya = false } = {}) {
  const hasil = await Swal.fire({
    ...dasar,
    icon: berbahaya ? 'warning' : 'question',
    title: judul,
    text: pesan,
    showCancelButton: true,
    confirmButtonText: teksSetuju,
    cancelButtonText: 'Batal',
    confirmButtonColor: berbahaya ? WARNA_BAHAYA : WARNA_UTAMA,
  })
  return hasil.isConfirmed
}
