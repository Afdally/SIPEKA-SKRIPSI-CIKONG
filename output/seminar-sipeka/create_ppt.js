const pptxgen = require('pptxgenjs');

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'Muh. Afdal Ziqri Ramadhan';
pptx.subject = 'Seminar Hasil SIPEKA';
pptx.title = 'SIPEKA - Sistem Pelaporan dan Manajemen Kasus';
pptx.company = 'Universitas Halu Oleo';
pptx.lang = 'id-ID';
pptx.theme = {
  headFontFace: 'Cambria',
  bodyFontFace: 'Arial',
  lang: 'id-ID'
};

const C = {
  navy: '12304A',
  navy2: '1B4965',
  teal: '0E7490',
  aqua: 'D9F0F2',
  mint: 'BFE8E1',
  coral: 'E76F51',
  gold: 'F2C14E',
  ink: '17324D',
  muted: '587185',
  white: 'FFFFFF',
  pale: 'F5F9FB',
  line: 'DCE8EE',
  redPale: 'FDE9E4',
  greenPale: 'E7F6F0'
};

const W = 13.333;
const H = 7.5;

function addText(slide, text, x, y, w, h, opts = {}) {
  slide.addText(text, {
    x, y, w, h, isTextBox: true, margin: 0,
    fontFace: opts.fontFace || 'Arial',
    fontSize: opts.fontSize || 16,
    color: opts.color || C.ink,
    bold: opts.bold || false,
    italic: opts.italic || false,
    align: opts.align || 'left',
    valign: opts.valign || 'mid',
    breakLine: false,
    fit: 'shrink',
    paraSpaceAfterPt: opts.paraSpaceAfterPt || 0,
    bullet: opts.bullet,
    transparency: opts.transparency,
    ...opts
  });
}

function rect(slide, x, y, w, h, fill, radius = false, line = fill) {
  slide.addShape(radius ? pptx.ShapeType.roundRect : pptx.ShapeType.rect, {
    x, y, w, h, rectRadius: radius ? 0.08 : 0,
    fill: { color: fill }, line: { color: line, transparency: line === fill ? 100 : 0, width: 1 }
  });
}

function line(slide, x1, y1, x2, y2, color = C.line, width = 1.5, endArrowType) {
  slide.addShape(pptx.ShapeType.line, {
    x: x1, y: y1, w: x2 - x1, h: y2 - y1,
    line: { color, width, endArrowType }
  });
}

function title(slide, t, kicker) {
  addText(slide, kicker || 'SEMINAR HASIL', 0.65, 0.34, 5.0, 0.22, { fontSize: 10, bold: true, color: C.teal, charSpacing: 1.5 });
  addText(slide, t, 0.65, 0.62, 12.0, 0.55, { fontFace: 'Cambria', fontSize: 27, bold: true, color: C.navy });
  line(slide, 0.65, 1.35, 12.7, 1.35, C.aqua, 2);
}

function footer(slide, n, dark = false) {
  addText(slide, `SIPEKA • Seminar Hasil`, 0.65, 7.12, 3.0, 0.18, { fontSize: 8.5, color: dark ? 'B8D5DF' : C.muted });
  addText(slide, String(n).padStart(2, '0'), 12.25, 7.1, 0.45, 0.18, { fontSize: 9, bold: true, color: dark ? C.white : C.navy, align: 'right' });
}

function bullets(slide, items, x, y, w, fs = 16, color = C.ink, gap = 0.39) {
  items.forEach((it, i) => addText(slide, it, x, y + i * gap, w, 0.28, { fontSize: fs, color, bullet: { type: 'ul' } }));
}

function pill(slide, label, x, y, w, fill, color = C.navy) {
  rect(slide, x, y, w, 0.34, fill, true, fill);
  addText(slide, label, x + 0.08, y + 0.03, w - 0.16, 0.25, { fontSize: 10, bold: true, color, align: 'center' });
}

function stat(slide, value, label, x, y, w, fill, valueColor = C.navy) {
  rect(slide, x, y, w, 1.1, fill, true, fill);
  addText(slide, value, x + 0.12, y + 0.15, w - 0.24, 0.46, { fontFace: 'Cambria', fontSize: 27, bold: true, color: valueColor, align: 'center' });
  addText(slide, label, x + 0.12, y + 0.70, w - 0.24, 0.25, { fontSize: 10, color: C.muted, align: 'center' });
}

function card(slide, heading, body, x, y, w, h, fill = C.white, accent = C.teal) {
  rect(slide, x, y, w, h, fill, true, C.line);
  slide.addShape(pptx.ShapeType.ellipse, { x: x + 0.18, y: y + 0.2, w: 0.28, h: 0.28, fill: { color: accent }, line: { color: accent, transparency: 100 } });
  addText(slide, heading, x + 0.56, y + 0.16, w - 0.72, 0.3, { fontSize: 15, bold: true, color: C.navy });
  addText(slide, body, x + 0.2, y + 0.58, w - 0.4, h - 0.72, { fontSize: 12.5, color: C.muted, valign: 'top', breakLine: false });
}

