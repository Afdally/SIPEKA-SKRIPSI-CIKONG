import axios from 'axios'

// Semua request ke backend lewat satu pintu ini: nginx api-gateway, yang
// meneruskan ke report-service atau case-service tergantung path-nya.
//
// Path-nya relatif dengan sengaja. Alamat gateway-nya diurus proxy di
// vite.config.js, supaya aplikasi tetap jalan dibuka dari alamat mana pun —
// localhost, IP Wi-Fi, maupun Tailscale.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
})

// Helper kecil buat nempelin token JWT ke header Authorization.
// Dipakai di semua request yang butuh login (hampir semua kecuali submit
// laporan publik, cek status, dan lihat master data kategori kekerasan).
export function authHeader(token) {
  return { headers: { Authorization: `Bearer ${token}` } }
}

export default apiClient
