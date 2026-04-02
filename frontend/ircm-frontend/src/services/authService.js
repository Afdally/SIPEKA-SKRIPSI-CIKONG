import axios from 'axios'

const BASE_URL = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:8080/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

const authService = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    return res.data
  },

  // Tambah akun baru (hanya admin_dp3a yang bisa memanggil ini)
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
