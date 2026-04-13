import { setupPage, renderSkeleton, apiFetch, showError } from '/js/config.js';

/** Renders EONET open events on Leaflet map with category filter buttons. */
const app = document.getElementById('app');
setupPage('EARTH EVENTS');

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.onload = () => resolve(window.L);
    s.onerror = () => reject(new Error('Leaflet failed to load'));
    document.head.appendChild(s);
  });
}

async function load() {
  renderSkeleton(app, 4);
  try {
    const [events, categories] = await Promise.all([apiFetch('/api/eonet'), apiFetch('/api/eonet-categories')]);
    app.innerHTML = `<section class='card' style='padding:.8rem'><div id='filters' style='display:flex;flex-wrap:wrap;gap:.5rem;'></div></section><section class='card' style='margin-top:1rem;overflow:hidden'><div id='map' style='height:55vh'></div></section>`;
    try {
      const L = await loadLeaflet();
      const map = L.map('map').setView([20, 0], 2);
      L.tileLayer('https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);
      setTimeout(() => map.invalidateSize(), 60);
      const layer = L.layerGroup().addTo(map);
      let active = null;
      const render = () => {
        layer.clearLayers();
        (events.features || []).filter((f) => !active || f.properties.categories?.some((c) => c.title === active)).forEach((f) => {
          const [lon, lat] = f.geometry.coordinates;
          L.circleMarker([lat, lon], { radius: 6, color: '#00f5ff' }).addTo(layer).bindPopup(f.properties.title);
        });
      };
      const filters = document.getElementById('filters');
      (categories.categories || []).forEach((c) => {
        const b = document.createElement('button'); b.className = 'pill'; b.textContent = c.title;
        b.onclick = () => { active = active === c.title ? null : c.title; render(); };
        filters.appendChild(b);
      });
      render();
    } catch (err) { document.getElementById('map').innerHTML = `<div class='error-card'>${err.message}</div>`; }
  } catch (e) { showError(app, e.message, load); }
}

load();
