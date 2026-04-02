const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const laporanRoutes = require('./src/routes/laporan');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/storage', express.static(path.join(__dirname, 'storage'))); // For uploaded files

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'report-service' }));

app.use('/api/laporan', laporanRoutes);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/report_db';
const PORT = process.env.PORT || 8001;

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB terhubung:', MONGODB_URI);
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Reporting Service berjalan di http://0.0.0.0:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Gagal koneksi MongoDB:', err.message);
    process.exit(1);
  });
