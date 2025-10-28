import { Redis } from '@upstash/redis';

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
    const channel = (req.query.channel || 'default').toString();
    const since = (req.query.since || '').toString();
    const key = `ch:${channel}`;
    const payload = await redis.get(key);
    if (!payload) {
      return res.json({ ok: true, update: false });
    }
    if (since && payload.timestamp && since === payload.timestamp) {
      return res.json({ ok: true, update: false });
    }
    return res.json({ ok: true, update: true, payload });
  } catch (e) {
    console.error('poll error', e);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
}

