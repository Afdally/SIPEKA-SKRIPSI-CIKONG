const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const kasusRoutes = require('./src/routes/kasus');
const masterRoutes = require('./src/routes/master');
const { seedMetode } = require('./src/controllers/masterMetodeController');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'case-service' }));
app.use('/api/penanganan', kasusRoutes);
app.use('/api/master', masterRoutes);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/case_db';
const PORT = process.env.PORT || 8003;

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB terhubung:', MONGODB_URI);
    await seedMetode(); // Auto-seeding master data
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Case Service berjalan di http://0.0.0.0:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Gagal koneksi MongoDB:', err.message);
    process.exit(1);
  });
