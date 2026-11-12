
// ================================================================ sound
let actx = null, soundOn = false, noiseBuf = null;
function ensureAudio() { if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); noiseBuf = actx.createBuffer(1, actx.sampleRate, actx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } catch (e) { return; } } if (actx.state === 'suspended') actx.resume().catch(() => {}); }
function sfx(kind) {
  if (!soundOn || !actx || S.speed > 10) return;
  const t = actx.currentTime;
  const tone = (f0, f1, dur, g, type = 'sine') => { const o = actx.createOscillator(), gn = actx.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur); gn.gain.setValueAtTime(g, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(gn).connect(actx.destination); o.start(t); o.stop(t + dur + 0.02); };
  if (kind === 'bell') { tone(1320, 1300, 1.2, 0.18); tone(1980, 1950, 0.8, 0.08); }
  else if (kind === 'drop') { tone(90, 50, 0.25, 0.3); }
  else if (kind === 'clank') { tone(700, 650, 0.15, 0.08, 'square'); }
}
// ================================================================ boards
function drawWhiteboard(k) {
  const { ctx: c, cv, tex } = WB; c.fillStyle = '#f2f1ea'; c.fillRect(0, 0, cv.width, cv.height);
  c.fillStyle = '#2f68ab'; c.font = '700 16px Silkscreen, monospace'; c.fillText('TODAY', 10, 22);
  const lines = ['A1 BACK SQUAT 5x5 @80%', 'A2 PULL-UPS 4x8', 'B1 SLED PUSH 6x15M', 'B2 HIP THRUST 3x10', 'C  ROW 2000M'];
  c.font = '12px Silkscreen, monospace';
  lines.forEach((l, i) => { const show = clamp(k * lines.length - i, 0, 1); if (show <= 0) return; c.fillStyle = i % 2 ? '#d6403a' : '#1c1f2a'; c.fillText(l.slice(0, Math.ceil(l.length * show)), 10, 44 + i * 19); });
  tex.needsUpdate = true;
}
function drawPRBoard() {
  const { ctx: c, cv, tex } = PRB; c.fillStyle = '#1c1f2a'; c.fillRect(0, 0, cv.width, cv.height);
  c.fillStyle = '#dfe03a'; c.font = '700 16px Silkscreen, monospace'; c.fillText('PR BOARD', 10, 22);
  c.font = '11px Silkscreen, monospace';
  const list = A ? A.prs.slice(-7).reverse() : [];
  if (!list.length) { c.fillStyle = '#959bab'; c.fillText('NO PRS YET TODAY', 10, 46); }
  list.forEach((p, i) => { c.fillStyle = i ? '#f2f1ea' : '#dfe03a'; c.fillText(`${hhmm(p.t)} ${p.name.toUpperCase()} ${p.kg}KG`, 10, 44 + i * 17); c.fillStyle = '#959bab'; c.fillText(p.lift.toUpperCase().slice(0, 14), 150, 44 + i * 17); });
  tex.needsUpdate = true;
}
// ================================================================ toasts
const toastEl = document.getElementById('toast');
function showToast(text) { const d = document.createElement('div'); d.textContent = text; toastEl.appendChild(d); while (toastEl.children.length > 3) toastEl.firstChild.remove(); setTimeout(() => d.remove(), 3500); }
// ================================================================ NetLogo-style panel
const panel = document.getElementById('panel');
let goOn = false;
const playing = () => goOn && A && !A.done;
const W = {};   // widget refs
let plotbar = null;
// plots: a horizontal strip under the scene on wide screens, the Plots tab on phones
function placePlots() {
  if (!plotbar) return;
  const wide = window.innerWidth >= 860, grp = document.getElementById('plotGrp');
  if (wide) { if (plotbar.parentNode !== document.body) document.body.appendChild(plotbar); plotbar.classList.add('bar'); plotbar.style.right = panelW + 'px'; document.documentElement.style.setProperty('--plotH', plotH + 'px'); document.documentElement.style.setProperty('--plotOff', plotH + 'px'); if (grp) grp.style.display = 'none'; }
  else { if (grp && plotbar.parentNode !== grp) grp.appendChild(plotbar); plotbar.classList.remove('bar'); plotbar.style.right = ''; document.documentElement.style.setProperty('--plotOff', '0px'); if (grp) grp.style.display = ''; }
  // every legend stays on one line so all four plots get the same height; a legend that doesn't fit shrinks its text
  for (const lg of plotbar.querySelectorAll('.legend')) { let f = 10; lg.classList.remove('short'); lg.style.fontSize = f + 'px'; while (lg.scrollWidth > lg.clientWidth + 1 && f > 8) { f -= 0.5; lg.style.fontSize = f + 'px'; } if (lg.scrollWidth > lg.clientWidth + 1) lg.classList.add('short'); }
  for (const c of plotbar.querySelectorAll('canvas')) { const r = c.getBoundingClientRect(); if (r.width > 0) { c.width = Math.round(r.width); c.height = Math.round(Math.max(60, r.height)); } }
}
function el(tag, attrs = {}, html = '') { const e = document.createElement(tag); for (const k in attrs) { if (k === 'class') e.className = attrs[k]; else e.setAttribute(k, attrs[k]); } if (html) e.innerHTML = html; return e; }
function group(title, tab, id) { const g = el('section', { class: 'grp' }); if (tab) g.dataset.tab = tab; if (id) g.id = id; g.appendChild(el('h2', {}, `<span>${tr(title)}</span><span class="pend">${tr('applies on Setup')}</span>`)); panel.appendChild(g); return g; }
function slider(g, key, label, min, max, step, fmt, onSetup, path, map) {
  const w = el('div', { class: 'w' }); const id = 'w_' + key.replace('.', '_');
  w.innerHTML = `<div class="lab"><label for="${id}">${tr(label)}<span class="pd">${tr('· Setup')}</span></label><b></b></div><input type="range" id="${id}" min="${min}" max="${max}" step="${step}">`;
  const inp = w.querySelector('input'), out = w.querySelector('b');
  const toV = map ? map.toV : (x) => x, toPos = map ? map.toPos : (v) => v;   // optional non-linear scale (speed)
  const get = () => path ? S[path][key] : S[key], set = (v) => { if (path) S[path][key] = v; else S[key] = v; };
  inp.value = toPos(get()); out.textContent = fmt(get());
  inp.addEventListener('input', () => { const v = toV(+inp.value); set(v); out.textContent = fmt(v); if (path === 'mix') balanceMix(key); refreshPending(); });
  touchSlider(inp);
  g.appendChild(w); W[id] = { w, inp, out, get, fmt, onSetup, key, path }; return w;
}
function touchSlider(inp) {
  let on = false, x0 = 0, y0 = 0, dir = 0, v0 = null;
  const setFrom = (cx) => { const r = inp.getBoundingClientRect(), mn = +inp.min, mx = +inp.max, st = +inp.step || 1; let v = mn + clamp((cx - r.left) / r.width, 0, 1) * (mx - mn); v = Math.round(v / st) * st; if (+inp.value !== v) { inp.value = v; inp.dispatchEvent(new Event('input')); } };
  inp.addEventListener('touchstart', (e) => { const t = e.touches[0]; on = true; x0 = t.clientX; y0 = t.clientY; dir = 0; v0 = inp.value; }, { passive: true });
  inp.addEventListener('touchmove', (e) => { if (!on) return; const t = e.touches[0];
    if (!dir) { const dx = Math.abs(t.clientX - x0), dy = Math.abs(t.clientY - y0); if (dx + dy > 6) { dir = dx >= dy ? 1 : 2; if (dir === 2 && inp.value !== v0) { inp.value = v0; inp.dispatchEvent(new Event('input')); } } }   // a vertical swipe scrolls the panel and leaves the value alone
    if (dir === 1) { e.preventDefault(); setFrom(t.clientX); } }, { passive: false });
  inp.addEventListener('touchend', (e) => { if (on && dir !== 2) setFrom(dir ? e.changedTouches[0].clientX : x0); on = false; }, { passive: true });
}
function chooser(g, key, label, opts) {
  const w = el('div', { class: 'w' }); const id = 'w_' + key;
  w.innerHTML = `<div class="lab"><label for="${id}">${tr(label)}<span class="pd">${tr('· Setup')}</span></label></div><select id="${id}">${opts.map(o => `<option value="${o}">${tr(o)}</option>`).join('')}</select>`;
  const sel = w.querySelector('select'); sel.value = S[key]; sel.addEventListener('change', () => { S[key] = sel.value; if (key === 'weather') env.raining = S.weather === 'Rain'; refreshPending(); });
  g.appendChild(w); W[id] = { w, sel, key, onSetup: true }; return w;
}
function segmented(g, key, label, opts) {
  const w = el('div', { class: 'w' }); w.innerHTML = `<div class="lab"><span>${tr(label)}<span class="pd">${tr('· Setup')}</span></span></div><div class="seg" role="group" aria-label="${tr(label)}">${opts.map(o => `<button data-v="${o}">${tr(o)}</button>`).join('')}</div>`;
  const bs = [...w.querySelectorAll('button')]; const upd = () => bs.forEach(b => { const on = b.dataset.v === S[key]; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  bs.forEach(b => b.addEventListener('click', () => { S[key] = b.dataset.v; upd(); refreshPending(); })); upd();
  g.appendChild(w); W['w_' + key] = { w, key, onSetup: true, upd }; return w;
}
function sw(g, key, label) {
  const w = el('div', { class: 'w sw' }); w.innerHTML = `<span>${tr(label)}</span><button aria-pressed="false">${tr('Off')}</button>`;
  const b = w.querySelector('button'); const upd = () => { b.textContent = tr(S[key] ? 'On' : 'Off'); b.classList.toggle('on', S[key]); b.setAttribute('aria-pressed', S[key]); };
  b.addEventListener('click', () => { S[key] = !S[key]; upd(); }); upd(); g.appendChild(w); return w;
}
function balanceMix(changed) {
  const keys = Object.keys(S.mix), others = keys.filter(k => k !== changed);
  let rest = 100 - S.mix[changed]; const sum = others.reduce((s, k) => s + S.mix[k], 0);
  others.forEach((k, i) => { S.mix[k] = sum > 0 ? Math.round(S.mix[k] / sum * rest) : Math.round(rest / others.length); });
  const diff = 100 - keys.reduce((s, k) => s + S.mix[k], 0); S.mix[others[0]] += diff;
  if (S.mix[others[0]] < 0) { S.mix[others[0]] = 0; }
  for (const k of keys) { const r = W['w_' + k]; if (r) { r.inp.value = S.mix[k]; r.out.textContent = S.mix[k] + ' %'; } }
}
function buildPanel() {
  if (plotbar) plotbar.remove();   // rebuilt on a language switch
  panel.innerHTML = '<div id="sheetHandle"><i></i></div><div class="tabs" role="tablist"></div>';
  // monitors first on phones (always visible), placed after Run on desktop
  const run = group('Run', 'Run', 'runGrp');
  const r1 = el('div', { class: 'row' });
  W.setup = el('button', { class: 'btn-setup' }, tr('Setup')); W.go = el('button', { class: 'btn-go' }, tr('Go')); W.step = el('button', {}, tr('Step'));
  r1.append(W.setup, W.go, W.step); run.appendChild(r1);
  // log scale: 1x .. 600x (a whole 17-hour day in under two minutes at the top end)
  const spd = { toV: (p) => { const v = Math.pow(600, p / 100); return v < 10 ? Math.round(v) : v < 100 ? Math.round(v / 5) * 5 : Math.round(v / 25) * 25; }, toPos: (v) => Math.round(100 * Math.log(Math.max(1, v)) / Math.log(600)) };
  slider(run, 'speed', 'Speed (gym seconds per real second)', 0, 100, 1, v => v + '×', false, undefined, spd);
  const r2 = el('div', { class: 'row' }); r2.innerHTML = `<label for="seed" style="flex:0 0 auto;font-size:12px">${tr('Seed')}</label><input type="number" id="seed"><button id="dice" style="flex:0 0 auto" aria-label="${tr('Random seed')}">🎲</button>`;
  run.appendChild(r2); W.seed = r2.querySelector('#seed'); W.seed.value = S.seed;
  W.seed.addEventListener('change', () => { S.seed = Math.max(1, Math.floor(+W.seed.value || 1)); W.seed.value = S.seed; refreshPending(); });
  r2.querySelector('#dice').addEventListener('click', () => { S.seed = Math.floor(Math.random() * 1e6) + 1; W.seed.value = S.seed; refreshPending(); });
  const r3 = el('div', { class: 'row' }); W.snd = el('button', {}, tr('Sound off')); W.copy = el('button', {}, tr('Copy results')); r3.append(W.snd, W.copy); run.appendChild(r3);
  run.appendChild(el('p', { class: 'note', id: 'runNote' }, ''));
  const mg = group('Monitors', null, 'monGrp'); mg.querySelector('.pend').remove();
  const mon = el('div', { class: 'mon' });
  for (const [id, lab] of [['mClock', 'Clock'], ['mIn', 'Inside now'], ['mWait', 'Waiting now'], ['mAvg', 'Avg wait'], ['mQ', 'Longest queue'], ['mPR', 'PRs today'], ['mStray', 'Stray weights'], ['mVisits', 'Visits'], ['mRack', 'Rack queue']]) { const d = el('div', {}, `<span>${tr(lab)}</span><b id="${id}">–</b>`); mon.appendChild(d); }
  mg.appendChild(mon);
  const day = group('Day', 'Day');
  chooser(day, 'curve', 'Arrival curve', Object.keys(CURVES));
  slider(day, 'members', 'Members per day', 100, 600, 5, v => v, true);
  slider(day, 'visit', 'Mean visit length', 30, 100, 1, v => v + MIN(), true);
  segmented(day, 'setting', 'Setting', ['Urban', 'Suburban', 'Rural']);
  chooser(day, 'weather', 'Weather', ['Clear', 'Rain', 'Heatwave']);
  day.appendChild(el('p', { class: 'note' }, tr('Setting and rain show at once. How members travel (scooter, bus, on foot, dropped off), bus frequency and the heatwave curve apply on Setup.')));
  const mem = group('Members', 'Members');
  mem.appendChild(el('p', { class: 'note', style: 'margin:0 0 4px' }, tr('Archetype mix (sums to 100 %, applies on Setup)')));
  for (const [k, lab] of [['power', 'Powerlifter'], ['oly', 'Olympic lifter'], ['body', 'Bodybuilder'], ['beginner', 'Beginner'], ['coach', 'Coach with client']]) slider(mem, k, lab, 0, 100, 1, v => v + ' %', true, 'mix');
  slider(mem, 'patience', 'Patience before swapping', 0, 15, 0.5, v => v + MIN());
  slider(mem, 'workIn', 'Work-in willingness', 0, 100, 5, v => v + ' %');
  slider(mem, 'rest', 'Rest between sets', 1, 5, 0.25, v => v.toFixed(2).replace(/0$/, '') + MIN());
  slider(mem, 'rerack', 'Re-rack habit', 0, 100, 5, v => v + ' %');
  const gym = group('Gym', 'Gym');
  slider(gym, 'racks', 'Power racks', 2, 10, 1, v => v, true);
  slider(gym, 'plats', 'Olympic platforms', 0, 4, 1, v => v, true);
  slider(gym, 'benches', 'Adjustable benches', 2, 10, 1, v => v, true);
  slider(gym, 'cleaners', 'Cleaners', 0, 3, 1, v => v);
  slider(gym, 'cap', 'Capacity cap at the turnstile', 20, 80, 1, v => v);
  sw(gym, 'curls', 'Racks used for curls');
  const pl = group('Plots', 'Plots', 'plotGrp');
  pl.querySelector('.pend').remove();
  plotbar = el('div', { id: 'plotbar' });
  for (const [id, title] of [['pOcc', 'Occupancy vs capacity cap'], ['pQ', 'Rack queue length'], ['pZ', 'Zone use (stacked)'], ['pH', 'Wait times (minutes)']]) {
    const d = el('div', { class: 'plot' }); d.innerHTML = `<div class="pt"><span>${tr(title)}</span><span id="${id}v"></span></div><canvas id="${id}" width="320" height="96"></canvas><div class="legend" id="${id}l"></div>`; plotbar.appendChild(d);
  }
  pl.appendChild(plotbar);
  plotbar.querySelector('#pOccl').innerHTML = `<span><i style="background:#dfe03a"></i>${tr('today')}</span><span><i style="background:#6b7182"></i>${tr('earlier runs')}</span><span><i style="background:#d6403a"></i>${tr('cap')}</span>`;
  plotbar.querySelector('#pQl').innerHTML = `<span><i style="background:#e08f5a"></i>${tr('today')}</span><span><i style="background:#6b7182"></i>${tr('earlier runs (faded)')}</span>`;
  plotbar.querySelector('#pZl').innerHTML = ZONES.map(([k, l, c, sh]) => `<span title="${tr(l)}"><i style="background:${c}"></i><b class="lf">${tr(sh)}</b><b class="ls">${zh() ? tr(sh) : sh.slice(0, 4)}</b></span>`).join('');
  plotbar.querySelector('#pHl').innerHTML = `<span><i style="background:#4a8acb"></i>${tr('waits finished today')}</span>`;
  placePlots();
  // tabs (phones)
  const tabs = panel.querySelector('.tabs');
  for (const t of ['Run', 'Day', 'Members', 'Gym', 'Plots']) { const b = el('button', { role: 'tab' }, tr(t)); b.dataset.t = t; b.addEventListener('click', () => { showTab(t); panel.classList.remove('closed'); }); tabs.appendChild(b); }
  panel.querySelector('#sheetHandle').addEventListener('click', () => panel.classList.toggle('closed'));
  showTab('Run');
  // wiring
  W.setup.addEventListener('click', () => { goOn = false; setupRun(); refreshGo(); refreshPending(); clearFollow(); showToast(tx(`Setup · seed ${S.seed}`, `設定 · 種子 ${S.seed}`)); });
  W.go.addEventListener('click', () => { if (A && A.done) { setupRun(); refreshPending(); } goOn = !goOn; refreshGo(); });
  W.step.addEventListener('click', () => { if (!A || A.done) return; for (let i = 0; i < 60 / STEP; i++) simStep(); });
  W.snd.addEventListener('click', () => { soundOn = !soundOn; if (soundOn) ensureAudio(); W.snd.textContent = tr(soundOn ? 'Sound on' : 'Sound off'); });
  W.copy.addEventListener('click', async () => { try { await navigator.clipboard.writeText(resultsText()); showToast(tr('Results copied')); } catch (e) { showToast(tr('Copy was blocked here')); } });
}
function showTab(t) { panel.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.t === t)); panel.querySelectorAll('.grp[data-tab]').forEach(g => g.classList.toggle('show', g.dataset.tab === t)); }
function refreshGo() { W.go.textContent = tr(goOn ? 'Pause' : (A && A.done ? 'Go (new day)' : 'Go')); W.go.classList.toggle('on', goOn); }
function refreshPending() {
  if (!A) return;
  const c = A.cfg; let any = false;
  for (const id in W) {
    const r = W[id]; if (!r || !r.onSetup || !r.w) continue;
    const cur = r.path ? S[r.path][r.key] : S[r.key], act = r.path ? c[r.path][r.key] : c[r.key];
    const pd = cur !== act; r.w.classList.toggle('pd', pd); any = any || pd;
  }
  if (S.seed !== c.seed) any = true;
  W.setup.classList.toggle('need', any); W.setup.textContent = tr('Setup') + (any ? ' ↻' : '');
  document.getElementById('runNote').textContent = tr(any ? 'Some settings change the building or the day: press Setup to apply them.' : 'Behaviour sliders apply immediately.');
}
const ZONES = [['cardio', 'Cardio', '#4a8acb', 'Cardio'], ['machines', 'Machines', '#63a845', 'Machine'], ['dumbbells', 'Dumbbells', '#e08f5a', 'DB'], ['racks', 'Racks', '#d6403a', 'Rack'], ['platforms', 'Platforms', '#dfe03a', 'Platform']];
function resultsText() {
  if (!A) return '';
  const c = A.cfg; let peak = 0, peakM = 0; A.occ.forEach((v, m) => { if (v > peak) { peak = v; peakM = m; } });
  const avg = A.waits.length ? A.waits.reduce((s, v) => s + v, 0) / A.waits.length : 0, mx = A.waits.length ? Math.max(...A.waits) : 0;
  return [`gymsim run · seed ${c.seed} · ${c.curve} · ${c.weather}`,
    `Members ${c.members}, visit ${c.visit} min, mix P${c.mix.power}/O${c.mix.oly}/B${c.mix.body}/N${c.mix.beginner}/C${c.mix.coach} %`,
    `Racks ${c.racks}, platforms ${c.plats}, benches ${c.benches}, cleaners ${S.cleaners}, cap ${S.cap}, curls in racks ${S.curls ? 'on' : 'off'}`,
    `Patience ${S.patience} min, work-in ${S.workIn} %, rest ${S.rest} min, re-rack ${S.rerack} %`,
    `Clock ${hhmm(A.t)}${A.done ? ' (day complete)' : ''} · visits ${A.visits}`,
    `Peak occupancy ${peak} at ${hhmm(T_OPEN + peakM * 60)}`,
    `Average wait ${avg.toFixed(1)} min · longest wait ${mx.toFixed(1)} min · longest queue ${A.longestQ}`,
    `PRs ${A.prs.length}${A.prs.length ? ': ' + A.prs.map(p => `${p.name} ${p.lift} ${p.kg} kg`).join('; ') : ''}`].join('\n');
}
// ---------------------------------------------------------------- monitors + plots
function setText(id, v) { const e = document.getElementById(id); if (e && e.textContent !== String(v)) e.textContent = v; }
function updateMonitors() {
  if (!A) return;
  setText('mClock', hhmm(A.t)); setText('hudClock', `${hhmm(A.t)} · ${tx(`${A.inside} inside`, `館內 ${A.inside} 人`)}${A.done ? tx(' · day complete', ' · 今日結束') : (A.t < T_OPEN ? tx(' · opens 07:00', ' · 07:00 開門') : A.t > T_CLOSE ? tx(' · closed', ' · 已打烊') : '')}`);
  setText('mIn', A.inside);
  let waiting = A.outQ.length; for (const s of STATIONS) waiting += s.queue.length; setText('mWait', waiting);
  setText('mAvg', A.waits.length ? (A.waits.reduce((s, v) => s + v, 0) / A.waits.length).toFixed(1) + tx('m', ' 分') : '–');
  setText('mQ', A.longestQ); setText('mPR', A.prs.length);
  let stray = 0; for (const s of STATIONS) stray += s.strayDB + (s.dirty > 20 ? 1 : 0); setText('mStray', stray);
  setText('mVisits', A.visits);
  let rq = 0; for (const s of STATIONS) if (s.type === 'rack' || s.type === 'olyplat') rq += s.queue.length; setText('mRack', rq);
}
function plotLine(c, arr, max, col, w = 1, dash) {
  const W_ = c.canvas.width, H_ = c.canvas.height, n = arr.length; c.strokeStyle = col; c.lineWidth = w; c.setLineDash(dash || []); c.beginPath(); let started = false;
  for (let i = 0; i < n; i++) { const v = arr[i]; if (Number.isNaN(v)) continue; const x = 26 + i / n * (W_ - 30), y = H_ - 12 - v / max * (H_ - 18); if (!started) { c.moveTo(x, y); started = true; } else c.lineTo(x, y); }
  c.stroke(); c.setLineDash([]);
}
function axes(c, max, unit) {
  const W_ = c.canvas.width, H_ = c.canvas.height; c.fillStyle = '#10131c'; c.fillRect(0, 0, W_, H_);
  c.strokeStyle = '#2f3340'; c.lineWidth = 1; c.font = '9px Silkscreen, monospace'; c.fillStyle = '#6b7182';
  for (const h of [7, 10, 13, 16, 19, 22]) { const x = 26 + (h - 7) / 17 * (W_ - 30); c.beginPath(); c.moveTo(x, 4); c.lineTo(x, H_ - 12); c.stroke(); c.fillText(String(h).padStart(2, '0'), x - 5, H_ - 2); }
  c.fillText(String(Math.round(max)), 2, 10); c.fillText('0', 2, H_ - 12);
}
function drawPlots() {
  if (!A) return;
  // occupancy
  let c = document.getElementById('pOcc').getContext('2d');
  let max = Math.max(S.cap, 10, ...[...A.occ].filter(v => !Number.isNaN(v)), ...HIST.flatMap(h => [...h.occ].filter(v => !Number.isNaN(v)))) + 4;
  axes(c, max); HIST.forEach((h, i) => plotLine(c, h.occ, max, ['#6b7182', '#474c5c', '#2f3340'][i], 1));
  const capArr = new Float32Array(A.occ.length).fill(S.cap); plotLine(c, capArr, max, '#d6403a', 1, [4, 3]); plotLine(c, A.occ, max, '#dfe03a', 2);
  const cur = A.lastMin >= 0 ? A.occ[A.lastMin] : 0; setText('pOccv', Number.isNaN(cur) ? '' : tx(`${cur} now`, `現在 ${cur} 人`));
  // queue
  c = document.getElementById('pQ').getContext('2d');
  max = Math.max(4, ...[...A.q].filter(v => !Number.isNaN(v)), ...HIST.flatMap(h => [...h.q].filter(v => !Number.isNaN(v)))) + 1;
  axes(c, max); HIST.forEach((h, i) => plotLine(c, h.q, max, ['#6b7182', '#474c5c', '#2f3340'][i], 1)); plotLine(c, A.q, max, '#e08f5a', 2);
  // zones stacked
  c = document.getElementById('pZ').getContext('2d');
  const n = A.occ.length, stack = new Float32Array(n).fill(0); const layers = [];
  for (const [k] of ZONES) { const z = A.zones[k]; const arr = new Float32Array(n); for (let i = 0; i < n; i++) { if (Number.isNaN(z[i])) { arr[i] = NaN; continue; } stack[i] += z[i]; arr[i] = stack[i]; } layers.push(arr); }
  max = Math.max(8, ...[...stack]) + 2; axes(c, max);
  layers.forEach((arr, i) => plotLine(c, arr, max, ZONES[i][2], 1.5));
  // histogram of waits
  c = document.getElementById('pH').getContext('2d'); const W_ = c.canvas.width, H_ = c.canvas.height;
  c.fillStyle = '#10131c'; c.fillRect(0, 0, W_, H_);
  const bins = new Array(12).fill(0); for (const w of A.waits) bins[Math.min(11, Math.floor(w))]++;
  const bm = Math.max(1, ...bins); const bw = (W_ - 30) / 12;
  c.font = '9px Silkscreen, monospace';
  bins.forEach((v, i) => { const h = v / bm * (H_ - 22); c.fillStyle = '#4a8acb'; c.fillRect(26 + i * bw + 1, H_ - 12 - h, bw - 2, h); c.fillStyle = '#6b7182'; if (i % 2 === 0) c.fillText(i === 11 ? '11+' : String(i), 26 + i * bw + 2, H_ - 2); });
  c.fillStyle = '#6b7182'; c.fillText(String(bm), 2, 10);
  setText('pHv', tx(`${A.waits.length} waits`, `${A.waits.length} 次等待`));
}
// ---------------------------------------------------------------- follow card
const cardEl = document.getElementById('card');
let followA = null, focusS = null;
function clearFollow() { followA = null; focusS = null; view.follow = null; cardEl.style.display = 'none'; }
function updateCard() {
  if (followA) {
    const a = followA;
    if (!a.visible && a.state === 'gone') { cardEl.innerHTML = `<h3><span>${trName(a.name)}</span><button id="cardX">×</button></h3><div class="now">${tr('Gone home')}</div>`; }
    else {
      const e = a.kind === 'member' && a.state === 'ex' ? a.prog[a.exI] : null;
      let now = tr(({ arrive: 'Arriving', queueOut: 'Waiting outside (gym full)', toDesk: 'Checking in', desk: 'At the front desk', toLocker: 'Heading to the changing room', locker: 'Changing', toLockerOut: 'Done, heading to change', lockerOut: 'Changing', toExit: 'Leaving', leaveSite: 'Leaving', busWait: 'Waiting for the bus', inCar: 'Parking' })[a.state] || '');
      if (e) {
        const L = LIFTS[e.lift], set = e.sets[Math.min(e.setI, e.sets.length - 1)], ln = tr(L.name);
        const kg = set && set.kg ? ` · ${L.kind === 'db' ? set.kg + tx(' kg DBs', ' kg 啞鈴') : set.kg + ' kg'}` : '';
        const sn = `${e.setI + 1}/${e.sets.length}`, rp = set && set.reps > 1 ? `${Math.min(set.reps, (e.rep || 0) + 1)}/${set.reps}` : '';
        now = (zh() ? { wait: `等待${ln} · ${Math.round((A.t - e.waitT) / 60)}/${S.patience} 分`, walk: `走向${ln}`, setup: `裝槓片 · ${ln}`, spotwait: '等待保護者', set: `${ln} · 第 ${sn} 組${kg}${rp ? ` · 第 ${rp} 下` : ''}`, rest: `休息中 · 下一組：${ln} 第 ${sn} 組${e.shared ? '（輪流使用）' : ''}`, cardio: `${ln} · 剩 ${Math.max(0, Math.ceil((e.endT - A.t) / 60))} 分`, mat: '伸展中', finish: '卸下槓片' }
          : { wait: `Waiting for ${ln} · ${Math.round((A.t - e.waitT) / 60)}/${S.patience} min`, walk: `Walking to ${ln}`, setup: `Loading · ${ln}`, spotwait: 'Waiting for a spotter', set: `${ln} · set ${sn}${kg}${rp ? ` · rep ${rp}` : ''}`, rest: `Resting · ${ln} set ${sn} next${e.shared ? ' (working in)' : ''}`, cardio: `${ln} · ${Math.max(0, Math.ceil((e.endT - A.t) / 60))} min left`, mat: 'Stretching', finish: 'Stripping the bar' })[e.st] || ln;
      }
      if (a.kind !== 'member') now = a.kind === 'cleaner' ? tr(a.task ? ({ strip: 'Stripping a loaded bar', db: 'Returning stray dumbbells', wipe: 'Wiping down equipment' })[a.task.kind] : 'On patrol') : a.kind === 'staff' ? tr('Front desk') : a.kind === 'pcoach' ? tx(`Coaching ${a.client.name}`, `指導 ${a.client.name}`) : tr(a.spotFor ? 'Spotting' : 'Coaching the floor');
      const arch = tr({ power: 'Powerlifter', oly: 'Olympic lifter', body: 'Bodybuilder', beginner: 'Beginner', client: 'Client (with coach)' }[a.arch] || ({ staff: 'Staff', cleaner: 'Cleaner', coach: 'Head coach', pcoach: 'Personal coach' })[a.kind]);
      const prog = a.prog ? '<ol>' + a.prog.map((p, i) => `<li class="${i < a.exI ? 'done' : i === a.exI && a.state === 'ex' ? 'cur' : ''}">${tr(LIFTS[p.lift].name)}${p.kind === 'cardio' || p.kind === 'mat' ? ` ${p.dur}${MIN()}` : ` ${p.sets.length}×${p.sets[p.sets.length - 1].reps}`}</li>`).join('') + '</ol>' : '';
      cardEl.innerHTML = `<h3><span>${trName(a.name)}</span><button id="cardX" aria-label="${tr('Stop following')}">×</button></h3><div style="color:var(--muted)">${arch}${a.arr ? tx(` · arrived ${hhmm(a.arr)}`, ` · ${hhmm(a.arr)} 到場`) : ''}</div><div class="now">${now}</div>${prog}`;
    }
    cardEl.style.display = 'block';
  } else if (focusS) {
    const s = focusS; const nm = tr(s.type === 'rack' ? 'Power rack' : s.type === 'olyplat' ? 'Olympic platform' : (LIFTS[Object.keys(LIFTS).find(k => LIFTS[k].types[0] === s.type)] || { name: s.type }).name);
    const users = s.users.map(u => trName(u.name)).join(tx(', ', '、')) || tr('free');
    const q = s.queue.length ? s.queue.map(u => `${trName(u.name)} (${Math.round((A.t - (u.prog[u.exI].waitT || A.t)) / 60)}${tx('m', ' 分')})`).join(tx(', ', '、')) : tr('nobody');
    cardEl.innerHTML = `<h3><span>${s.type === 'bench' ? tr('Adjustable bench') : s.type === 'dbspot' ? tr('Dumbbell spot') : s.type === 'sled' ? tr('Sled lane') : s.type === 'mat' ? tr('Stretch mat') : nm}</span><button id="cardX" aria-label="${tr('Close')}">×</button></h3><div class="now">${tx('On it: ', '使用中：')}${users}</div><div>${tx('Queue: ', '排隊：')}${q}</div>${s.load > 20 || s.dirty > 20 ? `<div style="color:var(--muted)">${tx('Bar: ', '槓鈴：')}${s.dirty > 20 ? s.dirty + tx(' kg left loaded', ' kg 沒卸') : s.load + ' kg'}</div>` : ''}`;
    cardEl.style.display = 'block';
  }
  const x = document.getElementById('cardX'); if (x) x.onclick = clearFollow;
}
