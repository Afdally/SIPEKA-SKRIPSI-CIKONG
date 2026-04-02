const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./src/routes/auth');
const seed = require('./src/seed');

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'auth-service' }));

// Routes
app.use('/api/auth', authRoutes);

// Connect MongoDB lalu jalankan server
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/auth_db';
const PORT = process.env.PORT || 8000;

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB terhubung:', MONGODB_URI);
    await seed();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Auth Service berjalan di http://0.0.0.0:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Gagal koneksi MongoDB:', err.message);
    process.exit(1);
  });
