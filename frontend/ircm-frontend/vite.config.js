import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

// Sertifikat cuma ada di VM produksi (di-mount dari host lewat docker-compose).
// Di lokal (dev) file ini tidak ada, jadi HTTPS otomatis nonaktif tanpa perlu
// env var/config tambahan — cukup deteksi keberadaan filenya.
const SSL_KEY_PATH = '/etc/letsencrypt/live/sipeka.titikkami.site/privkey.pem'
const SSL_CERT_PATH = '/etc/letsencrypt/live/sipeka.titikkami.site/fullchain.pem'
const hasSslCerts = fs.existsSync(SSL_KEY_PATH) && fs.existsSync(SSL_CERT_PATH)

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const apiGatewayTarget = env.API_GATEWAY_TARGET || 'http://localhost:8080'

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: hasSslCerts ? 443 : 80,
      watch: {
        usePolling: true,
      },
      allowedHosts: [
        'sipeka.titikkami.site'
      ],
      https: hasSslCerts
        ? {
            key: fs.readFileSync(SSL_KEY_PATH),
            cert: fs.readFileSync(SSL_CERT_PATH),
          }
        : undefined,
      proxy: {
        '/api': { target: apiGatewayTarget, changeOrigin: true },
        // Foto/dokumen bukti laporan, dilayani report-service lewat gateway
        '/storage': { target: apiGatewayTarget, changeOrigin: true },
      },
    },
  }
})
