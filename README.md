# SIPEKA - Sistem Pelaporan Kasus Kekerasan (IRCM)
Sistem informasi terintegrasi untuk pelaporan, assessment, dan penanganan kasus kekerasan pada Dinas Pemberdayaan Perempuan dan Perlindungan Anak (DPPPA) Kota Kendari.

## 🏗️ Arsitektur Sistem
Proyek ini dibangun menggunakan arsitektur **Microservices** berbasis Node.js untuk backend, dan React (Vite) untuk frontend.
- **Frontend**: React.js (Vite) berjalan di port `5173`.
- **API Gateway / Nginx**: Menggabungkan seluruh service backend agar dapat diakses dari satu pintu di port `8080`.
- **Backend Services**:
  - `auth-service`: Mengatur login, manajemen user, dan validasi token JWT.
  - `reporting-service`: Mengatur form pengaduan dari masyarakat / landing page.
  - `case-service`: Mengatur alur penanganan kasus (Assessment, Intervensi, Monitoring, Terminasi) oleh petugas UPTD.

---

## 🚀 Cara Menjalankan Aplikasi

Aplikasi ini bisa dijalankan menggunakan Docker secara instan, atau dijalankan secara manual satu per satu untuk kebutuhan pengetesan (*development*).

### Opsi 1: Menjalankan dengan Docker (Lebih Praktis)
Jika komputer Anda sudah terinstal Docker dan Docker Compose, Anda bisa menjalankan seluruh ekosistem SIPEKA hanya dengan 1 perintah:
1. Buka Terminal/CMD di folder proyek ini.
2. Jalankan perintah berikut:
   ```bash
   docker-compose up -d --build
   ```
3. Docker otomatis akan menyalakan Frontend dan semua Backend Services. Akses website melalui `http://localhost:5173`.

### Opsi 2: Menjalankan Manual di Terminal (Dev Mode)
Anda harus membuka beberapa terminal/CMD secara bersamaan. Pastikan database **MongoDB** Anda sudah berjalan di PC Anda.

1. **Jalankan Frontend (Terminal 1):**
   ```bash
   cd frontend/ircm-frontend
   npm install
   npm run dev
   ```
2. **Jalankan Nginx / API Gateway (Terminal 2 - *Opsional jika langsung tembak port service*):**
   ```bash
   docker-compose up nginx
   ```
3. **Jalankan Auth Service (Terminal 3):**
   ```bash
   cd backend/auth-service
   npm install
   npm run dev
   ```
4. **Jalankan Reporting Service (Terminal 4):**
   ```bash
   cd backend/reporting-service
   npm install
   npm run dev
   ```
5. **Jalankan Case Service (Terminal 5):**
   ```bash
   cd backend/case-service
   npm install
   npm run dev
   ```

---

## 🔐 Akun Login Bawaan (Default User)

Saat backend pertama kali dijalankan, sistem otomatis membuatkan 2 akun default (*seeding*) yang bisa langsung Anda pakai untuk masuk ke halaman Dashboard:

### 1. Akun Super Admin
Mempunyai akses untuk melihat seluruh laporan keseluruhan dan manajemen user.
- **Email:** `superadmin@kendari.go.id`
- **Password:** `superadmin123`

### 2. Akun Petugas UPTD PPA
Mempunyai akses untuk menyetujui laporan masyarakat dan memproses tahapan kasus dari registrasi hingga terminasi.
- **Email:** `petugas@uptd-ppa.kendari.go.id`
- **Password:** `petugas123456`

---

## 🗺️ Integrasi dengan Peta GIS
Bagi *developer* eksternal yang ingin mengambil data sebaran kasus SIPEKA ke dalam sistem Web GIS, silakan baca dokumentasi API spasial secara terpisah di file:
📄 **`API_GIS_DOCUMENTATION.md`**