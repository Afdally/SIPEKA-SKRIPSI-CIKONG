// Klien Ollama untuk membaca cerita pelapor dan mengusulkan isi formulir.
//
// Ollama diperlakukan sebagai komponen INFRASTRUKTUR (sejajar mongodb/rabbitmq),
// bukan microservice tersendiri: dia perangkat lunak pihak ketiga, dan kode
// pemanggilnya tinggal di sini karena pengisian formulir pelaporan adalah bagian
// dari kapabilitas pelaporan yang dimiliki service ini.
//
// Alamatnya lewat env var supaya bisa dipindah tanpa mengubah kode: Ollama di
// mesin developer (host.docker.internal), di PC lain di jaringan (IP LAN),
// atau nanti sebagai container.

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://host.docker.internal:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b';

// Tanpa GPU, generasi jalan di CPU dan lambat. Batas waktu dibuat longgar tapi
// tetap ada, supaya pelapor tidak menunggu tanpa ujung kalau modelnya macet.
const TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS || 45000);

// Output dijaga sependek mungkin — jumlah token yang digenerasi itu penentu
// utama lama tunggu di CPU.
const NUM_PREDICT = 260;

// Semua field diminta bertipe string (termasuk usia) supaya tidak bergantung
// pada seberapa rapi model menuruti tipe. Konversi & validasi dilakukan di
// ekstraksiRule.bersihkan*.
//
// `nama_pelaku` diminta TAPI hasilnya dibuang — tidak ada field pelaku di
// formulir. Gunanya sebagai "tempat pembuangan": tanpa itu, model kecil cenderung
// menaruh nama pelaku ke `nama_korban` karena tidak punya tempat lain. Ini trik
// murah (beberapa token) yang menaikkan ketepatan pembedaan peran.
const SKEMA = {
  type: 'object',
  properties: {
    nama_korban:      { type: 'string' },
    nama_pelapor:     { type: 'string' },
    nama_pelaku:      { type: 'string' },
    usia_korban:      { type: 'string' },
    jenis_kelamin:    { type: 'string' },
    hubungan_pelapor: { type: 'string' },
    jenis_kekerasan:  { type: 'string' },
    lokasi_kejadian:  { type: 'string' },
    waktu_kejadian:   { type: 'string' },
  },
  required: [
    'nama_korban', 'nama_pelapor', 'nama_pelaku', 'usia_korban', 'jenis_kelamin',
    'hubungan_pelapor', 'jenis_kekerasan', 'lokasi_kejadian', 'waktu_kejadian',
  ],
};

// Contoh singkat (few-shot). Prompt yang lebih panjang memang menambah token,
// tapi di CPU pembacaan prompt jauh lebih cepat daripada penulisan jawaban, jadi
// ini tempat yang murah untuk membeli ketepatan. Ketiga contoh sengaja dipilih
// untuk mengajarkan hal yang paling sering keliru: pembedaan peran, dan ketikan
// singkat/tidak baku.
const CONTOH = [
  {
    laporan: 'saya melihat adek s dipukuli sma bpkku di rmh kmrn',
    jawab: {
      // "s" cuma inisial satu huruf -> dikosongkan, sejalan dengan penyaring
      // nama di ekstraksiRule.bersihkanNama yang menolak huruf tunggal.
      nama_korban: '', nama_pelapor: '', nama_pelaku: '',
      usia_korban: '', jenis_kelamin: '', hubungan_pelapor: 'Saudara',
      jenis_kekerasan: 'Kekerasan Fisik', lokasi_kejadian: 'rumah', waktu_kejadian: 'kemarin',
    },
  },
  {
    laporan: 'Saya Rina, 32 tahun. Sudah tiga bulan ini saya sering ditampar suami saya Andi di rumah kami.',
    jawab: {
      nama_korban: 'Rina', nama_pelapor: 'Rina', nama_pelaku: 'Andi',
      usia_korban: '32', jenis_kelamin: 'Perempuan', hubungan_pelapor: 'Diri Sendiri',
      jenis_kekerasan: 'Kekerasan Fisik', lokasi_kejadian: 'rumah', waktu_kejadian: 'tiga bulan ini',
    },
  },
];

