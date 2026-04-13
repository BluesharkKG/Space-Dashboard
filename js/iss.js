import { setupPage, renderSkeleton, apiFetch, showError } from '/js/config.js';

/** ISS live tracker with map marker updates and crew count. */
const app = document.getElementById('app');
setupPage('ISS TRACKER');

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

async function init() {
  renderSkeleton(app, 4);
  try {
    const L = await loadLeaflet();
    app.innerHTML = `<section class='card' style='overflow:hidden'><div id='map' style='height:52vh'></div></section><section class='card' style='padding:1rem;margin-top:1rem;display:flex;gap:.7rem;flex-wrap:wrap'><div class='pill mono' id='lat'>LAT --</div><div class='pill mono' id='lon'>LON --</div><div class='pill mono'>SPEED ~7.66 km/s</div><div class='pill mono' id='crew'>CREW --</div></section>`;
    const map = L.map('map').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    const icon = L.divIcon({ html: '🛰', className: '', iconSize: [20, 20] });
    const marker = L.marker([0, 0], { icon }).addTo(map);

    const tick = async () => {
      try {
        const [iss, crew] = await Promise.all([apiFetch('/api/iss-now'), apiFetch('/api/iss-crew')]);
        const lat = Number(iss.iss_position.latitude); const lon = Number(iss.iss_position.longitude);
        marker.setLatLng([lat, lon]); map.panTo([lat, lon], { animate: true, duration: 0.8 });
        document.getElementById('lat').textContent = `LAT ${lat.toFixed(3)}`;
        document.getElementById('lon').textContent = `LON ${lon.toFixed(3)}`;
        document.getElementById('crew').textContent = `IN SPACE ${crew.number || '--'}`;
      } catch {}
    };
    tick(); setInterval(tick, 10000);
  } catch (e) { showError(app, e.message, init); }
}

init();
