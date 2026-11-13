
// ================================================================ lights
const hemi = new THREE.HemisphereLight(0xcfe4ff, 0x5b7a3c, 1.5); world.add(hemi);
const sun = new THREE.DirectionalLight(0xfff3dc, 2.6);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -42, right: 42, top: 42, bottom: -42, near: 1, far: 200 });
sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.04;
world.add(sun); world.add(sun.target);
const hallLights = [];
// hall lights: short reach so their pools stay inside the hall instead of spilling curved bands onto the forecourt
for (const x of [-10, 0, 10]) for (const z of [-4.5, 4.5]) { const p = new THREE.PointLight(0xfff1d8, 0, 7.6, 0.4); p.position.set(x, 4.0, z); world.add(p); hallLights.push(p); }
const lotLights = [];
for (const [x, z] of [[-20, 12.4], [-6, 12.4], [9, 12.2]]) { const p = new THREE.PointLight(0xffb060, 0, 14, 1.4); p.position.set(x, 4.2, z); world.add(p); lotLights.push(p); }

// ================================================================ ground: a paved Taipei block
const SITE = { x0: -33.5, x1: 33.5, z0: -24, z1: 21.6 };
const UB = new Builder();
// each setting (urban / suburban / rural) owns a world group and a ground group; the gym, road and forecourt are shared
const ENV = {};
for (const [n, gc] of [['Urban', '#6b7182'], ['Suburban', '#6f9a48'], ['Rural', '#7c9c4c']]) {
  const w = new THREE.Group(), u = new THREE.Group(); world.add(w); under.add(u);
  const E = ENV[n] = { name: n, w, u, sb: new Builder(), ub: new Builder(), sides: {} };
  for (const [k, nx, nz] of [['s', 0, 1], ['n', 0, -1], ['w', -1, 0], ['e', 1, 0]]) { const lo = new THREE.Group(), hi = new THREE.Group(); const tall = new THREE.Group(); w.add(lo); w.add(hi); w.add(tall); E.sides[k] = { nx, nz, lo, hi, tall, lb: new Builder(), hb: new Builder(), tb: new Builder(), h: 1 }; }
  const g = new THREE.PlaneGeometry(420, 420).rotateX(-Math.PI / 2); g.translate(0, -0.01, 0); E.ub.add(g, L(gc));
}
let curSetting = null;
function applySetting(n) { if (n === curSetting) return; curSetting = n; for (const k in ENV) { ENV[k].w.visible = ENV[k].u.visible = k === n; } }
function inIsland(x, z) { return x > -38.2 && x < 38.2 && z > -24.2 && z < 26.5; }
const clouds = new THREE.Group(); under.add(clouds);
// ================================================================ the hall (30 x 20 m), cutaway walls
const HX = 15, HZ = 10, WALL_H = 3.8, CUT_H = 1.2;
const DOOR = { x: 12, z: HZ, w: 1.6 };
// floor: black rubber tiles
const floorCanvas = document.createElement('canvas'); floorCanvas.width = 600; floorCanvas.height = 400;
{
  const c = floorCanvas.getContext('2d'); c.fillStyle = '#2f3340'; c.fillRect(0, 0, 600, 400);
  for (let i = 0; i < 4000; i++) { c.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.12)'; c.fillRect(Math.random() * 600, Math.random() * 400, 2, 2); }
  c.fillStyle = '#1c1f2a'; for (let x = 0; x <= 600; x += 20) c.fillRect(x, 0, 1, 400); for (let y = 0; y <= 400; y += 20) c.fillRect(0, y, 600, 1);
  // entrance mat + painted walkway lines
  c.fillStyle = '#474c5c'; c.fillRect((DOOR.x - 1.2 + HX) * 20, (HZ - 1.6 + HZ) * 20, 48, 30);
  c.fillStyle = '#b8a21e'; c.fillRect(0, (6.9 + HZ) * 20, 420, 3); c.fillRect(0, (2.4 + HZ) * 20, 420, 3);
}
const floorTex = new THREE.CanvasTexture(floorCanvas); floorTex.colorSpace = THREE.SRGBColorSpace;
const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(HX * 2, HZ * 2).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: floorTex }));
floorMesh.position.y = 0.02; floorMesh.receiveShadow = true; world.add(floorMesh);
// walls: lower 1.2 m always; upper part only on the far sides of the current view
const winMat = new THREE.MeshLambertMaterial({ color: '#74abe0', emissive: '#000000', transparent: true, opacity: 0.55 });
const wallSides = [];
function wallSide(name, nx, nz, segs) {   // segs: [x0,z0,x1,z1, door?]
  const lower = new THREE.Group(), upper = new THREE.Group(); world.add(lower); world.add(upper);
  const lb = new Builder(), ub = new Builder();
  for (const [x0, z0, x1, z1, opt] of segs) {
    const len = Math.hypot(x1 - x0, z1 - z0), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, ry = Math.atan2(-(z1 - z0), x1 - x0);
    const glass = opt === 'glass';
    lb.add(place(new THREE.BoxGeometry(len, CUT_H, 0.25), cx, CUT_H / 2, cz, ry), L('#959bab'));
    lb.add(place(new THREE.BoxGeometry(len + 0.02, 0.08, 0.3), cx, CUT_H, cz, ry), L('#6b7182'));
    if (glass) { ub.add(place(new THREE.BoxGeometry(len, 1.7, 0.08), cx, CUT_H + 0.85, cz, ry), winMat); ub.add(place(new THREE.BoxGeometry(len, WALL_H - CUT_H - 1.7, 0.25), cx, CUT_H + 1.7 + (WALL_H - CUT_H - 1.7) / 2, cz, ry), L('#c4c9d4')); for (let k = 0; k <= Math.floor(len / 2.5); k++) { const t = len ? k * 2.5 / len : 0; ub.add(place(new THREE.BoxGeometry(0.12, 1.7, 0.14), x0 + (x1 - x0) * t, CUT_H + 0.85, z0 + (z1 - z0) * t, ry), L('#474c5c')); } }
    else ub.add(place(new THREE.BoxGeometry(len, WALL_H - CUT_H, 0.25), cx, CUT_H + (WALL_H - CUT_H) / 2, cz, ry), L(opt === 'mirror' ? '#c4c9d4' : '#e8dcc0'));
  }
  lb.flush(lower); ub.flush(upper);
  upper.position.y = CUT_H; upper.children.forEach(m => { m.position.y = -CUT_H; m.matrixAutoUpdate = true; });
  wallSides.push({ name, nx, nz, upper, h: 1 });
}
wallSide('front', 0, 1, [[-HX + 1.2, HZ, DOOR.x - 2, HZ, 'glass'], [DOOR.x + 2, HZ, HX - 1.2, HZ, 'glass']]);
wallSide('back', 0, -1, [[-HX + 1.2, -HZ, HX - 1.2, -HZ]]);
wallSide('left', -1, 0, [[-HX, -HZ + 1.2, -HX, HZ - 1.2]]);
wallSide('right', 1, 0, [[HX, -HZ + 1.2, HX, HZ - 1.2, 'glass']]);
function updateWalls(dt) {
  const ox = Math.sin(view.az), oz = Math.cos(view.az);
  for (const w of wallSides) {
    const near = w.nx * ox + w.nz * oz > 0.2;
    const tgt = near ? 0.0001 : 1; w.h += (tgt - w.h) * Math.min(1, dt * 6);
    w.upper.scale.y = Math.max(0.0001, w.h); w.upper.visible = w.h > 0.01;
  }
  for (const n in ENV) for (const k in ENV[n].sides) {
    const S_ = ENV[n].sides[k], near = S_.nx * ox + S_.nz * oz > 0.2;
    S_.h += ((near ? 0.0001 : 1) - S_.h) * Math.min(1, dt * 5);
    // the whole near side sinks into the ground so the road is the edge of the view
    const sk = Math.max(0.0001, S_.h), mode = window.__nearMode || 'flat';
    if (mode === 'cut') {   // near side: ground floors squashed to a 1.2 m cut, like the gym walls; upper floors and signs gone
      const lk = lerp(1.2 / 3.1, 1, S_.h); S_.lo.scale.y = lk; S_.hi.scale.y = S_.tall.scale.y = sk; S_.hi.position.y = 3.1 * lk;
      S_.lo.visible = true; S_.hi.visible = S_.tall.visible = S_.h > 0.01;
      for (const m of S_.lo.children) if (signMeshes.includes(m)) m.visible = S_.h > 0.5;
    } else {
      S_.lo.scale.y = S_.hi.scale.y = S_.tall.scale.y = sk; S_.hi.position.y = 3.1 * sk;
      S_.lo.visible = S_.hi.visible = S_.tall.visible = S_.h > 0.01;
    }
  }
  metroG.visible = SIDES.n.h > 0.5;
  // the board shrinks to the street on the sides facing the camera, so there are no empty lots in front
  const keepFull = false;   // near sides keep one lot's depth past the street, then dissolve into the backdrop at the bottom of the screen
  const ext = (k, near, full) => keepFull ? full : lerp(near, full, clamp(SIDES[k].h, 0, 1));
  const FX = 88, FS = 86, FN = 86;   // every setting fills a big board; the view is kept inside it
  scene.fog.color.setRGB(ext('e', 48, FX), ext('s', 46, FS), ext('w', 48, FX)); scene.fog.near = ext('n', 44, FN);
}
// full-height corners and entrance portal
for (const [x, z] of [[-HX, -HZ], [HX, -HZ], [-HX, HZ], [HX, HZ]]) box(1.4, WALL_H + 0.2, 1.4, '#e8dcc0', x, 0, z);
box(4.04, 0.25, 0.4, '#1c1f2a', DOOR.x, WALL_H - 0.25, HZ);   // 4 cm wider than the jambs so their sides are not coplanar
for (const dx of [-1.25, 1.25]) box(0.7, WALL_H - 0.01, 0.5, '#2f3340', DOOR.x + dx * 1.2 + (dx < 0 ? -0.15 : 0.15), 0, HZ);
box(1.5, 0.15, 0.6, '#1c1f2a', DOOR.x, 2.3, HZ);
box(1.0, 2.3, 0.04, '#74abe0', DOOR.x - 0.4, 0, HZ + 0.02, 0.0); // open door leaf (glass)
// sign
const signCanvas = document.createElement('canvas'); signCanvas.width = 256; signCanvas.height = 48;
const signTex = new THREE.CanvasTexture(signCanvas); signTex.colorSpace = THREE.SRGBColorSpace; signTex.magFilter = THREE.NearestFilter;
function paintSign() { const c = signCanvas.getContext('2d'); c.fillStyle = '#1c1f2a'; c.fillRect(0, 0, 256, 48); c.fillStyle = '#dfe03a'; c.font = '700 30px Silkscreen, monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('GYMSIM', 128, 26); signTex.needsUpdate = true; }
paintSign();
const signMat = new THREE.MeshLambertMaterial({ map: signTex, emissive: '#000000', emissiveMap: signTex });
const sign = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.7, 0.1), [L('#1c1f2a'), L('#1c1f2a'), L('#1c1f2a'), L('#1c1f2a'), signMat, L('#1c1f2a')]);
sign.position.set(DOOR.x, WALL_H + 0.45, HZ + 0.25); sign.castShadow = true; world.add(sign);
// real-time clock on the portal
const clock = new THREE.Group(); world.add(clock);
const hourHand = new THREE.Group(), minHand = new THREE.Group();
{
  clock.position.set(DOOR.x, 3.05, HZ + 0.3);
  clock.add(new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 14).rotateX(Math.PI / 2), L('#f2f1ea')));
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.05, 14).rotateX(Math.PI / 2), L('#1c1f2a')); rim.position.z = -0.02; clock.add(rim);
  for (let i = 0; i < 12; i++) { const big = i % 3 === 0; const t = new THREE.Mesh(new THREE.BoxGeometry(big ? 0.06 : 0.035, big ? 0.12 : 0.06, 0.02), L(i === 0 ? '#d6403a' : '#1c1f2a')); const a = i / 12 * Math.PI * 2; t.position.set(Math.sin(a) * 0.33, Math.cos(a) * 0.33, 0.04); t.rotation.z = -a; clock.add(t); }   // 12-hour face, 12 marked in red
  const hh = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.02), L('#1c1f2a')); hh.position.y = 0.09; hourHand.add(hh);
  const mh = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.32, 0.02), L('#1c1f2a')); mh.position.y = 0.14; minHand.add(mh);
  hourHand.position.z = 0.05; minHand.position.z = 0.06; clock.add(hourHand); clock.add(minHand);
}
// changing rooms, front desk, turnstile, fountain
const CHG = { x0: 11, x1: HX, z0: -2.2, z1: 5.2, door: 1.6 };
const LOCKERS = [];
{
  const c = '#c4c9d4';
  box(0.2, CUT_H, CHG.door - 0.6 - CHG.z0, c, CHG.x0, 0, (CHG.z0 + CHG.door - 0.6) / 2);
  box(0.2, CUT_H, CHG.z1 - (CHG.door + 0.6), c, CHG.x0, 0, (CHG.door + 0.6 + CHG.z1) / 2);
  box(CHG.x1 - CHG.x0, CUT_H, 0.2, c, (CHG.x0 + CHG.x1) / 2, 0, CHG.z0);
  box(CHG.x1 - CHG.x0, CUT_H, 0.2, c, (CHG.x0 + CHG.x1) / 2, 0, CHG.z1);
  box(CHG.x1 - CHG.x0 - 0.2, 0.01, CHG.z1 - CHG.z0 - 0.2, '#959bab', (CHG.x0 + CHG.x1) / 2, 0.02, (CHG.z0 + CHG.z1) / 2);
  for (let i = 0; i < 12; i++) { const z = CHG.z0 + 0.45 + i * 0.6; box(0.5, 1.8, 0.56, i % 2 ? '#2f68ab' : '#1e4a85', HX - 0.55, 0, z); box(0.02, 0.06, 0.06, '#c4c9d4', HX - 0.82, 1.1, z + 0.15); LOCKERS.push({ x: HX - 1.25, z }); }
  box(0.45, 0.42, 3.4, '#a9733f', 12.6, 0, 1.6); box(0.45, 0.42, 2.2, '#a9733f', 12.6, 0, -1.0);
  // desk
  box(0.8, 1.05, 2.4, '#2f3340', 13.6, 0, 7.4); box(0.95, 0.06, 2.55, '#e8dcc0', 13.6, 1.05, 7.4);
  box(0.3, 0.25, 0.4, '#1c1f2a', 13.5, 1.11, 7.0); box(0.06, 0.06, 0.06, '#dfe03a', 13.4, 1.15, 7.8);
  // turnstile
  for (const dx of [-0.75, 0.75]) box(0.25, 1.0, 0.6, '#6b7182', DOOR.x + dx, 0, 8.2);
  box(0.6, 0.05, 0.05, '#c4c9d4', DOOR.x - 0.3, 0.9, 8.2);
  // fountain
  box(0.5, 1.0, 0.4, '#c4c9d4', 10.65, 0, 5.8); box(0.3, 0.05, 0.25, '#74abe0', 10.65, 1.0, 5.8);
}
const DESK_STAFF_POS = { x: 14.35, z: 7.4 };
// ================================================================ outside: a Taipei street block
const ROAD_Z = 23.6;                 // main street centreline is ROAD_Z + 1.8
const NB = [];
// neighbours are split per side; the sides nearest the camera sink away so the road is the edge of the view
const SIDES = ENV.Urban.sides, EU = ENV.Urban;
const sideOf = (x, z) => Math.abs(x) * 0.8 > Math.abs(z - 2) ? (x > 0 ? 'e' : 'w') : (z > 2 ? 's' : 'n');
const TREES = [];
const poplars = [];
const signMeshes = [];
// sidewalks, roads, lanes
box(420, 0.03, 7.2, '#3b3532', 0, 0, ROAD_Z + 1.8, 0, { b: UB });
for (let x = -200; x < 200; x += 4) box(2.0, 0.035, 0.14, '#e8dcc0', x, 0, ROAD_Z + 1.8, 0, { b: UB });
box(420, 0.035, 0.1, '#dfe03a', 0, 0, ROAD_Z - 1.6, 0, { b: UB }); box(420, 0.035, 0.1, '#dfe03a', 0, 0, ROAD_Z + 5.2, 0, { b: UB });
box(420, 0.12, 1.8, '#a5a39a', 0, 0, ROAD_Z - 2.7, 0, { b: UB }); box(420, 0.12, 2.0, '#a5a39a', 0, 0, ROAD_Z + 6.4, 0, { b: UB });
for (let x = -200; x < 200; x += 0.6) box(0.3, 0.125, 0.15, (Math.floor(x / 0.6) % 2) ? '#d6403a' : '#f2f1ea', x, 0, ROAD_Z - 1.75, 0, { b: UB }); // red-white kerb
// zebra crossing: bars run with the traffic, stacked across the carriageway (west of the corner), stop lines, scooter waiting box
for (let z = ROAD_Z - 1.35; z < ROAD_Z + 5.1; z += 0.9) box(4.0, 0.04, 0.45, '#f2f1ea', 31, 0, z, 0, { b: UB });
box(0.3, 0.04, 3.4, '#f2f1ea', 33.7, 0, ROAD_Z, 0, { b: UB }); box(0.3, 0.04, 3.4, '#f2f1ea', 28.3, 0, ROAD_Z + 3.6, 0, { b: UB });
box(3.0, 0.04, 0.12, '#f2f1ea', 24, 0, ROAD_Z + 0.2, 0, { b: UB }); box(3.0, 0.04, 0.12, '#f2f1ea', 24, 0, ROAD_Z - 1.4, 0, { b: UB }); box(0.12, 0.04, 1.7, '#f2f1ea', 22.5, 0, ROAD_Z - 0.6, 0, { b: UB }); box(0.12, 0.04, 1.7, '#f2f1ea', 25.5, 0, ROAD_Z - 0.6, 0, { b: UB });
// side lanes (xiang) stop at the edges of the main street and the back road; zebra across each lane mouth
const LANE_SEGS = [[-60, -33.5], [-24.5, ROAD_Z - 1.8], [ROAD_Z + 5.4, 60]];
function laneRuns(b, col, w, edge) {
  for (const x of [-36, 36]) for (const [z0, z1] of LANE_SEGS) {
    box(w, 0.03, z1 - z0, col, x, 0, (z0 + z1) / 2, 0, { b });
    if (edge) for (const dx of [-2.1, 2.1]) box(0.1, 0.035, z1 - z0, edge, x + dx, 0, (z0 + z1) / 2, 0, { b });
  }
}
laneRuns(EU.ub, '#474c5c', 4.5, '#f2f1ea');
for (const x of [-36, 36]) for (let dx = -1.8; dx <= 1.81; dx += 0.9) box(0.45, 0.04, 3.0, '#f2f1ea', x + dx, 0, ROAD_Z - 4.0, 0, { b: EU.ub });
box(120, 0.03, 9, '#3b3532', 0, 0, -29, 0, { b: EU.ub });
// back street under the metro: double yellow centre line, dashed lane lines, edge lines, crossings at both junctions and mid-block
{
  const BZ = -29, U = { b: EU.ub }, segs = [[-60, -38.4], [-33.6, 33.6], [38.4, 60]];
  for (const [x0, x1] of segs) {
    for (const dz of [-0.12, 0.12]) box(x1 - x0, 0.035, 0.1, '#dfe03a', (x0 + x1) / 2, 0, BZ + dz, 0, U);
    for (const dz of [-4.25, 4.25]) box(x1 - x0, 0.035, 0.1, '#f2f1ea', (x0 + x1) / 2, 0, BZ + dz, 0, U);
    for (let x = x0 + 1; x < x1 - 2; x += 4) for (const dz of [-2.4, 2.4]) box(2.0, 0.035, 0.12, '#f2f1ea', x + 1, 0, BZ + dz, 0, U);
  }
  for (const cx of [-40.3, 15, 40.3]) {   // clear of the metro piers (every 30 m on the centre line)
    for (let z = BZ - 3.9; z < BZ + 4.0; z += 0.9) box(3.6, 0.04, 0.45, '#f2f1ea', cx, 0, z, 0, U);       // zebra across the back street
    box(0.3, 0.04, 4.1, '#f2f1ea', cx + 2.4, 0, BZ - 2.15, 0, U); box(0.3, 0.04, 4.1, '#f2f1ea', cx - 2.4, 0, BZ + 2.15, 0, U);   // stop lines
  }
  for (const x of [-36, 36]) for (let dx = -1.8; dx <= 1.81; dx += 0.9) box(0.45, 0.04, 3.0, '#f2f1ea', x + dx, 0, -22.6, 0, U);   // zebra across each lane mouth
}
// raised medians round the metro piers (every 30 m on the centre line); traffic swings round them, see MEDIAN_X in the traffic code
const MEDIAN_X = [-30, 0, 30];
for (const px of MEDIAN_X) {
  box(6.4, 0.16, 2.8, '#8f8c85', px, 0, -29, 0, { b: EU.ub });                                   // kerb
  box(6.0, 0.18, 2.4, '#b5b1a6', px, 0, -29, 0, { b: EU.ub });                                   // paved top
  for (const sd of [-1, 1]) box(0.35, 0.19, 2.82, '#dfe03a', px + sd * 3.05, 0, -29, 0, { b: EU.ub });   // yellow end caps
}
// site: concrete forecourt with painted scooter bays
box(SITE.x1 - SITE.x0, 0.004, SITE.z1 - SITE.z0, '#959bab', (SITE.x0 + SITE.x1) / 2, -0.002, (SITE.z0 + SITE.z1) / 2, 0, { b: UB });   // top at 0.002, the gym floor is at 0.02
box(30, 0.025, 7.4, '#7d746a', -14, 0, 16.6, 0, { b: UB });
const SCOOT = [];
for (let r = 0; r < 2; r++) for (let i = 0; i < 26; i++) { const x = -27.8 + i * 1.05, z = r ? 18.9 : 14.3; SCOOT.push({ x, z, yaw: r ? -Math.PI / 2 : Math.PI / 2 }); box(0.06, 0.03, 2.0, '#f2f1ea', x - 0.52, 0, z, 0, { b: UB }); }
box(1.8, 0.03, 9, '#c4c9d4', DOOR.x, 0, 15.4, 0, { b: UB });     // entrance walk
const BUS_STOP = { x: 13.6, z: 20.5 };   // shelter sits back from the kerb so a bus can pull in
box(3.2, 0.06, 1.2, '#959bab', BUS_STOP.x, 0.12, BUS_STOP.z); box(3.2, 2.4, 0.08, '#74abe0', BUS_STOP.x, 0.12, BUS_STOP.z - 0.6); box(3.4, 0.1, 1.6, '#1e4a85', BUS_STOP.x, 2.5, BUS_STOP.z);
box(0.1, 2.4, 0.1, '#474c5c', BUS_STOP.x - 1.55, 0.12, BUS_STOP.z + 0.5); box(0.1, 2.4, 0.1, '#474c5c', BUS_STOP.x + 1.55, 0.12, BUS_STOP.z + 0.5); box(1.8, 0.45, 0.4, '#c4c9d4', BUS_STOP.x, 0.12, BUS_STOP.z - 0.3);
box(0.12, 3.0, 0.10, '#474c5c', BUS_STOP.x + 2.2, 0.12, BUS_STOP.z + 0.6); box(0.7, 1.1, 0.12, '#2f68ab', BUS_STOP.x + 2.2, 2.2, BUS_STOP.z + 0.6); box(0.6, 0.2, 0.13, '#dfe03a', BUS_STOP.x + 2.2, 2.4, BUS_STOP.z + 0.6);
const lampMat = new THREE.MeshLambertMaterial({ color: '#f6f79a', emissive: '#000000' });
// street lamps everywhere along the streets; at night each throws a soft pool of light on the ground
// the pools don't draw colour: they write how much lamp light falls on each pixel into the render target's alpha,
// and the post pass adds that light after the 64-colour palette, so the glow fades smoothly instead of banding or dithering
const GLOW_BLEND = { blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.ZeroFactor, blendDst: THREE.OneFactor,
  blendEquationAlpha: THREE.AddEquation, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
  transparent: true, depthWrite: false };
