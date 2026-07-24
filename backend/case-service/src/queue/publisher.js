const amqp = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const QUEUE_NAME = 'kasus_status_updates';

let channel = null;

async function connect() {
  if (channel) return channel;

  const connection = await amqp.connect(RABBITMQ_URL);
  connection.on('close', () => { channel = null; });
  connection.on('error', () => { channel = null; });

  channel = await connection.createChannel();
  await channel.assertQueue(QUEUE_NAME, { durable: true });

  return channel;
}

// Publish perubahan status kasus agar report-service menyinkronkan status laporan.
// Dipakai sebagai pengganti axios.patch langsung ke report-service (lihat kasusController.js):
// kalau report-service/RabbitMQ sedang down, pesan tetap tertampung di queue durable
// sampai report-service kembali hidup dan memprosesnya.
async function publishStatusUpdate({ laporan_id, status, catatan }) {
  const ch = await connect();
  const payload = Buffer.from(JSON.stringify({ laporan_id, status, catatan }));
  ch.sendToQueue(QUEUE_NAME, payload, { persistent: true });
}

module.exports = { publishStatusUpdate, QUEUE_NAME };
