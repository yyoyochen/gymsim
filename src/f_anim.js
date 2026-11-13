
// ================================================================ animation: activity -> pose, plus moving props
let FRAME = 0;
const _o = new V3(), _B = new V3(), _ax = new V3(), _t1 = new V3(), _t2 = new V3(), _t3 = new V3(), _D = new V3();
const curveDown = (u) => u < 0.5 ? smooth(u / 0.5) : 1 - smooth((u - 0.5) / 0.5);   // 0 -> 1 -> 0
const isOutside = (p) => Math.abs(p.x) > HX - 0.2 || Math.abs(p.z) > HZ - 0.2;
// ---------------------------------------------------------------- props
function drawBar(c, ax, load, bumper, sagK = 1) {
  const sag = Math.min(0.09, load * 0.00028) * sagK;
  const pt = (d, out) => out.copy(c).addScaledVector(ax, d).addScaledVector(UP, -sag * (d / 1.1) * (d / 1.1));
  const segs = [-1.1, -0.66, -0.3, 0.3, 0.66, 1.1];
  for (let i = 0; i < segs.length - 1; i++) { pt(segs[i], _t1); pt(segs[i + 1], _t2); cylAB(_t1, _t2, Math.abs(segs[i]) > 0.6 && Math.abs(segs[i + 1]) > 0.6 ? 0.028 : 0.017, '#c4c9d4'); }
  const plates = platesFor(load);
  for (const side of [-1, 1]) {
    let d = 0.7;
    for (const p of plates) {
      const [col, dia, th0] = PLATE[p]; const th = bumper && p >= 10 ? th0 * 1.5 : th0; const diam = bumper && p >= 10 ? 0.45 : dia;
      pt(side * d, _t1); pt(side * (d + th), _t2); cylAB(_t1, _t2, diam / 2, bumper && p >= 10 ? (p === 10 ? '#448c3a' : col) : col); d += th + 0.003;
    }
    pt(side * (d + 0.005), _t1); pt(side * (d + 0.04), _t2); cylAB(_t1, _t2, 0.04, '#6b7182');
  }
}
function drawDB(h, ax, kg) {
  const r = 0.05 + kg * 0.0016, L = 0.04 + kg * 0.0013;
  _t1.copy(h).addScaledVector(ax, -0.08); _t2.copy(h).addScaledVector(ax, 0.08); cylAB(_t1, _t2, 0.016, '#959bab');
  for (const sd of [-1, 1]) { _t1.copy(h).addScaledVector(ax, sd * 0.08); _t2.copy(h).addScaledVector(ax, sd * (0.08 + L)); cylAB(_t1, _t2, r, '#1c1f2a'); }
}
// ---------------------------------------------------------------- per agent pose
function animAgent(a, dtR, now) {
  const P = a.P, s = a.look.scale || 1, v = a.vis, act = a.act || { k: 'idle' };
  if (act.k === 'hidden' || !a.visible) { P.hidden = true; return; }
  P.hidden = false;
  const sp = Math.hypot(a.vx, a.vz);
  const simRate = playing() ? Math.min(S.speed, 4) : 0;
  v.walkW += ((sp > 0.1 ? 1 : 0) - v.walkW) * Math.min(1, dtR * 10);
  if (sp > 0.1) { const stride = clamp(sp * 0.2, 0.12, 0.6) * s; v.phase += dtR * simRate * sp * Math.PI / (2 * stride); }
  P.look = a.lookAt || null;
  const pos = a.pos, yaw = a.yaw;
  let arms = act.arms || 'rest';
  if (act.k === 'walk' || act.k === 'idle') {
    poseStand(P, pos, yaw, s, { vx: a.vx, vz: a.vz, walkW: v.walkW, phase: v.phase });
    if (act.k === 'walk') { armsRest(P, s, Math.sin(v.phase) * 0.17 * v.walkW); if (act.carry || a.carry) armsMode(P, s, 'carry', now); }
    else armsMode(P, s, arms, now / 1000);
    if (env.rainAmt > 0.3 && isOutside(pos)) { armsMode(P, s, 'umbrella', 0); _t1.copy(P.hR).addScaledVector(UP, 0.65); CYL.put(1.0, 0, 0, 0, 0.08, 0, 0, 0, 1.0, _t1.x, _t1.y, _t1.z, a.look.shirt === '#1c1f2a' ? '#2f68ab' : '#1c1f2a'); _t2.copy(P.hR); cylAB(_t2, _t1, 0.012, '#1c1f2a'); }
    if (a.carry) { drawDB(_t1.copy(P.hR).addScaledVector(UP, -0.05), _t2.set(Math.cos(yaw), 0, Math.sin(yaw)), 20); }
  } else if (act.k === 'setup') {
    poseStand(P, pos, yaw, s, { crouch: 0.55 }); armsMode(P, s, 'carry', 0);
    frameOf(yaw); P.hR.copy(P.H).addScaledVector(_pf, 0.45 * s).addScaledVector(UP, -0.2 * s); P.hL.copy(P.hR).addScaledVector(_pr, -0.15 * s);
  } else if (act.k === 'spot') {
    poseStand(P, pos, yaw, s, { crouch: 0.25, stance: 0.08 });
    frameOf(yaw); P.hR.copy(P.H).addScaledVector(_pf, 0.45 * s).addScaledVector(UP, 0.35 * s).addScaledVector(_pr, 0.2 * s); P.hL.copy(P.hR).addScaledVector(_pr, -0.4 * s);
  } else if (act.k === 'clean') {
    if (act.kind === 'wipe') { poseStand(P, pos, yaw, s, { crouch: 0.3 }); armsMode(P, s, 'wipe', now / 1000); }
    else { poseStand(P, pos, yaw, s, { crouch: 0.75 }); frameOf(yaw); P.hR.copy(P.H).addScaledVector(_pf, 0.5 * s).addScaledVector(UP, -0.45 * s).addScaledVector(_pr, 0.12 * s); P.hL.copy(P.hR).addScaledVector(_pr, -0.25 * s); }
  } else if (act.k === 'cardio') poseCardio(a, P, act.s, s, now);
  else if (act.k === 'mat') { frameOf(act.s.yaw); _o.set(pos.x, 0.18, pos.z); const k = 0.5 + 0.5 * Math.sin(now / 900 + a.vis.phase); poseSit(P, _o, act.s.yaw, s, { footY: 0.0, legReach: 0.85, lean: 0.3 + 0.6 * k }); P.hR.copy(P.fR).addScaledVector(_pf, -0.15 + -0.3 * (1 - k)).addScaledVector(UP, 0.15); P.hL.copy(P.fL).addScaledVector(_pf, -0.15 + -0.3 * (1 - k)).addScaledVector(UP, 0.15); }
  else if (act.k === 'lift') poseLift(a, P, act, s, now);
  if (now < v.clap) armsMode(P, s, 'clap', now / 1000);
  if (now < v.cheer) armsMode(P, s, 'cheer', now / 1000);
  drawBody(a.look, P, a.vis);
}
function poseCardio(a, P, st, s, now) {
  frameOf(st.yaw); const f = _pf, r = _pr, O = _o.set(st.x, 0, st.z); const tt = now / 1000 * (playing() ? 1 : 0.0) + a.vis.phase;
  if (st.type === 'treadmill') {
    const ph = (a.vis.cph = (a.vis.cph || 0) + 0.12 * (playing() ? 1 : 0));
    poseStand(P, _t3.set(O.x, 0.2, O.z), st.yaw, s, { vx: f.x * 2.6, vz: f.z * 2.6, walkW: 1, phase: ph });
    armsRest(P, s, Math.sin(ph) * 0.2);
  } else if (st.type === 'rower') {
    const ph = (a.vis.cph = (a.vis.cph || 0) + 0.08 * (playing() ? 1 : 0)), k = (1 - Math.cos(ph)) / 2;
    _t3.set(O.x, 0.34, O.z).addScaledVector(f, -0.1 - 0.55 * k);
    P.H.copy(_t3); const lean = 0.45 - 0.7 * k; P.T.set(f.x * Math.sin(lean), Math.cos(lean), f.z * Math.sin(lean)); P.F.set(f.x * Math.cos(lean), -Math.sin(lean), f.z * Math.cos(lean));
    for (const [Fp, sd] of [[P.fL, -1], [P.fR, 1]]) Fp.set(O.x, 0.28, O.z).addScaledVector(f, 0.55).addScaledVector(r, sd * 0.12);
    P.kp.set(0, 1, 0); P.ep = null;
    _t1.copy(_t3).addScaledVector(f, 0.6 - 0.35 * k).addScaledVector(UP, 0.3 + 0.35 * k); P.hR.copy(_t1).addScaledVector(r, 0.12); P.hL.copy(_t1).addScaledVector(r, -0.12);
    aaBox(_t3.x, 0.26, _t3.z, 0.35, 0.06, 0.35, '#1c1f2a', st.yaw);
  } else {
    const ph = (a.vis.cph = (a.vis.cph || 0) + 0.1 * (playing() ? 1 : 0));
    P.H.set(O.x, 1.0, O.z).addScaledVector(f, -0.05);
    const lean = 0.42; P.T.set(f.x * Math.sin(lean), Math.cos(lean), f.z * Math.sin(lean)); P.F.set(f.x * Math.cos(lean), -Math.sin(lean), f.z * Math.cos(lean));
    const cc = _t3.set(O.x, 0.35, O.z).addScaledVector(f, 0.38);
    P.fL.copy(cc).addScaledVector(f, Math.cos(ph) * 0.16).addScaledVector(UP, -Math.sin(ph) * 0.16).addScaledVector(r, -0.12);
    P.fR.copy(cc).addScaledVector(f, -Math.cos(ph) * 0.16).addScaledVector(UP, Math.sin(ph) * 0.16).addScaledVector(r, 0.12);
    P.kp.copy(f).addScaledVector(UP, 0.4); P.ep = null;
    const push = st.type === 'airbike' ? Math.cos(ph) * 0.12 : 0;
    P.hR.set(O.x, 1.12, O.z).addScaledVector(f, 0.62 + push).addScaledVector(r, 0.22); P.hL.set(O.x, 1.12, O.z).addScaledVector(f, 0.62 - push).addScaledVector(r, -0.22);
  }
}
// ---------------------------------------------------------------- selectorized machines: one set of handle points drives both the steel and the hands
const MACH = new Set(['pulldown', 'row', 'chestpress', 'shoulderpress', 'pecdeck', 'legext', 'legcurl']);
const MLEAN = { pulldown: -0.15, row: 0.2, shoulderpress: -0.05 };
const _m1 = new V3(), _m2 = new V3(), _m3 = new V3(), _m4 = new V3(), _mh = [new V3(), new V3()];
const M_STEEL = '#1c1f2a', M_CHROME = '#c4c9d4', M_CABLE = '#0d0f14', M_PAD = '#2f3340';
function mpt(st, a, y, c, out) { const cy = Math.cos(st.yaw), sy = Math.sin(st.yaw); return out.set(st.x + cy * a - sy * c, y, st.z + sy * a + cy * c); }
function machineRig(st, k, s, P, ln) {
  const type = st.type; if (ln === undefined) ln = MLEAN[type] ?? -0.08;
  const shA = 0.47 * s * Math.sin(ln), shY = 0.55 + 0.47 * s * Math.cos(ln), shC = 0.19 * s, R = 0.6 * s * 0.94;
  const reach = (dc, dy, da = 0) => Math.sqrt(Math.max(0.01, R * R - dc * dc - dy * dy - da * da));
  const setH = (a, y, c) => { mpt(st, a, y, c, _mh[0]); mpt(st, a, y, -c, _mh[1]); if (P) { P.hR.copy(_mh[0]); P.hL.copy(_mh[1]); } };
  if (type === 'pulldown') {
    const c = 0.34, a = 0.1, y = lerp(shY + reach(c - shC, 0, a - shA), shY + 0.1, k);
    setH(a, y, c);
    cylAB(mpt(st, 0.15, 2.33, 0, _m1), mpt(st, a, y + 0.02, 0, _m2), 0.008, M_CABLE);
    for (const sd of [-1, 1]) { mpt(st, a, y, 0, _m1); mpt(st, a, y, sd * 0.3, _m2); cylAB(_m1, _m2, 0.016, M_CHROME); mpt(st, a, y - 0.07, sd * 0.5, _m3); cylAB(_m2, _m3, 0.016, M_CHROME); }
  } else if (type === 'row') {
    const c = 0.08, y = 0.86, a = lerp(shA + reach(shC - c, shY - y), 0.22, k);
    setH(a, y, c);
    cylAB(mpt(st, a, y, -0.12, _m1), mpt(st, a, y, 0.12, _m2), 0.016, M_CHROME);
    cylAB(mpt(st, a + 0.03, y, 0, _m1), mpt(st, 1.06, 0.29, 0, _m2), 0.008, M_CABLE);
    if (P) { for (const [Fp, sd] of [[P.fL, -1], [P.fR, 1]]) mpt(st, 0.74, 0.3, sd * 0.13 * s, Fp); P.kp.copy(UP); }
  } else if (type === 'chestpress' || type === 'shoulderpress') {
    const press = type === 'shoulderpress';
    const c = press ? 0.27 : 0.25;
    let a, y;
    if (press) { a = 0.08; y = lerp(shY + 0.08, shY + reach(c - shC, 0, a - shA), k); }
    else { y = shY - 0.05; a = lerp(shA + 0.26, shA + reach(c - shC, 0.05), k); }
    setH(a, y, c);
    for (const sd of [-1, 1]) {
      mpt(st, -0.5, press ? 1.03 : 1.93, sd * 0.38, _m1); mpt(st, a, y, sd * 0.38, _m2);
      cylAB(_m1, _m2, 0.032, M_STEEL);
      mpt(st, a, y, sd * 0.17, _m3); cylAB(_m2, _m3, 0.02, M_CHROME);
      _m4.copy(_m2).add(_m3).multiplyScalar(0.5); aaBox(_m4.x, _m4.y, _m4.z, 0.07, 0.07, 0.07, M_PAD, st.yaw);
    }
  } else if (type === 'pecdeck') {
    const Rr = 0.8 * 0.6 * s, phi = lerp(0.22, 1.42, k), y = shY - 0.04;
    const ha = -0.12 + Rr * Math.sin(phi), hc = 0.1 + Rr * Math.cos(phi);
    setH(ha, y, hc);
    for (const sd of [-1, 1]) {
      mpt(st, -0.12, 1.88, sd * 0.1, _m1); mpt(st, ha, 1.88, sd * hc, _m2); cylAB(_m1, _m2, 0.03, M_STEEL);
      mpt(st, ha, y - 0.1, sd * hc, _m3); cylAB(_m2, _m3, 0.025, M_STEEL);
      aaBox(_m3.x, y, _m3.z, 0.06, 0.2, 0.06, M_PAD, st.yaw);
    }
  } else if (type === 'legext' || type === 'legcurl') {
    const ext = type === 'legext' ? k : 1 - k;
    const fa = 0.38 + 0.38 * ext, fy = 0.07 + 0.42 * ext;
    const ra = fa + (type === 'legext' ? 0.07 : -0.08), ry = fy + 0.04;
    if (P) { for (const [Fp, sd] of [[P.fL, -1], [P.fR, 1]]) mpt(st, fa, fy, sd * 0.12, Fp); P.kp.copy(UP).addScaledVector(_pf, 0.6); setH(-0.02, 0.52, 0.27); }
    cylAB(mpt(st, 0.42, 0.55, 0.3, _m1), mpt(st, ra, ry, 0.3, _m2), 0.03, M_STEEL);
    cylAB(_m2, mpt(st, ra, ry, -0.22, _m3), 0.065, M_PAD);
    for (const sd of [-1, 1]) { mpt(st, -0.02, 0.5, sd * 0.3, _m1); mpt(st, 0.12, 0.5, sd * 0.3, _m2); cylAB(_m1, _m2, 0.018, M_CHROME); }
  }
  if (P) st._machF = FRAME;
}
function cableIdle(st) {   // functional trainer: D-handles hanging at the pulleys when nobody is using it
  for (const sd of [-1, 1]) { mpt(st, 0.3, 2.1, sd * 1.656, _m1); mpt(st, 0.3, 1.72, sd * 1.656, _m2); cylAB(_m1, _m2, 0.008, M_CABLE); aaBox(_m2.x, 1.68, _m2.z, 0.03, 0.1, 0.13, M_CHROME, st.yaw); }
}
function poseLift(a, P, act, s, now) {
  const st = act.s, lift = act.lift; frameOf(st.yaw); const f = _pf, r = _pr;
  const O = _o.copy(a.pos); O.y = (st.type === 'rack' || st.type === 'olyplat') ? 0.06 : 0;
  let u = act.u ?? 0; if (act.ready) u = 0;
  const load = st.load;
  const L = LIFTS[lift] || {};
  const anim = L.anim || lift;
  const lean = (ang) => { P.T.set(f.x * Math.sin(ang), Math.cos(ang), f.z * Math.sin(ang)); P.F.set(f.x * Math.cos(ang), -Math.sin(ang), f.z * Math.cos(ang)); };
  const feet = (w, y = O.y, fwd = 0) => { P.fL.set(O.x, y + 0.07 * s, O.z).addScaledVector(r, -w).addScaledVector(f, fwd); P.fR.set(O.x, y + 0.07 * s, O.z).addScaledVector(r, w).addScaledVector(f, fwd); };
  const shoulders = () => _t3.copy(P.H).addScaledVector(P.T, 0.47 * s);
  const barTo = (c, axis, bumper) => { st._barC = st._barC || new V3(); st._barAx = st._barAx || new V3(); st._barC.copy(c); st._barAx.copy(axis); st._barF = FRAME; st._bump = bumper; };
  const hands = (c, w) => { P.hR.copy(c).addScaledVector(r, w); P.hL.copy(c).addScaledVector(r, -w); };
  P.ep = null; P.kp.copy(f).addScaledVector(UP, 0.2); P.headTilt = 0;
  const shake = act.stuck ? Math.sin(now / 40) * 0.01 : 0;
  switch (anim) {
    case 'squat': case 'frontsquat': case 'beltsquat': case 'hack': {
      let d = curveDown(u); if (act.stuck) d = 0.9;
      const front = lift === 'frontsquat', hack = anim === 'hack', belt = anim === 'beltsquat';
      P.H.copy(O).addScaledVector(UP, (0.975 - 0.5 * d) * s).addScaledVector(f, (hack ? 0.05 : -0.3) * d * s);
      lean(hack ? -0.2 + 0.1 * d : (front ? 0.08 + 0.25 * d : 0.12 + 0.5 * d));
      feet(0.22 * s, O.y, hack ? 0.25 : 0); P.kp.copy(f).addScaledVector(UP, 0.1);
      const S_ = shoulders();
      if (belt) { _B.set(O.x, 0.95, O.z).addScaledVector(f, 0.72); hands(_B, 0.3); _t1.copy(P.H).addScaledVector(UP, -0.05); _t2.set(O.x, 0.15, O.z).addScaledVector(f, -0.3 + 0.0); cylAB(_t1, _t2, 0.015, '#1c1f2a'); aaBox(_t2.x, 0.15 + (1 - d) * 0.2, _t2.z, 0.1, 0.1, 0.5, '#959bab', st.yaw); break; }
      if (hack) { hands(_t1.copy(S_).addScaledVector(P.F, 0.05).addScaledVector(P.T, 0.1), 0.22); aaBox(S_.x, S_.y - 0.25, S_.z, 0.55, 0.9, 0.1, '#1c1f2a', st.yaw + 0.0); break; }
      if (front) { _B.copy(S_).addScaledVector(P.F, 0.14).addScaledVector(P.T, 0.02); hands(_B, 0.22 * s); P.ep = _t2.copy(P.F).addScaledVector(P.T, -0.1); }
      else { _B.copy(S_).addScaledVector(P.F, -0.11).addScaledVector(P.T, 0.03); hands(_B, 0.44 * s); P.ep = _t2.copy(P.F).multiplyScalar(-1).addScaledVector(P.T, -0.6); }
      if (act.stuck && st.type === 'rack') { _B.y = Math.max(_B.y, 0.7); }
      _B.y += shake; barTo(_B, r, false); break;
    }
    case 'bench': {
      let d = curveDown(u); if (act.stuck) d = 0.95;
      P.H.copy(O).addScaledVector(UP, 0.56).addScaledVector(f, -0.22);
      P.T.copy(f); P.F.set(0, 1, 0);
      P.fL.set(O.x, O.y + 0.07, O.z).addScaledVector(f, -0.82).addScaledVector(r, -0.32); P.fR.set(O.x, O.y + 0.07, O.z).addScaledVector(f, -0.82).addScaledVector(r, 0.32);
      P.kp.set(0, 1, 0).addScaledVector(f, -0.3);
      _B.set(O.x, 0.8 + 0.43 * (1 - d) + shake, O.z).addScaledVector(f, 0.3 - 0.06 * (1 - d)); hands(_B, 0.42 * s);
      P.ep = _t2.set(0, -1, 0); P.headTilt = 0;
      barTo(_B, r, false); break;
    }
    case 'deadlift': {
      let h = curveDown(u); if (act.stuck) h = 0.06 + Math.abs(Math.sin(now / 60)) * 0.02;
      if (act.rep === 0 && u < 0.12) chalkPuff(O, f);
      P.H.copy(O).addScaledVector(UP, lerp(0.64, 0.975, h) * s).addScaledVector(f, -lerp(0.3, 0.02, h) * s);
      lean(lerp(0.95, 0.0, h)); feet(0.14 * s); P.kp.copy(f).addScaledVector(UP, 0.2);
      _B.set(O.x, O.y + 0.225 + 0.56 * h, O.z).addScaledVector(f, lerp(0.16, 0.12, h)); hands(_B, 0.25 * s);
      barTo(_B, r, st.type === 'olyplat'); break;
    }
    case 'ohp': {
      const k = curveDown(u);
      P.H.copy(O).addScaledVector(UP, 0.975 * s); lean(-0.05 * k); feet(0.15 * s);
      const S_ = shoulders(); _B.copy(S_).addScaledVector(P.F, 0.15 * (1 - k)).addScaledVector(P.T, 0.02 + 0.62 * k * s); hands(_B, 0.3 * s);
      barTo(_B, r, false); break;
    }
    case 'curl': {
      const k = curveDown(u);
      P.H.copy(O).addScaledVector(UP, 0.975 * s); lean(-0.05); feet(0.14 * s);
      _B.copy(P.H).addScaledVector(f, (0.2 + 0.12 * k) * s).addScaledVector(UP, (-0.08 + 0.45 * k) * s); hands(_B, 0.2 * s);
      P.ep = _t2.set(0, -1, 0).addScaledVector(f, -0.6);
      barTo(_B, r, false); break;
    }
    case 'snatch': case 'cj': {
      const cj = anim === 'cj';
      let d = 0, h = 0, over = false, split = 0, barY, wide = cj ? 0.28 : 0.6, release = false, fr = false;
      const S0 = 0.93 * s;
      if (u < 0.32) { h = smooth(u / 0.32); d = 0; barY = O.y + 0.225 + 0.62 * h; }
      else if (u < (cj ? 0.4 : 0.5)) { const k = (u - 0.32) / ((cj ? 0.4 : 0.5) - 0.32); h = 1; d = smooth(k); if (cj) { fr = true; } else over = true; }
      else if (cj && u < 0.55) { fr = true; d = 1 - smooth((u - 0.4) / 0.15); }
      else if (cj && u < 0.62) { fr = true; d = 0.18 * Math.sin((u - 0.55) / 0.07 * Math.PI); }
      else if (cj && u < 0.72) { over = true; split = 0.42 * smooth((u - 0.62) / 0.1); wide = 0.3; d = 0.15; }
      else if (cj && u < 0.85) { over = true; split = 0.42 * (1 - smooth((u - 0.72) / 0.13)); wide = 0.3; }
      else if (!cj && u < 0.62) { over = true; d = 1; }
      else if (!cj && u < 0.85) { over = true; d = 1 - smooth((u - 0.62) / 0.23); }
      else release = true;
      if (u < 0.32) { P.H.copy(O).addScaledVector(UP, lerp(0.62, 0.975, h) * s).addScaledVector(f, -lerp(0.3, 0.02, h) * s); lean(lerp(0.95, 0.05, h)); }
      else { P.H.copy(O).addScaledVector(UP, (0.975 - 0.5 * d) * s).addScaledVector(f, -0.22 * d * s); lean(over ? 0.05 + 0.15 * d : 0.1 + 0.2 * d); }
      feet((split ? 0.15 : 0.2) * s); if (split) { P.fL.addScaledVector(f, split); P.fR.addScaledVector(f, -split * 0.9); P.H.addScaledVector(UP, -0.12 * split / 0.42); }
      const S_ = shoulders();
      if (release) {
        const k = (u - 0.85) / 0.15; hands(_t1.copy(P.H).addScaledVector(f, 0.15).addScaledVector(UP, -0.05), 0.3);
        // bar dropped from overhead, bounces on the bumpers
        const top = O.y + 2.05 * s, g = O.y + 0.225; let y;
        if (k < 0.45) { const q = k / 0.45; y = top - (top - g) * q * q; } else if (k < 0.8) { const q = (k - 0.45) / 0.35; y = g + 0.14 * 4 * q * (1 - q); } else { const q = (k - 0.8) / 0.2; y = g + 0.04 * 4 * q * (1 - q); }
        if (k >= 0.45 && !a.vis.dropped) { a.vis.dropped = true; sfx('drop'); } if (k < 0.2) a.vis.dropped = false;
        _B.set(O.x, y, O.z).addScaledVector(f, 0.12);
      } else if (over) { _B.copy(S_).addScaledVector(P.T, 0.62 * s).addScaledVector(P.F, -0.04); hands(_B, wide * s); }
      else if (fr) { _B.copy(S_).addScaledVector(P.F, 0.14).addScaledVector(P.T, 0.02); hands(_B, 0.24 * s); P.ep = _t2.copy(P.F).addScaledVector(P.T, -0.1); }
      else { _B.set(O.x, barY ?? (O.y + 0.84), O.z).addScaledVector(f, 0.14); hands(_B, 0.4 * s); }
      if (act.rep === 0 && u < 0.08) chalkPuff(O, f);
      barTo(_B, r, true); break;
    }
    case 'dbbench': {
      const d = curveDown(u);
      P.H.copy(O).addScaledVector(UP, 0.55).addScaledVector(f, 0.15); P.T.copy(f).negate(); P.F.set(0, 1, 0);
      P.fL.set(O.x, 0.07, O.z).addScaledVector(f, 0.75).addScaledVector(r, -0.3); P.fR.set(O.x, 0.07, O.z).addScaledVector(f, 0.75).addScaledVector(r, 0.3); P.kp.set(0, 1, 0);
      _B.set(O.x, 0.8 + 0.42 * (1 - d), O.z).addScaledVector(f, -0.3);
      P.hR.copy(_B).addScaledVector(r, 0.14 + 0.16 * d); P.hL.copy(_B).addScaledVector(r, -0.14 - 0.16 * d); P.ep = _t2.set(0, -1, 0);
      drawDB(P.hR, f, act.load || 20); drawDB(P.hL, f, act.load || 20); break;
    }
    case 'dbpress': {
      const k = curveDown(u);
      poseSit(P, _t1.set(O.x, 0.52, O.z).addScaledVector(f, -0.2), st.yaw, s, { lean: -0.12 });
      const S_ = shoulders(); P.hR.copy(S_).addScaledVector(r, 0.28 - 0.1 * k).addScaledVector(P.T, 0.08 + 0.5 * k); P.hL.copy(S_).addScaledVector(r, -0.28 + 0.1 * k).addScaledVector(P.T, 0.08 + 0.5 * k);
      P.ep = _t2.set(0, -1, 0); drawDB(P.hR, f, act.load || 20); drawDB(P.hL, f, act.load || 20);
      aaBox(O.x - f.x * 0.42, 0.85, O.z - f.z * 0.42, 0.1, 0.8, 0.3, '#1c1f2a', st.yaw + Math.PI / 2); break;
    }
    case 'dbcurl': case 'lateral': {
      P.H.copy(O).addScaledVector(UP, 0.975 * s); lean(0); feet(0.13 * s);
      const kR = curveDown(u), kL = curveDown((u + 0.5) % 1);
      if (anim === 'lateral') { const k = curveDown(u); for (const [hh, sd] of [[P.hR, 1], [P.hL, -1]]) hh.copy(P.H).addScaledVector(UP, (0.0 + 0.45 * k) * s).addScaledVector(r, sd * (0.25 + 0.42 * k) * s).addScaledVector(f, 0.05); }
      else { P.hR.copy(P.H).addScaledVector(r, 0.22 * s).addScaledVector(f, (0.06 + 0.2 * kR) * s).addScaledVector(UP, (-0.05 + 0.42 * kR) * s); P.hL.copy(P.H).addScaledVector(r, -0.22 * s).addScaledVector(f, (0.06 + 0.2 * kL) * s).addScaledVector(UP, (-0.05 + 0.42 * kL) * s); P.ep = _t2.set(0, -1, 0).addScaledVector(f, -0.5); }
      drawDB(P.hR, r, act.load || 12); drawDB(P.hL, r, act.load || 12); break;
    }
    case 'cablefly': {
      const k = curveDown(u);
      P.H.copy(O).addScaledVector(UP, 0.975 * s); lean(0.15); feet(0.15 * s, 0, 0); P.fL.addScaledVector(f, 0.2); P.fR.addScaledVector(f, -0.15);
      for (const [hh, sd] of [[P.hR, 1], [P.hL, -1]]) { hh.set(O.x, 1.75 - 0.6 * k, O.z).addScaledVector(r, sd * (0.85 - 0.78 * k)).addScaledVector(f, 0.05 + 0.45 * k); mpt(st, 0.3, 2.1, sd * 1.656, _t1); cylAB(_t1, hh, 0.008, '#0d0f14'); aaBox(hh.x, hh.y, hh.z, 0.03, 0.1, 0.13, '#c4c9d4', st.yaw); }
      st._machF = FRAME;
      stackLift(st, k); break;
    }
    case 'pulldown': case 'row': case 'chestpress': case 'shoulderpress': case 'pecdeck': case 'legext': case 'legcurl': {
      const k = curveDown(u);
      const ln = anim === 'row' ? 0.2 - 0.3 * k : (MLEAN[anim] ?? -0.08);
      poseSit(P, _t1.set(st.x, 0.55, st.z), st.yaw, s, { lean: ln, legReach: 0.46, footY: 0 });
      machineRig(st, k, s, P, ln);
      if (anim === 'chestpress' || anim === 'pecdeck') P.ep = _t2.set(0, -1, 0).addScaledVector(f, -0.3);
      if (anim === 'shoulderpress') P.ep = _t2.set(0, -1, 0).addScaledVector(f, -0.15);
      if (anim === 'pulldown') P.ep = _t2.set(0, -1, 0).addScaledVector(f, -0.2);
      stackLift(st, k); break;
    }
    case 'legpress': {
      const d = curveDown(u);
      P.H.set(O.x, 0.55, O.z).addScaledVector(f, -0.6);
      P.T.copy(f).multiplyScalar(-0.78).addScaledVector(UP, 0.62).normalize(); P.F.copy(f).multiplyScalar(0.62).addScaledVector(UP, 0.78).normalize();
      _D.copy(f).multiplyScalar(0.72).addScaledVector(UP, 0.69).normalize();
      const e = 0.5 + 0.45 * (1 - d);
      for (const [Fp, sd] of [[P.fL, -1], [P.fR, 1]]) Fp.copy(P.H).addScaledVector(_D, e).addScaledVector(r, sd * 0.18);
      P.kp.set(0, 1, 0).addScaledVector(f, -0.2);
      armsMode(P, s, 'lap', 0);
      _t1.copy(P.H).addScaledVector(_D, e + 0.12); aaBox(_t1.x, _t1.y, _t1.z, 0.75, 0.6, 0.1, '#474c5c', st.yaw + Math.PI / 2);
      for (const sd of [-1, 1]) { _t2.copy(_t1).addScaledVector(r, sd * 0.5); _t3.copy(_t2).addScaledVector(r, sd * 0.06); cylAB(_t2, _t3, 0.225, '#2f68ab'); }
      break;
    }
    case 'hipthrust': {
      const k = curveDown(u);
      const Sx = _t1.set(O.x, 0.5, O.z).addScaledVector(f, -0.5);
      P.H.set(O.x, lerp(0.3, 0.62, k), O.z).addScaledVector(f, 0.08);
      P.T.subVectors(Sx, P.H).normalize(); P.F.set(0, 1, 0).addScaledVector(P.T, -P.T.y).normalize();
      P.fL.set(O.x, 0.07, O.z).addScaledVector(f, 0.55).addScaledVector(r, -0.2); P.fR.set(O.x, 0.07, O.z).addScaledVector(f, 0.55).addScaledVector(r, 0.2); P.kp.set(0, 1, 0);
      _B.copy(P.H).addScaledVector(P.F, 0.16); hands(_B, 0.35);
      drawBar(_B, r, Math.max(40, act.load || 60), false, 0.3); break;
    }
    case 'pullup': case 'dip': {
      const k = curveDown(u);
      if (anim === 'pullup') {
        _B.set(O.x, 2.35, O.z); P.H.set(O.x, 1.15 + 0.45 * k, O.z).addScaledVector(f, -0.05); P.T.set(0, 1, 0); P.F.copy(f);
        for (const [Fp, sd] of [[P.fL, -1], [P.fR, 1]]) Fp.copy(P.H).addScaledVector(UP, -0.78).addScaledVector(f, -0.25).addScaledVector(r, sd * 0.1);
        P.kp.copy(f); hands(_B, 0.3);
      } else {
        // dip: supported on straight arms at the top, shoulders sink to bar height at the bottom; torso leans forward, knees bent, feet crossed behind
        const ln = 0.15 + 0.25 * k; lean(ln);
        const shY = lerp(1.27 + 0.55 * s, 1.27 + 0.1 * s, k);
        _B.set(O.x, 1.27, O.z).addScaledVector(f, 0.55);
        P.H.set(O.x, shY - 0.47 * s * Math.cos(ln), O.z).addScaledVector(f, 0.55 - 0.47 * s * Math.sin(ln) - 0.04);
        for (const [Fp, sd] of [[P.fL, -1], [P.fR, 1]]) Fp.copy(P.H).addScaledVector(UP, -0.6 * s).addScaledVector(f, -0.42 * s).addScaledVector(r, sd * 0.04);
        P.kp.copy(f).addScaledVector(UP, -0.2); hands(_B, 0.28); P.ep = _t2.copy(f).multiplyScalar(-1).addScaledVector(UP, 0.3);
      }
      break;
    }
    case 'sled': {
      poseStand(P, a.pos, a.yaw, s, { vx: a.vx, vz: a.vz, walkW: 1, phase: a.vis.phase, lean: 0.38 });
      frameOf(a.yaw);
      P.hR.set(st.sledX, 1.08, st.z).addScaledVector(_pf, -0.18).addScaledVector(_pr, 0.24); P.hL.set(st.sledX, 1.08, st.z).addScaledVector(_pf, -0.18).addScaledVector(_pr, -0.24);
      P.ep = _t2.set(0, -1, 0).addScaledVector(_pf, -0.4);
      break;
    }
    default: poseStand(P, a.pos, a.yaw, s, {}); armsRest(P, s, 0);
  }
}
function stackLift(st, k) { st._stackK = k; st._stackF = FRAME; }
const puffs = [];
function chalkPuff(O, f) { if (Math.random() < 0.3) puffs.push({ x: O.x + f.x * 0.2 + rnd(-0.3, 0.3), y: rnd(0.5, 1.1), z: O.z + f.z * 0.2 + rnd(-0.3, 0.3), t: performance.now() }); }

