import axios from 'axios'

// Relatif, sama alasannya dengan apiClient.js: alamat backend diurus proxy
// Vite supaya bisa diakses dari perangkat mana pun.
const BASE_URL = import.meta.env.VITE_AUTH_SERVICE_URL || '/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

const authService = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    return res.data
  },

  // Tambah akun baru (hanya super_admin yang bisa memanggil ini)
  createUser: async (token, userData) => {
    const res = await api.post('/auth/users', userData, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.data
  },

  logout: async (token) => {
    const res = await api.post('/auth/logout', {}, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.data
  },

  // Daftar akun petugas/admin (hanya super_admin)
  getUsers: async (token) => {
    const res = await api.get('/auth/users', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.data
  },

  updateUser: async (token, id, payload) => {
    const res = await api.put(`/auth/users/${id}`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.data
  },

  deleteUser: async (token, id) => {
    const res = await api.delete(`/auth/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.data
  },

  me: async (token) => {
    const res = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.data
  },

  refresh: async (token) => {
    const res = await api.post('/auth/refresh', {}, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.data
  },
}

export default authService
