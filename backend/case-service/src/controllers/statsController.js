const Kasus = require('../models/Kasus');

// GET /api/penanganan/stats/summary
exports.getSummary = async (req, res) => {
  try {
    const totalKasus = await Kasus.countDocuments();
    const pending = await Kasus.countDocuments({ status: { $in: ['registrasi', 'assessment', 'penanganan'] } });
    const selesai = await Kasus.countDocuments({ status: 'selesai' });

    // Agregasi berdasarkan metode penanganan
    const perMetodeRaw = await Kasus.aggregate([
      { $match: { metode_penanganan: { $ne: null } } },
      { $group: { _id: "$metode_penanganan", count: { $sum: 1 } } }
    ]);
    
    const perMetode = perMetodeRaw.map(item => ({
      metode: item._id,
      jumlah: item.count
    }));

    return res.json({
      total_kasus: totalKasus,
      dalam_proses: pending,
      selesai: selesai,
      per_metode: perMetode
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/penanganan/stats/kinerja
exports.getKinerja = async (req, res) => {
  try {
    const kinerjaRaw = await Kasus.aggregate([
      {
        $group: {
          _id: "$petugas_id",
          petugas_name: { $first: "$petugas_name" },
          total_ditangani: { $sum: 1 },
          selesai: {
            $sum: { $cond: [{ $eq: ["$status", "selesai"] }, 1, 0] }
          }
        }
      },
      { $sort: { total_ditangani: -1 } }
    ]);

    const kinerja = kinerjaRaw.map(k => ({
      petugas_id: k._id,
      nama: k.petugas_name,
      total_kasus: k.total_ditangani,
      kasus_selesai: k.selesai
    }));

    return res.json(kinerja);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/penanganan/export/csv
exports.exportCSV = async (req, res) => {
  try {
    const data = await Kasus.find().sort({ createdAt: -1 });
    
    // Header CSV
    let csv = 'Kode Laporan,Tanggal Registrasi,Status,Metode Penanganan,Nama Petugas,Tanggal Selesai\n';
    
    data.forEach(k => {
      const tglReg = new Date(k.tanggal_registrasi).toLocaleDateString('id-ID');
      const tglSel = k.tanggal_selesai ? new Date(k.tanggal_selesai).toLocaleDateString('id-ID') : '-';
      const metode = k.metode_penanganan || '-';
      csv += `${k.kode_laporan},${tglReg},${k.status},${metode},${k.petugas_name},${tglSel}\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment('export_kasus.csv');
    return res.send(csv);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};
