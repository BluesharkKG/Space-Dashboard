import { NASA_KEY, setupPage, showError, fetchJSON, animateCount } from './config.js';

const app = document.getElementById('app');
setupPage('SPACE WEATHER');

const end = new Date();
const start = new Date();
start.setDate(end.getDate() - 30);
const TODAY = end.toISOString().slice(0, 10);
const LAST_30_DAYS = start.toISOString().slice(0, 10);

const urls = {
  FLR: `https://api.nasa.gov/DONKI/FLR?startDate=${LAST_30_DAYS}&endDate=${TODAY}&api_key=${NASA_KEY}`,
  CME: `https://api.nasa.gov/DONKI/CMEAnalysis?startDate=${LAST_30_DAYS}&endDate=${TODAY}&mostAccurateOnly=true&speed=500&halfAngle=30&catalog=ALL&api_key=${NASA_KEY}`,
  GST: `https://api.nasa.gov/DONKI/GST?startDate=${LAST_30_DAYS}&endDate=${TODAY}&api_key=${NASA_KEY}`,
  IPS: `https://api.nasa.gov/DONKI/IPS?startDate=${LAST_30_DAYS}&endDate=${TODAY}&location=ALL&catalog=ALL&api_key=${NASA_KEY}`,
  SEP: `https://api.nasa.gov/DONKI/SEP?startDate=${LAST_30_DAYS}&endDate=${TODAY}&api_key=${NASA_KEY}`,
  MPC: `https://api.nasa.gov/DONKI/MPC?startDate=${LAST_30_DAYS}&endDate=${TODAY}&api_key=${NASA_KEY}`,
  RBE: `https://api.nasa.gov/DONKI/RBE?startDate=${LAST_30_DAYS}&endDate=${TODAY}&api_key=${NASA_KEY}`,
  HSS: `https://api.nasa.gov/DONKI/HSS?startDate=${LAST_30_DAYS}&endDate=${TODAY}&api_key=${NASA_KEY}`,
  WSA: `https://api.nasa.gov/DONKI/WSAEnlilSimulations?startDate=${LAST_30_DAYS}&endDate=${TODAY}&api_key=${NASA_KEY}`,
  NOTIFICATIONS: `https://api.nasa.gov/DONKI/notifications?startDate=${LAST_30_DAYS}&endDate=${TODAY}&type=all&api_key=${NASA_KEY}`
};

const badge = { FLR:'#ffb347', CME:'#a66cff', GST:'#ff4f4f', IPS:'#00f5ff', SEP:'#7cff8f', MPC:'#2dd4bf', RBE:'#ffe66d', HSS:'#60a5fa', NOTIFICATIONS:'#bdbdbd' };

function renderSkeleton() {
  app.innerHTML = `<section class="card" style="padding:1rem;margin-bottom:1rem;text-align:center;">
    <div class="skeleton" style="width:220px;height:220px;border-radius:50%;margin:0 auto;"></div>
    <div class="skeleton" style="height:28px;width:320px;max-width:100%;margin:.8rem auto .4rem;"></div>
    <div class="skeleton" style="height:24px;width:220px;max-width:100%;margin:0 auto;"></div>
  </section>
  <section class="stats-row">
    ${Array.from({ length: 4 }).map(() => `<div class="card stat-card"><div class="skeleton" style="height:14px;width:85%;margin:.9rem auto .45rem;"></div><div class="skeleton" style="height:28px;width:55%;margin:0 auto 1rem;"></div></div>`).join('')}
  </section>
  <section style="margin-top:1rem;">
    <div style="display:flex;flex-wrap:wrap;gap:.5rem">${Array.from({ length: 9 }).map(() => `<div class="skeleton" style="height:30px;width:72px;border-radius:999px;"></div>`).join('')}</div>
    <div style="margin-top:.8rem">${Array.from({ length: 4 }).map(() => `<div class="skeleton" style="height:74px;width:100%;margin-bottom:.6rem;"></div>`).join('')}</div>
  </section>`;
}

