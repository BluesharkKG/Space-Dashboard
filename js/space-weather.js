import { NASA_KEY, setupPage, renderSkeleton, showError, cachedFetch, animateCount, fadeIn, dateRange } from '/js/config.js';

const app = document.getElementById('app');
setupPage('SPACE WEATHER');

const { start, end } = dateRange(30);
const endpoints = {
  FLR: `https://api.nasa.gov/DONKI/FLR?startDate=${start}&endDate=${end}&api_key=${NASA_KEY}`,
  CME: `https://api.nasa.gov/DONKI/CMEAnalysis?startDate=${start}&endDate=${end}&mostAccurateOnly=true&speed=500&halfAngle=30&catalog=ALL&api_key=${NASA_KEY}`,
  GST: `https://api.nasa.gov/DONKI/GST?startDate=${start}&endDate=${end}&api_key=${NASA_KEY}`,
  SEP: `https://api.nasa.gov/DONKI/SEP?startDate=${start}&endDate=${end}&api_key=${NASA_KEY}`,
  RBE: `https://api.nasa.gov/DONKI/RBE?startDate=${start}&endDate=${end}&api_key=${NASA_KEY}`,
  HSS: `https://api.nasa.gov/DONKI/HSS?startDate=${start}&endDate=${end}&api_key=${NASA_KEY}`,
  NOTIFICATIONS: `https://api.nasa.gov/DONKI/notifications?startDate=${start}&endDate=${end}&type=all&api_key=${NASA_KEY}`
};

const badge = { FLR:'#ffb347', CME:'#a66cff', GST:'#ff4f4f', SEP:'#7cff8f', RBE:'#ffe66d', HSS:'#60a5fa', NOTIFICATIONS:'#00f5ff' };

async function load() {
  renderSkeleton(app, 6);
  try {
    const entries = Object.entries(endpoints);
    const settled = await Promise.allSettled(entries.map(([, url]) => cachedFetch(url, 15)));
    const data = {};
    const availability = {};
    entries.forEach(([name], i) => {
      const item = settled[i];
      availability[name] = item.status === 'fulfilled';
      data[name] = item.status === 'fulfilled' ? (item.value || []) : [];
    });

    const stormToday = data.GST.some((e) => (e.startTime || '').startsWith(end));
    const flare24h = data.FLR.some((e) => Date.now() - new Date(e.beginTime || 0).getTime() < 86400000);

    app.innerHTML = `<section class="card" style="padding:1rem;margin-bottom:1rem;text-align:center;overflow:hidden;">
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
    <section style="margin-top:1rem;"><div id="tabs" style="display:flex;flex-wrap:wrap;gap:.5rem"></div><div class="feed-list" id="feed" style="margin-top:.8rem"></div></section>`;

    animateCount(document.getElementById('s1'), data.FLR.length);
    animateCount(document.getElementById('s2'), data.CME.length);
    animateCount(document.getElementById('s3'), data.GST.length);
    animateCount(document.getElementById('s4'), data.HSS.length);

    const keys = ['FLR','CME','GST','SEP','RBE','HSS','NOTIFICATIONS'];
    const tabs = document.getElementById('tabs');
    const feed = document.getElementById('feed');

    const renderTab = (k) => {
      feed.innerHTML = '';
      if (!availability[k]) {
        feed.innerHTML = '<div class="card feed-item"><span class="badge" style="background:rgba(255,255,255,0.2);color:var(--text-muted)">UNAVAILABLE</span></div>';
        return;
      }
      const arr = data[k] || [];
      if (!arr.length) {
        feed.innerHTML = '<div class="card feed-item">NO EVENTS IN RANGE</div>';
        return;
      }
      arr.forEach((item) => {
        const time = item.beginTime || item.startTime || item.submissionTime || item.messageIssueTime || 'N/A';
        const details = Object.keys(item).slice(0, 6).map((x) => `<div><span class="mono" style="color:var(--text-muted)">${x}</span>: ${typeof item[x] === 'object' ? JSON.stringify(item[x]).slice(0,90) : item[x]}</div>`).join('');
        const div = document.createElement('div');
        div.className = 'card feed-item';
        div.innerHTML = `<span class="badge" style="background:${badge[k]};color:#03131f">${k}</span> <span class="mono" style="color:var(--text-muted)">${time}</span>${details}`;
        feed.appendChild(div);
      });
    };

    keys.forEach((k, i) => {
      const b = document.createElement('button');
      b.className = `pill ${i === 0 ? 'active' : ''}`;
      b.innerHTML = `${k}${availability[k] ? '' : ' <span class="mono" style="color:var(--text-muted)">UNAVAILABLE</span>'}`;
      b.onclick = () => { [...tabs.children].forEach((x) => x.classList.remove('active')); b.classList.add('active'); renderTab(k); };
      tabs.appendChild(b);
    });

    renderTab('FLR');
    fadeIn(app);
  } catch (e) {
    showError(app, e.message, load);
  }
}

load();
