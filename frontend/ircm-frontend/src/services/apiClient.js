import axios from 'axios'

const API_GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL || '/api'

// Semua request ke backend lewat satu pintu ini: nginx api-gateway, yang
// meneruskan ke report-service atau case-service tergantung path-nya.
//
// Path-nya relatif dengan sengaja. Alamat gateway-nya diurus proxy di
// vite.config.js, supaya aplikasi tetap jalan dibuka dari alamat mana pun —
// localhost, IP Wi-Fi, maupun Tailscale.
const apiClient = axios.create({
  baseURL: API_GATEWAY_URL,
})

// Berkas berada di /storage pada host gateway (bukan di bawah /api).
// Helper ini menjaga URL berkas tetap melalui gateway ketika frontend dan
// gateway dijalankan pada mesin yang berbeda.
export function gatewayAssetUrl(path) {
  const normalizedPath = `/${String(path || '').replace(/^\/+/, '')}`
  if (API_GATEWAY_URL.startsWith('/')) return normalizedPath

  return new URL(normalizedPath, API_GATEWAY_URL).toString()
}

// Helper kecil buat nempelin token JWT ke header Authorization.
// Dipakai di semua request yang butuh login (hampir semua kecuali submit
// laporan publik, cek status, dan lihat master data kategori kekerasan).
export function authHeader(token) {
  return { headers: { Authorization: `Bearer ${token}` } }
}

export default apiClient
