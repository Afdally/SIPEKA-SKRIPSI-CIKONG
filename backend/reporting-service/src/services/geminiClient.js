// Klien Gemini (Google AI Studio) lewat endpoint yang kompatibel dengan bentuk
// OpenAI — jadi bentuk permintaannya sama persis dengan penyedia lain yang
// bergaya OpenAI (Groq, OpenRouter, xAI). Kalau nanti pindah penyedia, cukup
// ganti BASE_URL, key, dan nama model; kodenya tidak perlu diubah.
//
// Dipakai untuk mempercepat pengembangan: di CPU, model lokal butuh 10-35 detik
// sekali analisis, sementara lewat API biasanya di bawah 3 detik.
//
// PERHATIAN PRIVASI — pada tier GRATIS, Google menyatakan data yang dikirim
// dapat dipakai untuk meningkatkan layanan mereka. Jalur ini aman untuk data
// dummy selama pengembangan, TAPI kronologi korban yang sebenarnya tidak boleh
// dikirim ke sini. Untuk pemakaian nyata dan demo sidang, pakai LLM_PROVIDER=ollama
// supaya cerita korban tidak pernah meninggalkan mesin sendiri.

const { SKEMA, bangunPrompt, MAKS_TOKEN_JAWABAN } = require('./promptAnalisis');

const BASE_URL = process.env.LLM_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai';
const MODEL = process.env.LLM_MODEL || 'gemini-2.5-flash';
const API_KEY = process.env.LLM_API_KEY || '';

// Jauh lebih pendek daripada batas Ollama: kalau API awan belum menjawab dalam
// 20 detik, hampir pasti ada gangguan jaringan — dan menunggu lebih lama tidak
// menolong pelapor. Ekstraksi aturan mengambil alih.
const TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS || 20000);

async function analisisKronologi({ kronologi, masterKekerasan, hubunganValid, jenisKelaminValid }) {
  if (!API_KEY) {
    // Sengaja dilempar lebih awal dengan pesan yang jelas. Tanpa ini, kegagalan
    // muncul sebagai HTTP 401 yang mudah dikira gangguan sesaat, padahal
    // sebabnya sepele: env belum diisi.
    throw new Error('LLM_API_KEY belum diisi — lihat .env.example');
  }

  const mulai = Date.now();

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    body: JSON.stringify({
      model: MODEL,
      messages: bangunPrompt({ kronologi, masterKekerasan, hubunganValid, jenisKelaminValid }),
      temperature: 0,
      max_tokens: MAKS_TOKEN_JAWABAN,
      // Padanan `format` milik Ollama. Inilah yang mengunci jawaban model ke
      // sembilan field yang diharapkan — tanpa ini model bisa membalas kalimat
      // biasa dan JSON.parse di bawah gagal.
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'analisis_laporan', strict: true, schema: SKEMA },
      },
    }),
  });

  if (!res.ok) {
    // Badan balasan ikut dibaca karena penyedia awan menaruh sebab yang
    // sebenarnya di situ (key salah, model tidak dikenal, kuota habis) —
    // kode status saja tidak cukup untuk menebaknya.
    const detail = await res.text().catch(() => '');
    throw new Error(`Gemini menjawab HTTP ${res.status}${detail ? ` — ${detail.slice(0, 200)}` : ''}`);
  }

  const body = await res.json();
  const isi = body?.choices?.[0]?.message?.content;
  if (!isi) throw new Error('Balasan Gemini tidak berisi konten');

  let mentah;
  try {
    mentah = JSON.parse(isi);
  } catch {
    throw new Error('Balasan Gemini bukan JSON yang sah');
  }

  const usage = body.usage || body.usage_metadata || {};
  const prompt = Number(usage.prompt_tokens || usage.prompt_token_count || 0);
  const jawaban = Number(usage.completion_tokens || usage.candidates_token_count || 0);
  const reasoning = Number(usage.completion_tokens_details?.reasoning_tokens || usage.thoughts_token_count || 0);

  return {
    mentah,
    durasiMs: Date.now() - mulai,
    model: MODEL,
    penggunaanToken: {
      prompt,
      jawaban,
      reasoning,
      total: Number(usage.total_tokens || usage.total_token_count || prompt + jawaban),
    },
  };
}

module.exports = { analisisKronologi, MODEL, TIMEOUT_MS };
