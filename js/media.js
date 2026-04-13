import { setupPage, renderSkeleton, apiFetch, showError } from '/js/config.js';

/** NASA media search with modal and resilient fetch handling. */
const app = document.getElementById('app');
setupPage('NASA MEDIA');
let query = 'nebula';
let page = 1;
let items = [];

function card(it) {
  const d = it.data?.[0] || {}; const thumb = it.links?.[0]?.href || '';
  return `<button class='card media-card' data-id='${d.nasa_id}' style='padding:0;overflow:hidden;width:100%;text-align:left'><img loading='lazy' src='${thumb}' alt='${d.title||''}' style='width:100%;height:180px;object-fit:cover'><div style='padding:.6rem'><div>${d.title||'Untitled'}</div><small class='mono'>${(d.date_created||'').slice(0,10)}</small></div></button>`;
}

async function search(reset = false) {
  const grid = document.getElementById('grid');
  if (reset) { page = 1; renderSkeleton(grid, 6); }
  try {
    const json = await apiFetch(`/api/media?q=${encodeURIComponent(query)}&page=${page}`);
    if (reset) { items = []; grid.innerHTML = ''; }
    items.push(...(json.collection?.items || []));
    grid.innerHTML = items.map(card).join('');
  } catch (e) { showError(grid, e.message, () => search(reset)); }
}

function init() {
  app.innerHTML = `<section class='card' style='padding:1rem;display:flex;gap:.5rem'><input id='q' value='nebula' style='flex:1'><button id='go'>Search</button></section><section id='grid' style='margin-top:1rem;display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem'></section><div style='text-align:center;margin-top:1rem'><button id='more'>LOAD MORE</button></div><div id='modal' style='position:fixed;inset:0;background:#000b;display:none;place-items:center;padding:1rem;z-index:50'></div>`;
  search(true);
  document.getElementById('go').onclick = () => { query = document.getElementById('q').value || 'nebula'; search(true); };
  document.getElementById('more').onclick = () => { page += 1; search(false); };
  document.getElementById('grid').onclick = (e) => {
    const id = e.target.closest('[data-id]')?.dataset.id; if (!id) return;
    const d = items.find((x) => x.data?.[0]?.nasa_id === id)?.data?.[0] || {};
    const link = items.find((x) => x.data?.[0]?.nasa_id === id)?.links?.[0]?.href || '';
    const m = document.getElementById('modal');
    m.innerHTML = `<div class='card' style='padding:1rem;max-width:900px;width:min(92vw,900px)'>${d.media_type==='video'?`<video controls src='${link}' style='width:100%'></video>`:`<img src='${link}' alt='${d.title||''}' style='width:100%'>`}<h3>${d.title||''}</h3><p>${d.description||''}</p></div>`;m.style.display='grid';
  };
  document.getElementById('modal').onclick = (e) => { if (e.target.id === 'modal') e.target.style.display = 'none'; };
}

init();
