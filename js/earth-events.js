import { setupPage, showLoading, showError, fetchJSON, animateCount } from './config.js';

const app = document.getElementById('app');
setupPage('EARTH EVENTS');

const colors = {
  Wildfires: '#fb923c', Volcanoes: '#ff4f4f', Storms: '#60a5fa', Floods: '#2dd4bf', 'Sea and Lake Ice': '#00f5ff', Drought: '#ffb347',
  'Dust and Haze': '#9ca3af', Landslides: '#a16207', Manmade: '#a855f7', Snow: '#f8fafc', 'Temperature Extremes': '#fde047'
};

async function load() {
  showLoading(app);
  try {
    const [eventsData, catsData] = await Promise.all([
      fetchJSON('https://eonet.gsfc.nasa.gov/api/v3/events/geojson?status=open'),
      fetchJSON('https://eonet.gsfc.nasa.gov/api/v3/categories')
    ]);
    const features = eventsData.features || [];
    const categories = catsData.categories || [];

    app.innerHTML = `<section class='stats-row'>
      <div class='card stat-card'><div class='stat-label'>TOTAL OPEN EVENTS</div><div id='s1' class='stat-number'>0</div></div>
      <div class='card stat-card'><div class='stat-label'>WILDFIRES</div><div id='s2' class='stat-number'>0</div></div>
      <div class='card stat-card'><div class='stat-label'>STORMS</div><div id='s3' class='stat-number'>0</div></div>
      <div class='card stat-card'><div class='stat-label'>VOLCANOES</div><div id='s4' class='stat-number'>0</div></div>
    </section>
    <section class='card' style='padding:.8rem;margin-top:1rem;'><div id='filters' style='display:flex;flex-wrap:wrap;gap:.5rem;'></div></section>
    <section class='card' style='margin-top:1rem;overflow:hidden;'><div id='map' style='height:55vh;'></div></section>
    <section class='card' style='margin-top:1rem;padding:1rem;'><h3 class='section-title'>EVENT STREAM</h3><div id='list' style='max-height:280px;overflow:auto;display:grid;gap:.5rem;'></div></section>`;

    animateCount(document.getElementById('s1'), features.length);
    animateCount(document.getElementById('s2'), features.filter((f) => (f.properties.categories || []).some((c) => c.title === 'Wildfires')).length);
    animateCount(document.getElementById('s3'), features.filter((f) => (f.properties.categories || []).some((c) => c.title === 'Storms')).length);
    animateCount(document.getElementById('s4'), features.filter((f) => (f.properties.categories || []).some((c) => c.title === 'Volcanoes')).length);

    const map = L.map('map').setView([20, 0], 2);
    L.tileLayer('https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; OpenStreetMap &copy; CARTO' }).addTo(map);
    const layer = L.layerGroup().addTo(map);
    const list = document.getElementById('list');
    let active = null;

    const render = () => {
      layer.clearLayers();
      list.innerHTML = '';
      features
        .filter((f) => !active || (f.properties.categories || []).some((c) => c.title === active))
        .forEach((f) => {
          const [lon, lat] = f.geometry.coordinates;
          const cat = f.properties.categories?.[0]?.title || 'Other';
          const marker = L.circleMarker([lat, lon], { radius: 6, color: colors[cat] || '#00f5ff', fillOpacity: 0.85 }).addTo(layer);
          marker.bindPopup(`<strong>${f.properties.title}</strong><br>${(f.properties.date || '').slice(0,10)}<br>${f.properties.sources?.[0]?.id || 'NASA'}`);
          const item = document.createElement('button');
          item.className = 'card';
          item.style.padding = '.7rem';
          item.style.textAlign = 'left';
          item.innerHTML = `<div>${f.properties.title}</div><small class='mono' style='color:var(--text-muted)'>${cat}</small>`;
          item.onclick = () => map.flyTo([lat, lon], 5);
          list.appendChild(item);
        });
    };

    const filters = document.getElementById('filters');
    categories.forEach((c) => {
      const b = document.createElement('button');
      b.className = 'pill'; b.textContent = c.title;
      b.onclick = () => {
        if (active === c.title) { active = null; b.classList.remove('active'); }
        else { active = c.title; [...filters.children].forEach((x) => x.classList.remove('active')); b.classList.add('active'); }
        render();
      };
      filters.appendChild(b);
    });
    render();
  } catch (e) {
    showError(app, e.message, load);
  }
}

load();
