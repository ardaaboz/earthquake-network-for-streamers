import { Redis } from '@upstash/redis';
import { normalizeAlert } from '../lib/normalize.js';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }
  try {
    res.setHeader('Content-Type','application/json; charset=UTF-8');
    const { msg = 'Test Deprem Ağı uyarısı', loc = 'Istanbul', channel = 'default', secret } = req.query;
    const expected = process.env.GLOBAL_SECRET || '';
    if (expected && secret !== expected) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }
    const base = {
      type: 'earthquake_alert',
      id: Date.now().toString(),
      title: 'Erken Uyarı',
      message: String(msg),
      location: String(loc),
      timestamp: new Date().toISOString(),
      source: 'manual',
      channel: String(channel),
    };
    const norm = normalizeAlert(base);
    const payload = { ...base, ...norm };
    await redis.set(`ch:${channel}`, payload, { ex: 300 });
    return res.json({ ok: true, payload });
  } catch (e) {
    console.error('send error', e);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
}