// ---------------------------------------------------------------- station props, vehicles
const _c1 = new V3(), _ra = new V3();
function drawStations(now) {
  for (const s of STATIONS) {
    if (s.type === 'rack' || s.type === 'olyplat') {
      const bump = s.type === 'olyplat';
      const ld = s.dirty > 20 ? s.dirty : s.load;
      if (s._barF === FRAME) drawBar(s._barC, s._barAx, s.load, s._bump);
      else {
        frameOf(s.yaw);
        if (s.type === 'rack' && !(s.mode === 'deadlift' && s.users.length)) { const y = s.mode === 'bench' && s.users.length ? 1.04 : 1.34; _c1.set(s.hooks.x, y, s.hooks.z); drawBar(_c1, _pr, ld, false, 0.4); }
        else { _c1.set(s.bar0.x, 0.06 + 0.225, s.bar0.z); drawBar(_c1, _pr, ld, bump, 0); }
      }
      if (s.type === 'rack' && s.mode === 'bench' && s.users.length) aaBox(s.x, 0.27, s.z - 0.15, 0.3, 0.42, 1.25, '#1c1f2a', 0);
    }
    if (s.stackAt) {
      const k = s._stackF === FRAME ? s._stackK : 0;
      for (const p of [s.stackAt, s.stackAt2]) if (p) { aaBox(p.x, 0.92 + k * 0.4, p.z, 0.36, 0.12, 0.2, '#474c5c', 0); _t1.set(p.x, 0.98 + k * 0.4, p.z); _t2.set(p.x, 2.1, p.z); cylAB(_t1, _t2, 0.008, '#0d0f14'); }
      if (s._machF !== FRAME) { if (MACH.has(s.type)) machineRig(s, 0, 1, null); else if (s.type === 'cable') cableIdle(s); }
    }
    if (s.type === 'sled') { aaBox(s.sledX, 0.12, s.z, 0.7, 0.16, 0.7, '#474c5c', 0); for (const sd of [-1, 1]) { _t1.set(s.sledX - 0.2, 0.2, s.z + sd * 0.25); _t2.set(s.sledX - 0.2, 1.05, s.z + sd * 0.25); cylAB(_t1, _t2, 0.025, '#959bab'); } _t1.set(s.sledX + 0.15, 0.3, s.z); _t2.set(s.sledX + 0.15, 0.45, s.z); cylAB(_t1, _t2, 0.225, '#2f68ab'); }
    if (s.strayDB > 0) for (let i = 0; i < Math.min(3, s.strayDB); i++) { _c1.set(s.rest.x + 0.3 + i * 0.25, 0.07, s.rest.z - 0.2); drawDB(_c1, _ra.set(1, 0, 0), 22); }
  }
  for (let i = puffs.length - 1; i >= 0; i--) { const p = puffs[i], age = (now - p.t) / 600; if (age > 1) { puffs.splice(i, 1); continue; } const sz = 0.06 + age * 0.12; aaBox(p.x, p.y + age * 0.3, p.z, sz, sz, sz, '#f2f1ea', 0); }
}
function drawCar(x, z, yaw, col, ghost) { ghost = false;   // traffic under the metro is drawn solid like the main street
  (ghost ? VB.carG : col === TAXI_COL ? VB.taxi : VB.car).put(x, 0, z, yaw, col); }
