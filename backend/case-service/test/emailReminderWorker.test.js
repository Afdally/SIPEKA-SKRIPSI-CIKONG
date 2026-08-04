const test = require('node:test');
const assert = require('node:assert/strict');
const { buildText, runOnce } = require('../src/services/emailReminderWorker');

const config = {
  reportingServiceUrl: 'http://report-service:8000',
  internalApiKey: 'test-key',
  dashboardUrl: 'http://dashboard.test',
  smtpFrom: 'SIPEKA <noreply@test.local>',
};

function jsonResponse(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function modelWithDistinct(values) {
  return { find: () => ({ distinct: async () => values }) };
}

test('isi email hanya memuat metadata aman', () => {
  const text = buildText([
    {
      kode_laporan: 'LP-2026-ABCDE',
      createdAt: '2026-08-02T00:00:00.000Z',
      nama_korban: 'Tidak boleh tampil',
      kronologi: 'Tidak boleh tampil',
    },
  ], config.dashboardUrl);
  assert.match(text, /LP-2026-ABCDE/);
  assert.match(text, /dashboard\.test/);
  assert.doesNotMatch(text, /Tidak boleh tampil/);
});

test('laporan yang sudah menjadi Kasus diselesaikan tanpa dikirim lewat email', async () => {
  const calls = [];
  const mails = [];
  const fetchFn = async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith('/claim')) {
      return jsonResponse({
        claim_token: 'claim-1',
        data: [
          { _id: 'report-registered', kode_laporan: 'LP-1', createdAt: '2026-08-02T00:00:00Z' },
          { _id: 'report-new', kode_laporan: 'LP-2', createdAt: '2026-08-02T00:01:00Z' },
        ],
      });
    }
    return jsonResponse({ updated: 1 });
  };

  const result = await runOnce(
    config,
    { sendMail: async (mail) => mails.push(mail) },
    {
      fetchFn,
      KasusModel: modelWithDistinct(['report-registered']),
      UserModel: modelWithDistinct(['petugas@test.local']),
    },
  );

  assert.deepEqual(result, { sent: 1, skipped: 1 });
  assert.equal(mails.length, 1);
  assert.match(mails[0].text, /LP-2/);
  assert.doesNotMatch(mails[0].text, /LP-1/);
  const completions = calls.filter((call) => call.url.endsWith('/complete'));
  assert.equal(completions.length, 2);
  assert.equal(JSON.parse(completions[0].options.body).email_sent, false);
  assert.equal(JSON.parse(completions[1].options.body).email_sent, true);
  assert.equal(calls.some((call) => call.url.endsWith('/release')), false);
});

test('klaim dilepas ketika pengiriman gagal', async () => {
  const calls = [];
  const fetchFn = async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith('/claim')) {
      return jsonResponse({
        claim_token: 'claim-2',
        data: [{ _id: 'report-new', kode_laporan: 'LP-2', createdAt: '2026-08-02T00:00:00Z' }],
      });
    }
    return jsonResponse({ released: 1 });
  };

  await assert.rejects(
    runOnce(
      config,
      { sendMail: async () => { throw new Error('SMTP down'); } },
      {
        fetchFn,
        KasusModel: modelWithDistinct([]),
        UserModel: modelWithDistinct(['petugas@test.local']),
      },
    ),
    /SMTP down/,
  );
  const release = calls.find((call) => call.url.endsWith('/release'));
  assert.ok(release);
  assert.deepEqual(JSON.parse(release.options.body).report_ids, ['report-new']);
});
