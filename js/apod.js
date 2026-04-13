import { setupPage, renderSkeleton, apiFetch, showError } from '/js/config.js';

/** Loads APOD and supports date-based queries with video/image rendering. */
const app = document.getElementById('app');
setupPage('APOD');

function render(item) {
  const max = new Date().toISOString().slice(0, 10);
  app.innerHTML = `<section class='card' style='padding:1rem'><label class='mono'>APOD DATE <input id='apodDate' type='date' min='1995-06-16' max='${max}' value='${item.date || max}'></label></section>
  <section class='card' style='padding:1rem;margin-top:1rem'>${item.media_type === 'video' ? `<iframe class='hero-media' src='${item.url}' title='APOD video' allowfullscreen></iframe>` : `<img src='${item.hdurl || item.url}' alt='${item.title || ''}' style='width:100%;max-height:65vh;object-fit:cover'>`}<h2 class='section-title'>${item.title || ''}</h2><div class='mono'>${item.date || ''}</div><p>${item.explanation || ''}</p></section>`;
  document.getElementById('apodDate').addEventListener('change', (e) => load(e.target.value));
}

async function load(date = '') {
  renderSkeleton(app, 3);
  try {
    const q = date ? `?date=${encodeURIComponent(date)}` : '';
    const data = await apiFetch(`/api/apod${q}`);
    render(data);
  } catch (e) { showError(app, e.message, () => load(date)); }
}

load();