function drawScooter(x, z, yaw, col, rider, helmet, ghost) { ghost = false; (ghost ? VB.scootG : VB.scoot).put(x, 0, z, yaw, col); if (rider) { (ghost ? VB.riderG : VB.rider).put(x, 0, z, yaw, rider); (ghost ? VB.helmetG : VB.helmet).put(x, 0, z, yaw, helmet); } }
// Taipei Metro Wenhu line: 4-car trains (2 x 2), both directions, headways from the timetable in gym time, moving at 60 km/h in real time
const MT = { run: null, next: [0, 0], last: [-1e9, -1e9], trains: [] };
function metroHeadway(h) { if (h < 6 || h >= 24.5) return 0; if ((h >= 7 && h < 9) || (h >= 17 && h < 19.5)) return 2; if (h >= 23) return 6; return 4; }
function drawMetro(t) {
  if (MT.run !== A) { MT.run = A; MT.trains.length = 0; MT.next = [t, t + 60]; MT.last = [-1e9, -1e9]; }
  const hw = metroHeadway(t / 3600);
  for (let d = 0; d < 2; d++) {
    if (!hw) { MT.next[d] = t; continue; }
    if (t >= MT.next[d] && RTC - MT.last[d] > 9) { MT.trains.push({ d, t0: RTC }); MT.last[d] = RTC; MT.next[d] = t + hw * 60; }
  }
  const show = metroG.visible && ENV.Urban.w.visible, CAR = 14.3, V = 16.7;
  for (let i = MT.trains.length - 1; i >= 0; i--) {
    const tr = MT.trains[i], dir = tr.d ? -1 : 1, head = -dir * 175 + dir * V * (RTC - tr.t0);
    if (dir * head > 175 + 4 * CAR) { MT.trains.splice(i, 1); continue; }
    if (!show) continue;
    const z = METRO.z + (dir > 0 ? 2.1 : -2.1), y = METRO.y + 0.22;
    for (let k = 0; k < 4; k++) {
      const cx = head - dir * (CAR / 2 + k * CAR);
      if (k === 0) VB.mEnd.put(cx, y, z, dir > 0 ? 0 : Math.PI);
      else if (k === 3) VB.mEnd.put(cx, y, z, dir > 0 ? Math.PI : 0);
      else VB.mMid.put(cx, y, z, dir > 0 ? 0 : Math.PI);
    }
  }
}
let RTC = 0;
// ---------------------------------------------------------------- street traffic (right-hand): the main street and the back street under the metro
// Cars hold their lanes. Scooters keep to the kerb side, steer round anything ahead and slow down when boxed in.
const OBS = [];   // per frame, stride 6: x, z, half length, half width, direction, speed
const FLOW = (() => {
  const F = [], CLM = ROAD_Z + 1.8, CLB = -29;
  const SC = ['#d6403a', '#f2f1ea', '#1c1f2a', '#2f68ab', '#959bab', '#dfe03a', '#74abe0', '#d07a8e', '#63a845'];
  const JK = ['#2f68ab', '#d6403a', '#1c1f2a', '#f2f1ea', '#448c3a'], HM = ['#f2f1ea', '#dfe03a', '#d6403a', '#2f68ab'];
  const car = (cl, dir, lane, x, col, ghost) => F.push({ kind: 'car', cl, dir, z0: cl + dir * lane, x, v: 8, sw: 0, col, ghost, n: F.length });
  const sc = (cl, dir, lane, x, v, k, ghost) => F.push({ kind: 'scoot', cl, dir, z0: cl + dir * lane, x, v0: v, v, sw: 0, col: SC[k % SC.length], rider: JK[k % JK.length], helmet: HM[k % HM.length], ghost, n: F.length });
  // main street: car lanes 0.95 / 0.8 from the centre line, scooter lines towards each kerb
  car(CLM, 1, 1.0, -60, '#f2f1ea'); car(CLM, 1, 1.0, 25, '#959bab'); car(CLM, -1, 0.85, 40, '#1c1f2a'); car(CLM, -1, 0.85, -35, TAXI_COL);
  [[1, 2.3], [1, 2.7], [1, 3.1], [-1, 2.4], [-1, 2.8], [-1, 3.2]].forEach(([d, ln], k) => { sc(CLM, d, ln, -80 + k * 29, 9 + (k % 4), k); sc(CLM, d, ln, 10 + k * 23, 9.5 + ((k + 2) % 4), k + 5); });
  // back street under the metro: drawn see-through so it never hides the gym
  car(CLB, 1, 1.3, -20, '#c4c9d4', true); car(CLB, -1, 1.3, 30, '#2f68ab', true); car(CLB, 1, 1.3, 60, '#1c1f2a', true);
  [[1, 3.0], [1, 3.6], [-1, 3.0], [-1, 3.6]].forEach(([d, ln], k) => sc(CLB, d, ln, -50 + k * 31, 9 + k % 3, k + 2, true));
  return F;
})();
const KERB = [];   // { kind: 'taxi'|'bus', ev, x, v, target, hl, leaveT, minT, col, out }
function kerbTraffic(t, dtR) {
  if (KERB.run !== A) { KERB.length = 0; KERB.run = A; KERB.seen = new Set(); }
  const lane = ROAD_Z - 0.85, spawn = (o) => {
    for (let k = 0; k < 6 && KERB.some(q => !q.out && Math.abs(q.target - o.target) < q.hl + o.hl + 0.8); k++) o.target += 5;   // queue behind whoever is already there
    KERB.push(o); KERB.seen.add(o.ev);
  };
  for (const car of A.cars) {
    if (KERB.seen.has(car)) continue;
    const show = car.kind === 'drop' ? t >= car.t0 : t >= car.t0 - 10;
    if (!show) continue;
    // at high sim speeds trips come faster than taxis can drive in and out; a couple at the kerb stand in for the rest
    if (KERB.filter(q => q.kind === 'taxi').length >= 2) { KERB.seen.add(car); continue; }
    spawn({ kind: 'taxi', ev: car, x: 72, v: 9, target: car.x, hl: 2.3, hw: 0.95, leaveT: car.kind === 'drop' ? car.t0 + 14 : car.t0 + 10, minT: 1.5, col: car.col, out: false, wait: 0 });
  }
  for (const bt of A.buses) {
    if (KERB.seen.has(bt) || t < bt - 25 || t > bt + 30) continue;
    if (KERB.some(q => q.kind === 'bus' && !q.out)) { KERB.seen.add(bt); continue; }   // at high speeds one bus stands in for several
    spawn({ kind: 'bus', ev: bt, x: 80, v: 9, target: BUS_STOP.x, hl: 5.7, hw: 1.25, leaveT: bt + 30, minT: 2, out: false, wait: 0 });
  }
  KERB.sort((p, q) => p.x - q.x);                                   // westbound: the one with the smaller x is in front
  for (let i = 0; i < KERB.length; i++) {
    const k = KERB[i], front = KERB[i - 1];
    let vmax = 10;
    if (!k.out) { const dist = k.x - k.target; vmax = dist <= 0.05 ? 0 : Math.min(10, 0.6 + dist * 1.1); if (dist <= 0.05) { k.x = k.target; k.wait += dtR; if (t >= k.leaveT && k.wait >= k.minT) k.out = true; } }
    if (front) { const gap = k.x - front.x - k.hl - front.hl; vmax = Math.min(vmax, gap < 1 ? 0 : front.v + (gap - 1) * 1.5); }
    k.v += clamp(vmax - k.v, -14 * dtR, 3 * dtR); if (k.v < 0) k.v = 0;
    k.x -= k.v * dtR;
  }
  for (let i = KERB.length - 1; i >= 0; i--) if (KERB[i].x < -85) KERB.splice(i, 1);
  for (const k of KERB) {
    if (k.kind === 'taxi') { drawCar(k.x, lane, -Math.PI / 2, k.col); OBS.push(k.x, lane, 2.25, 0.88, -1, k.v); continue; }
    const x = k.x, z = ROAD_Z - 1.05; OBS.push(x, z, k.hl, k.hw, -1, k.v);
    aaBox(x, 1.55, z, 11, 2.7, 2.4, '#f2f1ea', 0); aaBox(x, 0.6, z, 11.05, 0.5, 2.45, '#1e4a85', 0); aaBox(x, 1.95, z, 10.6, 0.85, 2.46, '#13305a', 0); aaBox(x - 5.2, 2.6, z, 0.6, 0.3, 2.0, '#dfe03a', 0);
    for (const dx of [-3.6, 3.4]) for (const dz of [-1.05, 1.05]) aaBox(x + dx, 0.4, z + dz, 0.9, 0.8, 0.3, '#0d0f14', 0);
  }
}
// ---------------------------------------------------------------- street life on the far side: people on the walkway, riders in the YouBike lane
const AMB = (() => {
  const rng = makeRng(4242), peds = [], riders = [];
  for (let i = 0; i < 12; i++) { const dir = i % 2 ? 1 : -1; peds.push({ dir, x: -90 + i * 15.5 + rng() * 4, z: ROAD_Z + (dir > 0 ? 10.1 : 9.75) + rng() * 0.25, v: dir > 0 ? 1.3 : 1.22, look: makeLook(rng, rng() < 0.5, 'member'), P: newPose(), vis: { phase: rng() * 6, walkW: 1, hy: 0 }, d: 0 }); }
  for (let i = 0; i < 6; i++) { const dir = i % 2 ? 1 : -1; riders.push({ dir, x: -90 + i * 31 + rng() * 6, z: ROAD_Z + 8.3 + dir * 0.45, v: dir > 0 ? 4.2 : 4.0, look: makeLook(rng, rng() < 0.5, 'member'), P: newPose(), vis: { phase: 0, walkW: 0, hy: 0 }, ph: rng() * 6 }); }
  return { peds, riders };
})();
const _ap = new V3();
function drawStreetLife(dtR) {
  if (curSetting !== 'Urban') return;
  const Y = 0.12;
  for (const p of AMB.peds) {
    p.x += p.dir * p.v * dtR; if (p.x > 95) p.x -= 190; if (p.x < -95) p.x += 190;
    const s = p.look.scale || 1, stride = clamp(p.v * 0.2, 0.12, 0.6) * s; p.vis.phase += dtR * p.v * Math.PI / (2 * stride);
    poseStand(p.P, _ap.set(p.x, Y, p.z), p.dir > 0 ? 0 : Math.PI, s, { vx: p.dir * p.v, vz: 0, walkW: 1, phase: p.vis.phase });
    armsRest(p.P, s, Math.sin(p.vis.phase) * 0.17); p.P.look = null; drawBody(p.look, p.P, p.vis);
  }
  for (const r of AMB.riders) {
    r.x += r.dir * r.v * dtR; if (r.x > 95) r.x -= 190; if (r.x < -95) r.x += 190;
    r.ph += dtR * r.v / 0.35;
    const P = r.P, s = r.look.scale || 1, d = r.dir, lean = 0.32, x = r.x, z = r.z;
    VB.ubike.put(x, Y, z, d > 0 ? 0 : Math.PI, '#f2c230');
    P.H.set(x - d * 0.22, Y + 0.95, z); P.T.set(d * Math.sin(lean), Math.cos(lean), 0); P.F.set(d * Math.cos(lean), -Math.sin(lean), 0);
    const cx = x, cy = Y + 0.33, c = Math.cos(r.ph) * 0.17, sn = Math.sin(r.ph) * 0.17;
    P.fL.set(cx + d * c, cy - sn, z - d * 0.12); P.fR.set(cx - d * c, cy + sn, z + d * 0.12);
    P.hR.set(x + d * 0.38, Y + 1.06, z + d * 0.27); P.hL.set(x + d * 0.38, Y + 1.06, z - d * 0.27);
    P.kp.set(d, 0.4, 0); P.ep = null; P.headTilt = 0; P.look = null; P.hidden = false;
    drawBody(r.look, P, r.vis);
  }
}
// sideways shift (m, away from the centre line) a back-street car needs near a median: 1.15 m while alongside, easing out over 5.4 m
function medianShift(x) {
  let s = 0;
  for (const px of MEDIAN_X) { const d = Math.abs(x - px); s = Math.max(s, d < 5.6 ? 1.15 : d < 11 ? 0.575 * (1 + Math.cos(Math.PI * (d - 5.6) / 5.4)) : 0); }
  return s;
}
// back-street lane centre for a vehicle: in Rural the back road is a 6 m country road, so cars sit at 1.25 m and every scooter at 2.5 m
function laneZ(f) { return f.cl === -29 && curSetting === 'Rural' ? f.cl + f.dir * (Math.abs(f.z0 - f.cl) < 2 ? 1.25 : 2.5) : f.z0; }
function drawVehicles(real = 0) {
  if (!A) return;
  OBS.length = 0;
  const t = A.t, dtR = playing() ? Math.min(0.1, real) : 0; RTC += dtR;
  // taxis and buses pull in to the kerb on the gym's side: they drive in real time, queue behind each other and wait for their passengers
  kerbTraffic(t, dtR);
  drawStreetLife(dtR);
  const thin = curSetting === 'Rural' ? 2 : curSetting === 'Suburban' ? 3 : 0;   // quieter roads outside the city
  const wrap = (f) => { if (f.x > 95) f.x -= 190; if (f.x < -95) f.x += 190; };
  // cars first: steady speed in their own lane
  for (const f of FLOW) if (f.kind === 'car') {
    if (thin && f.n % thin === 0) continue;
    f.x += f.dir * f.v * dtR; wrap(f);
    // back street: swing out round the raised medians (cosine ramp in and out), heading follows the path
    const z0 = laneZ(f), zAt = (x) => f.cl === -29 && curSetting === 'Urban' ? z0 + f.dir * medianShift(x) : z0, z = zAt(f.x), slope = zAt(f.x + 0.5) - zAt(f.x - 0.5);
    drawCar(f.x, z, Math.atan2(f.dir, slope * f.dir), f.col, f.ghost); OBS.push(f.x, z, 2.25, 0.88, f.dir, f.v);
  }
  if (curSetting === 'Urban') for (const px of MEDIAN_X) OBS.push(px, -29, 3.2, 1.4, 0, 0);   // the medians themselves, so scooters steer clear
  // scooters: publish where everyone is, then each one looks ahead
  const base = OBS.length;
  for (const f of FLOW) if (f.kind === 'scoot') { f.ob = OBS.length; OBS.push(thin && f.n % thin === 0 ? 1e6 : f.x, laneZ(f) + f.sw, 0.95, 0.38, f.dir, f.v); }
  for (const f of FLOW) if (f.kind === 'scoot') {
    if (thin && f.n % thin === 0) continue;
    const keep = OBS[f.ob]; OBS[f.ob] = 1e6;                       // ignore yourself
    const half = f.cl === ROAD_Z + 1.8 ? 3.6 : curSetting === 'Rural' ? 3.0 : 4.5, lo = f.dir > 0 ? f.cl + 0.3 : f.cl - half + 0.4, hi = f.dir > 0 ? f.cl + half - 0.4 : f.cl - 0.3;
    const lz = laneZ(f), zc = lz + f.sw; let want = lz, vmax = f.v0;
    for (let o = 0; o < OBS.length; o += 6) {
      const ahead = (OBS[o] - f.x) * f.dir, hl = OBS[o + 2];
      if (ahead < -hl - 1.4 || ahead > hl + 10) continue;
      const oz = OBS[o + 1], clear = OBS[o + 3] + 0.38 + 0.2;
      if (Math.abs(oz - zc) >= clear && Math.abs(oz - want) >= clear) continue;
      const a = oz - clear, b = oz + clear, ca = a >= lo, cb = b <= hi;
      want = ca && cb ? (Math.abs(a - lz) <= Math.abs(b - lz) ? a : b) : ca ? a : cb ? b : want;
    }
    // still something in our path right in front? match its speed (or stop) until there is room to pass
    for (let o = 0; o < OBS.length; o += 6) {
      const ahead = (OBS[o] - f.x) * f.dir, gap = ahead - OBS[o + 2] - 0.95;
      if (ahead <= 0 || gap > 3.5) continue;
      if (Math.abs(OBS[o + 1] - zc) >= OBS[o + 3] + 0.38 + 0.1) continue;
      const ov = (OBS[o + 4] === f.dir ? OBS[o + 5] : 0);
      vmax = Math.min(vmax, gap < 0.6 ? 0 : ov + (gap - 0.6) * 1.5);
    }
    f.v += clamp(vmax - f.v, -12 * dtR, 4 * dtR);
    const d = want - zc, st = 3.6 * dtR; f.sw += Math.abs(d) <= st ? d : Math.sign(d) * st;
    f.x += f.dir * Math.max(0, f.v) * dtR; wrap(f);
    const z = lz + f.sw; OBS[f.ob] = keep; OBS[f.ob] = f.x; OBS[f.ob + 1] = z; OBS[f.ob + 5] = f.v;
    const lean = clamp(-d * 0.35, -0.3, 0.3);
    drawScooter(f.x, z, (f.dir > 0 ? 0 : Math.PI) + lean * f.dir, f.col, f.rider, f.helmet, f.ghost);
  }
  // members' scooters in the forecourt bays
  for (let i = 0; i < SCOOT.length; i++) { const m = A.scoot[i]; if (m && m.state !== 'pending') drawScooter(SCOOT[i].x, SCOOT[i].z, SCOOT[i].yaw, m.look.shoe === '#f2f1ea' ? '#f2f1ea' : m.look.shirt); }
  drawMetro(t);
  if (window.__dbgVeh) window.__dbgVeh(drawCar, drawScooter);
}
