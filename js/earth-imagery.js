import { NASA_KEY, setupPage } from './config.js';

const app = document.getElementById('app');
setupPage('EARTH IMAGERY');

const presets = {
  'New York': [40.7128, -74.006],
  'Amazon Rainforest': [-3.4653, -62.2159],
  'Sahara Desert': [23.4162, 25.6628],
  'Mount Everest': [27.9881, 86.925],
  'Great Barrier Reef': [-18.2871, 147.6992]
};

function resultTemplate(url, lat, lon) {
  return `<div class='card' style='padding:1rem;margin-top:1rem;position:relative;'>
    <img src='${url}' alt='earth imagery' style='width:100%;max-height:60vh;object-fit:cover;border-radius:8px'>
    <div class='mono' style='position:absolute;left:1.5rem;bottom:1.5rem;background:rgba(0,0,0,.55);padding:.2rem .4rem;border-radius:6px'>LAT ${lat} | LON ${lon}</div>
    <div style='margin-top:.6rem'><label>Copyable coordinates</label><input readonly value='${lat}, ${lon}' style='width:100%'></div>
  </div>`;
}

async function submit(e) {
  e?.preventDefault();
  const lat = document.getElementById('lat').value;
  const lon = document.getElementById('lon').value;
  const date = document.getElementById('date').value;
  const out = document.getElementById('result');
  out.innerHTML = `<div class='card' style='padding:1rem;margin-top:1rem;position:relative;'>
    <div class='skeleton' style='width:100%;height:min(60vh,520px);margin-bottom:.6rem;'></div>
    <div class='skeleton' style='height:24px;width:220px;position:absolute;left:1.5rem;bottom:4.2rem;'></div>
    <div class='skeleton' style='height:18px;width:100%;'></div>
  </div>`;
  try {
    const url = `https://api.nasa.gov/planetary/earth/imagery?lon=${encodeURIComponent(lon)}&lat=${encodeURIComponent(lat)}&date=${date}&dim=0.1&api_key=${NASA_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('NO CLEAR IMAGERY FOR THIS DATE / LOCATION');
    const blob = await res.blob();
    out.innerHTML = resultTemplate(URL.createObjectURL(blob), lat, lon);
  } catch (err) {
    out.innerHTML = `<div class='card' style='padding:1rem;border-color:var(--accent-amber);color:var(--accent-amber)'>NO CLEAR IMAGERY FOR THIS DATE / LOCATION</div>`;
  }
}

function init() {
  const d = new Date(); d.setDate(d.getDate() - 20);
  app.innerHTML = `<section class='card' style='padding:1rem'>
    <form id='f' style='display:grid;grid-template-columns:repeat(4,1fr);gap:.5rem'>
      <input id='lat' type='number' step='any' placeholder='LAT' required>
      <input id='lon' type='number' step='any' placeholder='LON' required>
      <input id='date' type='date' value='${d.toISOString().slice(0,10)}' required>
      <button type='submit'>SUBMIT</button>
    </form>
    <div id='presets' style='display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.7rem'></div>
  </section>
  <section id='result'></section>`;

  const wrap = document.getElementById('presets');
  Object.entries(presets).forEach(([name, [lat, lon]]) => {
    const b = document.createElement('button'); b.className = 'pill'; b.textContent = name;
    b.onclick = () => { document.getElementById('lat').value = lat; document.getElementById('lon').value = lon; };
    wrap.appendChild(b);
  });
  document.getElementById('f').addEventListener('submit', submit);
}

init();
