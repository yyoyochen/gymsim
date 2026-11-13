
// ================================================================ lighting follows the gym clock
const TOD = {
  day: { sun: [-0.45, 0.82, 0.36], sunC: '#fff3dc', sunI: 2.7, sky: '#cfe4ff', gnd: '#5b7a3c', hemiI: 1.55, top: '#4a8acb', bot: '#a5cdf0', exp: 1.05, lights: 0 },
  dusk: { sun: [-0.86, 0.24, 0.46], sunC: '#ffa060', sunI: 1.8, sky: '#ffb07a', gnd: '#3b2c3a', hemiI: 0.95, top: '#4d2a5e', bot: '#f0a060', exp: 1.15, lights: 0.8 },
  night: { sun: [0.35, 0.78, -0.45], sunC: '#9fb8ff', sunI: 0.35, sky: '#3a4a80', gnd: '#141a28', hemiI: 0.6, top: '#0b1a33', bot: '#13305a', exp: 1.3, lights: 1 }
};
const _ca = new THREE.Color(), _cb = new THREE.Color(), _va = new V3(), _vb = new V3(), _lt = { sun: new V3(), sunC: new THREE.Color(), sky: new THREE.Color(), gnd: new THREE.Color(), top: new V3(), bot: new V3() };
const _gray = linCol('#959bab'), _grayT = linCol('#6b7182'), winE = new THREE.Color('#ffd08a');
function mixTOD(a, b, k) {
  const A_ = TOD[a], B_ = TOD[b];
  _lt.sun.set(...A_.sun).lerp(_va.set(...B_.sun), k).normalize();
  _lt.sunC.set(A_.sunC).lerp(_ca.set(B_.sunC), k); _lt.sky.set(A_.sky).lerp(_ca.set(B_.sky), k); _lt.gnd.set(A_.gnd).lerp(_ca.set(B_.gnd), k);
  _lt.top.copy(linCol(A_.top)).lerp(linCol(B_.top), k); _lt.bot.copy(linCol(A_.bot)).lerp(linCol(B_.bot), k);
  _lt.sunI = lerp(A_.sunI, B_.sunI, k); _lt.hemiI = lerp(A_.hemiI, B_.hemiI, k); _lt.exp = lerp(A_.exp, B_.exp, k); _lt.lights = lerp(A_.lights, B_.lights, k);
}
const _sunQ = new V3();
function todAt(h) {
  if (h < 5.4) mixTOD('night', 'night', 0); else if (h < 6.3) mixTOD('night', 'dusk', (h - 5.4) / 0.9); else if (h < 7.3) mixTOD('dusk', 'day', h - 6.3);
  else if (h < 17.6) mixTOD('day', 'day', 0); else if (h < 18.8) mixTOD('day', 'dusk', (h - 17.6) / 1.2); else if (h < 19.8) mixTOD('dusk', 'night', h - 18.8); else mixTOD('night', 'night', 0);
}
// street lamp looks (the first is the default)
const LAMP_STYLES = {
  warm:  { col: [1.0, 0.68, 0.36], amt: 0.6,  mul: 0.0, pool: 1.0, soft: 1.5, r: 1.1, cone: 0, halo: 0 },
  lit:   { col: [1.0, 0.8, 0.52], amt: 0.06, mul: 2.6, pool: 1.0, soft: 1.1, r: 1.1, cone: 0, halo: 0 },
  cone:  { col: [1.0, 0.74, 0.42], amt: 0.45, mul: 0.5, pool: 0.9, soft: 1.5, r: 1.0, cone: 1.3, halo: 0.6 },
  halo:  { col: [1.0, 0.7, 0.4], amt: 0.4, mul: 0.6, pool: 0.85, soft: 1.7, r: 0.9, cone: 0, halo: 1.4 },
  led:   { col: [0.82, 0.9, 1.0], amt: 0.3, mul: 1.0, pool: 0.8, soft: 1.0, r: 1.6, cone: 0, halo: 0.8 }
};
let _lampKey = '';
function applyLampStyle(on) {
  const st = LAMP_STYLES[window.__lampStyle] || LAMP_STYLES.led, pu = postMat.uniforms;
  if (_lampKey !== (window.__lampStyle || 'led')) { _lampKey = window.__lampStyle || 'led'; for (const m of POOLS.children) { if (m.userData.s0 === undefined) m.userData.s0 = m.scale.x; const k = st.r; m.scale.x = m.userData.s0 * k; m.scale.z = (m.userData.sz0 ?? (m.userData.sz0 = m.scale.z)) * k; } }
  pu.glowCol.value.set(st.col[0], st.col[1], st.col[2]); pu.glowAmt.value = st.amt; pu.glowMul.value = st.mul;
  poolMat.uniforms.strength.value = st.pool * on; poolMat.uniforms.soft.value = st.soft; POOLS.visible = on > 0.05;
  coneMat.uniforms.strength.value = st.cone * on; CONES.visible = st.cone > 0 && on > 0.05;
  haloMat.uniforms.strength.value = st.halo * on; HALOS.visible = st.halo > 0 && on > 0.05;
}
function applyLighting(t) {
  // the sun's direction moves in 10-minute steps so shadows hold still instead of crawling every frame
  // light colours and levels change in 5-minute steps: with a 64-colour palette a continuous fade makes colour bands crawl across the floor
  const h = t / 3600; todAt(Math.round(h * 6) / 6); _sunQ.copy(_lt.sun); todAt(Math.round(h * 12) / 12); _lt.sun.copy(_sunQ);
  const rr = Math.round(env.rainAmt * 8) / 8, heat = S.weather === 'Heatwave' ? 1 : 0;
  sun.position.copy(_lt.sun).multiplyScalar(80); sun.color.copy(_lt.sunC); sun.intensity = _lt.sunI * (1 - 0.6 * rr) * (1 + 0.15 * heat);
  hemi.color.copy(_lt.sky); hemi.groundColor.copy(_lt.gnd); hemi.intensity = _lt.hemiI * (1 - 0.2 * rr);
  const lightsOn = Math.max(_lt.lights, rr * 0.6);
  for (const l of hallLights) l.intensity = lightsOn * 22;
  for (const l of lotLights) l.intensity = 0; applyLampStyle(_lt.lights);   // street lamps glow but don't throw round pools (the 64-colour palette turns those into curved bands)
  winMat.emissive.copy(winE).multiplyScalar(lightsOn * 0.8); lampMat.emissive.copy(winE).multiplyScalar(_lt.lights); signMat.emissive.setRGB(_lt.lights * 0.9, _lt.lights * 0.9, _lt.lights * 0.3); for (const m of signMats) m.emissive.setScalar(_lt.lights * 0.7); for (const m of hSignMats) m.emissive.setScalar(_lt.lights * 0.7);
  const pu = postMat.uniforms, g = rr * (_lt.lights > 0.8 ? 0.25 : 0.6);
  pu.skyTop.value.copy(_lt.top).lerp(_grayT, g); pu.skyBot.value.copy(_lt.bot).lerp(_gray, g);
  if (heat) pu.skyBot.value.lerp(linCol('#ffd08a'), 0.25 * (1 - _lt.lights));
  // backdrop: horizon glow, sun and moon on their arcs (sunrise 06:00, sunset 18:30), clouds by weather, land by setting
  pu.skyHor.value.copy(pu.skyBot.value).lerp(_va.set(_lt.sunC.r, _lt.sunC.g, _lt.sunC.b), 0.35 * (1 - g));
  pu.sunCol.value.set(_lt.sunC.r, _lt.sunC.g, _lt.sunC.b);
  { const sH = (h - 6) / 12.5, up = sH > 0 && sH < 1 ? Math.min(1, Math.sin(Math.PI * sH) * 4) : 0;
    pu.sunP.value.set(0.08 + 0.84 * sH, 0.79 + Math.sin(Math.PI * clamp(sH, 0, 1)) * 0.17, up * (1 - 0.8 * rr));
    let mH = h - 18.5; if (mH < 0) mH += 24; mH /= 11.5; const mu = mH > 0 && mH < 1 ? Math.min(1, Math.sin(Math.PI * mH) * 4) * (1 - up) : 0;
    pu.moonP.value.set(0.08 + 0.84 * mH, 0.8 + Math.sin(Math.PI * clamp(mH, 0, 1)) * 0.15, mu * (1 - 0.8 * rr)); }
  pu.tSec.value = performance.now() / 1000; pu.cover.value = heat ? 0.15 : 0.35 + 0.6 * rr; pu.rainy.value = rr;
  pu.setting.value = curSetting === 'Rural' ? 2 : curSetting === 'Suburban' ? 1 : 0;
  pu.shift.value.set(view.az * 0.6 + view.target.x * 0.003, 0);
  { const LAND = { Urban: ['#959bab', '#474c5c'], Suburban: ['#8cc456', '#317033'], Rural: ['#bfe07a', '#448c3a'] }[curSetting || 'Urban'];
    const dl = lerp(1, 0.22, _lt.lights) * (1 - 0.35 * rr);
    pu.landA.value.copy(linCol(LAND[0])).multiplyScalar(dl).lerp(pu.skyHor.value, 0.35); pu.landB.value.copy(linCol(LAND[1])).multiplyScalar(dl * 0.9); }
  pu.exposure.value = _lt.exp * (1 + 0.06 * heat); pu.night.value = _lt.lights > 0.9 && rr < 0.3 ? 1 : 0;
}
// ================================================================ picking: tap a person to follow, or a station to inspect
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), gPlane = new THREE.Plane(new V3(0, 1, 0), 0), hitP = new V3(), _pv = new V3();
const ZMIN = 0.6, ZMAX = 10;   // furthest view is locked so the board always fills the screen
const ptrs = new Map(); let pinch0 = 0, zoom0 = 1, downAt = null, panning = false, panLast = null;
const _pr2 = new V3(), _pf2 = new V3();
function panBy(dx, dy) {   // screen pixels -> ground movement so the ground follows the pointer
  const r = canvas.getBoundingClientRect(); const wpp = (view.baseH / view.zoom) / r.height;
  _pr2.copy(_cr); _pr2.y = 0; _pr2.normalize(); _pf2.copy(_cf); _pf2.y = 0; _pf2.normalize();
  view.target.addScaledVector(_pr2, -dx * wpp).addScaledVector(_pf2, dy * wpp / Math.sin(view.el));
  view.target.x = clamp(view.target.x, -40, 40); view.target.z = clamp(view.target.z, -36, 38);
  if (window.__clampView !== false) keepViewOnBoard();
  view.follow = null;
}
canvas.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') return; canvas.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (ptrs.size === 1) { downAt = { x: e.clientX, y: e.clientY }; panLast = { x: e.clientX, y: e.clientY }; panning = false; } if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); zoom0 = view.zoomT; downAt = null; panning = false; panLast = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; } });
canvas.addEventListener('pointermove', (e) => {
  if (e.pointerType === 'touch' || !ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptrs.size === 2 && pinch0 > 0) { const [a, b] = [...ptrs.values()]; view.zoomT = clamp(zoom0 * Math.hypot(a.x - b.x, a.y - b.y) / pinch0, ZMIN, ZMAX); const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; panBy(m.x - panLast.x, m.y - panLast.y); panLast = m; return; }
  if (ptrs.size === 1 && panLast) {
    if (!panning && downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 6) { panning = true; canvas.classList.add('panning'); }
    if (panning) { panBy(e.clientX - panLast.x, e.clientY - panLast.y); panLast = { x: e.clientX, y: e.clientY }; }
  }
});
canvas.addEventListener('pointerup', (e) => {
  if (e.pointerType === 'touch') return;
  if (ptrs.size === 1 && downAt && !panning && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) < 8) pickAt(e.clientX, e.clientY);
  ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch0 = 0; if (ptrs.size === 0) { downAt = null; panning = false; canvas.classList.remove('panning'); }
  else if (ptrs.size === 1) { const p = [...ptrs.values()][0]; panLast = { x: p.x, y: p.y }; downAt = null; }
});
canvas.addEventListener('pointercancel', (e) => { if (e.pointerType === 'touch') return; ptrs.delete(e.pointerId); downAt = null; panning = false; canvas.classList.remove('panning'); });
canvas.addEventListener('wheel', (e) => { e.preventDefault(); view.zoomT = clamp(view.zoomT * Math.exp(-e.deltaY * 0.0012), ZMIN, ZMAX); }, { passive: false });

