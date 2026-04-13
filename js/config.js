export const NASA_KEY = "VRhpCMRM4LS2gZxK1ENblSXuipwuAtcqy5p3TppV";

// AUTH PLAN: Add Supabase JS SDK. Create /pages/login.html with email/password + Google OAuth.
// PAYWALL PLAN: Use Stripe payment links and Netlify serverless webhook to update Supabase tier.
// ADS PLAN: Add Google AdSense script and hide ads for pro tier users.

export function dateRange(daysBack) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - daysBack);
  return {
    start: startDate.toISOString().slice(0, 10),
    end: endDate.toISOString().slice(0, 10)
  };
}

export async function cachedFetch(url, ttlMinutes = 10) {
  const cacheKey = 'astralis_' + btoa(url);
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached);
      const ageMinutes = (Date.now() - timestamp) / 60000;
      if (ageMinutes < ttlMinutes) return data;
    } catch {
      localStorage.removeItem(cacheKey);
    }
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
  return data;
}

export function initBackground() {
  const shell = document.createElement('div');
  shell.className = 'background-shell';
  shell.innerHTML = `<div class="stars-layer"></div><div class="nebula-layer"><div class="nebula n1"></div><div class="nebula n2"></div><div class="nebula n3"></div></div><div class="shooting-layer"></div>`;
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
  }, 4200 + Math.random() * 3800);
}

export function startUTCClock(el) {
  const tick = () => {
    const formatted = new Date().toISOString().replace('T', ' — ').replace('Z', '').replace(/-/g, '.');
    el.textContent = `UTC ${formatted}`;
  };
  tick();
  setInterval(tick, 1000);
}

export function renderSkeleton(container, blocks = 3) {
  container.innerHTML = `<div class="skeleton-wrap">${Array.from({ length: blocks }).map(() => '<div class="skeleton"></div>').join('')}</div>`;
}

export function fadeIn(container) {
  container.classList.add('content-fade');
  requestAnimationFrame(() => container.classList.add('is-visible'));
}

export function showError(container, message, retry) {
  container.innerHTML = `<div class="error-card">DATA UPLINK FAILED — RETRY<br><small>${message}</small><br><button id="retryBtn">Retry</button></div>`;
  container.querySelector('#retryBtn')?.addEventListener('click', retry);
}

export function animateCount(el, target) {
  const duration = 1200;
  const start = performance.now();
  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const value = Math.floor(target * progress);
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
