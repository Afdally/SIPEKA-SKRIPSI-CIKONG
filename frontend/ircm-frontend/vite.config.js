import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const apiGatewayTarget = env.API_GATEWAY_TARGET || 'http://localhost:8080'

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 443,
      watch: {
        usePolling: true,
      },
      allowedHosts: [
        'sipeka.titikkami.site'
      ],
      https: {
        key: fs.readFileSync('/etc/letsencrypt/live/sipeka.titikkami.site/privkey.pem'),
        cert: fs.readFileSync('/etc/letsencrypt/live/sipeka.titikkami.site/fullchain.pem'),
      },
      proxy: {
        '/api': { target: apiGatewayTarget, changeOrigin: true },
        // Foto/dokumen bukti laporan, dilayani report-service lewat gateway
        '/storage': { target: apiGatewayTarget, changeOrigin: true },
      },
    },
  }
})