// ---------------------------------------------------------------- touch: two fingers pinch to zoom (about the fingers) and move together to pan; one finger drags or taps
const TCH = { mode: null, d0: 0, z0: 1, last: null, start: null, moved: false };
const tMid = (ts) => ({ x: (ts[0].clientX + ts[1].clientX) / 2, y: (ts[0].clientY + ts[1].clientY) / 2 });
const tDist = (ts) => Math.max(1, Math.hypot(ts[0].clientX - ts[1].clientX, ts[0].clientY - ts[1].clientY));
function screenCentre() { const r = canvas.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height * (0.5 - (view.yOff || 0)) }; }
function twoStart(ts) { TCH.mode = 'two'; TCH.d0 = tDist(ts); TCH.z0 = view.zoom = view.zoomT; TCH.last = tMid(ts); TCH.moved = true; }
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault(); const ts = e.touches;
  if (ts.length === 1) { TCH.mode = 'one'; TCH.start = { x: ts[0].clientX, y: ts[0].clientY }; TCH.last = { ...TCH.start }; TCH.moved = false; }
  else twoStart(ts);
}, { passive: false });
canvas.addEventListener('touchmove', (e) => {
  e.preventDefault(); const ts = e.touches;
  if (ts.length >= 2) {
    if (TCH.mode !== 'two') twoStart(ts);
    const m = tMid(ts); panBy(m.x - TCH.last.x, m.y - TCH.last.y); TCH.last = m;
    const z1 = view.zoom, z2 = clamp(TCH.z0 * tDist(ts) / TCH.d0, ZMIN, ZMAX);
    if (Math.abs(z2 - z1) > 1e-4) { view.zoom = view.zoomT = z2; const c = screenCentre(), k = 1 - z2 / z1; panBy((m.x - c.x) * k, (m.y - c.y) * k); }
  } else if (ts.length === 1 && TCH.last) {
    const p = { x: ts[0].clientX, y: ts[0].clientY };
    if (!TCH.moved && TCH.start && Math.hypot(p.x - TCH.start.x, p.y - TCH.start.y) > 8) { TCH.moved = true; canvas.classList.add('panning'); }
    if (TCH.moved) panBy(p.x - TCH.last.x, p.y - TCH.last.y);
    TCH.last = p;
  }
}, { passive: false });
function touchEnd(e) {
  e.preventDefault(); const ts = e.touches;
  if (ts.length === 0) { if (TCH.mode === 'one' && !TCH.moved && TCH.start && e.type === 'touchend') pickAt(TCH.start.x, TCH.start.y); TCH.mode = null; TCH.last = null; canvas.classList.remove('panning'); }
  else if (ts.length === 1) { TCH.mode = 'one'; TCH.moved = true; TCH.last = { x: ts[0].clientX, y: ts[0].clientY }; }   // lifting one finger of a pinch never counts as a tap
  else twoStart(ts);
}
canvas.addEventListener('touchend', touchEnd, { passive: false }); canvas.addEventListener('touchcancel', touchEnd, { passive: false });

