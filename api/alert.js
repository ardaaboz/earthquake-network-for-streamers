import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).end();
    }
    const filePath = path.join(process.cwd(), 'alert.mp3');
    // Small cache for static asset
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    const data = await fs.promises.readFile(filePath);
    res.status(200).end(data);
  } catch (e) {
    console.error('alert mp3 error', e);
    res.status(404).end();
  }
}

