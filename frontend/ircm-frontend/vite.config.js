import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Panggilan ke /api dan /storage diteruskan dev server ini ke api-gateway, jadi
// kode frontend cukup memakai path relatif dan tidak perlu tahu alamat backend.
//
// Ini yang membuat aplikasi bisa dibuka dari perangkat mana pun. Sebelumnya
// alamat backend ditulis langsung sebagai "http://localhost:8080" — benar hanya
// kalau browsernya berjalan di mesin yang sama dengan server. Dibuka dari HP
// lewat Tailscale atau dari laptop lain di Wi-Fi, "localhost" di sana menunjuk
// ke perangkat itu sendiri dan semua panggilan API mati.
//
// Targetnya bisa diganti lewat env karena letak backend berbeda tergantung cara
// menjalankan (lihat dua opsi di README):
//   - lewat Docker : gateway dikenal sebagai host "api-gateway" di jaringan compose
//   - npm run dev  : gateway ada di localhost:8080 dari sudut pandang PC
const targetBackend = process.env.VITE_PROXY_TARGET || 'http://localhost:8080'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 80,
    watch: {
      usePolling: true,
    },
    proxy: {
      '/api': { target: targetBackend, changeOrigin: true },
      // Foto/dokumen bukti laporan, dilayani report-service lewat gateway
      '/storage': { target: targetBackend, changeOrigin: true },
    },
  },
})