function flowNode(slide, label, x, y, w, fill, color = C.navy) {
  rect(slide, x, y, w, 0.66, fill, true, fill);
  addText(slide, label, x + 0.08, y + 0.12, w - 0.16, 0.4, { fontSize: 12, bold: true, color, align: 'center' });
}

function note(slide, text) { slide.addNotes(text); }

// 1
{
  const s = pptx.addSlide(); s.background = { color: C.navy };
  addText(s, 'SEMINAR HASIL', 0.78, 0.7, 4, 0.3, { fontSize: 12, bold: true, color: C.mint, charSpacing: 2 });
  addText(s, 'SIPEKA', 0.75, 1.35, 5.5, 0.75, { fontFace: 'Cambria', fontSize: 42, bold: true, color: C.white });
  addText(s, 'Sistem Pelaporan dan Manajemen Kasus Kekerasan terhadap Perempuan dan Anak Berbasis Web', 0.8, 2.2, 6.3, 1.1, { fontFace: 'Cambria', fontSize: 24, bold: true, color: C.white, valign: 'top' });
  addText(s, 'Menggunakan Arsitektur Microservices • Studi Kasus: DPPPA Kota Kendari', 0.82, 3.55, 5.8, 0.38, { fontSize: 14, color: 'C7E7ED' });
  rect(s, 8.2, 1.0, 3.9, 4.85, C.navy2, true, C.navy2);
  flowNode(s, 'Pelapor', 8.7, 1.55, 2.9, C.aqua);
  line(s, 10.15, 2.25, 10.15, 2.7, C.mint, 2, 'triangle');
  flowNode(s, 'NLP + Formulir', 8.7, 2.78, 2.9, C.mint);
  line(s, 10.15, 3.45, 10.15, 3.9, C.mint, 2, 'triangle');
  flowNode(s, 'Report Service', 8.7, 3.98, 2.9, C.white);
  line(s, 10.15, 4.65, 10.15, 5.08, C.gold, 2, 'triangle');
  flowNode(s, 'RabbitMQ → Case Service', 8.7, 5.15, 2.9, C.gold, C.navy);
  addText(s, 'Muh. Afdal Ziqri Ramadhan  •  E1E122065', 0.8, 6.3, 6.3, 0.3, { fontSize: 13, color: 'C7E7ED' });
  addText(s, 'Jurusan Informatika • Fakultas Teknik • Universitas Halu Oleo • 2026', 0.8, 6.67, 7.0, 0.25, { fontSize: 10.5, color: '9BCAD3' });
  footer(s, 1, true); note(s, 'Buka presentasi dengan menjelaskan bahwa penelitian ini membangun SIPEKA untuk mengintegrasikan pelaporan masyarakat dan penanganan kasus di DPPPA Kota Kendari.');
}

// 2
{
  const s = pptx.addSlide(); s.background = { color: C.pale }; title(s, 'Masalah utama berada pada proses yang terpisah', 'KONTEKS PENELITIAN');
  card(s, 'Pencatatan berulang', 'Laporan dicatat pada buku registrasi dan Microsoft Excel, kemudian diinput ulang ke sistem lain.', 0.75, 1.85, 3.75, 2.0, C.white, C.coral);
  card(s, 'Sulit dipantau', 'Pelapor belum memiliki sarana untuk memantau perkembangan laporan secara mandiri.', 4.8, 1.85, 3.75, 2.0, C.white, C.gold);
  card(s, 'Koordinasi lambat', 'Pelaporan, assessment, intervensi, dan penyelesaian kasus belum berada dalam alur digital yang sama.', 8.85, 1.85, 3.75, 2.0, C.white, C.teal);
  addText(s, 'Dampak proses manual', 0.78, 4.45, 3.0, 0.3, { fontSize: 16, bold: true, color: C.navy });
  bullets(s, ['Pekerjaan administrasi bertambah', 'Risiko data tidak sinkron', 'Status laporan tidak transparan'], 0.92, 4.9, 6.2, 15, C.ink, 0.43);
  rect(s, 8.2, 4.55, 4.2, 1.55, C.redPale, true, C.redPale);
  addText(s, 'Kebutuhan sistem', 8.48, 4.83, 3.6, 0.28, { fontSize: 16, bold: true, color: C.coral, align: 'center' });
  addText(s, 'Satu alur terintegrasi dari laporan sampai penyelesaian kasus.', 8.55, 5.25, 3.45, 0.52, { fontSize: 14, bold: true, color: C.ink, align: 'center' });
  footer(s, 2); note(s, 'Tekankan permasalahan praktis yang ditemukan dari proses DPPPA: pencatatan ganda, sulitnya pemantauan, dan koordinasi yang belum terintegrasi.');
}