function bangunPrompt({ kronologi, masterKekerasan, hubunganValid, jenisKelaminValid }) {
  const sistem = [
    'Tugas Anda: membaca laporan kekerasan berbahasa Indonesia dan menyalin keterangan yang DISEBUTKAN di dalamnya ke bentuk JSON.',
    '',
    'PENTING — dalam satu laporan ada sampai TIGA orang berbeda, jangan tertukar:',
    '  * PELAPOR = orang yang menulis laporan ini (biasanya menyebut dirinya "saya").',
    '  * KORBAN  = orang yang MENGALAMI kekerasan.',
    '  * PELAKU  = orang yang MELAKUKAN kekerasan.',
    'Pelapor SERING BUKAN korban. Kalau pelapor menulis "saya melihat adik saya dipukul bapak saya",',
    'maka korbannya adik, pelakunya bapak, dan pelapornya adalah kakak/saudara korban — bukan korban.',
    'Petunjuk peran pelaku: nama yang muncul setelah kata "oleh", "sama", atau "dari" hampir selalu PELAKU.',
    '',
    'Laporan sering ditulis cepat, tidak baku, dan disingkat. Pahami singkatan umum:',
    'sma/sm=sama, bpk=bapak, ortu=orang tua, adek/dek=adik, kk=kakak, rmh=rumah, sklh=sekolah,',
    'kmrn=kemarin, tdk/gk=tidak, yg=yang, sy/ak/aku=saya. Akhiran -ku berarti milik pelapor (bpkku=bapak saya).',
    '',
    'Aturan yang tidak boleh dilanggar:',
    '- JANGAN menebak, mengarang, atau menyimpulkan. Kalau sesuatu tidak disebutkan, isi string kosong "".',
    '- Nama harus berupa nama utuh minimal dua huruf. Kalau di teks hanya ada inisial satu huruf, isi "".',
    '- Jangan memberi penjelasan apa pun. Balas HANYA JSON.',
    '',
    'Keterangan tiap field:',
    '- nama_korban: nama KORBAN. Kalau korban hanya disebut "saya"/"adik saya" tanpa nama, isi "".',
    '- nama_pelapor: nama PENULIS laporan, kalau dia menyebutkan namanya sendiri. Kalau tidak, isi "".',
    '- nama_pelaku: nama PELAKU. Kalau tidak disebut, isi "".',
    '- usia_korban: umur KORBAN dalam angka saja, contoh "15". Bukan umur pelapor atau pelaku.',
    `- jenis_kelamin: jenis kelamin KORBAN, pilih salah satu dari [${jenisKelaminValid.join(', ')}] atau "".`,
    `- hubungan_pelapor: hubungan PELAPOR dengan KORBAN, pilih salah satu dari [${hubunganValid.join(', ')}] atau "". Kalau pelapor adalah korbannya sendiri, jawab "Diri Sendiri".`,
    `- jenis_kekerasan: pilih salah satu dari [${masterKekerasan.join(', ')}] atau "".`,
    '- lokasi_kejadian: tempat kejadian secara singkat, contoh "rumah pelaku", "sekolah", "kos". Maksimal 6 kata.',
    '- waktu_kejadian: frasa waktu APA ADANYA dari teks, contoh "kemarin", "tiga bulan terakhir", "20 Juli". JANGAN dihitung jadi tanggal.',
  ].join('\n');

  const pesan = [{ role: 'system', content: sistem }];

  for (const contoh of CONTOH) {
    pesan.push({ role: 'user', content: `Laporan:\n"""\n${contoh.laporan}\n"""` });
    pesan.push({ role: 'assistant', content: JSON.stringify(contoh.jawab) });
  }

  pesan.push({ role: 'user', content: `Laporan:\n"""\n${kronologi}\n"""` });
  return pesan;
}

// Mengembalikan objek mentah hasil model (nilai masih berupa string apa adanya),
// atau melempar error kalau Ollama tidak bisa dihubungi / balasannya tidak valid.
async function analisisKronologi({ kronologi, masterKekerasan, hubunganValid, jenisKelaminValid }) {
  const mulai = Date.now();

  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: bangunPrompt({ kronologi, masterKekerasan, hubunganValid, jenisKelaminValid }),
      stream: false,
      format: SKEMA,
      options: { temperature: 0, num_predict: NUM_PREDICT },
      // Model ditahan di memori supaya laporan berikutnya tidak kena biaya
      // muat ulang model dari disk (bisa 5-20 detik di CPU).
      keep_alive: process.env.OLLAMA_KEEP_ALIVE || '24h',
    }),
  });

  if (!res.ok) {
    throw new Error(`Ollama menjawab HTTP ${res.status}`);
  }

  const body = await res.json();
  const isi = body?.message?.content;
  if (!isi) throw new Error('Balasan Ollama tidak berisi konten');

  let mentah;
  try {
    mentah = JSON.parse(isi);
  } catch {
    throw new Error('Balasan Ollama bukan JSON yang sah');
  }

  return { mentah, durasiMs: Date.now() - mulai, model: OLLAMA_MODEL };
}

module.exports = { analisisKronologi, OLLAMA_URL, OLLAMA_MODEL, TIMEOUT_MS };
