import apiClient, { authHeader } from './apiClient'
import { mockKasusService } from './mock/mockKasusService'

// Lihat catatan MOCK_MODE di authService.js.
const MOCK_MODE = import.meta.env.VITE_MOCK_MODE === 'true'

// Semua panggilan API yang berhubungan dengan KASUS (case-service):
// alur registrasi -> assessment -> intervensi -> monitoring -> selesai,
// plus statistik dan master data metode penanganan. Semua butuh login.
const kasusService = {
  getAll: async (token) => {
    if (MOCK_MODE) return mockKasusService.getAll(token)
    const res = await apiClient.get('/penanganan', authHeader(token))
    return res.data
  },

  // Tahap 1: petugas mendaftarkan laporan menjadi kasus
  registrasi: async (token, payload) => {
    if (MOCK_MODE) return mockKasusService.registrasi(token, payload)
    const res = await apiClient.post('/penanganan/registrasi', payload, authHeader(token))
    return res.data
  },

  // Tahap 2: hasil wawancara/assessment
  assessment: async (token, id, payload) => {
    if (MOCK_MODE) return mockKasusService.assessment(token, id, payload)
    const res = await apiClient.put(`/penanganan/${id}/assessment`, payload, authHeader(token))
    return res.data
  },

  // Tahap 3: rencana intervensi/penanganan
  intervensi: async (token, id, payload) => {
    if (MOCK_MODE) return mockKasusService.intervensi(token, id, payload)
    const res = await apiClient.put(`/penanganan/${id}/intervensi`, payload, authHeader(token))
    return res.data
  },

  // Tahap 4: catatan progres selama monitoring
  addLog: async (token, id, payload) => {
    if (MOCK_MODE) return mockKasusService.addLog(token, id, payload)
    const res = await apiClient.post(`/penanganan/${id}/log`, payload, authHeader(token))
    return res.data
  },

  // Tahap 4b: tutup/arsipkan kasus
  selesaikan: async (token, id) => {
    if (MOCK_MODE) return mockKasusService.selesaikan(token, id)
    const res = await apiClient.put(`/penanganan/${id}/selesai`, {}, authHeader(token))
    return res.data
  },

  // --- Statistik (untuk dashboard Super Admin) ---

  getStatsSummary: async (token) => {
    if (MOCK_MODE) return mockKasusService.getStatsSummary(token)
    const res = await apiClient.get('/penanganan/stats/summary', authHeader(token))
    return res.data
  },

  getStatsKinerja: async (token) => {
    if (MOCK_MODE) return mockKasusService.getStatsKinerja(token)
    const res = await apiClient.get('/penanganan/stats/kinerja', authHeader(token))
    return res.data
  },

  // --- Master data metode penanganan (untuk Pusat Kendali Layanan) ---

  getMasterMetodeAll: async (token) => {
    if (MOCK_MODE) return mockKasusService.getMasterMetodeAll(token)
    const res = await apiClient.get('/master/metode?all=true', authHeader(token))
    return res.data
  },

  createMasterMetode: async (token, payload) => {
    if (MOCK_MODE) return mockKasusService.createMasterMetode(token, payload)
    const res = await apiClient.post('/master/metode', payload, authHeader(token))
    return res.data
  },

  updateMasterMetode: async (token, id, payload) => {
    if (MOCK_MODE) return mockKasusService.updateMasterMetode(token, id, payload)
    const res = await apiClient.put(`/master/metode/${id}`, payload, authHeader(token))
    return res.data
  },

  deleteMasterMetode: async (token, id) => {
    if (MOCK_MODE) return mockKasusService.deleteMasterMetode(token, id)
    const res = await apiClient.delete(`/master/metode/${id}`, authHeader(token))
    return res.data
  },
}

export default kasusService