// 3
{
  const s = pptx.addSlide(); s.background = { color: C.white }; title(s, 'Penelitian menjawab tiga kebutuhan utama', 'TUJUAN');
  const goals = [
    ['01', 'Bangun sistem web', 'Mengintegrasikan pelaporan masyarakat dan manajemen kasus dalam satu sistem.'],
    ['02', 'Pisahkan layanan', 'Menerapkan Report Service dan Case Service sesuai tanggung jawab bisnis.'],
    ['03', 'Uji hasilnya', 'Mengukur performa, ketahanan komunikasi layanan, dan penerimaan pengguna.']
  ];
  goals.forEach((g, i) => {
    const x = 0.85 + i * 4.12;
    rect(s, x, 2.0, 3.52, 3.35, i === 1 ? C.aqua : C.pale, true, i === 1 ? C.aqua : C.line);
    addText(s, g[0], x + 0.25, 2.28, 0.7, 0.5, { fontFace: 'Cambria', fontSize: 29, bold: true, color: C.teal });
    addText(s, g[1], x + 0.25, 3.0, 2.9, 0.45, { fontFace: 'Cambria', fontSize: 20, bold: true, color: C.navy });
    addText(s, g[2], x + 0.25, 3.75, 2.95, 0.88, { fontSize: 14, color: C.muted, valign: 'top' });
  });
  footer(s, 3); note(s, 'Jelaskan bahwa penelitian ini memiliki tiga fokus: membangun sistem, menerapkan microservices, dan melakukan evaluasi berbasis pengujian.');
}

// 4
{
  const s = pptx.addSlide(); s.background = { color: C.pale }; title(s, 'Alur sistem berubah dari pencatatan manual menjadi alur digital', 'BAB IV • ANALISIS SISTEM');
  addText(s, 'Sistem berjalan', 0.85, 1.72, 2.0, 0.3, { fontSize: 17, bold: true, color: C.coral });
  const old = ['Laporan masuk', 'Buku registrasi', 'Microsoft Excel', 'Input ulang', 'Simfoni PPA'];
  old.forEach((v, i) => { flowNode(s, v, 0.85 + (i % 3) * 2.0, 2.25 + Math.floor(i / 3) * 0.95, 1.6, i === 3 ? C.redPale : C.white, i === 3 ? C.coral : C.navy); if (i < old.length - 1) line(s, 2.45 + (i % 3) * 2.0, 2.58 + Math.floor(i / 3) * 0.95, 2.75 + (i % 3) * 2.0, 2.58 + Math.floor(i / 3) * 0.95, C.coral, 1.5, 'triangle'); });
  rect(s, 0.85, 4.35, 5.6, 1.0, C.redPale, true, C.redPale);
  addText(s, 'Masalah: input berulang, data tidak sinkron, status sulit dipantau.', 1.1, 4.66, 5.1, 0.35, { fontSize: 14, bold: true, color: C.coral, align: 'center' });
  addText(s, 'Sistem yang diusulkan', 7.0, 1.72, 2.6, 0.3, { fontSize: 17, bold: true, color: C.teal });
  const neu = ['Pelaporan', 'NLP + verifikasi', 'Registrasi', 'Assessment', 'Intervensi', 'Monitoring', 'Terminasi'];
  neu.forEach((v, i) => { const x = 7.0 + (i % 4) * 1.48; const y = 2.25 + Math.floor(i / 4) * 1.0; flowNode(s, v, x, y, 1.2, i === 1 ? C.mint : C.aqua); if (i < neu.length - 1) line(s, x + 1.2, y + 0.33, x + 1.4, y + 0.33, C.teal, 1.4, 'triangle'); });
  rect(s, 7.0, 4.35, 5.5, 1.0, C.greenPale, true, C.greenPale);
  addText(s, 'Solusi: satu alur terintegrasi dan status dapat dipantau.', 7.25, 4.66, 5.0, 0.35, { fontSize: 14, bold: true, color: C.teal, align: 'center' });
  footer(s, 4); note(s, 'Bandingkan secara singkat alur lama dengan alur baru. Fokuskan narasi pada pekerjaan berulang dan manfaat alur digital yang terintegrasi.');
}

// 5
{
  const s = pptx.addSlide(); s.background = { color: C.white }; title(s, 'Satu alur menghubungkan pelapor, petugas, dan layanan backend', 'BAB IV • ALUR SISTEM');
  const steps = ['Cerita pelapor', 'NLP mengusulkan data', 'Pelapor verifikasi', 'Laporan dikirim', 'Petugas menangani', 'Status dipantau'];
  steps.forEach((v, i) => { const x = 0.8 + (i % 3) * 4.1; const y = 1.9 + Math.floor(i / 3) * 1.65; rect(s, x, y, 3.25, 0.84, i === 1 ? C.mint : C.aqua, true, i === 1 ? C.mint : C.aqua); addText(s, `${String(i + 1).padStart(2, '0')}  ${v}`, x + 0.18, y + 0.18, 2.9, 0.43, { fontSize: 16, bold: true, color: C.navy }); if (i < steps.length - 1) { const nx = i % 3 === 2 ? x + 1.62 : x + 3.25; const ny = i % 3 === 2 ? y + 0.84 : y + 0.42; const ex = i % 3 === 2 ? x + 1.62 : x + 4.0; const ey = i % 3 === 2 ? y + 1.35 : y + 0.42; line(s, nx, ny, ex, ey, C.teal, 1.6, 'triangle'); } });
  rect(s, 1.2, 5.55, 10.9, 0.72, C.pale, true, C.line);
  addText(s, 'Hasil akhir: laporan tercatat, kasus dikelola, dan pelapor memperoleh informasi status.', 1.45, 5.76, 10.4, 0.28, { fontSize: 15, bold: true, color: C.navy, align: 'center' });
  footer(s, 5); note(s, 'Jelaskan alur operasional dari sudut pandang pengguna. NLP ditempatkan sebelum submit agar pelapor tetap dapat mengoreksi hasil analisis.');
}

