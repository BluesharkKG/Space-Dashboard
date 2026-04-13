import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;
const NASA_API_KEY = process.env.NASA_API_KEY;
const cache = {};

/** Fetches remote JSON with TTL cache and stale fallback on errors. */
async function cachedUpstream(key, ttlMs, url) {
  const now = Date.now();
  const hit = cache[key];
  if (hit && hit.expiresAt > now) return hit.data;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    cache[key] = { data, expiresAt: now + ttlMs, lastGood: data };
    return data;
  } catch (err) {
    if (hit?.lastGood) return hit.lastGood;
    throw err;
  }
}

/** Builds NASA URL safely with API key from env only. */
function nasa(url) {
  if (!NASA_API_KEY) throw new Error('NASA_API_KEY missing');
  return `${url}${url.includes('?') ? '&' : '?'}api_key=${NASA_API_KEY}`;
}

app.use(express.static(__dirname));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/api/apod', async (req, res) => {
  try {
    const date = req.query.date ? `&date=${encodeURIComponent(req.query.date)}` : '';
    const key = `apod_${req.query.date || 'today'}`;
    const data = await cachedUpstream(key, 3600000, nasa(`https://api.nasa.gov/planetary/apod?${date ? date.slice(1) : ''}`));
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/neo', async (req, res) => {
  try {
    const start = new Date();
    const end = new Date(); end.setDate(start.getDate() + 7);
    const url = nasa(`https://api.nasa.gov/neo/rest/v1/feed?start_date=${start.toISOString().slice(0,10)}&end_date=${end.toISOString().slice(0,10)}`);
    const data = await cachedUpstream('neo', 3600000, url);
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/space-weather', async (req, res) => {
  try {
    const end = new Date();
    const start = new Date(); start.setDate(end.getDate() - 30);
    const url = nasa(`https://api.nasa.gov/DONKI/FLR?startDate=${start.toISOString().slice(0,10)}&endDate=${end.toISOString().slice(0,10)}`);
    const data = await cachedUpstream('space_weather', 1800000, url);
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/mars-latest', async (req, res) => {
  try {
    const data = await cachedUpstream('mars_latest', 21600000, nasa('https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/latest_photos'));
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/iss-now', async (req, res) => {
  try {
    const data = await cachedUpstream('iss_now', 10000, 'http://api.open-notify.org/iss-now.json');
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/iss-crew', async (req, res) => {
  try {
    const data = await cachedUpstream('iss_crew', 60000, 'http://api.open-notify.org/astros.json');
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/eonet', async (req, res) => {
  try { res.json(await cachedUpstream('eonet', 600000, 'https://eonet.gsfc.nasa.gov/api/v3/events/geojson?status=open')); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/eonet-categories', async (req, res) => {
  try { res.json(await cachedUpstream('eonet_categories', 600000, 'https://eonet.gsfc.nasa.gov/api/v3/categories')); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/media', async (req, res) => {
  try {
    const q = req.query.q || 'nebula';
    const page = req.query.page || 1;
    const url = `https://images-api.nasa.gov/search?q=${encodeURIComponent(q)}&media_type=image,video&page=${page}`;
    res.json(await cachedUpstream(`media_${q}_${page}`, 1200000, url));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`ASTRALIS running on ${PORT}`);
  const base = process.env.RENDER_EXTERNAL_URL || `http://127.0.0.1:${PORT}`;
  setInterval(() => {
    fetch(`${base}/health`).catch(() => {});
  }, 14 * 60 * 1000);
});
