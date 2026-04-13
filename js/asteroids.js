import { NASA_KEY, setupPage, renderSkeleton, showError, cachedFetch, animateCount, fadeIn } from '/js/config.js';

const app = document.getElementById('app');
setupPage('ASTEROID WATCH');

function flattenNeo(data) {
  return Object.values(data.near_earth_objects || {}).flat().map((o) => {
    const ca = o.close_approach_data?.[0] || {};
    return {
      raw: o,
      name: o.name,
      diameter: ((o.estimated_diameter?.meters?.estimated_diameter_min || 0) + (o.estimated_diameter?.meters?.estimated_diameter_max || 0)) / 2,
      velocity: Number(ca.relative_velocity?.kilometers_per_second || 0),
      missKm: Number(ca.miss_distance?.kilometers || 0),
      missLd: Number(ca.miss_distance?.lunar || 0),
      hazardous: !!o.is_potentially_hazardous_asteroid
    };
  }).sort((a, b) => a.missKm - b.missKm);
}

async function load() {
  renderSkeleton(app, 6);
  try {
    const today = new Date();
    const plus7 = new Date();
    plus7.setDate(today.getDate() + 7);
    const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${today.toISOString().slice(0,10)}&end_date=${plus7.toISOString().slice(0,10)}&api_key=${NASA_KEY}`;
    const data = await cachedFetch(url, 30);
    const ast = flattenNeo(data);
    const nearest = ast[0];
    const fastest = ast.reduce((m, a) => (a.velocity > m.velocity ? a : m), ast[0] || { velocity: 0 });
    const hazardousCount = ast.filter((a) => a.hazardous).length;
    const threatPct = nearest ? Math.min(100, Math.max(5, 100 - nearest.missLd * 10)) : 0;

    app.innerHTML = `<section class="card" style="padding:1rem;position:relative;"><canvas id="orbit" style="width:100%;height:320px"></canvas><div id="tooltip" class="mono" style="position:absolute;display:none;background:#031521;padding:.35rem .5rem;border:1px solid var(--border-rest);border-radius:6px;"></div></section>
    <section class="card" style="padding:1rem;margin-top:1rem;"><div class="stat-label">PROXIMITY THREAT LEVEL</div><div style="height:14px;background:#111;border-radius:999px;overflow:hidden;margin:.35rem 0"><div style="height:100%;width:${threatPct}%;background:linear-gradient(90deg,#2a2a2a,#ff4f4f)"></div></div><div class="mono">${nearest ? `${nearest.name} — ${nearest.missLd.toFixed(2)} LD` : 'N/A'}</div></section>
    <section class="stats-row" style="margin-top:1rem;"><div class="card stat-card"><div class="stat-label">TOTAL TRACKED THIS WEEK</div><div class="stat-number" id="s1">0</div></div><div class="card stat-card"><div class="stat-label">POTENTIALLY HAZARDOUS</div><div class="stat-number" id="s2">0</div></div><div class="card stat-card"><div class="stat-label">CLOSEST APPROACH (km)</div><div class="stat-number" id="s3">0</div></div><div class="card stat-card"><div class="stat-label">FASTEST OBJECT (km/s)</div><div class="stat-number" id="s4">0</div></div></section>
    <section class="card" style="padding:1rem;margin-top:1rem;"><div class="table-wrap"><table><thead><tr><th>NAME</th><th>DIAMETER (m)</th><th>VELOCITY (km/s)</th><th>MISS DISTANCE (km)</th><th>HAZARDOUS</th></tr></thead><tbody id="tbody"></tbody></table></div><div id="detail" style="margin-top:1rem"></div></section>`;

    animateCount(document.getElementById('s1'), ast.length);
    animateCount(document.getElementById('s2'), hazardousCount);
    animateCount(document.getElementById('s3'), Math.round(nearest?.missKm || 0));
    animateCount(document.getElementById('s4'), Math.round((fastest.velocity || 0) * 100) / 100);

    const tbody = document.getElementById('tbody');
    const detail = document.getElementById('detail');
    ast.forEach((a) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${a.name}</td><td>${a.diameter.toFixed(1)}</td><td>${a.velocity.toFixed(2)}</td><td>${Math.round(a.missKm).toLocaleString()}</td><td style="color:${a.hazardous ? '#ff4f4f' : '#7cff8f'}">${a.hazardous ? 'YES' : 'NO'}</td>`;
      tr.onclick = () => { detail.innerHTML = `<div class='card' style='padding:1rem'><h3 class='section-title'>${a.name}</h3><pre style='white-space:pre-wrap;'>${JSON.stringify(a.raw, null, 2)}</pre></div>`; };
      tbody.appendChild(tr);
    });

    const canvas = document.getElementById('orbit');
    const ctx = canvas.getContext('2d');
    const tip = document.getElementById('tooltip');
    const dots = ast.slice(0, 80).map((a, i) => ({ ...a, angle: Math.random() * Math.PI * 2, radius: 30 + Math.min(130, a.missLd * 7) + i * 0.15 }));
    let t = 0;
    let raf;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * devicePixelRatio);
      canvas.height = Math.floor(rect.height * devicePixelRatio);
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };

    const draw = () => {
      t += 0.002;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2;
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2); ctx.fill();
      dots.forEach((d) => {
        const x = cx + Math.cos(d.angle + t) * d.radius;
        const y = cy + Math.sin(d.angle + t) * (d.radius * 0.45);
        d.x = x; d.y = y;
        ctx.fillStyle = d.hazardous ? '#ff4f4f' : '#d1d5db';
        ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };

    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas);
    resize();
    draw();

    canvas.onmousemove = (e) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const hit = dots.find((d) => Math.hypot(d.x - x, d.y - y) < 5);
      if (hit) { tip.style.display = 'block'; tip.style.left = `${e.clientX + 8}px`; tip.style.top = `${e.clientY + 8}px`; tip.textContent = hit.name; }
      else tip.style.display = 'none';
    };

    window.addEventListener('beforeunload', () => { cancelAnimationFrame(raf); ro.disconnect(); });
    fadeIn(app);
  } catch (e) {
    showError(app, e.message, load);
  }
}

load();