// 6
{
  const s = pptx.addSlide(); s.background = { color: C.pale }; title(s, 'Microservices memisahkan tanggung jawab berdasarkan domain bisnis', 'BAB IV • ARSITEKTUR');
  rect(s, 0.8, 2.0, 2.4, 3.8, C.navy, true, C.navy);
  addText(s, 'FRONTEND', 1.15, 2.35, 1.7, 0.3, { fontSize: 15, bold: true, color: C.mint, align: 'center' });
  addText(s, 'React.js', 1.1, 3.0, 1.8, 0.4, { fontFace: 'Cambria', fontSize: 22, bold: true, color: C.white, align: 'center' });
  addText(s, 'Pelapor • Petugas • Super Admin', 1.0, 3.75, 2.0, 0.55, { fontSize: 12, color: 'C7E7ED', align: 'center' });
  line(s, 3.2, 3.9, 4.25, 3.9, C.teal, 2, 'triangle');
  rect(s, 4.4, 2.0, 1.85, 3.8, C.aqua, true, C.aqua);
  addText(s, 'API\nGATEWAY', 4.7, 3.0, 1.25, 0.75, { fontFace: 'Cambria', fontSize: 20, bold: true, color: C.navy, align: 'center' });
  line(s, 6.25, 3.0, 7.1, 2.65, C.teal, 1.7, 'triangle'); line(s, 6.25, 4.85, 7.1, 5.15, C.teal, 1.7, 'triangle');
  card(s, 'Report Service', 'Laporan, status, bukti, dan analisis NLP.\nDatabase: report_db', 7.25, 1.75, 2.45, 1.7, C.white, C.teal);
  card(s, 'Case Service', 'Registrasi, assessment, intervensi, dan terminasi.\nDatabase: case_db', 7.25, 4.35, 2.45, 1.7, C.white, C.coral);
  rect(s, 10.2, 2.75, 2.25, 1.2, C.gold, true, C.gold); addText(s, 'RabbitMQ', 10.55, 3.02, 1.55, 0.3, { fontSize: 18, bold: true, color: C.navy, align: 'center' }); addText(s, 'message broker', 10.55, 3.42, 1.55, 0.25, { fontSize: 11, color: C.navy, align: 'center' });
  line(s, 9.7, 2.6, 10.2, 3.05, C.gold, 1.5, 'triangle'); line(s, 9.7, 5.0, 10.2, 3.65, C.gold, 1.5, 'triangle');
  footer(s, 6); note(s, 'Jelaskan bahwa pemisahan dilakukan berdasarkan domain bisnis: Report Service menangani laporan, sedangkan Case Service menangani proses kasus.');
}

// 7
{
  const s = pptx.addSlide(); s.background = { color: C.white }; title(s, 'NLP membantu pelapor mengisi formulir tanpa kehilangan kontrol', 'REVISI DOSEN • NLP');
  const x1 = 0.9, y = 2.0;
  const nodes = [
    ['Cerita bebas', C.aqua], ['Model bahasa', C.mint], ['Validasi aturan', C.gold], ['Usulan formulir', C.aqua], ['Koreksi pelapor', C.greenPale]
  ];
  nodes.forEach((n, i) => { const x = x1 + i * 2.45; flowNode(s, n[0], x, y, 1.8, n[1]); if (i < nodes.length - 1) line(s, x + 1.8, y + 0.33, x + 2.35, y + 0.33, C.teal, 1.6, 'triangle'); });
  card(s, 'Informasi yang dapat diusulkan', 'Nama korban • usia • jenis kelamin • hubungan pelapor • jenis kekerasan • lokasi • waktu kejadian', 1.0, 3.35, 5.25, 1.55, C.pale, C.teal);
  card(s, 'Prinsip keamanan data', 'Hasil NLP hanya usulan. Pelapor memeriksa dan memperbaiki data sebelum menjadi laporan resmi.', 6.75, 3.35, 5.25, 1.55, C.pale, C.coral);
  rect(s, 2.0, 5.65, 9.2, 0.68, C.navy, true, C.navy); addText(s, 'Cerita → Analisis → Validasi → Verifikasi → Submit', 2.2, 5.85, 8.8, 0.28, { fontSize: 17, bold: true, color: C.white, align: 'center' });
  footer(s, 7); note(s, 'Tekankan bahwa NLP tidak mengambil keputusan dan tidak langsung memasukkan data sebagai data resmi. Pelapor tetap melakukan verifikasi.');
}