for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });   // stop iOS zooming the whole page
function pickAt(cx, cy) {
  const r = canvas.getBoundingClientRect(); const x = cx - r.left, y = cy - r.top;
  let best = null, bd = 26;
  for (const a of AGENTS) {
    if (!a.visible || a.P.hidden || !a.vis.head) continue;
    for (const p of [a.vis.head, a.P.H]) { _pv.copy(p).project(cam); const sx = (_pv.x + 1) / 2 * r.width, sy = (1 - _pv.y) / 2 * r.height; const d = Math.hypot(sx - x, sy - y); if (d < bd) { bd = d; best = a; } }
  }
  if (best) { followA = best; focusS = null; view.follow = best; updateCard(); return; }
  ndc.set(x / r.width * 2 - 1, -(y / r.height) * 2 + 1); ray.setFromCamera(ndc, cam);
  if (ray.ray.intersectPlane(gPlane, hitP)) {
    let s0 = null, sd = 1.6; for (const s of STATIONS) { const d = Math.hypot(s.x - hitP.x, s.z - hitP.z); if (d < sd) { sd = d; s0 = s; } }
    if (s0) { focusS = s0; followA = null; view.follow = null; updateCard(); return; }
  }
  clearFollow();
}
document.getElementById('rotL').addEventListener('click', () => { view.azT -= Math.PI / 2; });
document.getElementById('rotR').addEventListener('click', () => { view.azT += Math.PI / 2; });
document.getElementById('zoomIn').addEventListener('click', () => { view.zoomT = clamp(view.zoomT * 1.25, ZMIN, ZMAX); });
document.getElementById('zoomOut').addEventListener('click', () => { view.zoomT = clamp(view.zoomT / 1.25, ZMIN, ZMAX); });
window.addEventListener('keydown', (e) => { if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return; if (e.key === 'q' || e.key === 'Q') view.azT -= Math.PI / 2; if (e.key === 'e' || e.key === 'E') view.azT += Math.PI / 2; if (e.key === ' ') { e.preventDefault(); W.go.click(); }
  const k = { ArrowLeft: [40, 0], a: [40, 0], A: [40, 0], ArrowRight: [-40, 0], d: [-40, 0], D: [-40, 0], ArrowUp: [0, 40], w: [0, 40], W: [0, 40], ArrowDown: [0, -40], s: [0, -40], S: [0, -40] }[e.key];
  if (k) { e.preventDefault(); panBy(k[0], k[1]); } });