const poolMat = new THREE.ShaderMaterial({
  uniforms: { strength: { value: 0 }, soft: { value: 1.6 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform float strength; uniform float soft; varying vec2 vUv;
    void main(){ float r = length(vUv - 0.5) * 2.0; float a = pow(clamp(1.0 - r, 0.0, 1.0), soft) * (0.75 + 0.25 * exp(-r * r * 9.0));
      gl_FragColor = vec4(0.0, 0.0, 0.0, clamp(a * strength, 0.0, 0.98)); }`,
  ...GLOW_BLEND, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
});
// a faint cone of light under each lamp head, and a small halo around the head itself (both off unless the lamp style uses them)
const coneMat = new THREE.ShaderMaterial({
  uniforms: { strength: { value: 0 } },
  vertexShader: 'varying float vH; varying vec3 vN; varying vec3 vV; void main(){ vH = uv.y; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
  fragmentShader: `uniform float strength; varying float vH; varying vec3 vN; varying vec3 vV;
    void main(){ float edge = pow(abs(dot(normalize(vN), vec3(0.0, 0.0, 1.0))), 1.5); float a = strength * 0.32 * edge * (0.35 + 0.65 * vH);
      gl_FragColor = vec4(0.0, 0.0, 0.0, clamp(a, 0.0, 0.9)); }`,
  ...GLOW_BLEND, side: THREE.DoubleSide
});
const haloMat = new THREE.ShaderMaterial({
  uniforms: { strength: { value: 0 }, size: { value: 2.0 } },
  vertexShader: 'uniform float size; varying vec2 vP; void main(){ vP = position.xy * 2.0; vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0); mv.xy += position.xy * size * 2.0; mv.z += 1.0; gl_Position = projectionMatrix * mv; }',
  fragmentShader: `uniform float strength; varying vec2 vP;
    void main(){ float r = length(vP); float a = strength * (exp(-r * r * 5.0) * 0.9 + 0.25 * pow(clamp(1.0 - r, 0.0, 1.0), 2.0));
      gl_FragColor = vec4(0.0, 0.0, 0.0, clamp(a, 0.0, 0.95)); }`,
  ...GLOW_BLEND
});
const POOLS = new THREE.Group(); world.add(POOLS);
const CONES = new THREE.Group(); world.add(CONES); const HALOS = new THREE.Group(); world.add(HALOS);
const coneGeo = new THREE.CylinderGeometry(0.25, 2.3, 1, 20, 1, true).translate(0, 0.5, 0), haloGeo = new THREE.PlaneGeometry(1, 1);
function lampPool(x, y, z, r, sx = 1, sz = 1) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(r * 1.3, 32).rotateX(-Math.PI / 2), poolMat); m.position.set(x, y + 0.012, z); m.scale.set(sx, 1, sz); m.renderOrder = 1; POOLS.add(m);
}
function lampHead(x, y, z, hgt) {
  const c = new THREE.Mesh(coneGeo, coneMat); c.position.set(x, y, z); c.scale.set(1, hgt, 1); c.renderOrder = 2; CONES.add(c);
  const h = new THREE.Mesh(haloGeo, haloMat); h.position.set(x, y + hgt, z); h.renderOrder = 3; h.frustumCulled = false; HALOS.add(h);
}
function streetLamp(x, z, dx, dz, y0 = 0) {      // pole at (x,z), arm reaching (dx,dz) over the street
  box(0.12, 6, 0.12, '#6b7182', x, y0, z); box(Math.abs(dx) + 0.12, 0.1, Math.abs(dz) + 0.12, '#6b7182', x + dx / 2, y0 + 6, z + dz / 2);
  SB.add(place(new THREE.BoxGeometry(0.45, 0.14, 0.45), x + dx, y0 + 5.95, z + dz), lampMat);
  lampPool(x + dx, Math.max(y0, 0.03), z + dz, 3.0, dx ? 1.25 : 1, dz ? 1.25 : 1); lampHead(x + dx, Math.max(y0, 0.03), z + dz, 5.85 + y0 - Math.max(y0, 0.03));
}
for (const l of lotLights) { box(0.14, l.position.y, 0.14, '#474c5c', l.position.x, 0, l.position.z); SB.add(place(new THREE.BoxGeometry(0.5, 0.18, 0.5), l.position.x, l.position.y + 0.05, l.position.z), lampMat); lampPool(l.position.x, 0.02, l.position.z, 2.6); lampHead(l.position.x, 0.02, l.position.z, l.position.y - 0.05); }
const laneClear = (x, m = 3) => Math.abs(Math.abs(x) - 36) > m;
for (let x = -53; x < 53; x += 12) {
  if (laneClear(x + 1.1)) streetLamp(x, ROAD_Z - 3.3, 0, 1.6, 0.12);           // gym side of the main street
  if (laneClear(x + 6)) streetLamp(x + 6, ROAD_Z + 6.1, 0, -1.6, 0.12);        // far side, by the bike lane
  if (laneClear(x + 3) && Math.abs(x + 3) < 50) streetLamp(x + 3, -24.2, 0, -1.6); // along the back street
}
for (const lx of [-36, 36]) for (let z = -18; z < 18; z += 12) streetLamp(lx + (lx < 0 ? -2.6 : 2.6), z, lx < 0 ? 1.3 : -1.3, 0);   // side lanes
// traffic light at the corner
box(0.16, 4.2, 0.16, '#474c5c', 29, 0, ROAD_Z - 3.1); box(0.3, 0.8, 0.3, '#1c1f2a', 29, 3.4, ROAD_Z - 2.9); box(0.12, 0.12, 0.05, '#63a845', 29, 3.55, ROAD_Z - 2.74);
function tree(x, z, h, kind) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const pit = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.18, 1.18), L('#5a524c')); pit.position.y = 0.09; g.add(pit);
  const tr = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2.0, 0.28), L('#45291b')); tr.position.y = 1.0; g.add(tr);
  const cr = new THREE.Mesh(new THREE.IcosahedronGeometry(1.0 + h * 0.12, 0), L(pick(['#317033', '#448c3a', '#24552b']))); cr.position.y = 2.4 + h * 0.15; cr.scale.set(1, 0.8, 1); g.add(cr);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.userData.ph = rnd(0, 6); world.add(g); poplars.push(g); TREES.push({ x, z });
}
for (let x = -56; x <= 48; x += 8) { if (Math.abs(x - 13.6) < 3 || Math.abs(x - 30) < 5) continue; if (Math.abs(Math.abs(x + 2) - 36) > 3) tree(x + 2, ROAD_Z - 3.1, 3.5, 0); if (Math.abs(Math.abs(x + 5) - 36) > 3) tree(x + 5, ROAD_Z + 6.8, 3, 0); }
for (const [x, z] of [[-30, 8], [-30, -4], [-30, -16], [30, 8], [30, -6], [30, -18], [22, 18.5], [3, 18.5]]) tree(x, z, 2.5, 0);
// ---------------------------------------------------------------- shophouses and apartments
const SIGN_TXT = [['牛肉麵', '#d6403a'], ['早餐', '#dfe03a'], ['藥局', '#448c3a'], ['補習班', '#2f68ab'], ['咖啡', '#643c24'], ['機車行', '#d6403a'], ['便當', '#f0a060'], ['牙醫', '#2f68ab'], ['按摩', '#8a4f7d'], ['水餃', '#9b2226'], ['手搖飲', '#63a845'], ['24H', '#448c3a'], ['麵包', '#c99a5e'], ['眼鏡', '#1e4a85'], ['旅社', '#d07a8e'], ['鍋貼', '#e08f5a']];
const signMats = SIGN_TXT.map(([t, c], i) => {
  const cv = document.createElement('canvas'); cv.width = 32; cv.height = 96; const x = cv.getContext('2d');
  x.fillStyle = c; x.fillRect(0, 0, 32, 96); x.fillStyle = '#f2f1ea'; x.fillRect(2, 2, 28, 92); x.fillStyle = c; x.fillRect(4, 4, 24, 88);
  x.fillStyle = '#fff8e6'; x.font = '700 22px sans-serif'; x.textAlign = 'center';
  const chars = [...t]; chars.forEach((ch, k) => x.fillText(ch, 16, 26 + k * 26 * (3 / Math.max(3, chars.length))));
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = THREE.NearestFilter;
  return new THREE.MeshLambertMaterial({ map: tex, emissive: '#000000', emissiveMap: tex });
});
const TILES = ['#e8dcc0', '#cbb994', '#c4c9d4', '#eab38a', '#959bab', '#f2f1ea', '#a65b48', '#c98f6b', '#b5a58a', '#d9b8a0'];
// horizontal shop signboards over the arcades (text on a coloured board)
const H_SIGNS = [['牛肉麵', '#d6403a', '#fff8e6'], ['早餐店', '#dfe03a', '#9b2226'], ['藥局', '#448c3a', '#fff8e6'], ['補習班', '#2f68ab', '#fff8e6'], ['滷味', '#f0a060', '#1c1f2a'], ['機車行', '#1c1f2a', '#dfe03a'],
  ['便當', '#f2f1ea', '#d6403a'], ['牙醫診所', '#f2f1ea', '#2f68ab'], ['水餃', '#9b2226', '#fff8e6'], ['電器行', '#2f68ab', '#f2f1ea'], ['豆漿', '#dfe03a', '#d6403a'], ['五金', '#f2f1ea', '#1c1f2a'], ['麵包店', '#8a4f7d', '#fff8e6'], ['眼鏡行', '#2c6a52', '#fff8e6']];
const hSignMats = H_SIGNS.map(([t, bg, fg]) => {
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 32; const x = cv.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, 128, 32); x.fillStyle = fg; x.fillRect(0, 0, 128, 2); x.fillRect(0, 30, 128, 2);
  x.font = '700 22px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t, 64, 17);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = THREE.NearestFilter;
  return new THREE.MeshLambertMaterial({ map: tex, emissive: '#000000', emissiveMap: tex });
});
// local frame: facade along +u, facing direction (outward normal) given by yaw `fy` (0 = facing +z)
function shophouse(cx, cz, fy, w, d, floors, o = {}) {
  const c = Math.cos(fy), s = Math.sin(fy);
  const W = (u, v) => [cx + u * c + v * s, cz - u * s + v * c];          // u along facade, v outward
  const fh = 3.1, tile = o.tile || pick(TILES), arcade = o.arcade !== false, SD = SIDES[o.side || sideOf(cx, cz)];
  const bx = (wu, h, dv, col, u, y, v) => { const [x, z] = W(u, v); box(wu, h, dv, col, x, y, z, fy, { b: y >= fh - 0.01 ? SD.hb : SD.lb }); };
  // ground floor: arcade (qilou) with columns, recessed shopfront and rolling shutter
  if (arcade) {
    bx(w, fh, d - 3, '#6b7182', 0, 0, -1.5);
    for (let u = -w / 2 + 0.3; u <= w / 2 - 0.2; u += w / Math.max(1, Math.round(w / 4))) bx(0.5, fh, 0.5, tile, u, 0, d / 2 - 0.25);
    bx(w - 0.4, 2.2, 0.08, o.shop || pick(['#13305a', '#2f3340', '#959bab']), 0, 0, d / 2 - 2.96);
    // one signboard per shop bay, each a different size and height
    const nb = Math.max(1, Math.round(w / 4)), bwid = w / nb;
    for (let k = 0; k < nb; k++) {
      const sw = bwid - rnd(0.3, 0.9), sh = rnd(0.55, 0.8), u = -w / 2 + bwid * (k + 0.5), [x, z] = W(u, d / 2 + 0.12);
      const g = new THREE.BoxGeometry(sw, sh, 0.12); place(g, x, rnd(2.25, 2.4) + sh / 2, z, fy);
      const mats = [L('#1c1f2a'), L('#1c1f2a'), L('#1c1f2a'), L('#1c1f2a'), hSignMats[Math.floor(Math.random() * hSignMats.length)], L('#1c1f2a')];
      const m = new THREE.Mesh(g, mats); m.castShadow = true; SD.lo.add(m); signMeshes.push(m);
      if (Math.random() < 0.5) bx(bwid - 0.2, 0.08, 1.4, pick(['#2c6a52', '#959bab', '#d6403a', '#2f68ab']), u, 2.15, d / 2 + 0.6);   // shop awning
    }
  } else { bx(w, fh, d, '#7d746a', 0, 0, 0); bx(w - 0.4, 2.2, 0.08, '#474c5c', 0, 0, d / 2 + 0.02); }
  // upper floors
  const top = fh + (floors - 1) * 3.0;
  bx(w, top - fh, d, tile, 0, fh, 0);
  bx(w + 0.1, 0.12, d + 0.1, '#7d746a', 0, fh, 0);
  if (o.simple) {        // background block: window bands and a few AC units, far cheaper than the full facade
    for (let f = 0; f < floors - 1; f++) { const y = fh + f * 3.0; SD.hb.add(place(new THREE.BoxGeometry(w - 1.0, 1.2, 0.06), ...(() => { const [x, z] = W(0, d / 2 + 0.03); return [x, y + 0.9 + 0.6, z]; })(), fy), winMat);
      for (let k = 0; k < Math.floor(w / 3); k++) if (Math.random() < 0.5) bx(0.7, 0.45, 0.3, '#e8dcc0', -w / 2 + 1.5 + k * 3 + rnd(-0.3, 0.3), y + 0.4, d / 2 + 0.17); if (Math.random() < 0.4) bx(rnd(1.5, 3), 1.4, 0.4, '#3b3532', rnd(-w / 3, w / 3), y + 0.8, d / 2 + 0.2); }
  } else {
  // upper floors: every flat is different - caged windows, enclosed balconies with awnings, open balconies, AC units wherever they fit
  const frameCols = ['#f2f1ea', '#c4c9d4', '#3b3532', '#5a524c', '#2c6a52', '#959bab'];
  const bars = (u, y, bw, h, v, col) => { for (let q = -bw / 2 + 0.12; q < bw / 2 - 0.05; q += 0.24) bx(0.03, h, 0.03, col, u + q, y, v); bx(bw, 0.04, 0.03, col, u, y + h * 0.5, v); };
  for (let f = 0; f < floors - 1; f++) {
    const y = fh + f * 3.0;
    for (let u0 = -w / 2 + 0.35; u0 < w / 2 - 1.0;) {
      const bw = Math.min(pick([1.4, 1.8, 2.2, 2.6, 3.0]), w / 2 - 0.35 - u0), u = u0 + bw / 2, r = Math.random(), fc = pick(frameCols);
      if (bw < 0.9) break;
      if (r < 0.28) {                                   // enclosed (often illegal) balcony box hanging off the facade
        const dp = rnd(0.6, 1.0), h = 2.3;
        bx(bw, 0.12, dp, '#959bab', u, y + 0.45, d / 2 + dp / 2);
        SD.hb.add(place(new THREE.BoxGeometry(bw - 0.1, h - 0.4, 0.04), ...(() => { const [x, z] = W(u, d / 2 + dp - 0.05); return [x, y + 0.57 + (h - 0.4) / 2, z]; })(), fy), winMat);
        bars(u, y + 0.57, bw, h - 0.45, d / 2 + dp, fc); bx(0.05, h - 0.4, dp, fc, u - bw / 2, y + 0.57, d / 2 + dp / 2); bx(0.05, h - 0.4, dp, fc, u + bw / 2, y + 0.57, d / 2 + dp / 2);
        { const [x, z] = W(u, d / 2 + dp / 2 + 0.1); box(bw + 0.2, 0.06, dp + 0.45, pick(['#2c6a52', '#2f68ab', '#74abe0', '#959bab', '#448c3a']), x, y + 2.75, z, fy, { b: SD.hb, rx: -0.22 }); }
      } else if (r < 0.42) {                            // open balcony with railing, laundry
        bx(bw, 0.12, 0.9, '#c4c9d4', u, y + 0.05, d / 2 + 0.45); bx(bw - 0.3, 2.1, 0.05, '#1c1f2a', u, y + 0.17, d / 2 + 0.01);
        bars(u, y + 0.17, bw, 0.95, d / 2 + 0.88, fc);
        if (Math.random() < 0.6) for (let q = 0; q < 3; q++) bx(0.35, 0.5, 0.03, pick(['#f2f1ea', '#d6403a', '#2f68ab', '#dfe03a', '#d07a8e']), u - bw / 3 + q * bw / 3, y + 1.4, d / 2 + 0.5);
      } else {                                          // window, usually with an iron cage
        const ww = bw - rnd(0.25, 0.6), wh = rnd(1.1, 1.5), wy = y + rnd(0.8, 1.0);
        SD.hb.add(place(new THREE.BoxGeometry(ww, wh, 0.06), ...(() => { const [x, z] = W(u, d / 2 + 0.03); return [x, wy + wh / 2, z]; })(), fy), winMat);
        if (Math.random() < 0.7) { const cd = rnd(0.25, 0.45); bars(u, wy - 0.05, ww + 0.15, wh + 0.1, d / 2 + cd, fc); bx(ww + 0.15, 0.05, cd, fc, u, wy + wh + 0.05, d / 2 + cd / 2); bx(ww + 0.15, 0.08, cd, fc, u, wy - 0.08, d / 2 + cd / 2); if (Math.random() < 0.4) bx(ww + 0.3, 0.05, cd + 0.3, pick(['#2c6a52', '#74abe0', '#959bab']), u, wy + wh + 0.2, d / 2 + cd / 2 + 0.1); }
        else bx(ww + 0.1, 0.06, 0.18, '#7d746a', u, wy - 0.06, d / 2 + 0.09);
      }
      // air conditioners: split units on brackets or window units, placed wherever there is wall
      if (Math.random() < 0.55) { const au = u + (Math.random() < 0.5 ? -1 : 1) * (bw / 2 - 0.25), ay = y + rnd(0.1, 2.3); bx(0.7, 0.5, 0.32, pick(['#f2f1ea', '#e8dcc0', '#c4c9d4']), au, ay, d / 2 + 0.2); bx(0.5, 0.04, 0.38, '#5a524c', au, ay - 0.04, d / 2 + 0.2); }
      if (Math.random() < 0.15) bx(0.6, 0.42, 0.25, '#e8dcc0', u, y + 2.35, d / 2 + 0.12);
      u0 += bw + rnd(0.15, 0.6);
    }
  }
  }
  // weathering: patches of retiled or stained wall, drain pipes
  for (let k = 0; k < 3; k++) if (floors > 2 && Math.random() < 0.7) bx(rnd(1, 3), rnd(1, 3.5), 0.03, pick(TILES), rnd(-w / 2 + 1, w / 2 - 1), rnd(fh + 0.3, top - 1.5), d / 2 + 0.015 + k * 0.004);   // k * 4 mm so overlapping patches never share a plane
  for (const pu of [-w / 2 + 0.15, w / 2 - 0.15]) if (Math.random() < 0.6) bx(0.08, top - fh, 0.08, '#959bab', pu, fh, d / 2 + 0.06);
  // roof: parapet, water tank, corrugated add-on
  bx(w, 0.9, 0.15, tile, 0, top, d / 2 - 0.08); bx(w, 0.9, 0.15, tile, 0, top, -d / 2 + 0.08);   // 5 mm inside the wall planes so back-to-back rows never overlap
  if (o.addon !== false && Math.random() < 0.7) { bx(w * 0.6, 2.3, d * 0.5, '#c4c9d4', -w * 0.15, top, -d * 0.15); bx(w * 0.62 + 0.4, 0.12, d * 0.5 + 0.6, pick(['#2f68ab', '#74abe0', '#2c6a52', '#a5cdf0']), -w * 0.15, top + 2.3, -d * 0.15); }
  { const [x, z] = W(w * 0.3, -d * 0.2); for (const dx of [-0.4, 0.4]) box(0.1, 1.0, 0.1, '#6b7182', x + dx, top, z, 0, { b: SD.hb }); cyl(0.6, 0.6, 1.3, 10, pick(['#cbb994', '#74abe0', '#f2f1ea']), x, top + 1.0, z, { b: SD.hb }); }
  // vertical signs on the facade
  for (let k = 0; k < (o.signs ?? Math.floor(w / 5)); k++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.4, 0.8), [L('#1c1f2a'), L('#1c1f2a'), L('#1c1f2a'), L('#1c1f2a'), signMats[Math.floor(Math.random() * signMats.length)], signMats[Math.floor(Math.random() * signMats.length)]]);
    const [x, z] = W(-w / 2 + 1 + k * 4.2 + Math.random(), d / 2 + 0.55);
    m.position.set(x, fh + 1.6 + Math.random() * 1.5, z); m.rotation.y = fy + Math.PI / 2; m.castShadow = true; m.position.y -= fh; SD.hi.add(m); signMeshes.push(m);
  }
  NB.push({ cx, cz, w, d });
}
// across the main street: a continuous row of arcaded shophouses
// buildings stay off the streets: rows break for the side lanes (x = ±36, 4.5 m wide) and stop short of the main and back roads
const LANE_GAP = (x0, x1) => [-36, 36].some(lx => x1 > lx - 2.9 && x0 < lx + 2.9);
const rowAlong = (xa, xb, wf, fn) => { for (let x = xa; x < xb;) { let w = wf(); if (LANE_GAP(x, x + w)) { const lx = [-36, 36].find(q => x + w > q - 2.9 && x < q + 2.9); if (x < lx - 2.9 - 4) w = lx - 2.9 - x; else { x = lx + 2.9; continue; } } fn(x + w / 2, w); x += w; } };
rowAlong(-50 + rnd(0, 4), 43, () => 6 + Math.floor(Math.random() * 4) * 1.5, (cx, w) => shophouse(cx, ROAD_Z + 12.4 + 6, Math.PI, w, 12, 4 + Math.floor(Math.random() * 4)));
// left and right neighbours across the lanes (facing the lanes), back row behind the metro
for (let z = -23.5; z < 19.5 - 4; ) { const w = Math.min(6 + Math.floor(Math.random() * 3) * 2, 19.5 - z); shophouse(-38.25 - 6, z + w / 2, Math.PI / 2, w, 12, 4 + Math.floor(Math.random() * 3), { arcade: false, signs: 1 }); shophouse(38.25 + 6, z + w / 2, -Math.PI / 2, w, 12, 4 + Math.floor(Math.random() * 3), { arcade: false, signs: 1 }); z += w; }
rowAlong(-50 + rnd(0, 4), 42, () => 7 + Math.floor(Math.random() * 3) * 2, (cx, w) => shophouse(cx, -43.5, 0, w, 12, 5 + Math.floor(Math.random() * 4), { signs: 1 }));
// outer city: two more rows behind every edge, getting taller towards the back (simple facades)
const LANE_GAP2 = (x0, x1) => [-58, -36, 36, 58].some(lx => x1 > lx - 3.2 && x0 < lx + 3.2);
const rowAlong2 = (xa, xb, wf, fn) => { for (let x = xa; x < xb;) { const w = wf(); if (LANE_GAP2(x, x + w)) { x += 2; continue; } fn(x + w / 2, w); x += w; } };
for (const [zc, fl] of [[-55.5, [6, 9]], [-71, [9, 14]]]) rowAlong2(-88, 82, () => 8 + Math.floor(Math.random() * 4) * 2, (cx, w) => shophouse(cx, zc, 0, w, 12, fl[0] + Math.floor(Math.random() * (fl[1] - fl[0])), { simple: true, signs: 0, arcade: false }));
rowAlong2(-88, 82, () => 6 + Math.floor(Math.random() * 4) * 1.5, (cx, w) => { if (Math.abs(cx) > 48) shophouse(cx, ROAD_Z + 12.4 + 6, Math.PI, w, 12, 4 + Math.floor(Math.random() * 4), { simple: true, signs: 1 }); });
for (const [zc, fl] of [[ROAD_Z + 37, [6, 9]], [ROAD_Z + 52.5, [9, 14]]]) rowAlong2(-88, 82, () => 8 + Math.floor(Math.random() * 4) * 2, (cx, w) => shophouse(cx, zc, Math.PI, w, 12, fl[0] + Math.floor(Math.random() * (fl[1] - fl[0])), { simple: true, signs: 0, arcade: false }));
for (const [xc, fl] of [[58.5, [6, 9]], [74, [9, 14]]]) for (const sd of [-1, 1]) for (let z = -48; z < 19.5 - 4;) { const w = Math.min(8 + Math.floor(Math.random() * 3) * 2, 19.5 - z); shophouse(sd * xc, z + w / 2, sd > 0 ? -Math.PI / 2 : Math.PI / 2, w, 12, fl[0] + Math.floor(Math.random() * (fl[1] - fl[0])), { simple: true, signs: 0, arcade: false }); z += w; }
for (const z of [-47.8, ROAD_Z + 27.7]) box(200, 0.028, 5.5, '#3b3532', 0, 0, z, 0, { b: EU.ub });   // 2 mm under the side lanes that cross it
// the elevated metro behind the gym
const METRO = { z: -29, y: 8.5 };   // piers stand on the back street's centre line (BZ), inside raised medians
const MB = { b: new Builder() }, metroG = new THREE.Group(); EU.w.add(metroG);
// Wenhu line guideway: twin track, concrete running pads 1.88 m apart, steel guide rails, box girder on single piers
box(250, 0.35, 9, '#c4c9d4', 0, METRO.y - 0.35, METRO.z, 0, MB); box(250, 1.4, 5, '#a5a39a', 0, METRO.y - 1.75, METRO.z, 0, MB);
for (const sd of [-1, 1]) { box(250, 0.9, 0.22, '#c4c9d4', 0, METRO.y, METRO.z + sd * 4.4, 0, MB); box(250, 0.12, 0.3, '#959bab', 0, METRO.y + 0.9, METRO.z + sd * 4.4, 0, MB); }
for (const tz of [-2.1, 2.1]) {
  for (const sd of [-1, 1]) { box(250, 0.2, 0.45, '#959bab', 0, METRO.y, METRO.z + tz + sd * 0.94, 0, MB); box(250, 0.42, 0.08, '#6b7182', 0, METRO.y, METRO.z + tz + sd * 1.45, 0, MB); }
  box(250, 0.06, 0.6, '#7d746a', 0, METRO.y, METRO.z + tz, 0, MB);
}
for (let x = -120; x <= 120; x += 30) { box(2.0, METRO.y - 2.95, 2.0, '#a5a39a', x, 0, METRO.z, 0, MB); box(2.6, 1.1, 8.4, '#a5a39a', x, METRO.y - 2.95, METRO.z, 0, MB); }
MB.b.flush(metroG);
// scooters parked along the sidewalks and in the arcades (static)
function scooterGeo(x, z, yaw, col, b = SB) { addTemplate(b, SCOOT_T, x, z, yaw, col); }
const SCOOT_COL = ['#d6403a', '#f2f1ea', '#1c1f2a', '#2f68ab', '#959bab', '#dfe03a', '#74abe0', '#d07a8e', '#63a845'];
// far side of the main street: kerb strip with trees, a YouBike lane, then the pedestrian walkway up to the arcades
box(420, 0.12, 1.8, '#2c6a52', 0, 0, ROAD_Z + 8.3, 0, { b: EU.ub });
for (let x = -200; x < 200; x += 3) for (const dz of [-0.86, 0, 0.86]) box(dz ? 1.6 : 1.0, 0.125, 0.08, '#f2f1ea', x, 0, ROAD_Z + 8.3 + dz, 0, { b: EU.ub });
for (let x = -90; x < 90; x += 15) for (const dz of [-0.45, 0.45]) { box(0.36, 0.13, 0.36, '#f2f1ea', x - 0.35, 0, ROAD_Z + 8.3 + dz, 0, { b: EU.ub }); box(0.36, 0.13, 0.36, '#f2f1ea', x + 0.35, 0, ROAD_Z + 8.3 + dz, 0, { b: EU.ub }); box(0.6, 0.13, 0.08, '#f2f1ea', x, 0, ROAD_Z + 8.3 + dz, 0, { b: EU.ub }); }   // bike symbols
box(420, 0.12, 3.2, '#cbb994', 0, 0, ROAD_Z + 10.8, 0, { b: EU.ub });
for (let x = -200; x < 200; x += 1.2) box(0.04, 0.122, 3.18, '#b09a70', x, 0, ROAD_Z + 10.8, 0, { b: EU.ub });   // 1 cm inside the walkway edge
box(419.9, 0.125, 0.3, '#dfe03a', 0, 0, ROAD_Z + 9.55, 0, { b: EU.ub });    // tactile guide strip
// YouBike dock: kiosk, posts, a row of bikes nose-in
{
  const zb = ROAD_Z + 11.65; box(0.7, 1.7, 0.45, '#dfe03a', 15.0, 0.12, zb + 0.3, 0, { b: EU.sb }); box(0.5, 0.4, 0.05, '#1c1f2a', 15.0, 1.1, zb + 0.06, 0, { b: EU.sb });
  box(0.1, 2.6, 0.1, '#6b7182', 14.3, 0.12, zb + 0.5, 0, { b: EU.sb }); box(0.8, 0.5, 0.06, '#dfe03a', 14.3, 2.3, zb + 0.5, 0, { b: EU.sb });
  for (let i = 0; i < 14; i++) { const x = 16 + i * 0.75; box(0.12, 0.85, 0.22, '#959bab', x, 0.12, zb + 0.6, 0, { b: EU.sb }); if ((i * 5) % 7 < 5) addTemplate(EU.sb, YOUBIKE_T, x, zb - 0.25, -Math.PI / 2, '#f2c230', 0.12); }
}
for (let x = -53; x < 53; x += 0.95) { if ((x > -34 && x < 34) || Math.abs(Math.abs(x) - 36) < 2.6) continue; if (Math.random() < 0.7) scooterGeo(x, ROAD_Z - 2.4, Math.PI / 2 + rnd(-0.1, 0.1), pick(SCOOT_COL), EU.sb); }
for (let z = -21; z < 19; z += 0.95) { if (Math.random() < 0.55) scooterGeo(-37.9, z, Math.PI + rnd(-0.1, 0.1), pick(SCOOT_COL), EU.sb); if (Math.random() < 0.55) scooterGeo(37.9, z, rnd(-0.1, 0.1), pick(SCOOT_COL), EU.sb); }
const lotLights2 = [];
// ================================================================ suburban and rural surroundings
// shared helpers: a gable roof (ridge along the facade), a static tree, a parked car, a hedge run
function gableGeo(w, h, d) {
  const sh = new THREE.Shape(); sh.moveTo(-d / 2, 0); sh.lineTo(d / 2, 0); sh.lineTo(0, h); sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth: w, bevelEnabled: false }); g.translate(0, 0, -w / 2); g.rotateY(Math.PI / 2); return g;
}
function sTree(b, x, z, h = 1, col) {        // static round tree (no sway, merged)
  box(0.26 * h, 2.0 * h, 0.26 * h, '#45291b', x, 0, z, 0, { b });
  const g = new THREE.IcosahedronGeometry(1.15 * h, 0); g.scale(1, 0.85, 1); b.add(place(g, x, 2.6 * h, z, rnd(0, 3)), L(col || pick(['#317033', '#448c3a', '#24552b'])));
}
function sPoplar(b, x, z, h = 1) { box(0.2, 1.4, 0.2, '#45291b', x, 0, z, 0, { b }); const g = new THREE.ConeGeometry(0.9 * h, 6.5 * h, 6); b.add(place(g, x, 1.2 + 3.25 * h, z), L(pick(['#2c6a52', '#317033']))); }
function sCar(b, x, z, yaw, col) { addTemplate(b, CAR_T, x, z, yaw, col); }
function hedge(b, x0, z0, x1, z1, h = 1.1) {
  const len = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(-(z1 - z0), x1 - x0);
  box(len, h, 0.9, '#2c6a52', (x0 + x1) / 2, 0, (z0 + z1) / 2, ry, { b }); box(len - 0.1, 0.12, 0.8, '#317033', (x0 + x1) / 2, h, (z0 + z1) / 2, ry, { b });
}
function sideBuilders(E, x, z) { return E.sides[sideOf(x, z)]; }
function mountains(E, n, r0, r1, cols, hMul = 1) {
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2 + rnd(-0.1, 0.1), r = rnd(r0, r1), x = Math.cos(a) * r, z = Math.sin(a) * r * 0.85;
    const g = new THREE.IcosahedronGeometry(rnd(30, 55), 0); g.scale(rnd(1.2, 1.8), rnd(0.45, 0.7) * hMul, 1); g.translate(0, -6, 0);
    sideBuilders(E, x, z).tb.add(place(g, x, 0, z, rnd(0, 3)), L(pick(cols)));
  }
}
// a house split at 3.1 m so the near-side cutaway keeps the ground floor: walls, windows, gable roof
function house(E, cx, cz, fy, w, d, floors, o = {}) {
  const SD = sideBuilders(E, cx, cz), c = Math.cos(fy), s = Math.sin(fy), fh = 3.1;
  const W = (u, v) => [cx + u * c + v * s, cz - u * s + v * c];
  const bx = (wu, h, dv, col, u, y, v) => { const [x, z] = W(u, v); box(wu, h, dv, col, x, y, z, fy, { b: y >= fh - 0.01 ? SD.hb : SD.lb }); };
  const wall = o.wall || pick(['#f2f1ea', '#e8dcc0', '#cbb994', '#c4c9d4', '#eab38a']);
  bx(w, fh, d, wall, 0, 0, 0);
  bx(1.0, 2.2, 0.06, '#643c24', -w / 4, 0, d / 2 + 0.02);
  if (o.garage) bx(2.6, 2.3, 0.06, '#959bab', w / 4, 0, d / 2 + 0.02);
  else SD.lb.add(place(new THREE.BoxGeometry(1.6, 1.2, 0.08), ...W(w / 4, d / 2 + 0.03).flatMap((v, i) => i ? [1.2 + 0.6, v] : [v]), fy), winMat);
  const top = fh + (floors - 1) * 3.0;
  if (floors > 1) {
    bx(w, top - fh, d, wall, 0, fh, 0); bx(w + 0.1, 0.1, d + 0.1, '#7d746a', 0, fh, 0);
    for (let f = 0; f < floors - 1; f++) for (let u = -w / 2 + 1.4; u < w / 2 - 0.8; u += 2.6) { const [x, z] = W(u, d / 2 + 0.03); SD.hb.add(place(new THREE.BoxGeometry(1.4, 1.3, 0.08), x, fh + f * 3 + 1.55, z, fy), winMat); }
    if (o.balcony) { bx(w * 0.6, 0.12, 1.0, '#959bab', 0, fh + 0.05, d / 2 + 0.5); bx(w * 0.6, 0.9, 0.05, '#c4c9d4', 0, fh + 0.17, d / 2 + 0.98); }
  }
  const rh = o.flat ? 0 : Math.min(2.4, d * 0.28), rc = o.roof || pick(['#9b2226', '#5a524c', '#2f3340', '#643c24', '#1e4a85']);
  if (o.flat) { bx(w, 0.6, 0.12, wall, 0, top, d / 2 - 0.06); bx(w, 0.6, 0.12, wall, 0, top, -d / 2 + 0.06); if (o.tank !== false) { const [x, z] = W(w * 0.25, -d * 0.2); SD.hb.add(place(new THREE.CylinderGeometry(0.55, 0.55, 1.2, 10), x, top + 0.9, z), L('#cbb994')); } }
  else { const [x, z] = W(0, 0); (top >= fh ? SD.hb : SD.lb).add(place(gableGeo(w + 0.5, rh, d + 0.6), x, top, z, fy), L(rc)); }
  return SD;
}
// ---------------- suburban: lawns, hedges, a car park, detached houses with gardens, hills on the horizon
{
  const E = ENV.Suburban, b = E.sb, ub = E.ub;
  // streets: quiet asphalt lanes with grass verges, back road
  laneRuns(ub, '#565c6c', 4.5, null); for (const x of [-36, 36]) for (const [z0, z1] of LANE_SEGS) box(0.12, 0.035, z1 - z0 - 0.04, '#e8dcc0', x, 0, (z0 + z1) / 2, 0, { b: ub });
  box(200, 0.03, 7, '#565c6c', 0, 0, -29, 0, { b: ub });
  for (let x = -58; x < 58; x += 4) box(2.0, 0.035, 0.12, '#e8dcc0', x + 1, 0, -29, 0, { b: ub }); for (const dz of [-3.3, 3.3]) box(116, 0.035, 0.1, '#e8dcc0', 0, 0, -29 + dz, 0, { b: ub });
  // lawns on the lot around the hall; the paved forecourt stays at the front
  const lawn = '#63a845';
  for (const [x0, x1, z0, z1] of [[-33.5, -15.8, -24, 11], [15.8, 33.5, -24, 11], [-15.8, 15.8, -24, -10.8]]) box(x1 - x0, 0.03, z1 - z0, lawn, (x0 + x1) / 2, 0.005, (z0 + z1) / 2, 0, { b: ub });
  // hedges: the back and both sides, with gaps where people come in off the lanes
  hedge(b, -33.1, -23.6, 33.1, -23.6); hedge(b, -33.1, -14, -33.1, 10); hedge(b, 33.1, -14, 33.1, 10);
  hedge(b, -33.1, 10, -29.5, 10, 0.8); hedge(b, 29.5, 10, 33.1, 10, 0.8);
  // car park east of the hall
  box(12.6, 0.04, 13.4, '#474c5c', 25.3, 0, 0.5, 0, { b: ub });
  for (let i = 0; i <= 5; i++) for (const z of [-3.6, 4.6]) box(0.1, 0.045, 4.6, '#f2f1ea', 19.6 + i * 2.5 - 0.6, 0, z, 0, { b: ub });
  for (let i = 0; i < 5; i++) for (const [z, yaw] of [[-3.6, 0], [4.6, Math.PI]]) if ((i * 7 + (z > 0 ? 3 : 0)) % 5 < 3) sCar(b, 20.25 + i * 2.5, z, yaw, pick(['#f2f1ea', '#959bab', '#1c1f2a', '#d6403a', '#2f68ab', '#c4c9d4']));
  // trees in the lawns, poplars along the back hedge
  for (const [x, z] of [[-30, 6], [-30, -6], [-24, -18], [-12, -20], [4, -20], [18, -20], [29, -14], [-26, -2]]) sTree(b, x, z, 1.0 + rnd(-0.1, 0.2));
  for (let x = -30; x <= 30; x += 6) sPoplar(sideBuilders(E, x, -25.2).tb, x, -25.2, 1);
  // houses: whole lots - lawn, driveway, path, shrubs, mailbox, back fence - and four house types after the references
  // (ranch with hip roof and garage wing, two-storey cross-gable with porch, bungalow with dormer, modern flat-roof)
  const WALLS = ['#f2f1ea', '#e8dcc0', '#cbb994', '#c4c9d4', '#eab38a', '#a5cdf0', '#b5c49a', '#d9b8a0'];
  const ROOFS = ['#5a524c', '#474c5c', '#643c24', '#9b2226', '#2f68ab', '#5c1418', '#45291b', '#7d746a', '#a6533a', '#87552f'];   // greys, blue, browns and maroons (no green)
  function pyramidGeo(w, h, d) { const g = new THREE.ConeGeometry(1, h, 4); g.rotateY(Math.PI / 4); g.scale(w / 2 / 0.7071, 1, d / 2 / 0.7071); g.translate(0, h / 2, 0); return g; }
  let lotSeq = 0;   // each lawn sits a fraction higher than the last (mod 8) so overlapping lots never share a plane
  function lot(cx, cz, fy, lw, ld, type) {
    const SD = sideBuilders(E, cx, cz), c = Math.cos(fy), s = Math.sin(fy), fh = 3.1;
    const W = (u, v) => [cx + u * c + v * s, cz - u * s + v * c];                  // u along the street, v towards it
    const B = (y) => (y >= fh - 0.01 ? SD.hb : SD.lb);
    const bx = (wu, h, dv, col, u, y, v, rot = 0) => { const [x, z] = W(u, v); box(wu, h, dv, col, x, y, z, fy + rot, { b: B(y) }); };
    const geo = (g, col, u, y, v, rot = 0) => { const [x, z] = W(u, v); B(y).add(place(g, x, y, z, fy + rot), L(col)); };
    const win = (wu, h, u, y, v, rot = 0) => { const [x, z] = W(u, v); B(y).add(place(new THREE.BoxGeometry(wu, h, 0.06), x, y + h / 2, z, fy + rot), winMat); };
    const wall = pick(WALLS), roof = pick(ROOFS), trim = '#f2f1ea', front = ld / 2;
    // the lot: lawn, driveway, path, shrubs, mailbox, fenced back yard
    { const [x, z] = W(0, 0), q = lotSeq++ % 8; box(lw - 0.2 - q * 0.004, 0.03, ld - 0.2 - q * 0.004, pick(['#63a845', '#6f9a48', '#5d9a40']), x, 0.006 + q * 0.0007, z, fy, { b: ub }); }   // each lawn a hair higher and smaller than the last (mod 8): overlapping lots share no plane
    const gSide = Math.random() < 0.5 ? -1 : 1, hv = front - 5.5;                     // garage side, house front line
    const dU = gSide * (lw / 2 - 2.2);
    { const [x, z] = W(dU, (front + hv) / 2); box(3.4, 0.04, front - hv, '#c4c9d4', x, 0.008, z, fy, { b: ub }); }
    { const [x, z] = W(-gSide * 0.8, (front + hv) / 2); box(1.0, 0.04, front - hv, '#cbb994', x, 0.011, z, fy, { b: ub }); }   // 3 mm above the driveway where they overlap
    for (let q = 0; q < 4; q++) bx(0.62, 0.5, 0.62, pick(['#317033', '#448c3a', '#24552b']), -gSide * (1.8 + q * 0.9), 0, hv + 0.6);   // 62 cm so the sides never line up with a bay wall
    bx(0.08, 1.0, 0.08, '#474c5c', -gSide * 1.6, 0, front - 0.4); bx(0.25, 0.22, 0.4, pick(['#1c1f2a', '#f2f1ea', '#2f68ab']), -gSide * 1.6, 1.0, front - 0.4);
    const back = -ld / 2 + 0.1, mid = hv - 9.5;
    for (const su of [-1, 1]) bx(0.08, 1.6, mid - back, '#a9733f', su * (lw / 2 - 0.1), 0, (mid + back) / 2);
    bx(lw - 0.2, 1.6, 0.08, '#a9733f', 0, 0, back);
    if (Math.random() < 0.5) sTree(b, ...W(gSide * (lw / 2 - 2), back + 2.2), rnd(0.9, 1.15));
    if (Math.random() < 0.5) addTemplate(SD.lb, CAR_T, ...W(dU, hv + 3.2), fy, pick(['#f2f1ea', '#959bab', '#1c1f2a', '#d6403a', '#2f68ab', '#c4c9d4']));
    // the house
    if (type === 0) {        // ranch: long single storey, hip roof, garage wing with a front gable
      const mw = lw - 4.6, md = 8;
      bx(mw, 3.0, md, wall, -gSide * 1.7, 0, hv - md / 2); geo(pyramidGeo(mw + 0.8, 2.0, md + 0.8), roof, -gSide * 1.7, 3.0, hv - md / 2);
      bx(3.6, 2.8, 6.4, wall, dU, 0, hv - 3.0); geo(gableGeo(6.8, 1.5, 4.2), roof, dU, 2.8, hv - 3.0, Math.PI / 2);
      bx(2.8, 2.2, 0.06, trim, dU, 0, hv + 0.21);
      bx(1.0, 2.1, 0.06, '#643c24', -gSide * 0.6, 0, hv + 0.01); win(1.6, 1.1, -gSide * 3.0, 0.9, hv + 0.02); win(1.6, 1.1, -gSide * (mw - 1.5) + -gSide * 0.0, 0.9, hv + 0.02);
      bx(0.5, 0.9, 0.5, '#959bab', -gSide * 1.5, 4.4, hv - 5.0);              // chimney
    } else if (type === 1) { // two storeys, cross gable, porch
      const mw = lw - 3.0, md = 8.5;
      bx(mw, 5.6, md, wall, 0, 0, hv - md / 2); geo(gableGeo(mw + 0.6, 2.2, md + 0.8), roof, 0, 5.6, hv - md / 2);
      bx(4.2, 5.6, 2.0, wall, -gSide * 1.8, 0, hv + 0.9); geo(gableGeo(2.9, 1.8, 4.8), roof, -gSide * 1.8, 5.6, hv + 0.7, Math.PI / 2);
      bx(2.8, 2.3, 0.06, trim, dU, 0, hv + 0.03);
      bx(4.0, 0.25, 1.6, '#c4c9d4', gSide * 0.6, 0, hv + 0.8); for (const pu of [-1.8, 1.8]) bx(0.15, 2.6, 0.15, trim, gSide * 0.6 + pu, 0.25, hv + 1.5);
      bx(4.2, 0.15, 1.8, roof, gSide * 0.6, 2.85, hv + 0.8);
      bx(1.0, 2.1, 0.06, '#2f68ab', gSide * 0.6, 0.25, hv + 0.01);
      for (const wu of [-1.2, 1.2]) win(1.0, 1.2, -gSide * 1.8 + wu * 0.8, 3.4, hv + 1.92); win(1.4, 1.2, -gSide * 1.8, 0.9, hv + 1.92); win(1.4, 1.2, gSide * 1.5, 3.4, hv + 0.02);
    } else if (type === 2) { // bungalow: front-facing gable, dormer, full-width porch
      const mw = lw - 5.2, md = 9;
      bx(mw, 3.6, md, wall, -gSide * 1.4, 0, hv - md / 2); geo(gableGeo(md + 0.8, 2.6, mw + 0.8), roof, -gSide * 1.4, 3.6, hv - md / 2, Math.PI / 2);
      bx(1.6, 1.2, 1.4, wall, -gSide * 1.4, 4.3, hv - md / 2 + 1.0); geo(gableGeo(1.8, 0.7, 1.9), roof, -gSide * 1.4, 5.5, hv - md / 2 + 1.0, Math.PI / 2); win(0.9, 0.7, -gSide * 1.4, 4.5, hv - md / 2 + 1.72);
      bx(mw, 0.25, 1.8, '#c4c9d4', -gSide * 1.4, 0, hv + 0.9); for (const pu of [-mw / 2 + 0.3, 0, mw / 2 - 0.3]) bx(0.18, 2.6, 0.18, trim, -gSide * 1.4 + pu, 0.25, hv + 1.6);
      bx(mw + 0.3, 0.15, 2.0, roof, -gSide * 1.4, 2.85, hv + 0.9);
      bx(1.0, 2.1, 0.06, '#9b2226', -gSide * 0.4, 0.25, hv + 0.01); win(1.6, 1.3, -gSide * 2.6, 1.0, hv + 0.02);
      bx(3.2, 2.6, 5.5, wall, dU, 0, hv - 2.75); bx(3.6, 0.2, 5.9, roof, dU, 2.6, hv - 2.75); bx(2.6, 2.2, 0.06, trim, dU, 0, hv + 0.01);
    } else {                 // modern: two offset boxes, flat roofs, wide glazing, roof terrace
      const mw = lw - 3.4, md = 8;
      bx(mw, 3.0, md, wall, 0, 0, hv - md / 2); bx(mw * 0.7, 2.8, md - 1.5, pick(['#f2f1ea', '#474c5c', '#cbb994']), gSide * mw * 0.15, 3.0, hv - md / 2 - 0.75);
      win(mw * 0.45, 2.0, -gSide * mw * 0.2, 0.5, hv + 0.02); win(mw * 0.5, 1.6, gSide * mw * 0.15, 3.6, hv - 0.73);
      bx(mw * 0.3, 0.1, md, '#474c5c', -gSide * mw * 0.35, 3.0, hv - md / 2); bx(mw * 0.3, 0.9, 0.05, '#c4c9d4', -gSide * mw * 0.35, 3.1, hv - 0.02);
      bx(mw + 0.3, 0.15, md + 0.3, '#474c5c', 0, 2.95, hv - md / 2); bx(mw * 0.7 + 0.3, 0.15, md - 1.2, '#474c5c', gSide * mw * 0.15, 5.8, hv - md / 2 - 0.75);
      bx(2.8, 2.3, 0.06, '#565c6c', dU, 0, hv + 0.02);
    }
  }
  // lots: across the main street, behind the back road, and along both side lanes; one becomes a pocket park
  const lots = [];
  for (let x = -52; x < 52;) { const w = rnd(11.5, 14); if (LANE_GAP(x, x + w)) { x = [-36, 36].find(q => x + w > q - 2.9 && x < q + 2.9) + 2.9; continue; } if (x + w > 52) break; lots.push([x + w / 2, ROAD_Z + 7.6 + 9.5, Math.PI, w, 19]); x += w; }
  for (let x = -52; x < 52;) { const w = rnd(11.5, 14); if (LANE_GAP(x, x + w)) { x = [-36, 36].find(q => x + w > q - 2.9 && x < q + 2.9) + 2.9; continue; } if (x + w > 52) break; lots.push([x + w / 2, -33 - 8.5, 0, w, 17]); x += w; }
  for (const sd of [-1, 1]) for (let z = -24; z < 19.5;) { const w = Math.min(rnd(11.5, 14), 19.5 - z); if (w < 10) break; lots.push([sd * (38.6 + 7.5), z + w / 2, sd > 0 ? -Math.PI / 2 : Math.PI / 2, w, 15]); z += w; }
  // outer ring of the subdivision so the view never runs out of town: the inner rows run on, plus a second street
  // and row of lots on every side (streets at z 54 / -54 and x ±58)
  {
    const gapL = [-58, -36, 36, 58], gap = (x0, x1) => gapL.find(q => x1 > q - 3.6 && x0 < q + 3.6);
    const row = (xa, xb, z, fy, d) => { for (let x = xa; x < xb;) { const w = rnd(11.5, 14), g = gap(x, x + w); if (g !== undefined) { x = g + 3.6; continue; } if (x + w > xb) break; lots.push([x + w / 2, z, fy, w, d]); x += w; } };
    for (const [xa, xb] of [[-90, -52], [52, 90]]) { row(xa, xb, ROAD_Z + 7.6 + 9.5, Math.PI, 19); row(xa, xb, -33 - 8.5, 0, 17); }
    row(-90, 90, 57.6 + 9, Math.PI, 18); row(-90, 90, -57.6 - 9, 0, 18);
    for (const sd of [-1, 1]) { for (let z = -50; z < 50;) { const w = rnd(11.5, 14); if (Math.abs(z + w / 2 - ROAD_Z - 2) < 10 || Math.abs(z + w / 2 + 29) < 9 || Math.abs(Math.abs(z + w / 2) - 54) < 9.5) { z += w; continue; } lots.push([sd * (61.6 + 7.5), z + w / 2, sd > 0 ? -Math.PI / 2 : Math.PI / 2, w, 15]); z += w; } }
    for (const z of [54, -54]) { box(200, 0.028, 7, '#565c6c', 0, 0, z, 0, { b: ub }); for (let x = -98; x < 98; x += 4) box(2.0, 0.035, 0.12, '#e8dcc0', x + 1, 0, z, 0, { b: ub }); }
    for (const x of [-58, 58]) { box(7, 0.028, 200, '#565c6c', x, 0, 0, 0, { b: ub });   // 2 mm under the main street at the crossing
      for (let z = -98; z < 98; z += 4) box(0.12, 0.035, 2.0, '#e8dcc0', x, 0, z + 1, 0, { b: ub }); }
    for (const x of [-36, 36]) for (const [z0, z1] of [[-90, -33.5], [ROAD_Z + 5.4, 90]]) box(4.5, 0.03, z1 - z0, '#565c6c', x, 0, (z0 + z1) / 2, 0, { b: ub });
    for (let i = 0; i < 40; i++) { const x = rnd(-88, 88), z = rnd(-88, 88); if (Math.abs(x) > 56 || Math.abs(z) > 52) sTree(b, x, z, rnd(0.9, 1.25)); }
  }
  // the plot west of the side lane is reserved for the pocket park: when the first lot of the row happens to fit the gap, drop it
  for (let i = lots.length - 1; i >= 0; i--) if (lots[i][2] === 0 && lots[i][1] === -41.5 && lots[i][0] > -53 && lots[i][0] < -38) lots.splice(i, 1);
  lots.forEach(l => lot(l[0], l[1], l[2], l[3], l[4], Math.floor(Math.random() * 4)));
  // the plot west of the side lane, which the lot row skips because the lane is in the way, becomes the pocket park
  {
    const l = [-45.2, -41.5, 0, 13.4, 17];
    // pocket park: a children's playground (wood-chip surface in a concrete ring, play tower with two slides, swings,
    // activity panel, spring riders, sandbox), a fenced front with a gate, benches, and planted garden beds at the back
    const [cx, cz, , pw, pd] = l, SD = sideBuilders(E, cx, cz), hw = pw / 2 - 0.2, hd = pd / 2 - 0.2;
    const bk = (w, h, d, c, u, y, v, o = {}) => box(w, h, d, c, cx + u, y, cz + v, o.ry || 0, { b: SD.lb, rx: o.rx, rz: o.rz });
    const rot = (u, v, ry) => [u * Math.cos(ry) + v * Math.sin(ry), -u * Math.sin(ry) + v * Math.cos(ry)];   // local offset -> world offset
    const ball = (r, c, u, y, v, sq = 0.85) => { const g = new THREE.IcosahedronGeometry(r, 1); g.scale(1, sq, 1); SD.lb.add(place(g, cx + u, y, cz + v), L(c)); };
    const RED = '#d6403a', BLUE = '#2f68ab', YEL = '#f2b92f', WOOD = '#a9733f', GREY = '#c4c9d4';
    // lawn with mowing stripes, a paved path from the gate to the play area
    box(pw - 0.4, 0.03, pd - 0.4, '#6f9a48', cx, 0.006, cz, 0, { b: ub });
    for (let k = 0, v = -hd; v < hd - 0.6; k++, v += 1.5) if (k % 2) box(pw - 0.5, 0.034, 1.5, '#67924a', cx, 0.006, cz + v + 0.75, 0, { b: ub });
    box(1.5, 0.04, hd - 2.2, '#cbb994', cx, 0.01, cz + (hd + 2.2) / 2 + 0.2, 0, { b: ub });
    // safety surface: concrete kerb ring with wood chips inside
    const PX = -0.6, PZ = -0.3;
    cyl(4.55, 4.55, 0.05, 28, GREY, cx + PX, 0.01, cz + PZ, { b: ub }); cyl(4.3, 4.3, 0.06, 28, '#c49a68', cx + PX, 0.01, cz + PZ, { b: ub });
    for (let i = 0; i < 40; i++) { const a = rnd(0, 6.283), r = Math.sqrt(Math.random()) * 4.1; box(0.12, 0.012, 0.07, pick(['#a9733f', '#b88555', '#8f5f35']), cx + PX + Math.cos(a) * r, 0.07, cz + PZ + Math.sin(a) * r, rnd(0, 3), { b: ub }); }
    // play tower: four red posts, blue deck, yellow guard panels, pyramid roof, arch, climbing steps
    const TX = -2.2, TZ = -1.6, DK = 1.3;
    for (const du of [-0.9, 0.9]) for (const dv of [-0.9, 0.9]) cyl(0.09, 0.09, 3.0, 8, RED, cx + TX + du, 0, cz + TZ + dv, { b: SD.lb });
    bk(1.9, 0.1, 1.9, BLUE, TX, DK - 0.1, TZ);
    for (const [u, v, w, d] of [[0, -0.9, 1.8, 0.05], [-0.9, 0, 0.05, 1.8]]) { bk(w, 0.55, d, YEL, TX + u, DK, TZ + v); bk(w + (d < w ? 0.1 : 0), 0.05, d + (w < d ? 0.1 : 0), RED, TX + u, DK + 0.55, TZ + v); }
    for (let q = -0.7; q <= 0.71; q += 0.28) { bk(0.04, 0.5, 0.04, '#f2f1ea', TX + q, DK, TZ + 0.9); bk(0.04, 0.5, 0.04, '#f2f1ea', TX + 0.9, DK, TZ + q); }
    bk(1.9, 0.05, 0.05, RED, TX, DK + 0.5, TZ + 0.9); bk(0.05, 0.05, 1.9, RED, TX + 0.9, DK + 0.5, TZ);
    { const g = new THREE.ConeGeometry(1.6, 0.85, 4); SD.lb.add(place(g, cx + TX, 3.4, cz + TZ, Math.PI / 4), L(RED)); cyl(0.14, 0.2, 0.3, 8, BLUE, cx + TX, 3.7, cz + TZ, { b: SD.lb }); cyl(0.04, 0.04, 0.2, 6, BLUE, cx + TX, 4.0, cz + TZ, { b: SD.lb }); }
    for (const [du, dv] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]]) bk(0.2, 0.18, 0.2, BLUE, TX + du, 2.82, TZ + dv);   // roof brackets
    bk(0.1, 0.9, 0.1, BLUE, TX - 0.35, DK, TZ - 0.9); bk(0.1, 0.9, 0.1, BLUE, TX + 0.35, DK, TZ - 0.9); bk(0.8, 0.1, 0.1, BLUE, TX, DK + 0.9, TZ - 0.9);   // arch (back)
    for (let k = 0; k < 4; k++) bk(0.7, 0.1, 0.34, YEL, TX - 0.2, 0.12 + k * 0.28, TZ - 1.12 - k * 0.0);                                          // climbing steps (back)
    for (const dv of [-1.4, -1.18, -0.96]) bk(0.04, 0.04, 0.04, YEL, TX - 0.2, 0.1, TZ + dv);
    // straight slide off the front: blue bed, yellow side rails, exit lip
    { const run = 2.4, len = Math.hypot(DK, run), tilt = Math.atan2(DK, run), sx = TX - 0.45, mz = TZ + 0.9 + run / 2;
      bk(0.6, 0.08, len, BLUE, sx, DK / 2 - 0.04, mz, { rx: tilt });
      for (const dx of [-0.34, 0.34]) bk(0.06, 0.2, len, YEL, sx + dx, DK / 2 + 0.02, mz, { rx: tilt });
      bk(0.6, 0.1, 0.4, BLUE, sx, 0.05, TZ + 0.9 + run + 0.1); }
    // spiral tube slide off the side: stepped blue chute with a wall on the outside
    { const ax = TX + 1.75, az = TZ - 0.2, R = 0.8, N = 18, th0 = Math.PI, sweep = -1.6 * Math.PI;
      for (let i = 0; i < N; i++) { const t = i / (N - 1), th = th0 + t * sweep, y = DK - 0.1 - t * (DK - 0.2), ry = Math.atan2(-Math.cos(th), -Math.sin(th));
        bk(0.52, 0.1, 0.66, BLUE, ax + Math.cos(th) * R, y, az + Math.sin(th) * R, { ry }); bk(0.52, 0.4, 0.06, '#4a8acb', ax + Math.cos(th) * (R + 0.33), y, az + Math.sin(th) * (R + 0.33), { ry }); } }
    // swing set: red A-frames, top beam, chains and black seats
    { const sx = 3.2, sz = -0.2;
      bk(0.12, 0.12, 3.4, RED, sx, 2.2, sz);
      for (const dz of [-1.6, 1.6]) for (const sg of [-1, 1]) bk(0.09, 2.33, 0.09, RED, sx + sg * 0.3, -0.04, sz + dz, { rz: sg * 0.26 });
      for (const dz of [-0.65, 0.65]) { for (const o of [-0.2, 0.2]) bk(0.02, 1.7, 0.02, '#959bab', sx, 0.55, sz + dz + o); bk(0.22, 0.06, 0.46, '#1c1f2a', sx, 0.5, sz + dz); } }
    // activity panel: three red posts with yellow play panels
    for (let k = 0; k < 3; k++) cyl(0.07, 0.07, 1.7, 8, RED, cx + 0.4 + k * 1.05, 0, cz + 3.1, { b: SD.lb });
    for (let k = 0; k < 2; k++) { bk(0.95, 0.6, 0.05, YEL, 0.92 + k * 1.05, 0.65, 3.1); bk(0.3, 0.3, 0.07, RED, 0.92 + k * 1.05, 0.8, 3.1); }
    // spring riders
    for (const [u, v, c] of [[0.4, -3.4, YEL], [1.5, -3.2, '#448c3a']]) { cyl(0.07, 0.07, 0.4, 8, '#959bab', cx + u, 0, cz + v, { b: SD.lb }); bk(0.3, 0.3, 0.8, c, u, 0.4, v); bk(0.28, 0.3, 0.26, c, u, 0.55, v + 0.5); bk(0.04, 0.2, 0.04, RED, u - 0.1, 0.7, v + 0.5); bk(0.04, 0.2, 0.04, RED, u + 0.1, 0.7, v + 0.5); }
    // sandbox with timber edge, bucket and spade
    { const u = -3.6, v = 5.4; bk(2.4, 0.04, 2.4, '#e6cf9b', u, 0.01, v);
      for (const [du, dv, w, d] of [[0, -1.2, 2.5, 0.12], [0, 1.2, 2.5, 0.12], [-1.2, 0, 0.12, 2.4], [1.2, 0, 0.12, 2.4]]) bk(w, 0.22, d, WOOD, u + du, 0, v + dv);
      cyl(0.13, 0.1, 0.2, 8, RED, cx + u + 0.4, 0.05, cz + v - 0.2, { b: SD.lb }); bk(0.08, 0.04, 0.35, BLUE, u - 0.5, 0.05, v + 0.3, { ry: 0.6 }); }
    // benches facing the play area, a bin and a drinking fountain
    const bench = (u, v, ry) => { const P = (du, dv) => { const [x, z] = rot(du, dv, ry); return [u + x, v + z]; };
      let [x, z] = P(0, 0); bk(1.6, 0.07, 0.45, WOOD, x, 0.43, z, { ry }); [x, z] = P(0, -0.2); bk(1.6, 0.4, 0.06, WOOD, x, 0.62, z, { ry });
      for (const du of [-0.7, 0.7]) { [x, z] = P(du, 0); bk(0.07, 0.43, 0.4, '#3b3532', x, 0, z, { ry }); } };
    bench(-5.0, 1.6, Math.PI / 2); bench(4.6, 4.2, 0); bench(0.9, 6.0, 0);
    cyl(0.22, 0.2, 0.7, 10, '#448c3a', cx + hw - 0.5, 0, cz + 6.3, { b: SD.lb }); cyl(0.2, 0.2, 0.05, 10, '#1c1f2a', cx + hw - 0.5, 0.7, cz + 6.3, { b: SD.lb });
    bk(0.22, 0.9, 0.22, '#959bab', -hw + 0.6, 0, 6.3); bk(0.4, 0.1, 0.34, '#c4c9d4', -hw + 0.6, 0.9, 6.3);
    // low white picket fence across the front with a gate gap, hedges down both sides
    for (let u = -hw + 0.2; u <= hw - 0.1; u += 0.34) { if (Math.abs(u) < 1.0) continue; bk(0.07, 0.8, 0.05, '#f2f1ea', u, 0, hd - 0.1); }
    for (const [a, b2] of [[-hw, -1.0], [1.0, hw]]) { bk(b2 - a, 0.05, 0.05, '#f2f1ea', (a + b2) / 2, 0.55, hd - 0.1); bk(b2 - a, 0.05, 0.05, '#f2f1ea', (a + b2) / 2, 0.25, hd - 0.1); }
    for (const sg of [-1, 1]) bk(0.14, 1.2, 0.14, BLUE, sg * 1.0, 0, hd - 0.1);
    for (const sg of [-1, 1]) for (let v = -hd + 0.5; v < hd - 0.6; v += 1.3) ball(0.55 + rnd(0, 0.12), pick(['#2c6a52', '#317033', '#448c3a']), sg * (hw - 0.1), 0.45, v, 0.9);
    // garden beds at the back: timber frames, soil, vegetables and flowers
    for (const u of [-2.4, 2.0]) { const v = -6.5;
      bk(3.2, 0.36, 1.3, WOOD, u, 0, v); bk(3.0, 0.04, 1.1, '#5a3a24', u, 0.36, v);
      for (let k = 0; k < 6; k++) { const pu = u - 1.2 + k * 0.48, c = k % 3; if (c === 0) ball(0.2, '#448c3a', pu, 0.58, v - 0.2, 0.9); else { bk(0.03, 0.3, 0.03, '#317033', pu, 0.4, v - 0.2); ball(0.1, pick([RED, YEL, '#d07a8e', '#f2f1ea']), pu, 0.76, v - 0.2, 1); }
        ball(0.17, '#63a845', pu + 0.2, 0.55, v + 0.25, 0.9); } }
    // trees, a ball left on the grass
    sTree(b, cx - hw + 1.0, cz - hd + 1.6, 1.25); sTree(b, cx + hw - 1.0, cz - hd + 1.9, 1.1); sTree(b, cx + hw - 0.9, cz + 7.2, 0.8);
    ball(0.16, RED, -1.0, 0.16, 5.0, 1);
  }
}
// ---------------- rural: rice paddies, betel nut palms, a red-brick farmhouse, power lines, mountains close by
{
  const E = ENV.Rural, b = E.sb, ub = E.ub;
  // a paddy tile is 12 x 9.5 m (bunds included) and was placed by its centre point, so it used to spill over the roads;
  // test the whole tile against each no-field zone instead: the gym compound, the main street with its channel, the side lanes, the back road
  const skip = (cx, cz) => { const hit = (x0, x1, z0, z1) => cx - 6.2 < x1 + 0.3 && cx + 5.8 > x0 - 0.3 && cz - 4.95 < z1 + 0.3 && cz + 4.55 > z0 - 0.3;
    return hit(-40, 40, -32, ROAD_Z + 9.4) || hit(-1e3, 1e3, ROAD_Z - 3.5, ROAD_Z + 9.4) || hit(-39, -33, -1e3, 1e3) || hit(33, 39, -1e3, 1e3) || hit(-1e3, 1e3, -32.6, -25.4); };
  // each farm is about 16 m across x 15 m deep (hall 15 m wide, courtyard to the gate); positions keep every one clear of the roads, lanes and channel
  const FARMS = [[-48, 44, 0], [49, -8, Math.PI / 2], [20, 45, 0], [-70, -14, Math.PI / 2], [72, 46, -Math.PI / 2], [-20, -66, 0], [47, -64, 0], [-62, 66, 0]];
  const nearFarm = (x, z) => FARMS.some(([fx, fz]) => Math.abs(x - fx) < 13 && Math.abs(z - fz) < 12);
  for (let x = -84; x < 84; x += 12) for (let z = -76; z < 80; z += 9.5) {
    const cx = x + 6, cz = z + 4.75; if (skip(cx, cz) || nearFarm(cx, cz)) continue;
    const r = Math.random(), col = r < 0.55 ? '#8fbf5a' : r < 0.8 ? '#4a8acb' : r < 0.93 ? '#a8c060' : '#c8b45a';
    box(11.6, 0.03, 9.1, col, cx, 0.004, cz, 0, { b: ub });
    for (let k = -4; k <= 4; k++) box(11.2, 0.04, col === '#4a8acb' ? 0.1 : 0.16, col === '#c8b45a' ? '#b09a40' : col === '#4a8acb' ? '#8fbf5a' : '#6f9a48', cx, 0.005, cz + k * 0.95, 0, { b: ub });
    box(12, 0.16, 0.4, '#8a7a5c', cx, 0, cz - 4.75, 0, { b: ub }); box(0.4, 0.16, 9.5, '#8a7a5c', cx - 6, 0, cz, 0, { b: ub });
  }
  // irrigation channel along the far side of the road, concrete farm lanes
  box(300, 0.4, 0.15, '#a5a39a', 0, 0, ROAD_Z + 7.9, 0, { b }); box(300, 0.4, 0.15, '#a5a39a', 0, 0, ROAD_Z + 9.1, 0, { b }); box(300, 0.03, 1.05, '#4a8acb', 0, 0.12, ROAD_Z + 8.5, 0, { b: ub });
  laneRuns(ub, '#a5a39a', 3.2, null);
  // the back road carries traffic too (cars at ±1.3 m, scooters at ±3.0 and ±3.6 m), so it is a proper 9 m road like the other settings
  box(200, 0.03, 6, '#565c6c', 0, 0, -29, 0, { b: ub });
  for (let x = -98; x < 98; x += 4) box(2.0, 0.035, 0.12, '#e8dcc0', x + 1, 0, -29, 0, { b: ub });
  for (const dz of [-2.75, 2.75]) box(200, 0.035, 0.1, '#e8dcc0', 0, 0, -29 + dz, 0, { b: ub });
  for (const x of [-36, 36]) for (const [z0, z1] of [[-33.5, -32], [-26, -24.5]]) box(3.2, 0.03, z1 - z0, '#a5a39a', x, 0, (z0 + z1) / 2, 0, { b: ub });   // the side lanes run up to the narrower road
  // rough grass on the lot behind and beside the hall
  for (const [x0, x1, z0, z1] of [[-33.5, -15.8, -24, 11], [15.8, 33.5, -24, 11], [-15.8, 15.8, -24, -10.8]]) box(x1 - x0, 0.03, z1 - z0, '#7c9c4c', (x0 + x1) / 2, 0.005, (z0 + z1) / 2, 0, { b: ub });
  // grass-paver car park (草皮磚): pale concrete with staggered grass cells, kerbed all round
  { const px = 25.3, pz = 0.5, pw = 12.6, pd = 13.4;
    box(pw, 0.03, pd, '#b9bcc2', px, 0.008, pz, 0, { b: ub });
    for (let r = 0, z = pz - pd / 2 + 0.3; z < pz + pd / 2 - 0.2; r++, z += 0.46) for (let x = px - pw / 2 + 0.3 + (r % 2) * 0.27; x < px + pw / 2 - 0.2; x += 0.54) box(0.3, 0.006, 0.3, (Math.floor(x * 2) + r) % 3 ? '#5f9a3c' : '#4f8a3a', x, 0.036, z, 0, { b: ub });
    for (const [w, d, x, z] of [[pw + 0.5, 0.25, px, pz - pd / 2 - 0.12], [pw + 0.5, 0.25, px, pz + pd / 2 + 0.12], [0.25, pd, px - pw / 2 - 0.12, pz], [0.25, pd, px + pw / 2 + 0.12, pz]]) box(w, 0.1, d, '#c4c9d4', x, 0, z, 0, { b: ub }); }
  for (const [x, z, yaw, col] of [[22, -2, 0, '#f2f1ea'], [25, -2, 0.1, '#959bab'], [28.5, -1.5, 0, '#2f68ab'], [24, 5, Math.PI, '#c4c9d4']]) sCar(b, x, z, yaw, col);
  // betel nut palms: thin grey trunks with a tuft of fronds
  const palm = (x, z, h) => {
    const T = sideBuilders(E, x, z).tb; box(0.16, h, 0.16, '#9a9b84', x, 0, z, 0, { b: T });
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; box(1.6, 0.08, 0.3, '#4f8a3a', x + Math.cos(a) * 0.7, h - 0.1, z - Math.sin(a) * 0.7, a, { b: T, rz: -0.35 }); }
    box(0.3, 0.5, 0.3, '#5a7a2a', x, h - 0.75, z, 0, { b: T });
  };
  for (let z = -84; z < 84; z += 3.2) { if (Math.abs(z - ROAD_Z - 3) < 8) continue; if (Math.random() < 0.7) palm(-39.2, z, rnd(6.5, 9)); if (Math.random() < 0.7) palm(39.2, z, rnd(6.5, 9)); }
  for (let i = 0; i < 80; i++) { const x = rnd(-84, 84), z = rnd(-80, 80); if (skip(x, z) || nearFarm(x, z)) continue; for (let k = 0; k < 5; k++) palm(x + rnd(-3, 3), z + rnd(-3, 3), rnd(6, 9.5)); }
  for (const [x, z] of [[-31, -21], [-28, -21.5], [31, -21], [30.5, 8.5], [-31, 8]]) palm(x, z, rnd(7, 8.5));
  // sanheyuan farmhouses (三合院): a tall central hall and two lower wings round a paved courtyard open to the front.
  // Red brick on a blue-grey stone plinth, clay-tile roofs with tile rows, grey ridge caps with upturned ends and grey verges,
  // barred windows, a red door with couplets, a pillared veranda, a low front wall with a gate, a well and drying mats.
  for (const [fx, fz, fy] of FARMS) {
    const SD = sideBuilders(E, fx, fz), LB = SD.lb, c = Math.cos(fy), s = Math.sin(fy);
    const BRICK = '#a6533a', BRICK_D = '#8a4230', STONE = '#7d8ba0', TILE = '#b5452e', TILE_D = '#8f3322', RIDGE = '#9a9b84', VERGE = '#c4c9d4', RED = '#9b2226', DARK = '#2f3340', WOOD = '#a9733f';
    const Wf = (u, v) => [fx + u * c + v * s, fz - u * s + v * c];
    const F = (w, h, d, col, u, y, v, rot = 0, o = {}) => { const [x, z] = Wf(u, v); box(w, h, d, col, x, y, z, fy + rot, { b: LB, rx: o.rx, rz: o.rz }); };
    const FC = (r, h, col, u, y, v, seg = 10) => { const [x, z] = Wf(u, v); cyl(r, r, h, seg, col, x, y, z, { b: LB }); };
    const FB = (r, col, u, y, v, sq = 0.9) => { const [x, z] = Wf(u, v); const g = new THREE.IcosahedronGeometry(r, 1); g.scale(1, sq, 1); LB.add(place(g, x, y, z), L(col)); };
    // one building in its own frame: lx along its length, lz across it (+lz = its front), centre (cu, cv) in farm coordinates, yawed R
    const bld = (cu, cv, R, w, d, wh, rh, o = {}) => {
      const cr = Math.cos(R), sr = Math.sin(R), oh = o.oh || 1.0, gov = 0.55;
      const P = (lx, y, lz, bw, bh, bd, col, oo = {}) => F(bw, bh, bd, col, cu + lx * cr + lz * sr, y, cv - lx * sr + lz * cr, R, oo);
      const PC = (lx, lz, r, h, col) => FC(r, h, col, cu + lx * cr + lz * sr, 0, cv - lx * sr + lz * cr);
      P(0, 0, 0, w + 0.3, 0.45, d + 0.3, STONE);                                   // stone plinth
      P(0, 0, 0, w, wh, d, BRICK);                                                  // brick walls
      for (let y = 0.62; y < wh - 0.15; y += 0.27) {                                // brick course lines on the front, back and both ends
        P(0, y, d / 2 + 0.012, w - 0.2, 0.03, 0.024, BRICK_D); P(0, y, -d / 2 - 0.012, w - 0.2, 0.03, 0.024, BRICK_D);
        P(w / 2 + 0.012, y, 0, 0.024, 0.03, d - 0.2, BRICK_D); P(-w / 2 - 0.012, y, 0, 0.024, 0.03, d - 0.2, BRICK_D); }
      for (const sg of [-1, 1]) { const [x, z] = Wf(cu + sg * (w / 2 - 0.15) * cr, cv - sg * (w / 2 - 0.15) * sr); LB.add(place(gableGeo(0.3, rh, d), x, wh, z, fy + R), L(BRICK)); }   // gable-end brick triangles
      // tile roof: two slabs, tile rows, verge boards, ridge cap with upturned ends
      const th = Math.atan2(rh, d / 2), run = d / 2 + oh, len = run / Math.cos(th), yc = wh + rh - (run / 2) * Math.tan(th);
      for (const sg of [-1, 1]) {
        P(0, yc - 0.07, sg * run / 2, w + gov * 2, 0.14, len, TILE, { rx: sg * th });
        const nz = sg * Math.sin(th) * 0.095, ny = Math.cos(th) * 0.095;
        for (let lx = -w / 2 - gov + 0.3; lx < w / 2 + gov - 0.1; lx += 0.5) P(lx, yc - 0.07 + ny - 0.0, sg * run / 2 + nz, 0.07, 0.06, len - 0.08, TILE_D, { rx: sg * th });
        for (const eg of [-1, 1]) P(eg * (w / 2 + gov), yc - 0.07 + 0.02, sg * run / 2, 0.12, 0.2, len, VERGE, { rx: sg * th });
      }
      P(0, wh + rh - 0.02, 0, w + gov * 2 + 0.1, 0.2, 0.34, RIDGE);
      for (const eg of [-1, 1]) P(eg * (w / 2 + gov + 0.18), wh + rh + 0.04, 0, 0.5, 0.2, 0.3, RIDGE, { rz: eg * 0.5 });
      // wall openings
      const winZ = (lx, y, lz, dir) => { P(lx, y, lz + dir * 0.04, 1.1, 1.1, 0.08, DARK); for (const q of [-0.36, -0.12, 0.12, 0.36]) P(lx + q, y + 0.1, lz + dir * 0.1, 0.05, 0.9, 0.05, '#1c1f2a'); P(lx, y - 0.07, lz + dir * 0.1, 1.3, 0.07, 0.22, VERGE); P(lx, y + 1.1, lz + dir * 0.07, 1.3, 0.1, 0.16, VERGE); };
      const winX = (lz, y, lx, dir) => { P(lx + dir * 0.04, y, lz, 0.08, 1.1, 1.1, DARK); for (const q of [-0.3, 0, 0.3]) P(lx + dir * 0.1, y + 0.1, lz + q, 0.05, 0.9, 0.05, '#1c1f2a'); P(lx + dir * 0.1, y - 0.07, lz, 0.22, 0.07, 1.3, VERGE); P(lx + dir * 0.07, y + 1.1, lz, 0.16, 0.1, 1.3, VERGE); };
      const doorZ = (lx, lz, dir) => { P(lx, 0.02, lz + dir * 0.03, 1.5, 2.3, 0.06, '#2a1c16'); for (const sg of [-1, 1]) { P(lx + sg * 0.82, 0.02, lz + dir * 0.06, 0.12, 2.4, 0.1, RED); P(lx + sg * 1.12, 0.9, lz + dir * 0.025, 0.2, 1.3, 0.03, '#d6403a'); }
        P(lx, 2.32, lz + dir * 0.06, 1.8, 0.14, 0.12, RED); P(lx, 0.45, lz + dir * 0.5, 2.1, 0.12, 0.9, STONE); };
      o.build && o.build({ P, PC, winZ, winX, doorZ, cr, sr });
    };
    // ---- hall (正身): tall, wide, pillared veranda, red door, four barred windows, hanging lanterns
    bld(0, -4, 0, 15, 5.4, 3.0, 1.7, { oh: 1.2, build: ({ P, PC, winZ, doorZ }) => {
      doorZ(0, 2.7, 1); for (const lx of [-3.6, 3.6, -6.2, 6.2]) winZ(lx, 1.0, 2.7, 1);
      P(0, 0.45, 3.25, 14.6, 0.08, 1.2, '#b5a58a');                                  // veranda floor
      for (const lx of [-6.8, -3.0, 3.0, 6.8]) { PC(lx, 3.75, 0.12, 3.0, RED); P(lx, 0.45, 3.75, 0.36, 0.16, 0.36, STONE); }
      for (const lx of [-1.5, 1.5]) { PC(lx, 3.3, 0.11, 0.22, '#d6403a'); P(lx, 2.3, 3.3, 0.02, 0.5, 0.02, '#1c1f2a'); }   // lanterns
    } });
    // ---- wings (廂房): lower, long side facing the courtyard, gable end to the front with a barred window
    for (const sg of [-1, 1]) {
      const fe = -sg;   // sign of lx at the front end of this wing
      bld(sg * 5.4, 2.7, -sg * Math.PI / 2, 7.4, 4.4, 2.6, 1.5, { oh: 0.8, build: ({ P, winZ, winX, doorZ }) => {
        doorZ(-fe * 0.9, 2.2, 1); winZ(fe * 1.6, 0.95, 2.2, 1); winZ(fe * 2.9, 0.95, 2.2, 1);
        winX(0, 0.95, fe * 3.7, fe);                                                 // front gable-end window
        P(fe * 3.7 + fe * 0.02, 2.62, 0, 0.04, 0.5, 0.5, VERGE);                      // small vent under the gable
      } });
    }
    // ---- courtyard: red paving with joints, low front wall and gate piers, well, drying mats, potted plants
    F(6.4, 0.03, 7.7, '#b8573c', 0, 0.006, 2.55);
    for (let u = -2.7; u <= 2.71; u += 0.9) F(0.05, 0.012, 7.7, '#8f4430', u, 0.03, 2.55);
    for (let v = -1.0; v <= 6.01; v += 0.9) F(6.4, 0.012, 0.05, '#8f4430', 0, 0.03, v);
    for (const sg of [-1, 1]) {
      F(2.1, 0.3, 0.42, STONE, sg * 2.15, 0, 6.5); F(2.1, 0.8, 0.34, BRICK, sg * 2.15, 0.3, 6.5); F(2.25, 0.1, 0.52, VERGE, sg * 2.15, 1.1, 6.5);
      F(0.5, 1.6, 0.5, BRICK, sg * 1.1, 0, 6.5); F(0.64, 0.1, 0.64, VERGE, sg * 1.1, 1.6, 6.5); F(0.52, 0.3, 0.52, STONE, sg * 1.1, 0, 6.5);
    }
    { const [wx, wz] = Wf(1.7, 3.2); cyl(0.5, 0.55, 0.6, 12, RIDGE, wx, 0, wz, { b: LB }); cyl(0.36, 0.36, 0.02, 12, '#1c1f2a', wx, 0.6, wz, { b: LB });
      F(0.08, 1.4, 0.08, WOOD, 1.7 - 0.55, 0, 3.2); F(0.08, 1.4, 0.08, WOOD, 1.7 + 0.55, 0, 3.2); F(1.3, 0.08, 0.08, WOOD, 1.7, 1.4, 3.2); F(0.22, 0.2, 0.22, '#6b7182', 1.7, 0.95, 3.2); }
    for (const [u, v] of [[-1.3, 1.4], [-0.5, 4.0]]) { FC(0.95, 0.025, WOOD, u, 0.034, v, 18); FC(0.88, 0.03, '#e2c36a', u, 0.036, v, 18); }   // rice drying mats
    for (const [u, v] of [[-2.6, 5.7], [2.6, 5.7], [-6.4, 3.0], [6.4, 3.0]]) { F(0.34, 0.32, 0.34, '#a5522c', u, 0, v); FB(0.34, pick(['#317033', '#448c3a', '#63a845']), u, 0.55, v); }
    const [tx, tz] = Wf(9.5, -7); sTree(b, tx, tz, 1.2, '#24552b');
  }
  // tin-roofed farm sheds
  for (const [x, z] of [[-47, -14], [46, 32], [-47, 10], [70, -40], [-70, 30], [10, 70]]) { const SD = sideBuilders(E, x, z); for (const [dx, dz] of [[-3, -2], [3, -2], [-3, 2], [3, 2]]) box(0.14, 3.2, 0.14, '#6b7182', x + dx, 0, z + dz, 0, { b: SD.lb }); box(7, 0.12, 5, pick(['#2f68ab', '#74abe0', '#2c6a52']), x, 3.2, z, 0, { b: SD.lb, rz: 0.08 }); box(2.4, 1.0, 1.8, '#7d746a', x - 1.5, 0, z, 0, { b: SD.lb }); }
  // earth god shrine at the field corner across the road
  { const x = -18, z = ROAD_Z + 11.4; box(1.8, 1.6, 1.5, '#b23a2a', x, 0.2, z, 0, { b }); box(2.2, 0.2, 1.8, '#a5a39a', x, 0, z, 0, { b }); b.add(place(gableGeo(2.4, 0.7, 2.0), x, 1.8, z), L('#e08a2a')); box(0.7, 0.8, 0.06, '#dfe03a', x, 0.55, z - 0.76, 0, { b }); }
  // power poles and lines along the road
  for (let x = -96; x <= 96; x += 24) { box(0.26, 9, 0.26, '#a5a39a', x, 0, ROAD_Z + 7.2, 0, { b }); box(2.4, 0.14, 0.14, '#6b7182', x, 8.4, ROAD_Z + 7.2, 0, { b }); box(0.4, 0.5, 0.4, '#959bab', x + 0.5, 7.4, ROAD_Z + 7.2, 0, { b }); }
  for (const dz of [-1.0, 0, 1.0]) box(300, 0.03, 0.03, '#1c1f2a', 0, 8.45, ROAD_Z + 7.2 + dz * 1.0, 0, { b });
}

// ================================================================ boards (whiteboard + PR board), mirror
function boardMesh(w, h, x, z, ry) {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = Math.round(256 * h / w);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = THREE.NearestFilter;
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.05), [L('#474c5c'), L('#474c5c'), L('#474c5c'), L('#474c5c'), new THREE.MeshLambertMaterial({ map: tex }), L('#474c5c')]);
  m.position.set(x, 1.0 + h / 2, z); m.rotation.y = ry; m.castShadow = true; world.add(m);
  for (const dx of [-w / 2 + 0.1, w / 2 - 0.1]) box(0.06, 1.0, 0.06, '#474c5c', x + Math.cos(ry) * dx, 0, z - Math.sin(ry) * dx);
  return { cv, ctx: cv.getContext('2d'), tex };
}
const WB = boardMesh(2.2, 1.3, -13.0, -5.6, 0);
const PRB = boardMesh(2.4, 1.5, -10.4, -5.6, 0);
box(0.06, 2.1, 8.4, '#d5ebfb', -HX + 0.16, 0.3, -1.0);     // mirror wall
box(0.08, 0.1, 8.5, '#6b7182', -HX + 0.18, 2.42, -1.0); box(0.08, 0.1, 8.5, '#6b7182', -HX + 0.18, 0.28, -1.0);

// ================================================================ rain + puddles
const RAIN_N = 1800;
const rainGeo = new THREE.BufferGeometry(); const rainPos = new Float32Array(RAIN_N * 6), rainSeed = new Float32Array(RAIN_N * 3);
for (let i = 0; i < RAIN_N; i++) { rainSeed[i * 3] = rnd(-40, 40); rainSeed[i * 3 + 1] = rnd(0, 26); rainSeed[i * 3 + 2] = rnd(-28, 36); }
rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0xd5ebfb, transparent: true, opacity: 0.85, depthWrite: false }));
rain.frustumCulled = false; rain.visible = false; world.add(rain);
function updateRain(dt) {
  const n = Math.floor(RAIN_N * env.rainAmt); rain.visible = n > 0; if (!rain.visible) return;
  for (let i = 0; i < RAIN_N; i++) {
    let y = rainSeed[i * 3 + 1] - dt * 15; if (y < 0) y += 26; rainSeed[i * 3 + 1] = y;
    const x = rainSeed[i * 3] + 0.15 * y, z = rainSeed[i * 3 + 2], o = i * 6;
    if (i < n) { rainPos[o] = x; rainPos[o + 1] = y; rainPos[o + 2] = z; rainPos[o + 3] = x + 0.08; rainPos[o + 4] = y + 0.55; rainPos[o + 5] = z; }
    else { rainPos[o] = rainPos[o + 3] = 0; rainPos[o + 1] = rainPos[o + 4] = -500; rainPos[o + 2] = rainPos[o + 5] = 0; }
  }
  rainGeo.attributes.position.needsUpdate = true;
}
const puddleMat = new THREE.ShaderMaterial({
  uniforms: { tRefl: { value: null }, res: { value: new THREE.Vector2(1, 1) }, wet: { value: 0 }, time: { value: 0 }, tint: { value: linCol('#2f68ab') } },
  vertexShader: 'varying vec2 vUv; varying vec3 vW; void main(){ vUv=uv; vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
  fragmentShader: `uniform sampler2D tRefl; uniform vec2 res; uniform float wet; uniform float time; uniform vec3 tint; varying vec2 vUv; varying vec3 vW;
    void main(){ vec2 s=gl_FragCoord.xy/res; float r=length(vUv-0.5)*2.0; s.x+=0.004*sin(vW.x*9.0+time*6.0)*sin(vW.z*7.0-time*4.0);
      vec3 refl=texture2D(tRefl,s).rgb; float a=wet*(1.0-smoothstep(0.82,1.0,r))*0.9; gl_FragColor=vec4(mix(tint*0.55, refl*0.7, 0.5), a); }`,
  transparent: true, depthWrite: false
});
const puddles = new THREE.Group(); world.add(puddles);
for (const [x, z, r] of [[-14, 18.5, 1.3], [-8, 13.6, 1.0], [-2, 18.8, 1.2], [5, 16, 0.9], [12, 15, 0.9], [12.5, 19.5, 0.8], [-20, 22.5, 1.2], [3, 23.2, 1.0], [20, 23.6, 1.1], [-25, 10, 0.9], [22, 8, 0.9], [8, 11.2, 0.8]]) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 14).rotateX(-Math.PI / 2), puddleMat);
  m.position.set(x, 0.04, z); m.scale.set(r * 1.4, 1, r); m.rotation.y = rnd(0, 3); m.userData.r = r; m.renderOrder = 2; puddles.add(m);
}
// wet footprints on the entrance mat (instanced quads, fading)
const PRINTS = [];
SB.flush(world); UB.flush(under);
for (const n in ENV) {
  const E = ENV[n]; E.sb.flush(E.w); E.ub.flush(E.u, false);
  for (const k in E.sides) { const S_ = E.sides[k]; S_.lb.flush(S_.lo); S_.hb.flush(S_.hi); S_.tb.flush(S_.tall); S_.tall.children.forEach(m => { m.matrixAutoUpdate = true; }); S_.hi.position.y = 3.1; S_.hi.children.forEach(m => { if (!signMeshes.includes(m)) m.position.y = -3.1; m.matrixAutoUpdate = true; }); }
}
applySetting('Urban');