// 8
{
  const s = pptx.addSlide(); s.background = { color: C.pale }; title(s, 'RabbitMQ membuat perubahan status tidak bergantung pada request langsung', 'REVISI DOSEN • MESSAGE BROKER');
  flowNode(s, 'Case Service\nproducer', 0.95, 2.35, 2.45, C.aqua);
  line(s, 3.4, 2.68, 4.35, 2.68, C.teal, 2, 'triangle');
  flowNode(s, 'Queue\nkasus_status_updates', 4.5, 2.35, 3.0, C.gold);
  line(s, 7.5, 2.68, 8.45, 2.68, C.teal, 2, 'triangle');
  flowNode(s, 'Report Service\nconsumer', 8.6, 2.35, 2.65, C.mint);
  addText(s, 'Event perubahan status', 4.65, 1.75, 2.7, 0.25, { fontSize: 12, bold: true, color: C.muted, align: 'center' });
  const statuses = [['Registrasi', 'proses_assessment'], ['Intervensi', 'dalam_penanganan'], ['Terminasi', 'selesai']];
  statuses.forEach((v, i) => { const x = 1.2 + i * 3.95; rect(s, x, 4.25, 3.2, 1.0, C.white, true, C.line); addText(s, v[0], x + 0.2, 4.47, 1.05, 0.25, { fontSize: 14, bold: true, color: C.navy }); addText(s, v[1], x + 1.15, 4.47, 1.8, 0.25, { fontSize: 11.5, color: C.teal, align: 'right' }); });
  addText(s, 'Komunikasi asynchronous • queue durable • pesan persistent', 2.15, 5.85, 9.1, 0.3, { fontSize: 15, bold: true, color: C.navy, align: 'center' });
  footer(s, 8); note(s, 'Case Service menyimpan perubahan kasus lalu mengirim event ke RabbitMQ. Report Service mengambil pesan dan memperbarui status laporan.');
}

// 9
{
  const s = pptx.addSlide(); s.background = { color: C.white }; title(s, 'Implementasi sistem menerjemahkan rancangan menjadi tiga pengalaman pengguna', 'BAB V • IMPLEMENTASI');
  card(s, 'Pelapor', 'Form cerita kejadian, bantuan NLP, pengiriman laporan, upload bukti, dan cek status.', 0.85, 1.9, 3.75, 2.1, C.pale, C.teal);
  card(s, 'Admin/Petugas', 'Dashboard laporan, registrasi, assessment, rencana intervensi, monitoring, dan terminasi.', 4.8, 1.9, 3.75, 2.1, C.pale, C.coral);
  card(s, 'Super Admin', 'Dashboard statistik, manajemen petugas, data master, pusat kendali, dan ekspor data.', 8.75, 1.9, 3.75, 2.1, C.pale, C.gold);
  addText(s, 'Stack implementasi', 0.9, 4.62, 2.2, 0.28, { fontSize: 16, bold: true, color: C.navy });
  ['React.js', 'Node.js + Express', 'MongoDB', 'Docker + Nginx'].forEach((v, i) => pill(s, v, 0.9 + i * 3.05, 5.15, 2.55, i % 2 === 0 ? C.aqua : C.mint));
  footer(s, 9); note(s, 'Tampilkan screenshot aplikasi pada slide ini jika tersedia. Narasi fokus pada pembagian pengalaman pengguna dan teknologi inti yang digunakan.');
}

// 10
{
  const s = pptx.addSlide(); s.background = { color: C.pale }; title(s, 'Pengujian dirancang untuk mengukur kecepatan, ketahanan, dan penerimaan', 'BAB V • PENGUJIAN');
  const tests = [
    ['LOAD TESTING', '100 • 500 • 1.000 pengguna virtual', 'Response time • throughput • error rate', C.teal],
    ['FAULT INJECTION', 'Report Service dihentikan sementara', 'Amati queue sebelum dan sesudah recovery', C.coral],
    ['UAT', '25 pelapor • 3 admin', 'Skala Likert dan indeks penerimaan', C.gold]
  ];
  tests.forEach((t, i) => { const x = 0.85 + i * 4.12; rect(s, x, 2.0, 3.55, 3.35, C.white, true, C.line); addText(s, t[0], x + 0.25, 2.35, 3.0, 0.3, { fontSize: 13, bold: true, color: t[3], charSpacing: 1 }); addText(s, t[1], x + 0.25, 3.0, 3.0, 0.55, { fontFace: 'Cambria', fontSize: 21, bold: true, color: C.navy, valign: 'top' }); addText(s, t[2], x + 0.25, 4.15, 2.95, 0.52, { fontSize: 13, color: C.muted, valign: 'top' }); });
  footer(s, 10); note(s, 'Jelaskan bahwa setiap jenis pengujian menjawab pertanyaan berbeda: performa, perilaku saat service terganggu, dan penerimaan pengguna.');
}

