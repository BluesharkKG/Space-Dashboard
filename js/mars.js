import { setupPage, renderSkeleton, apiFetch, showError } from '/js/config.js';

/** Curiosity latest photos with camera filter and lazy image hydration. */
const app = document.getElementById('app');
setupPage('MARS GALLERY');
let photos = [];

function render(filter = 'ALL') {
  const list = filter === 'ALL' ? photos : photos.filter((p) => p.camera?.name === filter);
  document.getElementById('grid').innerHTML = list.map((p) => `<figure class='card' style='margin:0;overflow:hidden'><img data-src='${p.img_src}' alt='Mars' style='width:100%;height:220px;object-fit:cover'><figcaption style='padding:.6rem'><div>${p.camera?.name || ''}</div><small class='mono'>Sol ${p.sol}</small></figcaption></figure>`).join('');
  const io = new IntersectionObserver((entries) => { entries.forEach((e) => { if (e.isIntersecting) { const img = e.target; img.src = img.dataset.src; io.unobserve(img); } }); });
  document.querySelectorAll('#grid img[data-src]').forEach((img) => io.observe(img));
}

async function load() {
  renderSkeleton(app, 4);
  try {
    const data = await apiFetch('/api/mars-latest');
    photos = data.latest_photos || [];
    const cams = ['ALL', ...new Set(photos.map((p) => p.camera?.name).filter(Boolean))];
    app.innerHTML = `<section class='card' style='padding:1rem'><label>Camera <select id='cam'>${cams.map((c) => `<option>${c}</option>`).join('')}</select></label></section><section id='grid' style='display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-top:1rem'></section>`;
    render('ALL');
    document.getElementById('cam').onchange = (e) => render(e.target.value);
  } catch (e) { showError(app, e.message, load); }
}

load();
