import React, { useState } from 'react';
import { analisisKronologi } from '../../services/nlpService';

// Nilai preferensi_layanan harus sama persis dengan yang disimpan di
// Laporan.js (report-service), karena petugas membacanya apa adanya.
const PREFERENSI_OPTIONS = [
  {
    value: 'Datang ke UPTD',
    icon: 'bi-building-fill',
    label: 'Saya akan datang ke UPTD',
    desc: 'Anda mendatangi kantor UPTD PPA sesuai jadwal yang disepakati petugas.',
  },
  {
    value: 'Petugas Mendatangi Korban',
    icon: 'bi-geo-alt-fill',
    label: 'Petugas datang ke lokasi saya',
    desc: 'Petugas akan mendatangi lokasi Anda secara rahasia sesuai kesepakatan.',
  },
];

// Layar pertama tab "Buat Laporan Baru". Tiga hal dikumpulkan di sini:
// (1) cerita bebas — jadi bahan auto-isi form berikutnya lewat nlp-service,
// (2) preferensi cara layanan — supaya pelapor tahu sejak awal bahwa laporan
//     ini akan ditindaklanjuti dengan pertemuan nyata,
// (3) pernyataan kebenaran laporan — dasar pertanggungjawaban, sekaligus
//     penyaring ringan laporan iseng tanpa mempersulit korban asli.
// Kalau AI-nya gagal/tidak tersedia, pelapor tetap bisa lanjut isi form manual.
export default function CeritaKejadianStep({ masterKekerasan, teleponAwal, onSelesai }) {
  const [kronologi, setKronologi] = useState('');
  const [telepon, setTelepon] = useState(teleponAwal || '');
  const [preferensi, setPreferensi] = useState('');
  const [setuju, setSetuju] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [simulasikanGagal, setSimulasikanGagal] = useState(false);

  const validasi = () => {
    if (kronologi.trim().length < 50) {
      return 'Ceritakan kejadiannya minimal 50 huruf supaya bisa ditindaklanjuti dengan baik.';
    }
    if (!telepon) {
      return 'No. telepon/WhatsApp wajib diisi untuk keperluan tindak lanjut petugas.';
    }
    if (!preferensi) {
      return 'Silakan pilih bagaimana Anda ingin ditemui petugas.';
    }
    if (!setuju) {
      return 'Mohon centang pernyataan kesediaan sebelum melanjutkan.';
    }
    return '';
  };

  const handleAnalisis = async (e) => {
    e.preventDefault();
    const pesanError = validasi();
    if (pesanError) { setError(pesanError); return; }

    setError('');
    setAnalyzing(true);
    try {
      const analisis = await analisisKronologi(kronologi, { masterKekerasan, forceFail: simulasikanGagal });
      onSelesai({ kronologi, telepon, preferensi, setuju, analisis, gagal: false });
    } catch (err) {
      // 422/429 dari backend: tampilkan alasannya, jangan lanjut ke form.
      const pesanServer = err.response?.data?.message;
      if (pesanServer) { setError(pesanServer); return; }
      onSelesai({ kronologi, telepon, preferensi, setuju, analisis: null, gagal: true });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div>
      <div className="cerita-step-header">
        <div className="cerita-step-icon"><i className="bi bi-chat-heart-fill"></i></div>
        <h4 className="fw-bold mb-1">Ceritakan Apa yang Terjadi</h4>
        <p className="small text-muted mb-0 mx-auto" style={{ maxWidth: '32rem' }}>
          Tulis dengan bahasa Anda sendiri. Sistem akan bantu melengkapi formulir — Anda tetap bisa memeriksanya sebelum dikirim.
        </p>
      </div>

      <form onSubmit={handleAnalisis} className="mt-4">
        <div className="mb-4">
          <label className="form-label-premium">Ceritakan Kejadiannya <span className="text-danger">*</span></label>
          <textarea
            className="form-control-premium"
            style={{ minHeight: '160px', resize: 'vertical' }}
            placeholder="Contoh: Saya berumur 15 tahun, sering dipukul oleh ayah tiri saya di rumah sejak beberapa bulan terakhir..."
            value={kronologi}
            onChange={(e) => setKronologi(e.target.value)}
            disabled={analyzing}
          />
          <div className="text-end mt-1">
            <span className="small text-muted">{kronologi.length} / 1000 huruf (minimal 50)</span>
          </div>
        </div>

        <div className="mb-4">
          <label className="form-label-premium">No. Telepon / WhatsApp <span className="text-danger">*</span></label>
          <input
            type="tel"
            className="form-control-premium"
            placeholder="Contoh: 08xxxxxxxxxx"
            value={telepon}
            onChange={(e) => setTelepon(e.target.value)}
            disabled={analyzing}
          />
          <p className="text-muted mt-1 fst-italic m-0" style={{ fontSize: '0.7rem' }}>*) Digunakan khusus oleh petugas untuk tindak lanjut</p>
        </div>

        {/* Preferensi layanan — ditanyakan di awal supaya pelapor paham sejak
            mula bahwa laporan ini berujung pada pertemuan dengan petugas. */}
        <div className="mb-4">
          <label className="form-label-premium">Bagaimana Anda Ingin Ditemui Petugas? <span className="text-danger">*</span></label>
          <div className="preferensi-options">
            {PREFERENSI_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`preferensi-card${preferensi === opt.value ? ' selected' : ''}`}
              >
                <input
                  type="radio"
                  name="preferensi_layanan"
                  value={opt.value}
                  checked={preferensi === opt.value}
                  onChange={(e) => setPreferensi(e.target.value)}
                  disabled={analyzing}
                />
                <i className={`bi ${opt.icon} preferensi-card-icon`}></i>
                <span className="preferensi-card-label">{opt.label}</span>
                <span className="preferensi-card-desc">{opt.desc}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Pernyataan kebenaran — dasar pertanggungjawaban laporan */}
        <div className="pernyataan-box mb-4">
          <label>
            <input
              type="checkbox"
              checked={setuju}
              onChange={(e) => setSetuju(e.target.checked)}
              disabled={analyzing}
            />
            <span>
              Saya menyatakan bahwa laporan ini <strong>benar dan dapat dipertanggungjawabkan</strong>,
              serta bersedia dihubungi dan ditemui petugas UPTD PPA untuk proses tindak lanjut.
            </span>
          </label>
        </div>

        {error && <div className="alert alert-danger rounded-3 small">{error}</div>}

        {analyzing ? (
          <div className="cerita-analyzing-box">
            <div className="cerita-analyzing-spinner"></div>
            <div>
              <div className="fw-bold small">Menganalisis cerita Anda...</div>
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>Mohon tunggu sebentar, prosesnya tidak akan lama.</div>
            </div>
          </div>
        ) : (
          <div className="d-flex">
            <button type="submit" className="btn btn-primary fw-bold py-2 px-4 rounded-3 flex-fill">
              Submit Cerita & Lanjutkan
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
