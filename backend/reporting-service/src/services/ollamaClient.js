// Klien Ollama — model bahasa yang berjalan di mesin sendiri.
//
// Ollama diperlakukan sebagai komponen INFRASTRUKTUR (sejajar mongodb/rabbitmq),
// bukan microservice tersendiri: dia perangkat lunak pihak ketiga, dan kode
// pemanggilnya tinggal di sini karena pengisian formulir pelaporan adalah bagian
// dari kapabilitas pelaporan yang dimiliki service ini.
//
// Alamatnya lewat env var supaya bisa dipindah tanpa mengubah kode: Ollama di
// mesin developer (host.docker.internal), di PC lain di jaringan (IP LAN),
// atau nanti sebagai container.
//
// Prompt dan skemanya ada di promptAnalisis.js, dipakai bersama geminiClient.

const { SKEMA, bangunPrompt, MAKS_TOKEN_JAWABAN } = require('./promptAnalisis');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://host.docker.internal:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b';

// Tanpa GPU, generasi jalan di CPU dan lambat. Batas waktu dibuat longgar tapi
// tetap ada, supaya pelapor tidak menunggu tanpa ujung kalau modelnya macet.
const TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS || 45000);

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
      options: { temperature: 0, num_predict: MAKS_TOKEN_JAWABAN },
      // Model ditahan sebentar di memori supaya laporan berikutnya tidak kena
      // biaya muat ulang dari disk (5-20 detik di CPU), tapi tetap dilepas saat
      // sepi karena 1,9 GB terlalu mahal ditahan seharian di mesin 8 GB.
      keep_alive: process.env.OLLAMA_KEEP_ALIVE || '10m',
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

  const prompt = Number(body.prompt_eval_count || 0);
  const jawaban = Number(body.eval_count || 0);
  return {
    mentah,
    durasiMs: Date.now() - mulai,
    model: OLLAMA_MODEL,
    penggunaanToken: { prompt, jawaban, reasoning: 0, total: prompt + jawaban },
  };
}

module.exports = { analisisKronologi, OLLAMA_URL, OLLAMA_MODEL, TIMEOUT_MS };
