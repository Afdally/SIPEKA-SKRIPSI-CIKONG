const mongoose = require('mongoose');

const masterMetodeSchema = new mongoose.Schema({
  nama_metode: { type: String, required: true, unique: true },
  deskripsi:   { type: String, default: null },
  is_active:   { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('MasterMetode', masterMetodeSchema);