// 11
{
  const s = pptx.addSlide(); s.background = { color: C.white }; title(s, 'Microservices unggul pada sebagian besar endpoint yang diuji', 'HASIL • LOAD TESTING');
  addText(s, 'Average response time pada 1.000 pengguna virtual (ms)', 0.85, 1.62, 5.4, 0.25, { fontSize: 14, bold: true, color: C.navy });
  s.addChart(pptx.ChartType.bar, [
    { name: 'Microservices', labels: ['Login', 'Submit Laporan', 'Get Penanganan', 'Master Kekerasan'], values: [47813.0, 7.9, 903.9, 6.8] },
    { name: 'Monolitik', labels: ['Login', 'Submit Laporan', 'Get Penanganan', 'Master Kekerasan'], values: [48554.6, 3392.2, 344.6, 255.3] }
  ], {
    x: 0.85, y: 2.0, w: 7.1, h: 3.8, catAxisLabelFontFace: 'Arial', catAxisLabelFontSize: 11,
    valAxisLabelFontFace: 'Arial', valAxisLabelFontSize: 10, chartColors: [C.teal, C.coral],
    showLegend: true, legendPos: 'b', showTitle: false, showValue: false,
    valGridLine: { color: C.line, width: 1 }, catGridLine: { style: 'none' },
    showCatName: false, showValAxisTitle: false, showCatAxisTitle: false,
    valAxisMinVal: 0, showBorder: false
  });
  stat(s, '0%', 'error rate microservices', 8.55, 2.15, 3.55, C.greenPale, C.teal);
  stat(s, '0,10%', 'error rate monolitik pada Submit Laporan', 8.55, 3.55, 3.55, C.redPale, C.coral);
  addText(s, 'Pola hasil', 8.55, 5.1, 1.5, 0.25, { fontSize: 14, bold: true, color: C.navy });
  addText(s, 'Microservices lebih cepat pada Login, Submit Laporan, dan Master Kekerasan. Monolitik lebih cepat pada Get Penanganan.', 8.55, 5.45, 3.7, 0.7, { fontSize: 13, color: C.muted, valign: 'top' });
  footer(s, 11); note(s, 'Jelaskan hasil secara deskriptif dan jangan menyimpulkan bahwa microservices selalu lebih cepat. Pada Get Penanganan, monolitik justru lebih cepat.');
}

// 12
{
  const s = pptx.addSlide(); s.background = { color: C.pale }; title(s, 'Pada beban tertinggi, microservices tetap memproses seluruh permintaan', 'HASIL • 1.000 PENGGUNA VIRTUAL');
  stat(s, '1.000', 'pengguna virtual', 0.95, 1.9, 2.45, C.aqua);
  stat(s, '0%', 'error rate microservices', 3.7, 1.9, 2.65, C.greenPale, C.teal);
  stat(s, '0,10%', 'error rate monolitik', 6.65, 1.9, 2.65, C.redPale, C.coral);
  stat(s, '4', 'endpoint inti diuji', 9.6, 1.9, 2.45, C.mint);
  rect(s, 0.95, 3.55, 5.4, 1.7, C.white, true, C.line);
  addText(s, 'Lebih cepat pada microservices', 1.25, 3.85, 4.6, 0.3, { fontSize: 17, bold: true, color: C.teal });
  bullets(s, ['Login: 1,53% lebih rendah', 'Submit Laporan: 99,77% lebih rendah', 'Master Kekerasan: 97,36% lebih rendah'], 1.3, 4.32, 4.4, 13, C.ink, 0.34);
  rect(s, 6.75, 3.55, 5.4, 1.7, C.white, true, C.line);
  addText(s, 'Catatan interpretasi', 7.05, 3.85, 4.6, 0.3, { fontSize: 17, bold: true, color: C.coral });
  addText(s, 'Monolitik lebih cepat pada Get Penanganan. Hasil berlaku pada konfigurasi dan skenario pengujian yang digunakan.', 7.05, 4.32, 4.55, 0.62, { fontSize: 13, color: C.muted, valign: 'top' });
  footer(s, 12); note(s, 'Gunakan slide ini sebagai interpretasi utama hasil load testing. Sertakan batasan bahwa setiap skenario dijalankan satu kali dan total sumber daya kedua arsitektur tidak sepenuhnya sama.');
}

