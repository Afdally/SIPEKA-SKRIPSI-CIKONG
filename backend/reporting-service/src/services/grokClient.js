// Klien xAI/Grok melalui Chat Completions API.
//
// Key dan model dipisahkan dari Gemini agar kedua penyedia bisa tetap
// dikonfigurasi bersamaan. LLM_PROVIDER menentukan penyedia yang aktif.

const { SKEMA, bangunPrompt, MAKS_TOKEN_JAWABAN } = require('./promptAnalisis');

const BASE_URL = process.env.XAI_BASE_URL || 'https://api.x.ai/v1';
const MODEL = process.env.XAI_MODEL || 'grok-4.5';
const API_KEY = process.env.XAI_API_KEY || '';
const TIMEOUT_MS = Number(process.env.XAI_TIMEOUT_MS || 20000);

function normalisasiPenggunaan(usage = {}) {
  const prompt = Number(usage.prompt_tokens || 0);
  const jawaban = Number(usage.completion_tokens || 0);
  const reasoning = Number(usage.completion_tokens_details?.reasoning_tokens || 0);
  return {
    prompt,
    jawaban,
    reasoning,
    total: Number(usage.total_tokens || prompt + jawaban),
  };
}

async function analisisKronologi({ kronologi, masterKekerasan, hubunganValid, jenisKelaminValid }) {
  if (!API_KEY) {
    throw new Error('XAI_API_KEY belum diisi — lihat .env.example');
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
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'analisis_laporan', strict: true, schema: SKEMA },
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Grok menjawab HTTP ${res.status}${detail ? ` — ${detail.slice(0, 200)}` : ''}`);
  }

  const body = await res.json();
  const isi = body?.choices?.[0]?.message?.content;
  if (!isi) throw new Error('Balasan Grok tidak berisi konten');

  let mentah;
  try {
    mentah = JSON.parse(isi);
  } catch {
    throw new Error('Balasan Grok bukan JSON yang sah');
  }

  return {
    mentah,
    durasiMs: Date.now() - mulai,
    model: MODEL,
    penggunaanToken: normalisasiPenggunaan(body.usage),
  };
}

module.exports = { analisisKronologi, MODEL, TIMEOUT_MS };
