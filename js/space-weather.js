import { setupPage, renderSkeleton, apiFetch, showError } from '/js/config.js';

/** Displays latest solar flare gauge and recent events list. */
const app = document.getElementById('app');
setupPage('SPACE WEATHER');

function flareColor(cls='A') {
  if (/^[AB]/.test(cls)) return '#7cff8f';
  if (/^C/.test(cls)) return '#ffeb3b';
  if (/^M/.test(cls)) return '#ff9800';
  return '#ff4f4f';
}

function render(data) {
  const latest = (data || [])[0] || {};
  const cls = latest.classType || 'A';
  const color = flareColor(cls);
  app.innerHTML = `<section class='card' style='padding:1rem'><h3 class='section-title'>SOLAR ACTIVITY</h3><div class='mono' style='font-size:2rem;color:${color}'>${cls}</div><div class='mono'>Start: ${latest.beginTime || 'N/A'}</div><div class='mono'>Peak: ${latest.peakTime || 'N/A'}</div><div class='mono'>Source Region: ${latest.sourceLocation || 'N/A'}</div><div style='height:10px;background:#111;border-radius:999px;margin-top:.6rem'><div style='height:100%;width:100%;background:${color}'></div></div></section>
  <section class='card' style='padding:1rem;margin-top:1rem'><h3 class='section-title'>RECENT FLARES</h3><div style='max-height:46vh;overflow:auto'>${(data||[]).map((f)=>`<div style='padding:.6rem;border-bottom:1px solid var(--border-rest)'><span class='mono'>${f.classType || 'N/A'}</span> — ${(f.beginTime||'').slice(0,19)} — ${f.sourceLocation || 'N/A'}</div>`).join('') || 'NO EVENTS'}</div></section>`;
}

async function load() {
  renderSkeleton(app, 4);
  try { render(await apiFetch('/api/space-weather')); }
  catch (e) { showError(app, e.message, load); }
}

load();