// 13
{
  const s = pptx.addSlide(); s.background = { color: C.white }; title(s, 'Fault injection menunjukkan pesan dapat menunggu saat consumer berhenti', 'HASIL • RABBITMQ');
  flowNode(s, 'Report Service OFF', 1.1, 2.0, 2.3, C.redPale, C.coral);
  line(s, 3.4, 2.33, 4.55, 2.33, C.coral, 2, 'triangle');
  flowNode(s, 'RabbitMQ Queue', 4.7, 2.0, 2.7, C.gold);
  line(s, 7.4, 2.33, 8.55, 2.33, C.teal, 2, 'triangle');
  flowNode(s, 'Report Service ON', 8.7, 2.0, 2.5, C.greenPale, C.teal);
  const rows = [['OFF setelah dua pengiriman', '2', '0', '2'], ['ON kembali', '0', '0', '0']];
  const cols = [3.2, 1.05, 1.05, 1.05]; const startX = 2.0; const top = 3.55;
  ['Kondisi', 'Ready', 'Unacked', 'Total'].forEach((h, i) => { rect(s, startX + cols.slice(0, i).reduce((a,b)=>a+b,0), top, cols[i], 0.5, C.navy, false, C.navy); addText(s, h, startX + cols.slice(0, i).reduce((a,b)=>a+b,0) + 0.08, top + 0.12, cols[i] - 0.16, 0.25, { fontSize: 12, bold: true, color: C.white, align: i === 0 ? 'left' : 'center' }); });
  rows.forEach((r, ri) => r.forEach((v, i) => { const x = startX + cols.slice(0, i).reduce((a,b)=>a+b,0); rect(s, x, top + 0.5 + ri * 0.55, cols[i], 0.55, ri === 0 ? C.redPale : C.greenPale, false, C.line); addText(s, v, x + 0.08, top + 0.64 + ri * 0.55, cols[i] - 0.16, 0.25, { fontSize: 12, color: C.ink, align: i === 0 ? 'left' : 'center' }); }));
  addText(s, 'Dua pesan tertampung saat Report Service berhenti dan queue kembali kosong setelah service aktif.', 1.1, 5.65, 11.0, 0.35, { fontSize: 16, bold: true, color: C.navy, align: 'center' });
  footer(s, 13); note(s, 'Jelaskan bahwa pengujian menghentikan Report Service, bukan RabbitMQ. Dua pesan terlihat pada Ready dan menjadi nol setelah consumer kembali aktif.');
}

// 14
{
  const s = pptx.addSlide(); s.background = { color: C.pale }; title(s, 'Pengguna menilai sistem dapat digunakan dan diterima', 'HASIL • USER ACCEPTANCE TESTING');
  stat(s, '80,87%', 'indeks UAT pelapor • 25 responden', 1.0, 2.0, 4.8, C.aqua);
  stat(s, '88,21%', 'indeks UAT admin • 3 responden', 7.55, 2.0, 4.8, C.mint);
  addText(s, 'Aspek yang dinilai', 1.0, 4.0, 2.4, 0.28, { fontSize: 16, bold: true, color: C.navy });
  ['Fungsionalitas', 'Kemudahan penggunaan', 'Keandalan', 'Kelayakan implementasi'].forEach((v, i) => pill(s, v, 1.0 + (i % 2) * 3.2, 4.55 + Math.floor(i / 2) * 0.65, 2.85, i % 2 === 0 ? C.white : C.aqua));
  rect(s, 7.55, 4.0, 4.8, 1.7, C.white, true, C.line);
  addText(s, 'Catatan NLP', 7.85, 4.28, 1.8, 0.3, { fontSize: 16, bold: true, color: C.teal });
  addText(s, 'Pernyataan pengisian otomatis memperoleh nilai relatif lebih rendah, sehingga masih perlu evaluasi lanjutan.', 7.85, 4.72, 4.15, 0.6, { fontSize: 13, color: C.muted, valign: 'top' });
  footer(s, 14); note(s, 'Jelaskan bahwa UAT menunjukkan penerimaan positif. Sampaikan juga secara jujur bahwa fitur NLP masih perlu dievaluasi lebih lanjut.');
}

// 15
{
  const s = pptx.addSlide(); s.background = { color: C.white }; title(s, 'Tiga revisi dosen telah masuk ke sistem dan laporan', 'TINDAK LANJUT REVISI');
  const revs = [
    ['01', 'Alur sistem', 'Alur lama, alur usulan, dan alur pelaporan sampai terminasi diperjelas.', C.teal],
    ['02', 'RabbitMQ', 'Message broker, queue, producer-consumer, dan fault injection ditambahkan.', C.gold],
    ['03', 'NLP', 'Cerita bebas dianalisis untuk membantu pengisian formulir sebelum submit.', C.coral]
  ];
  revs.forEach((r, i) => { const x = 0.9 + i * 4.15; rect(s, x, 2.0, 3.55, 3.4, C.pale, true, C.line); addText(s, r[0], x + 0.25, 2.32, 0.75, 0.55, { fontFace: 'Cambria', fontSize: 29, bold: true, color: r[3] }); addText(s, r[1], x + 0.25, 3.1, 2.9, 0.35, { fontFace: 'Cambria', fontSize: 20, bold: true, color: C.navy }); addText(s, r[2], x + 0.25, 3.8, 2.9, 0.76, { fontSize: 13, color: C.muted, valign: 'top' }); addText(s, '✓ diterapkan', x + 0.25, 4.9, 2.3, 0.25, { fontSize: 12, bold: true, color: C.teal }); });
  footer(s, 15); note(s, 'Gunakan slide ini untuk menjawab langsung revisi dosen. Jelaskan bahwa revisi diterapkan pada rancangan, implementasi, dan pengujian.');
}

