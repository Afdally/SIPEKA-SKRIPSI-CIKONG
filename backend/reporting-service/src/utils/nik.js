const NIK_LENGTH = 16;
const NIK_PATTERN = /^\d{16}$/;

function normalizeNik(value) {
  if (value === undefined || value === null || value === '') return null;
  const nik = String(value).trim();
  return nik === '' ? null : nik;
}

function isValidNik(value) {
  const nik = normalizeNik(value);
  return nik === null || NIK_PATTERN.test(nik);
}

function maskNik(value) {
  const nik = normalizeNik(value);
  if (!nik) return null;
  return `${nik.slice(0, 4)}${'*'.repeat(Math.max(0, nik.length - 4))}`;
}

function nikForRole(value, role) {
  const nik = normalizeNik(value);
  if (!nik) return null;
  return role === 'super_admin' ? nik : maskNik(nik);
}

module.exports = { NIK_LENGTH, normalizeNik, isValidNik, maskNik, nikForRole };