async function load() {
  renderSkeleton();
  try {
    const entries = Object.entries(urls);
    const result = await Promise.all(entries.map(([, u]) => fetchJSON(u)));
    const data = Object.fromEntries(entries.map(([k], i) => [k, result[i] || []]));
    const stormToday = data.GST.some((e) => (e.startTime || '').startsWith(TODAY));
    const flare24h = data.FLR.some((e) => Date.now() - new Date(e.beginTime).getTime() < 86400000);

    app.innerHTML = `<section class="card" style="padding:1rem;margin-bottom:1rem;text-align:center;position:relative;overflow:hidden;">
      <svg width="220" height="220" viewBox="0 0 220 220"><circle cx="110" cy="110" r="45" fill="#ffb347"/><circle cx="110" cy="110" r="62" fill="none" stroke="#ffcc66" stroke-opacity="0.5" stroke-width="3"><animate attributeName="r" values="58;72;58" dur="3s" repeatCount="indefinite"/></circle><circle cx="110" cy="110" r="78" fill="none" stroke="#ffd78f" stroke-opacity="0.3" stroke-width="2"><animate attributeName="r" values="76;92;76" dur="4.3s" repeatCount="indefinite"/></circle></svg>
      ${stormToday ? '<div class="error-card" style="display:inline-block;border-color:#ff4f4f;">⚠ GEOMAGNETIC STORM IN PROGRESS</div>' : ''}
      ${flare24h ? '<div class="card" style="display:inline-block;margin-top:.5rem;border-color:#ffb347;color:#ffb347;padding:.5rem .8rem;">SOLAR FLARE DETECTED</div>' : ''}
    </section>
    <section class="stats-row">
      <div class="card stat-card"><div class="stat-label">TOTAL FLARES</div><div class="stat-number" id="s1">0</div></div>
      <div class="card stat-card"><div class="stat-label">TOTAL CMEs</div><div class="stat-number" id="s2">0</div></div>
      <div class="card stat-card"><div class="stat-label">ACTIVE STORMS</div><div class="stat-number" id="s3">0</div></div>
      <div class="card stat-card"><div class="stat-label">HIGH SPEED STREAMS</div><div class="stat-number" id="s4">0</div></div>
    </section>
    <section style="margin-top:1rem;">
      <div id="tabs" style="display:flex;flex-wrap:wrap;gap:.5rem"></div>
      <div class="feed-list" id="feed" style="margin-top:.8rem"></div>
    </section>`;

    animateCount(document.getElementById('s1'), data.FLR.length);
    animateCount(document.getElementById('s2'), data.CME.length);
    animateCount(document.getElementById('s3'), data.GST.length);
    animateCount(document.getElementById('s4'), data.HSS.length);

    const keys = ['FLR','CME','GST','IPS','SEP','MPC','RBE','HSS','NOTIFICATIONS'];
    const tabs = document.getElementById('tabs');
    const feed = document.getElementById('feed');
    const render = (k) => {
      feed.innerHTML = '';
      const arr = data[k] || [];
      if (!arr.length) {
        feed.innerHTML = '<div class="card feed-item">NO EVENTS IN RANGE</div>';
        return;
      }
      arr.forEach((item) => {
        const time = item.beginTime || item.startTime || item.submissionTime || item.messageIssueTime || 'N/A';
        const keys = Object.keys(item).slice(0, 6);
        const details = keys.map((x) => `<div><span class="mono" style="color:var(--text-muted)">${x}</span>: ${typeof item[x] === 'object' ? JSON.stringify(item[x]).slice(0,80) : item[x]}</div>`).join('');
        const div = document.createElement('div');
        div.className = 'card feed-item';
        div.innerHTML = `<span class="badge" style="background:${badge[k]};color:#03131f">${k}</span> <span class="mono" style="color:var(--text-muted)">${time}</span>${details}`;
        feed.appendChild(div);
      });
    };

    keys.forEach((k, i) => {
      const b = document.createElement('button');
      b.className = `pill ${i === 0 ? 'active' : ''}`;
      b.textContent = k;
      b.onclick = () => {
        [...tabs.children].forEach((x) => x.classList.remove('active'));
        b.classList.add('active');
        render(k);
      };
      tabs.appendChild(b);
    });
    render('FLR');
  } catch (e) {
    showError(app, e.message, load);
  }
}

load();
