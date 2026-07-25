import axios from 'axios'

// Semua request ke backend lewat satu pintu ini: nginx api-gateway (port 8080),
// yang meneruskan ke report-service atau case-service tergantung path-nya.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
})

// Helper kecil buat nempelin token JWT ke header Authorization.
// Dipakai di semua request yang butuh login (hampir semua kecuali submit
// laporan publik, cek status, dan lihat master data kategori kekerasan).
export function authHeader(token) {
  return { headers: { Authorization: `Bearer ${token}` } }
}

export default apiClient
