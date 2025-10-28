import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

const app = express();

const PORT = process.env.PORT || 8080;
const GLOBAL_SECRET = process.env.GLOBAL_SECRET || '';
const HEARTBEAT_MS = 25_000; // For SSE keepalive

app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use(morgan('dev'));

// In-memory subscribers per channel: channel -> Set(res)
const channels = new Map();

function getOrCreateChannel(name) {
  const key = String(name || 'default');
  if (!channels.has(key)) channels.set(key, new Set());
  return channels.get(key);
}

// Healthcheck
app.get('/health', (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// Static overlay assets
app.use('/static', express.static('public', { extensions: ['html'] }));

// Overlay page (for OBS Browser Source)
app.get(['/','/overlay'], (req, res) => {
  res.sendFile(process.cwd() + '/public/overlay2.html');
});

// Static alert sound for local dev
app.get('/alert.mp3', (req, res) => {
  try {
    res.setHeader('Content-Type', 'audio/mpeg');
    res.sendFile(process.cwd() + '/public/alert.mp3');
  } catch (e) {
    res.status(404).end();
  }
});

// SSE event stream for a given channel
app.get('/events', (req, res) => {
  const channel = (req.query.channel || 'default').toString();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const subscribers = getOrCreateChannel(channel);
  subscribers.add(res);

  // Initial ping so OBS knows it loaded
  res.write(`event: ready\n`);
  res.write(`data: {"channel":"${channel}"}\n\n`);

  const hb = setInterval(() => {
    try {
      res.write(`event: ping\n`);
      res.write(`data: ${Date.now()}\n\n`);
    } catch (e) {
      // ignore
    }
  }, HEARTBEAT_MS);

  req.on('close', () => {
    clearInterval(hb);
    subscribers.delete(res);
  });
});

// Webhook to receive phone notifications
app.post('/hook', (req, res) => {
  try {
    const { secret, channel = 'default', title, message, location, timestamp, source, raw } = req.body || {};

    if (GLOBAL_SECRET && secret !== GLOBAL_SECRET) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }

    const payload = {
      type: 'earthquake_alert',
      title: title || 'Deprem Ağı Uyarısı',
      message: message || (raw && String(raw)) || '',
      location: location || '',
      timestamp: timestamp || new Date().toISOString(),
      source: source || 'deprem-agi',
      channel: String(channel),
    };

    const subscribers = getOrCreateChannel(channel);
    const data = `data: ${JSON.stringify(payload)}\n\n`;
    for (const resStream of subscribers) {
      try {
        resStream.write('event: alert\n');
        resStream.write(data);
      } catch (e) {
        // ignore write errors; connection cleanup happens on close
      }
    }

    return res.json({ ok: true, delivered: subscribers.size });
  } catch (e) {
    console.error('Webhook error', e);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
});

// Simple debug sender (GET for manual tests)
app.get('/send', (req, res) => {
  const { msg = 'Test Deprem Ağı uyarısı', loc = 'Istanbul', channel = 'default', secret } = req.query;
  if (GLOBAL_SECRET && secret !== GLOBAL_SECRET) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }
  const body = {
    secret,
    channel,
    title: 'Erken Uyarı',
    message: String(msg),
    location: String(loc),
    timestamp: new Date().toISOString(),
    source: 'manual',
  };
  // Reuse handler logic by broadcasting directly
  const subscribers = getOrCreateChannel(channel);
  const payload = { type: 'earthquake_alert', ...body };
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  for (const resStream of subscribers) {
    try {
      resStream.write('event: alert\n');
      resStream.write(data);
    } catch {}
  }
  res.json({ ok: true, delivered: subscribers.size, payload });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${PORT}`);
});
