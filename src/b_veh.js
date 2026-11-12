
// ================================================================ vehicle templates: shaped low-poly models shared by static (merged) and moving (instanced) vehicles
// A template is a list of parts grouped by colour; 'tint' parts take the per-vehicle colour.
function extrudeXY(pts, depth, bevel = 0) {   // profile in (x, y), extruded across z, centred
  const sh = new THREE.Shape(); sh.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) sh.lineTo(pts[i][0], pts[i][1]); sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, bevel ? { depth, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 1 } : { depth, bevelEnabled: false });
  g.translate(0, 0, -depth / 2); return g;
}
function bxG(w, h, d, x, y, z, ry = 0, rz = 0) { return place(new THREE.BoxGeometry(w, h, d), x, y, z, ry, 0, rz); }
function cylX(r, len, x, y, z, seg = 12) { const g = new THREE.CylinderGeometry(r, r, len, seg); g.rotateX(Math.PI / 2); g.translate(x, y, z); return g; }   // axis across (z)
function segXY(ax, ay, bx, by, z, w, d) { const len = Math.hypot(bx - ax, by - ay); return place(new THREE.BoxGeometry(len, w, d), (ax + bx) / 2, (ay + by) / 2, z, 0, 0, Math.atan2(by - ay, bx - ax)); }
function makeTemplate(parts, post) {
  const by = new Map();
  for (const [col, g] of parts) { const gg = g.index ? g.toNonIndexed() : g.clone(); for (const k of Object.keys(gg.attributes)) if (!['position', 'normal', 'uv'].includes(k)) gg.deleteAttribute(k); if (!gg.attributes.uv) gg.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(gg.attributes.position.count * 2), 2)); gg.clearGroups(); if (post) post(gg); if (!by.has(col)) by.set(col, []); by.get(col).push(gg); }
  return [...by].map(([col, gs]) => ({ col, geo: mergeGeometries(gs, false) }));
}
// ---- car: a small sedan, front towards +z
const TPL_CAR = (() => {
  const P = [];
  P.push(['tint', extrudeXY([[-2.15, 0.3], [2.15, 0.3], [2.18, 0.56], [2.06, 0.78], [0.95, 0.9], [0.36, 1.37], [-0.95, 1.41], [-1.74, 1.02], [-2.1, 0.96], [-2.18, 0.62]], 1.6, 0.06)]);
  P.push(['#13305a', extrudeXY([[0.99, 0.92], [0.4, 1.36], [-0.96, 1.39], [-1.79, 1.02], [-1.6, 0.95], [0.9, 0.9]], 1.76)]);
  P.push(['tint', bxG(0.14, 0.5, 1.79, -0.28, 1.14, 0)]);                                                  // B-pillar
  for (const s of [-1, 1]) P.push(['tint', bxG(0.14, 0.08, 0.16, 0.86, 1.0, s * 0.92)]);                     // mirrors
  for (const u of [-1.36, 1.36]) for (const s of [-1, 1]) { P.push(['#1c1f2a', cylX(0.31, 0.22, u, 0.31, s * 0.76)]); P.push(['#959bab', cylX(0.16, 0.24, u, 0.31, s * 0.76, 8)]); }
  for (const s of [-1, 1]) { P.push(['#f2f1ea', bxG(0.06, 0.12, 0.34, 2.19, 0.66, s * 0.58)]); P.push(['#d6403a', bxG(0.06, 0.12, 0.3, -2.2, 0.8, s * 0.6)]); }
  P.push(['#1c1f2a', bxG(0.06, 0.12, 0.8, 2.2, 0.48, 0)]); P.push(['#1c1f2a', bxG(0.06, 0.1, 1.6, -2.2, 0.42, 0)]);
  return P;
})();
const TPL_TAXI = [...TPL_CAR, ['#f2f1ea', bxG(0.26, 0.18, 0.62, -0.3, 1.5, 0)], ['#2f68ab', bxG(0.27, 0.06, 0.63, -0.3, 1.5, 0)]];
const CAR_T = makeTemplate(TPL_CAR, g => g.rotateY(-Math.PI / 2)), TAXI_T = makeTemplate(TPL_TAXI, g => g.rotateY(-Math.PI / 2));
// ---- scooter: Taiwanese step-through, front towards +x
const SCOOT_T = makeTemplate((() => {
  const P = [];
  for (const u of [0.6, -0.55]) { P.push(['#1c1f2a', cylX(0.23, 0.11, u, 0.23, 0)]); P.push(['#959bab', cylX(0.11, 0.13, u, 0.23, 0, 8)]); }
  P.push(['#2f3340', extrudeXY([[-0.2, 0.27], [0.36, 0.27], [0.36, 0.35], [-0.2, 0.35]], 0.36)]);
  P.push(['tint', extrudeXY([[-0.92, 0.42], [-0.62, 0.3], [-0.18, 0.3], [-0.14, 0.5], [-0.3, 0.7], [-0.82, 0.73], [-0.96, 0.62]], 0.26, 0.04)]);
  P.push(['tint', extrudeXY([[0.3, 0.3], [0.46, 0.3], [0.66, 0.86], [0.6, 0.98], [0.5, 0.99], [0.33, 0.62]], 0.34, 0.04)]);
  P.push(['tint', extrudeXY([[0.42, 0.42], [0.8, 0.42], [0.78, 0.5], [0.46, 0.52]], 0.14)]);
  P.push(['#1c1f2a', extrudeXY([[-0.86, 0.73], [-0.22, 0.7], [-0.2, 0.79], [-0.42, 0.84], [-0.84, 0.85]], 0.26, 0.03)]);
  P.push(['#474c5c', segXY(0.6, 0.23, 0.55, 0.92, 0, 0.05, 0.05)]);
  P.push(['#1c1f2a', cylX(0.022, 0.66, 0.55, 1.03, 0, 6)]); P.push(['tint', bxG(0.16, 0.1, 0.28, 0.56, 1.02, 0)]);
  P.push(['#f2f1ea', bxG(0.06, 0.1, 0.16, 0.67, 0.93, 0)]); P.push(['#d6403a', bxG(0.04, 0.06, 0.16, -0.97, 0.64, 0)]); P.push(['#f2f1ea', bxG(0.02, 0.1, 0.18, -0.98, 0.45, 0)]);
  for (const s of [-1, 1]) { P.push(['#1c1f2a', bxG(0.03, 0.2, 0.03, 0.54, 1.12, s * 0.24)]); P.push(['#1c1f2a', bxG(0.04, 0.06, 0.11, 0.55, 1.24, s * 0.26)]); }
  return P;
})());
// ---- scooter rider (jacket tinted) + helmet (tinted), seated, hands on the bars
const RIDER_T = makeTemplate((() => {
  const P = [];
  P.push(['tint', segXY(-0.5, 0.86, -0.42, 1.38, 0, 0.36, 0.34)]);                                       // torso
  for (const s of [-1, 1]) {
    P.push(['#2f3340', segXY(-0.45, 0.84, 0.0, 0.82, s * 0.12, 0.15, 0.15)]); P.push(['#2f3340', segXY(0.0, 0.82, 0.04, 0.38, s * 0.12, 0.12, 0.12)]);   // thigh, shin
    P.push(['#1c1f2a', bxG(0.24, 0.08, 0.1, 0.08, 0.38, s * 0.12)]);
    P.push(['tint', segXY(-0.42, 1.32, -0.05, 1.1, s * 0.2, 0.1, 0.1)]); P.push(['#c99b74', segXY(-0.05, 1.1, 0.52, 1.04, s * 0.24, 0.08, 0.08)]);  // arms
  }
  P.push(['#c99b74', bxG(0.2, 0.2, 0.2, -0.38, 1.52, 0)]);
  return P;
})());
const HELMET_T = makeTemplate([['tint', bxG(0.28, 0.2, 0.27, -0.39, 1.6, 0)], ['#13305a', bxG(0.04, 0.1, 0.22, -0.24, 1.55, 0)]]);
// ---- YouBike 2.0: step-through frame (tinted yellow), white basket, front towards +x
const YOUBIKE_T = makeTemplate((() => {
  const P = [];
  for (const u of [0.52, -0.52]) { P.push(['#1c1f2a', cylX(0.33, 0.05, u, 0.33, 0, 14)]); P.push(['#c4c9d4', cylX(0.05, 0.07, u, 0.33, 0, 6)]); }
  P.push(['tint', segXY(0.4, 0.92, 0.0, 0.33, 0, 0.07, 0.06)]); P.push(['tint', segXY(0.0, 0.33, -0.18, 0.84, 0, 0.06, 0.06)]);
  P.push(['tint', segXY(0.0, 0.33, -0.52, 0.33, 0, 0.05, 0.12)]); P.push(['tint', segXY(-0.18, 0.8, -0.52, 0.33, 0, 0.04, 0.1)]);
  P.push(['tint', bxG(0.42, 0.13, 0.05, -0.1, 0.4, 0.08)]); P.push(['tint', segXY(-0.75, 0.62, -0.25, 0.68, 0, 0.03, 0.1)]);
  P.push(['#c4c9d4', segXY(0.52, 0.33, 0.4, 1.0, 0, 0.05, 0.1)]); P.push(['#1c1f2a', cylX(0.02, 0.58, 0.38, 1.06, 0, 6)]);
  P.push(['#1c1f2a', bxG(0.26, 0.07, 0.17, -0.2, 0.88, 0)]); P.push(['#f2f1ea', bxG(0.3, 0.22, 0.36, 0.66, 0.95, 0)]);
  return P;
})());
// ---- Taipei Metro Wenhu (brown) line car: 13.78 m x 2.56 m x 3.51 m, two doors per side, rubber tyres; along +x, floor of guideway at y 0
function metroCar(end) {
  const P = [], L = 13.2;
  P.push(['#e8e8e2', place(extrudeXY([[-1.22, 0.42], [1.22, 0.42], [1.28, 1.2], [1.28, 3.1], [1.08, 3.5], [-1.08, 3.5], [-1.28, 3.1], [-1.28, 1.2]], L), 0, 0, 0, Math.PI / 2)]);
  for (const s of [-1, 1]) {
    P.push(['#643c24', bxG(L, 0.18, 0.04, 0, 1.28, s * 1.285)]);                                     // brown line stripe
    for (const [u0, u1] of [[-6.4, -4.25], [-2.65, 2.65], [4.25, 6.4]]) P.push(['#1c1f2a', bxG(u1 - u0, 0.95, 0.04, (u0 + u1) / 2, 2.05, s * 1.29)]);
    for (const u of [-3.45, 3.45]) { P.push(['#c4c9d4', bxG(1.3, 2.3, 0.05, u, 1.72, s * 1.3)]); P.push(['#1c1f2a', bxG(0.9, 0.85, 0.05, u, 2.12, s * 1.31)]); P.push(['#474c5c', bxG(0.04, 2.3, 0.06, u, 1.72, s * 1.31)]); }
  }
  P.push(['#2f3340', bxG(L - 1.0, 0.36, 2.2, 0, 0.24, 0)]);                                            // skirt over the rubber tyres
  for (const u of [-4.6, 4.6]) for (const s of [-1, 1]) P.push(['#1c1f2a', cylX(0.45, 0.3, u, 0.45, s * 0.94, 10)]);
  P.push(['#959bab', bxG(3.4, 0.25, 1.4, -2.5, 3.55, 0)]); P.push(['#959bab', bxG(2.2, 0.2, 1.2, 3.2, 3.55, 0)]);
  if (end) {   // driverless front: big dark windscreen, round lamps, brown band
    P.push(['#1c1f2a', bxG(0.06, 1.35, 2.1, L / 2 + 0.01, 2.3, 0)]); P.push(['#643c24', bxG(0.06, 0.25, 2.4, L / 2 + 0.02, 1.3, 0)]);
    for (const s of [-1, 1]) { const g = new THREE.CylinderGeometry(0.13, 0.13, 0.06, 10); g.rotateZ(Math.PI / 2); g.translate(L / 2 + 0.03, 0.95, s * 0.85); P.push(['#f2f1ea', g]); }
  } else P.push(['#2f3340', bxG(0.5, 2.6, 1.6, L / 2 + 0.25, 1.9, 0)]);                                // gangway to the next car
  return makeTemplate(P);
}
const METRO_END_T = metroCar(true), METRO_MID_T = metroCar(false);
// ---------------------------------------------------------------- static placement into a Builder, and an instanced batch per template
const _vm = new THREE.Matrix4(), _vq = new THREE.Quaternion(), _vp = new V3(), _vs = new V3(1, 1, 1), _vy = new V3(0, 1, 0);
function vehMatrix(x, y, z, yaw) { _vq.setFromAxisAngle(_vy, yaw); return _vm.compose(_vp.set(x, y, z), _vq, _vs); }
function addTemplate(b, T, x, z, yaw, tint, y = 0) { vehMatrix(x, y, z, yaw); for (const p of T) { const g = p.geo.clone(); g.applyMatrix4(_vm); b.add(g, L(p.col === 'tint' ? tint : p.col)); } }
const VBATCHES = [];
class TBatch {
  constructor(T, max, ghost = 0) {   // ghost: opacity for see-through traffic (e.g. under the metro)
    this.parts = T.map(p => {
      let mat = p.col === 'tint' ? new THREE.MeshLambertMaterial({ color: 0xffffff }) : L(p.col);
      if (ghost) { mat = mat.clone(); mat.transparent = true; mat.opacity = ghost; mat.depthWrite = false; }
      const m = new THREE.InstancedMesh(p.geo, mat, max);
      m.castShadow = !ghost; if (ghost) m.renderOrder = 3; m.receiveShadow = true; m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      if (p.col === 'tint') { m.setColorAt(0, colOf('#ffffff')); m.instanceColor.setUsage(THREE.DynamicDrawUsage); }
      m.count = 0; world.add(m); return { m, tint: p.col === 'tint' };
    });
    this.max = max; this.n = 0; VBATCHES.push(this);
  }
  put(x, y, z, yaw, tint) {
    if (this.n >= this.max) return; vehMatrix(x, y, z, yaw);
    for (const p of this.parts) { p.m.setMatrixAt(this.n, _vm); if (p.tint) p.m.setColorAt(this.n, colOf(tint || '#ffffff')); }
    this.n++;
  }
}
function vBegin() { for (const b of VBATCHES) b.n = 0; }
function vEnd() { for (const b of VBATCHES) for (const p of b.parts) { p.m.count = b.n; p.m.instanceMatrix.needsUpdate = true; if (p.tint) p.m.instanceColor.needsUpdate = true; } }
const VB = { ubike: new TBatch(YOUBIKE_T, 12), carG: new TBatch(CAR_T, 12, 0.4), scootG: new TBatch(SCOOT_T, 16, 0.4), riderG: new TBatch(RIDER_T, 16, 0.4), helmetG: new TBatch(HELMET_T, 16, 0.4), car: new TBatch(CAR_T, 40), taxi: new TBatch(TAXI_T, 30), scoot: new TBatch(SCOOT_T, 90), rider: new TBatch(RIDER_T, 30), helmet: new TBatch(HELMET_T, 30), mEnd: new TBatch(METRO_END_T, 16), mMid: new TBatch(METRO_MID_T, 16) };
