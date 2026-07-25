import axios from 'axios'
import { mockAuthService } from './mock/mockAuthService'

// Mode mock: dipakai buat build khusus user testing (hosting statis di
// Vercel/Netlify) tanpa backend microservices beneran. Diaktifkan lewat
// env var VITE_MOCK_MODE=true saat build, lihat README/vercel.json.
const MOCK_MODE = import.meta.env.VITE_MOCK_MODE === 'true'

const BASE_URL = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:8080/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

const authService = {
  login: async (email, password) => {
    if (MOCK_MODE) return mockAuthService.login(email, password)
    const res = await api.post('/auth/login', { email, password })
    return res.data
  },

  // Tambah akun baru (hanya petugas_uptd yang bisa memanggil ini)
  createUser: async (token, userData) => {
    if (MOCK_MODE) return mockAuthService.createUser(token, userData)
    const res = await api.post('/auth/users', userData, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.data
  },

  logout: async (token) => {
    if (MOCK_MODE) return mockAuthService.logout(token)
    const res = await api.post('/auth/logout', {}, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.data
  },

  // Daftar akun petugas/admin (hanya super_admin)
  getUsers: async (token) => {
    if (MOCK_MODE) return mockAuthService.getUsers(token)
    const res = await api.get('/auth/users', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.data
  },

  updateUser: async (token, id, payload) => {
    if (MOCK_MODE) return mockAuthService.updateUser(token, id, payload)
    const res = await api.put(`/auth/users/${id}`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.data
  },

  deleteUser: async (token, id) => {
    if (MOCK_MODE) return mockAuthService.deleteUser(token, id)
    const res = await api.delete(`/auth/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.data
  },

  me: async (token) => {
    if (MOCK_MODE) return mockAuthService.me(token)
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
