/** Shared UI bootstrapping and offline-capable API helper utilities. */
export function initBackground() {
  const shell = document.createElement('div');
  shell.className = 'background-shell';
  shell.innerHTML = `<div class="stars-layer"></div><div class="nebula-layer"><div class="nebula n1"></div><div class="nebula n2"></div><div class="nebula n3"></div></div><div class="shooting-layer"></div>`;
  document.body.prepend(shell);
  const stars = shell.querySelector('.stars-layer');
  for (let i = 0; i < 220; i += 1) {
    const dot = document.createElement('div');
    dot.className = 'star';
    dot.style.width = dot.style.height = `${Math.random() < 0.8 ? 1 : 2}px`;
    dot.style.left = `${Math.random() * 100}%`;
    dot.style.top = `${Math.random() * 120}%`;
    dot.style.animationDelay = `${Math.random() * -60}s`;
    stars.appendChild(dot);
  }
}

/** Renders initial loading overlay and top fetch progress bar. */
export function initLoadUI() {
  if (!document.getElementById('topProgress')) {
    document.body.insertAdjacentHTML('afterbegin', '<div id="topProgress"></div><div id="bootOverlay">INITIALIZING ASTRALIS...</div>');
  }
}

/** Updates UTC clock in expected telemetry format. */
export function startUTCClock(el) {
  const tick = () => { el.textContent = `UTC ${new Date().toISOString().replace('T', ' — ').replace('Z', '').replace(/-/g, '.')}`; };
  tick(); setInterval(tick, 1000);
}

/** Shows shimmer placeholders for pending cards. */
export function renderSkeleton(container, blocks = 3) {
  container.innerHTML = `<div class="skeleton-wrap">${Array.from({ length: blocks }).map(() => '<div class="skeleton"></div>').join('')}</div>`;
}

/** Generic API fetch with progress bar and localStorage fallback. */
export async function apiFetch(url) {
  const progress = document.getElementById('topProgress');
  if (progress) progress.style.width = '65%';
  const key = `astralis_local_${btoa(url)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
    if (progress) progress.style.width = '100%';
    setTimeout(() => { if (progress) progress.style.width = '0%'; }, 250);
    document.getElementById('bootOverlay')?.classList.add('hide');
    return data;
  } catch (err) {
    const cached = localStorage.getItem(key);
    if (cached) {
      document.getElementById('bootOverlay')?.classList.add('hide');
      return JSON.parse(cached).data;
    }
    throw err;
  }
}

/** Displays visible API error state with retry action. */
export function showError(container, message, retry) {
  container.innerHTML = `<div class="error-card">DATA UPLINK FAILED — RETRY<br><small>${message}</small><br><button id="retryBtn">Retry</button></div>`;
  container.querySelector('#retryBtn')?.addEventListener('click', retry);
}

/** Animates number chips to target value. */
export function animateCount(el, target) {
  const start = performance.now();
  const step = (now) => {
    const p = Math.min((now - start) / 1200, 1);
    el.textContent = Math.floor(target * p).toLocaleString();
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/** Common page setup initializer. */
export function setupPage(title) {
  initLoadUI();
  initBackground();
  const c = document.querySelector('[data-utc-clock]');
  if (c) startUTCClock(c);
  const t = document.querySelector('[data-page-title]');
  if (t) t.textContent = title;
}
