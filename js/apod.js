import { NASA_KEY, setupPage, showError, fetchJSON } from './config.js';

const app = document.getElementById('app');
setupPage('APOD');

function renderSkeleton() {
  app.innerHTML = `
    <div class="content-grid">
      <section><div class="skeleton" style="width:100%;height:min(70vh,520px);"></div></section>
      <section style="display:grid;grid-template-columns:2fr 1fr;gap:1rem;">
        <article class="card" style="padding:1rem;">
          <div class="skeleton" style="height:28px;width:75%;margin-bottom:.6rem;"></div>
          <div class="skeleton" style="height:16px;width:35%;margin-bottom:.9rem;"></div>
          <div class="skeleton" style="height:16px;width:100%;margin-bottom:.5rem;"></div>
          <div class="skeleton" style="height:16px;width:100%;margin-bottom:.5rem;"></div>
          <div class="skeleton" style="height:16px;width:90%;"></div>
        </article>
        <aside class="card" style="padding:1rem;">
          <div class="skeleton" style="height:16px;width:100%;margin-bottom:.6rem;"></div>
          <div class="skeleton" style="height:16px;width:100%;margin-bottom:.6rem;"></div>
          <div class="skeleton" style="height:16px;width:80%;"></div>
        </aside>
      </section>
      <section>
        <div class="skeleton" style="height:22px;width:260px;margin-bottom:.8rem;"></div>
        <div style="display:flex;gap:.8rem;overflow:auto;">
          ${Array.from({ length: 5 }).map(() => `<div class="skeleton" style="width:150px;min-width:150px;height:90px;"></div>`).join('')}
        </div>
      </section>
    </div>`;
}

async function load(selected) {
  renderSkeleton();
  try {
    const [today, prev] = await Promise.all([
      fetchJSON(`https://api.nasa.gov/planetary/apod?api_key=${NASA_KEY}`),
      fetchJSON(`https://api.nasa.gov/planetary/apod?count=5&api_key=${NASA_KEY}`)
    ]);
    const current = selected || today;
    app.innerHTML = `
      <div class="content-grid">
        <section>
          ${current.media_type === 'video'
            ? `<iframe class="hero-media" src="${current.url}" title="apod video" allowfullscreen></iframe>`
            : `<img class="hero-media" src="${current.hdurl || current.url}" alt="${current.title}" />`}
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
      c.innerHTML = `<div style="position:relative;"><img src="${item.url}" style="width:150px;height:90px;object-fit:cover;border-radius:12px 12px 0 0"/><small class="mono" style="position:absolute;bottom:4px;right:6px;background:rgba(0,0,0,.5);padding:2px 4px;border-radius:4px;">${item.date}</small></div>`;
      c.addEventListener('click', () => load(item));
      strip.appendChild(c);
    });
  } catch (e) {
    showError(app, e.message, () => load(selected));
  }
}

load();
