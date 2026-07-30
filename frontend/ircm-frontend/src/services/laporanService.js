import apiClient, { authHeader } from './apiClient'

// Semua panggilan API yang berhubungan dengan LAPORAN (report-service):
// submit laporan publik, cek status, daftar kategori kekerasan.
const laporanService = {
  // --- Publik (tidak butuh login) ---

  // Dipakai di form pelaporan untuk mengisi dropdown "Jenis Kasus / Kekerasan"
  getMasterKekerasan: async () => {
    const res = await apiClient.get('/master/kekerasan?all=false')
    return res.data
  },

  // Dipakai di halaman "Cek Status Laporan"
  cekStatus: async (kodeLaporan) => {
    const res = await apiClient.get(`/laporan/status/${kodeLaporan}`)
    return res.data
  },

  // Kirim laporan baru (formData berisi field korban/pelapor + file bukti opsional)
  submitLaporan: async (formData) => {
    const res = await apiClient.post('/laporan', formData)
    return res.data
  },

  // --- Butuh login (petugas/super admin) ---

  getAll: async (token) => {
    const res = await apiClient.get('/laporan', authHeader(token))
    return res.data.data
  },

  // Daftar kategori kekerasan termasuk yang nonaktif (untuk Pusat Kendali Layanan)
  getMasterKekerasanAll: async (token) => {
    const res = await apiClient.get('/master/kekerasan?all=true', authHeader(token))
    return res.data
  },

  createMasterKekerasan: async (token, payload) => {
    const res = await apiClient.post('/master/kekerasan', payload, authHeader(token))
    return res.data
  },

  updateMasterKekerasan: async (token, id, payload) => {
    const res = await apiClient.put(`/master/kekerasan/${id}`, payload, authHeader(token))
    return res.data
  },

  deleteMasterKekerasan: async (token, id) => {
    const res = await apiClient.delete(`/master/kekerasan/${id}`, authHeader(token))
    return res.data
  },
}

export default laporanService
