const mongoose = require('mongoose');

const masterKekerasanSchema = new mongoose.Schema({
  nama_kategori: { type: String, required: true, unique: true },
  deskripsi:     { type: String, default: null },
  is_active:     { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('MasterKekerasan', masterKekerasanSchema);
