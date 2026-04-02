const User = require('./models/User');

module.exports = async function seed() {
  try {
    const defaultUsers = [
      // Admin DP3A
      {
        name: 'Admin DP3A Kendari',
        email: 'admin@dp3a-kendari.go.id',
        password: 'admin123456',
        role: 'admin_dp3a',
        kelurahan: null,
      },
      // Admin Kelurahan — Kec. Mandonga
      {
        name: 'Admin Kelurahan Mandonga',
        email: 'kelurahan.mandonga@kendari.go.id',
        password: 'kelurahan123456',
        role: 'admin_kelurahan',
        kelurahan: 'Mandonga',
      },
      {
        name: 'Admin Kelurahan Korumba',
        email: 'kelurahan.korumba@kendari.go.id',
        password: 'kelurahan123456',
        role: 'admin_kelurahan',
        kelurahan: 'Korumba',
      },
      // Admin Kelurahan — Kec. Kendari Barat
      {
        name: 'Admin Kelurahan Wawombalata',
        email: 'kelurahan.wawombalata@kendari.go.id',
        password: 'kelurahan123456',
        role: 'admin_kelurahan',
        kelurahan: 'Wawombalata',
      },
      {
        name: 'Admin Kelurahan Kemaraya',
        email: 'kelurahan.kemaraya@kendari.go.id',
        password: 'kelurahan123456',
        role: 'admin_kelurahan',
        kelurahan: 'Kemaraya',
      },
      // Admin Kelurahan — Kec. Kadia
      {
        name: 'Admin Kelurahan Kadia',
        email: 'kelurahan.kadia@kendari.go.id',
        password: 'kelurahan123456',
        role: 'admin_kelurahan',
        kelurahan: 'Kadia',
      },
      // Admin Kelurahan — Kec. Wua-Wua
      {
        name: 'Admin Kelurahan Wua-Wua',
        email: 'kelurahan.wuawua@kendari.go.id',
        password: 'kelurahan123456',
        role: 'admin_kelurahan',
        kelurahan: 'Wua-Wua',
      },
      // Admin Kelurahan — Kec. Baruga
      {
        name: 'Admin Kelurahan Lepo-Lepo',
        email: 'kelurahan.lepolepo@kendari.go.id',
        password: 'kelurahan123456',
        role: 'admin_kelurahan',
        kelurahan: 'Lepo-Lepo',
      },
      // Admin Kelurahan — Kec. Poasia
      {
        name: 'Admin Kelurahan Anduonohu',
        email: 'kelurahan.anduonohu@kendari.go.id',
        password: 'kelurahan123456',
        role: 'admin_kelurahan',
        kelurahan: 'Anduonohu',
      },
      // Admin Kelurahan — Kec. Kambu
      {
        name: 'Admin Kelurahan Kambu',
        email: 'kelurahan.kambu@kendari.go.id',
        password: 'kelurahan123456',
        role: 'admin_kelurahan',
        kelurahan: 'Kambu',
      },
      // Admin Kelurahan — Kec. Abeli
      {
        name: 'Admin Kelurahan Abeli',
        email: 'kelurahan.abeli@kendari.go.id',
        password: 'kelurahan123456',
        role: 'admin_kelurahan',
        kelurahan: 'Abeli',
      },
      // Admin Kelurahan — Kec. Kendari
      {
        name: 'Admin Kelurahan Kandai',
        email: 'kelurahan.kandai@kendari.go.id',
        password: 'kelurahan123456',
        role: 'admin_kelurahan',
        kelurahan: 'Kandai',
      },
      // Admin Kelurahan — Kec. Puuwatu
      {
        name: 'Admin Kelurahan Puuwatu',
        email: 'kelurahan.puuwatu@kendari.go.id',
        password: 'kelurahan123456',
        role: 'admin_kelurahan',
        kelurahan: 'Puuwatu',
      },
    ];

    for (const u of defaultUsers) {
      const exists = await User.findOne({ email: u.email });
      if (!exists) {
        await User.create(u);
        console.log(`👤 Seed: Created user ${u.email} (${u.kelurahan || u.role})`);
      }
    }
    console.log('✅ Seeding checked/completed.');
  } catch (err) {
    console.error('❌ Seeding error:', err);
  }
};
