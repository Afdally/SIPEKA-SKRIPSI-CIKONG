const amqp = require('amqplib');
const Laporan = require('../models/Laporan');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const QUEUE_NAME = 'kasus_status_updates';
const RETRY_DELAY_MS = 5000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Konsumsi event perubahan status kasus yang dipublish case-service (lihat
// case-service/src/queue/publisher.js) dan sinkronkan ke Laporan.status di sini.
// Ini menggantikan panggilan HTTP sinkron case-service -> report-service:
// kalau report-service sedang mati, pesan tetap tertampung durable di RabbitMQ
// sampai service ini hidup lagi dan memproses ulang antrian.
async function startConsumer() {
  let connection;
  try {
    connection = await amqp.connect(RABBITMQ_URL);
  } catch (err) {
    console.error('❌ Gagal konek RabbitMQ, retry dalam 5 detik:', err.message);
    await sleep(RETRY_DELAY_MS);
    return startConsumer();
  }

  connection.on('close', () => {
    console.error('⚠️ Koneksi RabbitMQ terputus, mencoba reconnect...');
    setTimeout(startConsumer, RETRY_DELAY_MS);
  });
  connection.on('error', () => {});

  const channel = await connection.createChannel();
  await channel.assertQueue(QUEUE_NAME, { durable: true });
  channel.prefetch(1);

  console.log(`👂 Menunggu pesan di queue "${QUEUE_NAME}"...`);

  channel.consume(QUEUE_NAME, async (msg) => {
    if (!msg) return;

    let payload;
    try {
      payload = JSON.parse(msg.content.toString());
    } catch (parseErr) {
      console.error('❌ Pesan tidak valid, dibuang:', parseErr.message);
      return channel.ack(msg);
    }

    const { laporan_id, status, catatan } = payload;

    try {
      const laporan = await Laporan.findByIdAndUpdate(laporan_id, { status, catatan });
      if (!laporan) {
        console.error(`❌ Laporan ${laporan_id} tidak ditemukan, pesan dibuang`);
      } else {
        console.log(`✅ Status laporan ${laporan_id} disinkronkan → ${status}`);
      }
      channel.ack(msg);
    } catch (dbErr) {
      console.error('❌ Gagal update laporan, requeue:', dbErr.message);
      channel.nack(msg, false, true);
    }
  });
}

module.exports = { startConsumer };
