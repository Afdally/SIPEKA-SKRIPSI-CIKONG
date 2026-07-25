import React, { useState } from 'react';
import { analisisKronologi } from '../../services/nlpService';

// Layar pertama tab "Buat Laporan Baru": pelapor cerita dulu bebas, baru form
// detail (nama korban, usia, dll) di-isi otomatis dari cerita itu. Kalau AI-nya
// gagal/tidak tersedia, pelapor tetap bisa lanjut isi form manual seperti biasa —
// tidak ada yang sampai gagal lapor gara-gara fitur ini.
export default function CeritaKejadianStep({ masterKekerasan, teleponAwal, onSelesai, onSkip }) {
  const [kronologi, setKronologi] = useState('');
  const [telepon, setTelepon] = useState(teleponAwal || '');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [simulasikanGagal, setSimulasikanGagal] = useState(false);

  const handleAnalisis = async (e) => {
    e.preventDefault();
    if (kronologi.trim().length < 50) {
      setError('Ceritakan kejadiannya minimal 50 huruf supaya bisa dianalisis dengan baik.');
      return;
    }
    if (!telepon) {
      setError('No. telepon/WhatsApp wajib diisi untuk keperluan tindak lanjut petugas.');
      return;
    }
    setError('');
    setAnalyzing(true);
    try {
      const hasil = await analisisKronologi(kronologi, { masterKekerasan, forceFail: simulasikanGagal });
      onSelesai(kronologi, telepon, hasil, false);
    } catch (err) {
      onSelesai(kronologi, telepon, null, true);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSkip = () => {
    onSkip(kronologi, telepon);
  };

  return (
    <div>
      <div className="cerita-step-header">
        <div className="cerita-step-icon"><i className="bi bi-chat-heart-fill"></i></div>
        <h4 className="fw-bold mb-1">Ceritakan Apa yang Terjadi</h4>
        <p className="small text-muted mb-0 mx-auto" style={{ maxWidth: '32rem' }}>
          Tulis kejadiannya dengan bahasa Anda sendiri, sedetail yang Anda nyaman ceritakan. Sistem akan
          membantu melengkapi formulir secara otomatis — Anda tetap bisa memeriksa dan mengoreksi
          semuanya sebelum laporan benar-benar dikirim.
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
          <div className="d-flex flex-column flex-sm-row gap-2">
            <button type="submit" className="btn btn-primary fw-bold py-2 px-4 rounded-3 flex-fill">
              <i className="bi bi-stars me-2"></i> Analisis Otomatis dengan AI
            </button>
            <button type="button" className="btn btn-outline-secondary fw-bold py-2 px-4 rounded-3" onClick={handleSkip}>
              Lewati, isi manual
            </button>
          </div>
        )}
      </form>

      {/* Kontrol demo — HAPUS bagian ini kalau nlp-service asli sudah terpasang.
          Cuma buat mensimulasikan skenario AI gagal tanpa perlu backend beneran. */}
      <div className="cerita-demo-toggle">
        <label>
          <input
            type="checkbox"
            checked={simulasikanGagal}
            onChange={(e) => setSimulasikanGagal(e.target.checked)}
            disabled={analyzing}
          />
          Mode demo: simulasikan AI gagal / tidak tersedia
        </label>
      </div>
    </div>
  );
}
