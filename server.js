import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;
const NASA_API_KEY = process.env.NASA_API_KEY;
const cache = {};

async function getCached(key, ttlSeconds, fetchFn) {
  const now = Date.now();
  if (cache[key] && cache[key].expiresAt > now) {
    return cache[key].data;
  }
  const data = await fetchFn();
  cache[key] = { data, expiresAt: now + ttlSeconds * 1000 };
  return data;
}

/** Fetches JSON and throws on non-200 responses. */
async function fetchJsonOrThrow(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
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
    const data = await getCached(key, 3600, async () => fetchJsonOrThrow(nasa(`https://api.nasa.gov/planetary/apod?${date ? date.slice(1) : ''}`)));
    res.json(data);
  } catch (e) {
    const key = `apod_${req.query.date || 'today'}`;
    if (cache[key]?.data) return res.json(cache[key].data);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/neo', async (req, res) => {
  try {
    const start = new Date();
    const end = new Date(); end.setDate(start.getDate() + 7);
    const url = nasa(`https://api.nasa.gov/neo/rest/v1/feed?start_date=${start.toISOString().slice(0,10)}&end_date=${end.toISOString().slice(0,10)}`);
    const data = await getCached('neo', 3600, async () => fetchJsonOrThrow(url));
    res.json(data);
  } catch (e) {
    if (cache.neo?.data) return res.json(cache.neo.data);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/space-weather', async (req, res) => {
  try {
    const end = new Date();
    const start = new Date(); start.setDate(end.getDate() - 30);
    const url = nasa(`https://api.nasa.gov/DONKI/FLR?startDate=${start.toISOString().slice(0,10)}&endDate=${end.toISOString().slice(0,10)}`);
    const data = await getCached('space_weather', 1800, async () => fetchJsonOrThrow(url));
    res.json(data);
  } catch (e) {
    if (cache.space_weather?.data) return res.json(cache.space_weather.data);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/mars-latest', async (req, res) => {
  try {
    const data = await getCached('mars_latest', 21600, async () => fetchJsonOrThrow(nasa('https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/latest_photos')));
    res.json(data);
  } catch (e) {
    if (cache.mars_latest?.data) return res.json(cache.mars_latest.data);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/iss-now', async (req, res) => {
  try {
    const data = await getCached('iss_now', 10, async () => fetchJsonOrThrow('http://api.open-notify.org/iss-now.json'));
    res.json(data);
  } catch (e) {
    if (cache.iss_now?.data) return res.json(cache.iss_now.data);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/iss-crew', async (req, res) => {
  try {
    const data = await getCached('iss_crew', 60, async () => fetchJsonOrThrow('http://api.open-notify.org/astros.json'));
    res.json(data);
  } catch (e) {
    if (cache.iss_crew?.data) return res.json(cache.iss_crew.data);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/eonet', async (req, res) => {
  try { res.json(await fetchJsonOrThrow('https://eonet.gsfc.nasa.gov/api/v3/events/geojson?status=open')); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/eonet-categories', async (req, res) => {
  try { res.json(await fetchJsonOrThrow('https://eonet.gsfc.nasa.gov/api/v3/categories')); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/media', async (req, res) => {
  try {
    const q = req.query.q || 'nebula';
    const page = req.query.page || 1;
    const url = `https://images-api.nasa.gov/search?q=${encodeURIComponent(q)}&media_type=image,video&page=${page}`;
    res.json(await fetchJsonOrThrow(url));
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
