export const NASA_KEY = "VRhpCMRM4LS2gZxK1ENblSXuipwuAtcqy5p3TppV";

// AUTH PLAN: Add Supabase JS SDK. Create /pages/login.html with email/password + Google OAuth.
// PAYWALL PLAN: Use Stripe payment links and Netlify serverless webhook to update Supabase tier.
// ADS PLAN: Add Google AdSense script and hide ads for pro tier users.

export function initBackground() {
  const shell = document.createElement('div');
  shell.className = 'background-shell';
  shell.innerHTML = `
    <div class="stars-layer"></div>
    <div class="nebula-layer">
      <div class="nebula n1"></div>
      <div class="nebula n2"></div>
      <div class="nebula n3"></div>
    </div>
    <div class="shooting-layer"></div>`;
  document.body.prepend(shell);

  const starsLayer = shell.querySelector('.stars-layer');
  for (let i = 0; i < 220; i += 1) {
    const dot = document.createElement('div');
    dot.className = 'star';
    const s = Math.random() < 0.8 ? 1 : 2;
    dot.style.width = `${s}px`;
    dot.style.height = `${s}px`;
    dot.style.left = `${Math.random() * 100}%`;
    dot.style.top = `${Math.random() * 120}%`;
    dot.style.animationDelay = `${Math.random() * -60}s`;
    starsLayer.appendChild(dot);
  }

  const shootingLayer = shell.querySelector('.shooting-layer');
  setInterval(() => {
    const s = document.createElement('div');
    s.className = 'shooting-star';
    s.style.left = `${Math.random() * 70}%`;
    s.style.top = `${Math.random() * 60}%`;
    shootingLayer.appendChild(s);
    setTimeout(() => s.remove(), 1300);
  }, 4000 + Math.random() * 4000);
}

export function startUTCClock(el) {
  const tick = () => {
    const now = new Date();
    const formatted = now.toISOString().replace('T', ' — ').replace('Z', '').replace(/-/g, '.');
    el.textContent = `UTC ${formatted}`;
  };
  tick();
  setInterval(tick, 1000);
}

export function showLoading(container) {
  container.innerHTML = '<div class="loading"></div>';
}

export function showError(container, message, retry) {
  container.innerHTML = `<div class="error-card">DATA UPLINK FAILED — RETRY<br><small>${message}</small><br><button id="retryBtn">Retry</button></div>`;
  container.querySelector('#retryBtn')?.addEventListener('click', retry);
}

export async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export function animateCount(el, target) {
  const duration = 1200;
  const start = performance.now();
  const from = 0;
  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const value = Math.floor(from + (target - from) * progress);
    el.textContent = Number.isFinite(value) ? value.toLocaleString() : '0';
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export function setupPage(titleText) {
  initBackground();
  const clock = document.querySelector('[data-utc-clock]');
  if (clock) startUTCClock(clock);
  const title = document.querySelector('[data-page-title]');
  if (title && titleText) title.textContent = titleText;
}

export function fmtDate(d) {
  if (!d) return 'N/A';
  return new Date(d).toISOString().slice(0, 10);
}
