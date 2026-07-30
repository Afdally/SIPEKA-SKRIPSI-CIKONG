import apiClient, { authHeader } from './apiClient'

// Semua panggilan API yang berhubungan dengan KASUS (case-service):
// alur registrasi -> assessment -> intervensi -> monitoring -> selesai,
// plus statistik dan master data metode penanganan. Semua butuh login.
const kasusService = {
  getAll: async (token) => {
    const res = await apiClient.get('/penanganan', authHeader(token))
    return res.data
  },

  // Tahap 1: petugas mendaftarkan laporan menjadi kasus
  registrasi: async (token, payload) => {
    const res = await apiClient.post('/penanganan/registrasi', payload, authHeader(token))
    return res.data
  },

  // Tahap 2: hasil wawancara/assessment
  assessment: async (token, id, payload) => {
    const res = await apiClient.put(`/penanganan/${id}/assessment`, payload, authHeader(token))
    return res.data
  },

  // Tahap 3: rencana intervensi/penanganan
  intervensi: async (token, id, payload) => {
    const res = await apiClient.put(`/penanganan/${id}/intervensi`, payload, authHeader(token))
    return res.data
  },

  // Tahap 4: catatan progres selama monitoring
  addLog: async (token, id, payload) => {
    const res = await apiClient.post(`/penanganan/${id}/log`, payload, authHeader(token))
    return res.data
  },

  // Tahap 4b: tutup/arsipkan kasus
  selesaikan: async (token, id) => {
    const res = await apiClient.put(`/penanganan/${id}/selesai`, {}, authHeader(token))
    return res.data
  },

  // --- Statistik (untuk dashboard Super Admin) ---

  getStatsSummary: async (token) => {
    const res = await apiClient.get('/penanganan/stats/summary', authHeader(token))
    return res.data
  },

  getStatsKinerja: async (token) => {
    const res = await apiClient.get('/penanganan/stats/kinerja', authHeader(token))
    return res.data
  },

  // --- Master data metode penanganan (untuk Pusat Kendali Layanan) ---

  getMasterMetodeAll: async (token) => {
    const res = await apiClient.get('/master/metode?all=true', authHeader(token))
    return res.data
  },

  createMasterMetode: async (token, payload) => {
    const res = await apiClient.post('/master/metode', payload, authHeader(token))
    return res.data
  },

  updateMasterMetode: async (token, id, payload) => {
    const res = await apiClient.put(`/master/metode/${id}`, payload, authHeader(token))
    return res.data
  },

  deleteMasterMetode: async (token, id) => {
    const res = await apiClient.delete(`/master/metode/${id}`, authHeader(token))
    return res.data
  },
}

export default kasusService