// 16
{
  const s = pptx.addSlide(); s.background = { color: C.navy };
  addText(s, 'KESIMPULAN', 0.8, 0.65, 2.5, 0.25, { fontSize: 11, bold: true, color: C.mint, charSpacing: 2 });
  addText(s, 'Sistem berhasil menjawab kebutuhan pelaporan dan penanganan kasus secara terintegrasi.', 0.8, 1.18, 8.9, 0.95, { fontFace: 'Cambria', fontSize: 28, bold: true, color: C.white, valign: 'top' });
  const cs = ['SIPEKA berhasil dikembangkan menggunakan RUP.', 'Report Service dan Case Service berhasil dipisahkan.', 'RabbitMQ berhasil digunakan untuk komunikasi asynchronous.', 'Microservices unggul pada sebagian besar endpoint yang diuji.', 'UAT pelapor 80,87% dan admin 88,21%.', 'NLP membantu pengisian awal formulir dan tetap diverifikasi pelapor.'];
  bullets(s, cs, 1.0, 3.0, 8.2, 16, C.white, 0.48);
  rect(s, 10.0, 2.25, 2.25, 2.65, C.navy2, true, C.navy2);
  addText(s, '0%', 10.35, 2.72, 1.55, 0.65, { fontFace: 'Cambria', fontSize: 38, bold: true, color: C.mint, align: 'center' });
  addText(s, 'error rate\nmicroservices', 10.35, 3.58, 1.55, 0.55, { fontSize: 13, color: C.white, align: 'center' });
  footer(s, 16, true); note(s, 'Simpulkan dengan menjawab tujuan penelitian satu per satu. Tekankan bahwa hasil performa berlaku pada konfigurasi dan skenario yang diuji.');
}

// 17
{
  const s = pptx.addSlide(); s.background = { color: C.pale }; title(s, 'Keterbatasan menjadi dasar pengembangan berikutnya', 'BAB VI • SARAN');
  card(s, 'Evaluasi NLP', 'Belum ada pengukuran precision, recall, dan F1-score pada dataset berlabel.', 0.85, 1.9, 3.75, 1.75, C.white, C.coral);
  card(s, 'Reliabilitas pesan', 'Fault injection belum mencakup gangguan RabbitMQ dan jaringan.', 4.8, 1.9, 3.75, 1.75, C.white, C.gold);
  card(s, 'Kinerja', 'Login dan Get Penanganan masih perlu optimasi query, indeks, dan pagination.', 8.75, 1.9, 3.75, 1.75, C.white, C.teal);
  addText(s, 'Prioritas pengembangan', 0.9, 4.45, 2.5, 0.3, { fontSize: 16, bold: true, color: C.navy });
  const next = ['Perkuat validasi backend dan kontrol status', 'Tambahkan outbox, retry, dan publisher confirmation', 'Ulangi pengujian dengan konfigurasi resource yang lebih terkontrol'];
  next.forEach((v, i) => { const x = 0.95 + i * 4.05; rect(s, x, 5.0, 3.45, 0.72, i === 1 ? C.mint : C.aqua, true, i === 1 ? C.mint : C.aqua); addText(s, `${i + 1}. ${v}`, x + 0.15, 5.18, 3.15, 0.32, { fontSize: 12, bold: true, color: C.navy, align: 'center' }); });
  footer(s, 17); note(s, 'Sampaikan keterbatasan secara terbuka. Saran pengembangan tidak boleh disampaikan seolah-olah sudah menjadi fitur pada penelitian ini.');
}

// 18
{
  const s = pptx.addSlide(); s.background = { color: C.navy };
  addText(s, 'TERIMA KASIH', 0.8, 1.1, 4.0, 0.35, { fontSize: 14, bold: true, color: C.mint, charSpacing: 2 });
  addText(s, 'Sesi Tanya Jawab', 0.8, 1.85, 6.2, 0.8, { fontFace: 'Cambria', fontSize: 36, bold: true, color: C.white });
  addText(s, 'SIPEKA • DPPPA Kota Kendari • Microservices • RabbitMQ • NLP', 0.82, 3.0, 7.0, 0.35, { fontSize: 15, color: 'C7E7ED' });
  rect(s, 8.2, 1.3, 3.6, 3.9, C.navy2, true, C.navy2);
  ['Pelaporan', 'NLP', 'RabbitMQ', 'Manajemen Kasus'].forEach((v, i) => { flowNode(s, v, 8.65, 1.85 + i * 0.75, 2.7, i === 2 ? C.gold : C.aqua); });
  addText(s, 'Muh. Afdal Ziqri Ramadhan  •  E1E122065', 0.82, 6.3, 6.3, 0.3, { fontSize: 13, color: 'C7E7ED' });
  footer(s, 18, true); note(s, 'Tutup presentasi dan persilakan penguji menyampaikan pertanyaan.');
}

pptx.writeFile({ fileName: 'output/seminar-sipeka/Seminar_Hasil_SIPEKA.pptx' });

