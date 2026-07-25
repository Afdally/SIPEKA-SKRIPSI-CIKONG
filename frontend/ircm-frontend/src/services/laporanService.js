import apiClient, { authHeader } from './apiClient'
import { mockLaporanService } from './mock/mockLaporanService'

// Lihat catatan MOCK_MODE di authService.js.
const MOCK_MODE = import.meta.env.VITE_MOCK_MODE === 'true'

// Semua panggilan API yang berhubungan dengan LAPORAN (report-service):
// submit laporan publik, cek status, daftar kategori kekerasan.
const laporanService = {
  // --- Publik (tidak butuh login) ---

  // Dipakai di form pelaporan untuk mengisi dropdown "Jenis Kasus / Kekerasan"
  getMasterKekerasan: async () => {
    if (MOCK_MODE) return mockLaporanService.getMasterKekerasan()
    const res = await apiClient.get('/master/kekerasan?all=false')
    return res.data
  },

  // Dipakai di halaman "Cek Status Laporan"
  cekStatus: async (kodeLaporan) => {
    if (MOCK_MODE) return mockLaporanService.cekStatus(kodeLaporan)
    const res = await apiClient.get(`/laporan/status/${kodeLaporan}`)
    return res.data
  },

  // Kirim laporan baru (formData berisi field korban/pelapor + file bukti opsional)
  submitLaporan: async (formData) => {
    if (MOCK_MODE) return mockLaporanService.submitLaporan(formData)
    const res = await apiClient.post('/laporan', formData)
    return res.data
  },

  // --- Butuh login (petugas/super admin) ---

  getAll: async (token) => {
    if (MOCK_MODE) return mockLaporanService.getAll(token)
    const res = await apiClient.get('/laporan', authHeader(token))
    return res.data.data
  },

  // Daftar kategori kekerasan termasuk yang nonaktif (untuk Pusat Kendali Layanan)
  getMasterKekerasanAll: async (token) => {
    if (MOCK_MODE) return mockLaporanService.getMasterKekerasanAll(token)
    const res = await apiClient.get('/master/kekerasan?all=true', authHeader(token))
    return res.data
  },

  createMasterKekerasan: async (token, payload) => {
    if (MOCK_MODE) return mockLaporanService.createMasterKekerasan(token, payload)
    const res = await apiClient.post('/master/kekerasan', payload, authHeader(token))
    return res.data
  },

  updateMasterKekerasan: async (token, id, payload) => {
    if (MOCK_MODE) return mockLaporanService.updateMasterKekerasan(token, id, payload)
    const res = await apiClient.put(`/master/kekerasan/${id}`, payload, authHeader(token))
    return res.data
  },

  deleteMasterKekerasan: async (token, id) => {
    if (MOCK_MODE) return mockLaporanService.deleteMasterKekerasan(token, id)
    const res = await apiClient.delete(`/master/kekerasan/${id}`, authHeader(token))
    return res.data
  },
}

export default laporanService
