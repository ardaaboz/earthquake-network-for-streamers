import { Redis } from '@upstash/redis';
import { normalizeAlert } from '../lib/normalize.js';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }
  try {
    res.setHeader('Content-Type','application/json; charset=UTF-8');
    const { secret, channel = 'default', title, message, location, timestamp, source, raw } = req.body || {};
    const expected = process.env.GLOBAL_SECRET || '';
    if (expected && secret !== expected) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }

    const base = {
      type: 'earthquake_alert',
      id: Date.now().toString(),
      title: title || 'Deprem Ağı Uyarısı',
      message: message || (raw && String(raw)) || '',
      location: location || '',
      timestamp: timestamp || new Date().toISOString(),
      source: source || 'deprem-agi',
      channel: String(channel),
    };
    const norm = normalizeAlert(base);
    const payload = { ...base, ...norm };

    const key = `ch:${channel}`;
    // Store latest payload with short TTL so polling clients can fetch it.
    await redis.set(key, payload, { ex: 300 });

    return res.json({ ok: true });
  } catch (e) {
    console.error('hook error', e);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
}