// ================================================================ render
const reflClear = new THREE.Color();
function render() {
  puddleMat.uniforms.wet.value = env.wet; puddleMat.uniforms.time.value = performance.now() / 1000;
  puddles.visible = env.wet > 0.02;
  if (puddles.visible) {
    puddles.visible = false; under.visible = false; floorMesh.visible = false; const rv = rain.visible; rain.visible = false;
    world.scale.y = -1; renderer.shadowMap.autoUpdate = false;
    const b = postMat.uniforms.skyBot.value; reflClear.setRGB(b.x, b.y, b.z, THREE.LinearSRGBColorSpace); renderer.setClearColor(reflClear, 1);
    renderer.setRenderTarget(rtRefl); renderer.clear(); renderer.render(scene, cam);
    world.scale.y = 1; renderer.shadowMap.autoUpdate = true; renderer.setClearColor(0x000000, 1);
    puddles.visible = true; under.visible = true; floorMesh.visible = true; rain.visible = rv; puddleMat.uniforms.tRefl.value = rtRefl.texture;
  }
  renderer.setRenderTarget(rtMain); renderer.clear(); renderer.render(scene, cam);
  renderer.setRenderTarget(rtPost); renderer.render(postScene, postCam);
  renderer.setRenderTarget(null); renderer.render(blitScene, postCam);
}
// ================================================================ main loop
const focusV = new V3();
let last = performance.now(), simAcc = 0, uiT = 0, plotT = 0;
function frame(now) { requestAnimationFrame(frame); const real = Math.min(0.25, Math.max(0, (now - last) / 1000)); last = now; try { tick(real, now); } catch (err) { if (!frame.warned) { frame.warned = true; console.error(err); } } }   // one bad frame must never freeze the sim
function advance(real) {
  if (!playing()) return;
  simAcc += real * S.speed; let n = 0;
  while (simAcc >= STEP && n < 1200) { simStep(); simAcc -= STEP; n++; if (A.done) { goOn = false; refreshGo(); showToast(tr('Day complete · press Setup or Go for a new day')); break; } }
}
// the furthest view never shows past the board: zoom in just enough, and keep the target where every screen corner lands on the board
const _vc = new V3();
function keepViewOnBoard() {
  if (_cr.lengthSq() < 1e-6 || !(scene.fog.near > 0)) return;   // camera axes not set up yet on the very first frame
  const E = scene.fog.color.r - 1, S = scene.fog.color.g - 1, Wb = scene.fog.color.b - 1, N = scene.fog.near - 1;
  const fitAt = (z) => {   // allowed target ranges for a zoom, or null if the view is wider than the board
    const H2 = view.baseH / z / 2, W2 = H2 * aspect;
    let x0 = -1e9, x1 = 1e9, z0 = -1e9, z1 = 1e9;
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {   // the bottom corners may reach 26 m past the edge, into the fade
      // with the phone sheet open only the top of the frame is visible: the bottom corners sit at the sheet's edge
      const top = H2 - (view.yOff || 0) * 2 * H2, vis = (view.yOff || 0) > 0.01 ? 0.48 : 1;
      _vc.copy(_cr).multiplyScalar(sx * W2).addScaledVector(_cu, sy > 0 ? top : top - vis * 2 * H2);
      const k = -(view.target.y + _vc.y) / _cf.y; const ox = _vc.x + _cf.x * k, oz = _vc.z + _cf.z * k;
      const m = sy < 0 ? 26 : 0; x0 = Math.max(x0, -Wb - m - ox); x1 = Math.min(x1, E + m - ox); z0 = Math.max(z0, -N - m - oz); z1 = Math.min(z1, S + m - oz);
    }
    return x0 <= x1 && z0 <= z1 ? [x0, x1, z0, z1] : null;
  };
  // hard stops, no springing back: the zoom target never goes further out than the board allows,
  // and the pan target is clamped against the zoom actually on screen, before the camera is placed
  let z = view.zoomT;
  if (!fitAt(z)) { while (!fitAt(z) && z < ZMAX) z *= 1.01; view.zoomT = z; }
  if (view.zoom < view.zoomT && !fitAt(view.zoom)) view.zoom = view.zoomT;
  const r = fitAt(view.zoom) || fitAt(view.zoomT);
  if (r) { view.target.x = clamp(view.target.x, r[0], r[1]); view.target.z = clamp(view.target.z, r[2], r[3]); }
}
function tick(raw, now) {
  advance(raw);                        // the sim keeps true speed on slow devices (up to 4 fps)
  const real = Math.min(0.05, raw);    // animation steps stay small
  env.raining = S.weather === 'Rain';
  env.rainAmt = clamp(env.rainAmt + (env.raining ? 1 : -1) * real * 0.4, 0, 1);
  env.wet = clamp(env.wet + (env.rainAmt > 0.2 ? real * 0.08 * env.rainAmt : -real * 0.02), 0, 1);
  for (const pd of puddles.children) { const s = pd.userData.r * (0.35 + 0.65 * env.wet); pd.scale.set(s * 1.4, 1, s); }
  if (view.follow && view.follow.visible) view.target.lerp(_va.set(view.follow.pos.x, 0, view.follow.pos.z), Math.min(1, real * 4));
  view.yOffT = window.innerWidth < 860 && !panel.classList.contains('closed') ? 0.24 : 0;
  updateWalls(real); if (window.__clampView !== false) keepViewOnBoard(); const wpp = updateCamera(real);
  FRAME++;
  BOX.begin(); CYL.begin(); vBegin();
  if (A) {
    // heads follow the nearest action
    for (const a of AGENTS) {
      if (!a.visible) continue;
      if (a.kind === 'member' && a.state === 'ex') { const e = a.prog[a.exI]; a.lookAt = e && e.st === 'wait' && e.waitS ? _lookOf(e.waitS) : null; }
      else if (a.kind === 'staff') a.lookAt = null;
      else a.lookAt = null;
      animAgent(a, real, now);
    }
    drawStations(now); drawVehicles(real);
  }
  BOX.end(); CYL.end(); vEnd();
  applyLighting(A ? A.t : 12 * 3600);
  updateRain(real * (playing() ? 1 : 0.3));
  applySetting(S.setting);
  clouds.position.x = Math.sin(now / 50000) * 6;
  uiT -= real; if (uiT <= 0) { uiT = 0.2; updateMonitors(); if (followA || focusS) updateCard(); }
  plotT -= real; if (plotT <= 0) { plotT = 0.5; drawPlots(); }
  { // portal clock shows the gym clock (the HUD time) on an ordinary 12-hour face
    const gt = A ? A.t : 12 * 3600, h = (gt / 3600) % 12, m = (gt / 60) % 60;
    hourHand.rotation.z = -h / 12 * Math.PI * 2; minHand.rotation.z = -m / 60 * Math.PI * 2;
  }
  updatePays();
  render();
}
// ================================================================ "+NT$" pops at the gate as members pay on the way out
const PAYS = [], _payV = new V3();
let payNext = 0, payDing = 0, payRun = null;
function updatePays() {
  const now = performance.now();
  if (A !== payRun) { payRun = A; for (const p of PAYS) p.el.remove(); PAYS.length = 0; payNext = 0; }   // a new run (Setup) clears pops still waiting from the old one
  if (A && A.payQ && A.payQ.length) {
    const q = A.payQ.splice(0);
    // fast-forward can bill dozens at once: show the latest few floor fees, and every PT sale
    const last = (f, n) => q.filter(f).slice(-n);
    const show = [...last(p => !p.pt && !p.rent, 3), ...last(p => p.rent, 2), ...last(p => p.pt, 3)];   // after a fast-forward: a few of each kind, PT sales last
    for (const p of show) {
      // colour: green = money in (fee, rent), yellow = capped visit, gold = PT sale (gold is reserved for it)
      const crit = !p.pt && !p.rent && p.fee >= PRICE.cap;   // hit the per-visit cap: the "critical hit"
      const el = document.createElement('div'); el.className = 'pay' + (p.pt ? ' pt' : p.rent ? ' rent' : crit ? ' crit' : ''); el.style.opacity = 0;
      el.innerHTML = `+$${p.fee.toLocaleString('en-US')}${p.pt ? `<small>PT ×${p.pt.n}${p.pt.inst ? ' · ' + p.pt.inst : ''}!</small>` : p.rent ? '<small>RENT</small>' : crit ? '<small>MAX!</small>' : ''}`;
      document.body.appendChild(el);
      payNext = Math.max(now, payNext + (p.pt ? 700 : 450));
      const side = Math.random() < 0.5 ? -1 : 1;
      PAYS.push({ el, born: payNext, pt: !!p.pt, vx: side * (p.pt ? 6 : 14 + Math.random() * 22), size: p.pt ? 2.1 : 0.8 + Math.min(1, p.fee / PRICE.cap) * 0.6 + (crit ? 0.25 : 0), rung: false });
    }
  }
  const r = canvas.getBoundingClientRect();
  _payV.set(DOOR.x, 2.6, HZ).project(cam);   // the gate: numbers burst from here, they don't follow the member
  const gx = r.left + (_payV.x + 1) / 2 * r.width, gy = r.top + (1 - _payV.y) / 2 * r.height;
  for (let i = PAYS.length - 1; i >= 0; i--) {
    const p = PAYS[i], ms = now - p.born, k = ms / (p.pt ? 2600 : 1300);
    if (k < 0) continue;
    if (k >= 1) { p.el.remove(); PAYS.splice(i, 1); continue; }
    if (!p.rung) { p.rung = true; if (p.pt) sfx('jackpot'); else if (now - payDing > 120) { payDing = now; sfx('cash'); } }
    // RPG damage number: punch in big, settle, hop up on an arc, drift sideways, fade at the end
    const s = ms / 1000, punch = ms < 90 ? 0.3 + ms / 90 * 1.4 : ms < 220 ? 1.7 - (ms - 90) / 130 * 0.7 : 1;
    let y = -(150 * s - 170 * s * s) - 18 * s, x = p.vx * s;   // fast hop that slows near its peak, then sinks a little
    if (p.pt) {   // the PT sale: a bigger, slower rise that hangs in the air and shakes like a level-up
      y = -70 * (1 - Math.exp(-s * 3.2));
      if (ms > 120 && ms < 900) { x += Math.sin(ms / 22) * 3 * (1 - ms / 900); y += Math.cos(ms / 17) * 2 * (1 - ms / 900); }
      p.el.style.filter = `brightness(${(1.1 + 0.25 * Math.sin(ms / 70)).toFixed(2)})`;   // gold glints
    }
    p.el.style.transform = `translate(${gx + x}px, ${gy + y}px) translate(-50%, -100%) scale(${(punch * p.size).toFixed(3)})`;
    p.el.style.opacity = k < 0.7 ? 1 : (1 - k) / 0.3;
  }
}
const _lv = new V3(); function _lookOf(s) { return _lv.set(s.x, 1.2, s.z); }
// ================================================================ boot
window.addEventListener('resize', () => { onResize(); positionUI(); placePlots(); });
function positionUI() { panel.style.width = panelW ? panelW + 'px' : ''; document.getElementById('viewbar').style.left = ''; }
onResize(); positionUI();
// sound toggle sits with the language toggle (the audio can only start after a click, so it begins muted)
const sndBtn = document.getElementById('sndBtn');
function refreshSnd() { sndBtn.classList.toggle('on', soundOn); sndBtn.setAttribute('aria-pressed', soundOn); sndBtn.title = tr(soundOn ? 'Sound on' : 'Sound off'); sndBtn.setAttribute('aria-label', sndBtn.title); }
sndBtn.addEventListener('click', () => { soundOn = !soundOn; if (soundOn) ensureAudio(); refreshSnd(); });
buildPanel(); placePlots(); setLang(LANG);
document.getElementById('langBtn').addEventListener('click', () => setLang(zh() ? 'en' : 'zh'));
setupRun(); refreshPending();
goOn = true; refreshGo();
if (window.innerWidth < 860) panel.classList.add('closed');
if (document.fonts && document.fonts.load) document.fonts.load('700 22px Silkscreen').then(() => { paintSign(); drawWhiteboard(A ? A.wb : 0); drawPRBoard(); }).catch(() => {});
function fastForward(gymSeconds) { const n = Math.round(gymSeconds / STEP); for (let i = 0; i < n && !A.done; i++) simStep(); }
window.__LO = { S, get A() { return A; }, hourHand, minHand, clock, get OBS() { return OBS; }, get followA() { return followA; }, toScreen: (v) => { const r = canvas.getBoundingClientRect(); _pv.copy(v).project(cam); return [r.left + (_pv.x + 1) / 2 * r.width, r.top + (1 - _pv.y) / 2 * r.height]; }, renderer, scene, get RTC() { return RTC; }, MT, VB, groundAt: (cx, cy) => { const r = canvas.getBoundingClientRect(); ndc.set((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam); const h = new V3(); ray.ray.intersectPlane(gPlane, h); return [+h.x.toFixed(2), +h.z.toFixed(2)]; }, STATIONS: () => STATIONS, AGENTS, setupRun, fastForward, tick, view, resultsText, HIST, setGo: (v) => { goOn = v; refreshGo(); } };
requestAnimationFrame(frame);
