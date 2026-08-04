const DEFAULT_POLL_MINUTES = 5;

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function loadConfig() {
  const config = {
    internalApiKey: process.env.INTERNAL_API_KEY,
    reportingServiceUrl: process.env.REPORTING_SERVICE_URL || 'http://report-service:8000',
    dashboardUrl: process.env.PETUGAS_DASHBOARD_URL || 'http://localhost',
    smtpHost: process.env.SMTP_HOST,
    smtpPort: positiveInteger(process.env.SMTP_PORT, 587),
    smtpSecure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS,
    smtpFrom: process.env.SMTP_FROM,
    pollMinutes: positiveInteger(process.env.EMAIL_REMINDER_POLL_MINUTES, DEFAULT_POLL_MINUTES),
  };
  const required = ['internalApiKey', 'smtpHost', 'smtpUser', 'smtpPass', 'smtpFrom'];
  config.enabled = required.every((key) => Boolean(config[key]));
  return config;
}

function buildText(reports, dashboardUrl) {
  const list = reports
    .map((report) => `- ${report.kode_laporan} (masuk ${new Date(report.createdAt).toLocaleString('id-ID', { timeZone: 'Asia/Makassar' })} WITA)`)
    .join('\n');
  return [
    `Terdapat ${reports.length} laporan baru yang belum diregistrasi:`,
    '', list, '',
    `Silakan buka dashboard petugas: ${dashboardUrl}`,
    '',
    'Email ini tidak memuat identitas atau detail sensitif pelapor dan korban.',
  ].join('\n');
}

async function requestJson(url, options, internalApiKey, fetchFn = fetch) {
  const response = await fetchFn(url, {
    ...options,
    headers: {
      'content-type': 'application/json',
      'x-internal-api-key': internalApiKey,
      ...(options && options.headers),
    },
  });
  if (!response.ok) throw new Error(`Reporting Service merespons HTTP ${response.status}`);
  return response.json();
}

async function runOnce(config, transporter, dependencies = {}) {
  const UserModel = dependencies.UserModel || require('../models/User');
  const KasusModel = dependencies.KasusModel || require('../models/Kasus');
  const fetchFn = dependencies.fetchFn || fetch;
  const baseUrl = config.reportingServiceUrl.replace(/\/$/, '');
  const claim = await requestJson(
    `${baseUrl}/api/laporan/internal/email-reminders/claim`,
    { method: 'POST' },
    config.internalApiKey,
    fetchFn,
  );
  const reports = Array.isArray(claim.data) ? claim.data : [];
  const claimToken = claim.claim_token;
  if (!claimToken || reports.length === 0) return { sent: 0, skipped: 0 };

  const unresolvedIds = new Set(reports.map((report) => String(report._id)));
  const complete = async (ids, emailSent) => {
    if (ids.length === 0) return;
    await requestJson(
      `${baseUrl}/api/laporan/internal/email-reminders/complete`,
      {
        method: 'PATCH',
        body: JSON.stringify({ claim_token: claimToken, report_ids: ids, email_sent: emailSent }),
      },
      config.internalApiKey,
      fetchFn,
    );
    ids.forEach((id) => unresolvedIds.delete(String(id)));
  };

  try {
    // Status reporting bisa tertinggal sesaat dari Case Service. Cek sumber kasus
    // sebelum email supaya laporan yang sudah diregistrasi tidak ikut diingatkan.
    const allIds = [...unresolvedIds];
    const registeredIds = (await KasusModel.find({ laporan_id: { $in: allIds } }).distinct('laporan_id'))
      .map(String);
    await complete(registeredIds, false);

    const registeredSet = new Set(registeredIds);
    const toEmail = reports.filter((report) => !registeredSet.has(String(report._id)));
    if (toEmail.length === 0) return { sent: 0, skipped: registeredIds.length };

    const recipients = await UserModel.find({ role: 'petugas_uptd' }).distinct('email');
    if (recipients.length === 0) throw new Error('Belum ada akun petugas_uptd penerima reminder.');

    await transporter.sendMail({
      from: config.smtpFrom,
      bcc: recipients,
      subject: `[SIPEKA] ${toEmail.length} laporan baru belum ditindaklanjuti`,
      text: buildText(toEmail, config.dashboardUrl),
    });
    await complete(toEmail.map((report) => String(report._id)), true);
    return { sent: toEmail.length, skipped: registeredIds.length };
  } catch (error) {
    if (unresolvedIds.size > 0) {
      try {
        await requestJson(
          `${baseUrl}/api/laporan/internal/email-reminders/release`,
          {
            method: 'PATCH',
            body: JSON.stringify({ claim_token: claimToken, report_ids: [...unresolvedIds] }),
          },
          config.internalApiKey,
          fetchFn,
        );
      } catch (releaseError) {
        console.error('Gagal melepas klaim email reminder:', releaseError.message);
      }
    }
    throw error;
  }
}

function startEmailReminderWorker() {
  const config = loadConfig();
  if (!config.enabled) {
    console.warn('Email reminder worker nonaktif: konfigurasi SMTP/INTERNAL_API_KEY belum lengkap.');
    return null;
  }
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: { user: config.smtpUser, pass: config.smtpPass },
  });
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const result = await runOnce(config, transporter);
      if (result.sent > 0) console.log(`Email reminder terkirim untuk ${result.sent} laporan.`);
    } catch (error) {
      console.error('Email reminder worker gagal:', error.message);
    } finally {
      running = false;
    }
  };
  void tick();
  const timer = setInterval(tick, config.pollMinutes * 60 * 1000);
  timer.unref();
  console.log(`Email reminder worker aktif (interval ${config.pollMinutes} menit).`);
  return timer;
}

module.exports = { buildText, loadConfig, requestJson, runOnce, startEmailReminderWorker };
