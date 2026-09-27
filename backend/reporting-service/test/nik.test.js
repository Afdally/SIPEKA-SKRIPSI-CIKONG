const assert = require('assert');
const { isValidNik, maskNik, nikForRole } = require('../src/utils/nik');

assert.strictEqual(isValidNik('1234567890123456'), true);
assert.strictEqual(isValidNik('123456789012345'), false);
assert.strictEqual(isValidNik('12345678901234567'), false);
assert.strictEqual(isValidNik(''), true);
assert.strictEqual(maskNik('1234567890123456'), '1234************');
assert.strictEqual(nikForRole('1234567890123456', 'super_admin'), '1234567890123456');
assert.strictEqual(nikForRole('1234567890123456', 'petugas_uptd'), '1234************');

console.log('nik.test.js passed');
