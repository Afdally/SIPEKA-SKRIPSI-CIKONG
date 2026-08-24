import apiClient, { authHeader } from './apiClient'

const authService = {
  login: async (email, password) => {
    const res = await apiClient.post('/auth/login', { email, password })
    return res.data
  },

  // Tambah akun baru (hanya super_admin yang bisa memanggil ini)
  createUser: async (token, userData) => {
    const res = await apiClient.post('/auth/users', userData, authHeader(token))
    return res.data
  },

  logout: async (token) => {
    const res = await apiClient.post('/auth/logout', {}, authHeader(token))
    return res.data
  },

  // Daftar akun petugas/admin (hanya super_admin)
  getUsers: async (token) => {
    const res = await apiClient.get('/auth/users', authHeader(token))
    return res.data
  },

  updateUser: async (token, id, payload) => {
    const res = await apiClient.put(`/auth/users/${id}`, payload, authHeader(token))
    return res.data
  },

  deleteUser: async (token, id) => {
    const res = await apiClient.delete(`/auth/users/${id}`, authHeader(token))
    return res.data
  },

  me: async (token) => {
    const res = await apiClient.get('/auth/me', authHeader(token))
    return res.data
  },

  refresh: async (token) => {
    const res = await apiClient.post('/auth/refresh', {}, authHeader(token))
    return res.data
  },
}

export default authService
