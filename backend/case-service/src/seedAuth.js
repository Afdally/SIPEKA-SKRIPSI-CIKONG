const User = require('./models/User');

module.exports = async function seedAuth() {
  try {
    const defaultUsers = [
      // Petugas UPTD PPA
      {
        name: 'Petugas UPTD PPA Kendari',
        email: 'petugas@uptd-ppa.kendari.go.id',
        password: 'petugas123456',
        role: 'petugas_uptd',
      },
      // Super Admin
      {
        name: 'Super Admin IRCM',
        email: 'superadmin@kendari.go.id',
        password: 'superadmin123',
        role: 'super_admin',
      },
    ];

    for (const u of defaultUsers) {
      const exists = await User.findOne({ email: u.email });
      if (!exists) {
        await User.create(u);
        console.log(`👤 Seed: Created user ${u.email} (${u.role})`);
      }
    }
    console.log('✅ Seeding auth checked/completed.');
  } catch (err) {
    console.error('❌ Seeding auth error:', err);
  }
};
