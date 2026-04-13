import { NASA_KEY, setupPage, renderSkeleton, showError, cachedFetch, fadeIn } from '/js/config.js';
void NASA_KEY;

const app = document.getElementById('app');
setupPage('NASA MEDIA');
let page = 1;
let query = 'nebula';
let cache = [];

function mediaCard(item) {
  const d = item.data?.[0] || {};
  const thumb = item.links?.[0]?.href || '';
  return `<button class='card media-card' data-id='${d.nasa_id}' style='padding:0;overflow:hidden;text-align:left;'>
    <img loading='lazy' src='${thumb}' alt='${d.title || ''}' style='width:100%;height:180px;object-fit:cover'>
    <div style='padding:.75rem'><h4 style='margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;'>${d.title || 'Untitled'}</h4><small class='mono' style='color:var(--text-muted)'>${(d.date_created || '').slice(0,10)}</small></div>
  </button>`;
}

async function search(reset = false) {
  const grid = document.getElementById('grid');
  if (reset) {
    page = 1;
    renderSkeleton(grid, 6);
  }
  try {
    const url = `https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=image,video&page=${page}`;
    const json = await cachedFetch(url, 20);
    const items = json.collection?.items || [];
    if (reset) {
      cache = [];
      grid.innerHTML = '';
    }
    cache.push(...items);
    cache.forEach((it) => {
      if (grid.querySelector(`[data-id="${it.data?.[0]?.nasa_id}"]`)) return;
      grid.insertAdjacentHTML('beforeend', mediaCard(it));
    });
    fadeIn(grid);
  } catch (e) {
    showError(grid, e.message, () => search(reset));
  }
}

function openModal(id) {
  const item = cache.find((x) => x.data?.[0]?.nasa_id === id);
  if (!item) return;
  const d = item.data?.[0] || {};
  const link = item.links?.[0]?.href || '';
  const modal = document.getElementById('modal');
  modal.innerHTML = `<div style='background:#091322;border:1px solid var(--border-rest);max-width:900px;width:min(92vw,900px);max-height:88vh;overflow:auto;padding:1rem;border-radius:12px'>
    ${d.media_type === 'video' ? `<video src='${link}' controls style='width:100%;max-height:60vh'></video>` : `<img src='${link}' alt='${d.title || ''}' style='width:100%;max-height:60vh;object-fit:contain'>`}
    <h3 class='section-title'>${d.title || ''}</h3><div class='mono'>${(d.date_created || '').slice(0,10)}</div><p>${d.description || ''}</p><div class='mono'>NASA ID: ${d.nasa_id || ''}</div><a href='${link}' target='_blank' rel='noopener'>Download link</a>
  </div>`;
  modal.style.display = 'grid';
}

function init() {
  app.innerHTML = `<section class='card' style='padding:1rem;display:flex;gap:.5rem;'><input id='searchInput' value='nebula' style='flex:1'><button id='searchBtn'>Search</button></section>
  <section id='grid' style='margin-top:1rem;column-count:3;column-gap:1rem;'></section>
  <div style='margin-top:1rem;text-align:center'><button id='more'>LOAD MORE</button></div>
  <div id='modal' style='position:fixed;inset:0;background:rgba(0,0,0,.8);display:none;place-items:center;padding:1rem;z-index:40'></div>`;

  const style = document.createElement('style');
  style.textContent = `@media(max-width:900px){#grid{column-count:2!important}}@media(max-width:620px){#grid{column-count:1!important}}.media-card{break-inside:avoid;display:block;width:100%;margin:0 0 1rem}`;
  document.head.appendChild(style);

  search(true);
  document.getElementById('searchBtn').onclick = () => { query = document.getElementById('searchInput').value || 'nebula'; search(true); };
  document.getElementById('more').onclick = () => { page += 1; search(false); };
  document.getElementById('grid').onclick = (e) => { const btn = e.target.closest('[data-id]'); if (btn) openModal(btn.dataset.id); };
  const modal = document.getElementById('modal');
  modal.onclick = (e) => { if (e.target.id === 'modal') modal.style.display = 'none'; };
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') modal.style.display = 'none'; });
}

init();
