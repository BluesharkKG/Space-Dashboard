import { setupPage, renderSkeleton, apiFetch, showError } from '/js/config.js';

/** Builds threat card + sorted list for today's closest approaching NEOs. */
const app = document.getElementById('app');
setupPage('ASTEROID WATCH');

function flattenToday(data) {
  const today = new Date().toISOString().slice(0, 10);
  const arr = data.near_earth_objects?.[today] || Object.values(data.near_earth_objects || {}).flat();
  return arr.map((o) => {
    const ca = o.close_approach_data?.[0] || {};
    return { name: o.name, hazardous: !!o.is_potentially_hazardous_asteroid, diameter: (o.estimated_diameter?.meters?.estimated_diameter_min || 0), km: Number(ca.miss_distance?.kilometers || 0), ld: Number(ca.miss_distance?.lunar || 0) };
  }).sort((a, b) => a.km - b.km);
}

function render(list) {
  const top = list[0];
  const color = top.ld < 5 ? '#ff4f4f' : top.ld <= 10 ? '#ffb347' : '#7cff8f';
  app.innerHTML = `<section class='card' style='padding:1rem'><h3 class='section-title'>TODAY'S CLOSEST OBJECT</h3><div class='mono'>${top.name}</div><div>Diameter: ${top.diameter.toFixed(1)} m</div><div>Distance: ${top.km.toLocaleString()} km (${top.ld.toFixed(2)} LD)</div><div>Potentially hazardous: ${top.hazardous}</div><div style='height:12px;background:#111;border-radius:999px;overflow:hidden;margin-top:.5rem'><div style='height:100%;width:${Math.max(5, 100 - top.ld * 8)}%;background:${color}'></div></div></section>
  <section class='card' style='padding:1rem;margin-top:1rem'><h3 class='section-title'>TODAY NEO FEED</h3><div style='max-height:50vh;overflow:auto'>${list.map((n) => `<div style='padding:.6rem;border-bottom:1px solid var(--border-rest)'><div class='mono'>${n.name}</div><small>${n.km.toLocaleString()} km • ${n.ld.toFixed(2)} LD • hazardous=${n.hazardous}</small></div>`).join('')}</div></section>`;
}

async function load() {
  renderSkeleton(app, 4);
  try { render(flattenToday(await apiFetch('/api/neo'))); }
  catch (e) { showError(app, e.message, load); }
}

load();
