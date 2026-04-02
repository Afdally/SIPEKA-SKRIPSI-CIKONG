const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const verifikasiRoutes = require('./src/routes/verifikasi');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'verification-service' }));
app.use('/api/verifikasi', verifikasiRoutes);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/verification_db';
const PORT = process.env.PORT || 8002;

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB terhubung:', MONGODB_URI);
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Verification Service berjalan di http://0.0.0.0:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Gagal koneksi MongoDB:', err.message);
    process.exit(1);
  });
