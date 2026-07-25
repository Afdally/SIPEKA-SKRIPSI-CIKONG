import { mockDb } from './mockDb';

function fakeToken(user) {
  return `mock.${btoa(JSON.stringify({ id: user._id, role: user.role }))}.token`;
}

export const mockAuthService = {
  login: async (email, password) => {
    mockDb.seedIfNeeded();
    await mockDb.delay(600);
    const users = mockDb.load(mockDb.KEYS.users, []);
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user || user.password !== password) throw mockDb.mockError('Email atau password salah');
    return {
      access_token: fakeToken(user),
      token_type: 'bearer',
      expires_in: 3600,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    };
  },

  logout: async () => {
    await mockDb.delay(200);
    return { message: 'Berhasil logout' };
  },

  getUsers: async () => {
    await mockDb.delay();
    return mockDb.load(mockDb.KEYS.users, []).map(({ password, ...u }) => u);
  },

  createUser: async (_token, payload) => {
    await mockDb.delay();
    const users = mockDb.load(mockDb.KEYS.users, []);
    if (users.some((u) => u.email.toLowerCase() === payload.email.toLowerCase())) {
      throw mockDb.mockError('Email sudah terdaftar');
    }
    const user = { _id: mockDb.uid(), ...payload };
    users.push(user);
    mockDb.save(mockDb.KEYS.users, users);
    const { password, ...safe } = user;
    return { message: 'Akun berhasil dibuat', user: safe };
  },

  updateUser: async (_token, id, payload) => {
    await mockDb.delay();
    const users = mockDb.load(mockDb.KEYS.users, []);
    const idx = users.findIndex((u) => u._id === id);
    if (idx < 0) throw mockDb.mockError('User tidak ditemukan');
    users[idx] = { ...users[idx], ...payload };
    mockDb.save(mockDb.KEYS.users, users);
    const { password, ...safe } = users[idx];
    return { message: 'Akun berhasil diperbarui', user: safe };
  },

  deleteUser: async (_token, id) => {
    await mockDb.delay();
    const users = mockDb.load(mockDb.KEYS.users, []).filter((u) => u._id !== id);
    mockDb.save(mockDb.KEYS.users, users);
    return { message: 'Akun berhasil dihapus' };
  },

  me: async () => {
    await mockDb.delay();
    return mockDb.currentUser();
  },
};
