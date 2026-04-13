import { NASA_KEY, setupPage, renderSkeleton, showError, cachedFetch, fadeIn } from '/js/config.js';

const app = document.getElementById('app');
setupPage('APOD');

function render(current, prev) {
  app.innerHTML = `
    <div class="content-grid">
      <section>
        ${current.media_type === 'video'
          ? `<iframe class="hero-media" src="${current.url}" title="apod video" allowfullscreen></iframe>`
          : `<img class="hero-media" src="${current.hdurl || current.url}" alt="${current.title}">`}
      </section>
      <section style="display:grid;grid-template-columns:2fr 1fr;gap:1rem;">
        <article class="card" style="padding:1rem;">
          <h2 class="section-title">${current.title}</h2>
          <div class="mono" style="color:var(--text-muted);">${current.date}</div>
          <p>${current.explanation || ''}</p>
          ${current.copyright ? `<p class="mono">© ${current.copyright}</p>` : ''}
        </article>
        <aside class="card" style="padding:1rem;">
          <div class="mono">DATE: ${current.date}</div>
          <div class="mono">COPYRIGHT: ${current.copyright || 'N/A'}</div>
          <div class="mono">MEDIA TYPE: ${current.media_type}</div>
        </aside>
      </section>
      <section>
        <h3 class="section-title">PREVIOUS TRANSMISSIONS</h3>
        <div id="strip" style="display:flex;gap:0.8rem;overflow:auto;"></div>
      </section>
    </div>`;

  const strip = document.getElementById('strip');
  prev.filter((i) => i.media_type === 'image').forEach((item) => {
    const c = document.createElement('button');
    c.className = 'card';
    c.style.padding = '0';
    c.style.minWidth = '150px';
    c.innerHTML = `<div style="position:relative;"><img loading="lazy" src="${item.url}" style="width:150px;height:90px;object-fit:cover;border-radius:12px 12px 0 0" alt="${item.title || 'APOD'}"><small class="mono" style="position:absolute;bottom:4px;right:6px;background:rgba(0,0,0,.5);padding:2px 4px;border-radius:4px;">${item.date}</small></div>`;
    c.addEventListener('click', () => render(item, prev));
    strip.appendChild(c);
  });
  fadeIn(app);
}

async function load() {
  renderSkeleton(app, 4);
  try {
    const [today, prev] = await Promise.all([
      cachedFetch(`https://api.nasa.gov/planetary/apod?api_key=${NASA_KEY}`, 60),
      cachedFetch(`https://api.nasa.gov/planetary/apod?count=5&api_key=${NASA_KEY}`, 60)
    ]);
    render(today, prev);
  } catch (e) {
    showError(app, e.message, load);
  }
}

load();
