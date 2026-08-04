const crypto = require('crypto');
const mongoose = require('mongoose');
const Laporan = require('../models/Laporan');

const DEFAULT_AFTER_MINUTES = 30;
const DEFAULT_LEASE_MINUTES = 15;

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function validIds(ids) {
  return Array.isArray(ids) && ids.length > 0 && ids.every((id) => mongoose.isValidObjectId(id));
}

exports.claim = async (req, res) => {
  try {
    const now = new Date();
    const ageMinutes = positiveInteger(process.env.EMAIL_REMINDER_AFTER_MINUTES, DEFAULT_AFTER_MINUTES);
    const leaseMinutes = positiveInteger(process.env.EMAIL_REMINDER_LEASE_MINUTES, DEFAULT_LEASE_MINUTES);
    const reportCutoff = new Date(now.getTime() - ageMinutes * 60 * 1000);
    const staleClaimCutoff = new Date(now.getTime() - leaseMinutes * 60 * 1000);
    const claimToken = crypto.randomUUID();

    // Satu update atomik mengubah seluruh kandidat menjadi milik token ini.
    // Worker lain hanya dapat mengambil status pending atau lease yang sudah basi.
    await Laporan.updateMany(
      {
        status: 'menunggu_registrasi',
        email_reminder_sent_at: null,
        createdAt: { $lte: reportCutoff },
        $or: [
          { email_reminder_status: { $in: ['pending', null] } },
          {
            email_reminder_status: 'claimed',
            email_reminder_claimed_at: { $lte: staleClaimCutoff },
          },
        ],
      },
      {
        $set: {
          email_reminder_status: 'claimed',
          email_reminder_claimed_at: now,
          email_reminder_claim_token: claimToken,
        },
      },
    );

    const reports = await Laporan.find({ email_reminder_claim_token: claimToken })
      .select('_id kode_laporan createdAt')
      .sort({ createdAt: 1 })
      .lean();

    res.json({ claim_token: reports.length > 0 ? claimToken : null, data: reports });
  } catch (error) {
    console.error('Gagal mengklaim kandidat email reminder:', error);
    res.status(500).json({ message: 'Gagal mengklaim kandidat email reminder.' });
  }
};

exports.complete = async (req, res) => {
  try {
    const {
      claim_token: claimToken,
      report_ids: reportIds,
      email_sent: emailSent = true,
    } = req.body;
    if (!claimToken || !validIds(reportIds)) {
      return res.status(400).json({ message: 'claim_token dan report_ids valid wajib diisi.' });
    }

    const sentAt = emailSent ? new Date() : null;
    const update = {
      $set: { email_reminder_status: 'sent' },
      $unset: { email_reminder_claimed_at: '', email_reminder_claim_token: '' },
    };
    if (emailSent) update.$set.email_reminder_sent_at = sentAt;
    const result = await Laporan.updateMany(
      {
        _id: { $in: reportIds },
        email_reminder_status: 'claimed',
        email_reminder_claim_token: claimToken,
      },
      update,
    );
    res.json({ updated: result.modifiedCount, sent_at: sentAt });
  } catch (error) {
    console.error('Gagal menyelesaikan email reminder:', error);
    res.status(500).json({ message: 'Gagal menyelesaikan email reminder.' });
  }
};

exports.release = async (req, res) => {
  try {
    const { claim_token: claimToken } = req.body;
    const reportIds = req.body.report_ids;
    if (!claimToken || (reportIds !== undefined && !validIds(reportIds))) {
      return res.status(400).json({ message: 'claim_token wajib diisi dan report_ids harus valid.' });
    }

    const filter = {
      email_reminder_status: 'claimed',
      email_reminder_claim_token: claimToken,
    };
    if (reportIds) filter._id = { $in: reportIds };

    const result = await Laporan.updateMany(
      filter,
      {
        $set: { email_reminder_status: 'pending' },
        $unset: { email_reminder_claimed_at: '', email_reminder_claim_token: '' },
      },
    );
    res.json({ released: result.modifiedCount });
  } catch (error) {
    console.error('Gagal melepas klaim email reminder:', error);
    res.status(500).json({ message: 'Gagal melepas klaim email reminder.' });
  }
};
