
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
box(4.0, 0.25, 0.4, '#1c1f2a', DOOR.x, WALL_H - 0.25, HZ);
for (const dx of [-1.25, 1.25]) box(0.7, WALL_H, 0.5, '#2f3340', DOOR.x + dx * 1.2 + (dx < 0 ? -0.15 : 0.15), 0, HZ);
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
// site: concrete forecourt with painted scooter bays
box(SITE.x1 - SITE.x0, 0.004, SITE.z1 - SITE.z0, '#959bab', (SITE.x0 + SITE.x1) / 2, -0.002, (SITE.z0 + SITE.z1) / 2, 0, { b: UB });   // top at 0.002, the gym floor is at 0.02
box(30, 0.025, 7.4, '#7d746a', -14, 0, 16.6, 0, { b: UB });
const SCOOT = [];
for (let r = 0; r < 2; r++) for (let i = 0; i < 26; i++) { const x = -27.8 + i * 1.05, z = r ? 18.9 : 14.3; SCOOT.push({ x, z, yaw: r ? -Math.PI / 2 : Math.PI / 2 }); box(0.06, 0.03, 2.0, '#f2f1ea', x - 0.52, 0, z, 0, { b: UB }); }
box(1.8, 0.03, 9, '#c4c9d4', DOOR.x, 0, 15.4, 0, { b: UB });     // entrance walk
const BUS_STOP = { x: 13.6, z: 20.5 };   // shelter sits back from the kerb so a bus can pull in
box(3.2, 0.06, 1.2, '#959bab', BUS_STOP.x, 0.12, BUS_STOP.z); box(3.2, 2.4, 0.08, '#74abe0', BUS_STOP.x, 0.12, BUS_STOP.z - 0.6); box(3.4, 0.1, 1.6, '#1e4a85', BUS_STOP.x, 2.5, BUS_STOP.z);
box(0.1, 2.4, 0.1, '#474c5c', BUS_STOP.x - 1.55, 0.12, BUS_STOP.z + 0.5); box(0.1, 2.4, 0.1, '#474c5c', BUS_STOP.x + 1.55, 0.12, BUS_STOP.z + 0.5); box(1.8, 0.45, 0.4, '#c4c9d4', BUS_STOP.x, 0.12, BUS_STOP.z - 0.3);
box(0.12, 3.0, 0.12, '#474c5c', BUS_STOP.x + 2.2, 0.12, BUS_STOP.z + 0.6); box(0.7, 1.1, 0.12, '#2f68ab', BUS_STOP.x + 2.2, 2.2, BUS_STOP.z + 0.6); box(0.6, 0.2, 0.13, '#dfe03a', BUS_STOP.x + 2.2, 2.4, BUS_STOP.z + 0.6);
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
  const pit = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.18, 1.2), L('#5a524c')); pit.position.y = 0.09; g.add(pit);
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
  for (let k = 0; k < 3; k++) if (floors > 2 && Math.random() < 0.7) bx(rnd(1, 3), rnd(1, 3.5), 0.03, pick(TILES), rnd(-w / 2 + 1, w / 2 - 1), rnd(fh + 0.3, top - 1.5), d / 2 + 0.015);
  for (const pu of [-w / 2 + 0.15, w / 2 - 0.15]) if (Math.random() < 0.6) bx(0.08, top - fh, 0.08, '#959bab', pu, fh, d / 2 + 0.06);
  // roof: parapet, water tank, corrugated add-on
  bx(w, 0.9, 0.15, tile, 0, top, d / 2 - 0.07); bx(w, 0.9, 0.15, tile, 0, top, -d / 2 + 0.07);
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
for (const z of [-47.8, ROAD_Z + 27.7]) box(200, 0.03, 5.5, '#3b3532', 0, 0, z, 0, { b: EU.ub });
// the elevated metro behind the gym
const METRO = { z: -31, y: 8.5 };
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
for (let x = -200; x < 200; x += 1.2) box(0.04, 0.122, 3.2, '#b09a70', x, 0, ROAD_Z + 10.8, 0, { b: EU.ub });
box(420, 0.125, 0.3, '#dfe03a', 0, 0, ROAD_Z + 9.55, 0, { b: EU.ub });    // tactile guide strip
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
  laneRuns(ub, '#565c6c', 4.5, null); for (const x of [-36, 36]) for (const [z0, z1] of LANE_SEGS) box(0.12, 0.035, z1 - z0, '#e8dcc0', x, 0, (z0 + z1) / 2, 0, { b: ub });
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
  function lot(cx, cz, fy, lw, ld, type) {
    const SD = sideBuilders(E, cx, cz), c = Math.cos(fy), s = Math.sin(fy), fh = 3.1;
    const W = (u, v) => [cx + u * c + v * s, cz - u * s + v * c];                  // u along the street, v towards it
    const B = (y) => (y >= fh - 0.01 ? SD.hb : SD.lb);
    const bx = (wu, h, dv, col, u, y, v, rot = 0) => { const [x, z] = W(u, v); box(wu, h, dv, col, x, y, z, fy + rot, { b: B(y) }); };
    const geo = (g, col, u, y, v, rot = 0) => { const [x, z] = W(u, v); B(y).add(place(g, x, y, z, fy + rot), L(col)); };
    const win = (wu, h, u, y, v, rot = 0) => { const [x, z] = W(u, v); B(y).add(place(new THREE.BoxGeometry(wu, h, 0.06), x, y + h / 2, z, fy + rot), winMat); };
    const wall = pick(WALLS), roof = pick(ROOFS), trim = '#f2f1ea', front = ld / 2;
    // the lot: lawn, driveway, path, shrubs, mailbox, fenced back yard
    { const [x, z] = W(0, 0); box(lw - 0.2, 0.03, ld - 0.2, pick(['#63a845', '#6f9a48', '#5d9a40']), x, 0.006, z, fy, { b: ub }); }
    const gSide = Math.random() < 0.5 ? -1 : 1, hv = front - 5.5;                     // garage side, house front line
    const dU = gSide * (lw / 2 - 2.2);
    { const [x, z] = W(dU, (front + hv) / 2); box(3.4, 0.04, front - hv, '#c4c9d4', x, 0.008, z, fy, { b: ub }); }
    { const [x, z] = W(-gSide * 0.8, (front + hv) / 2); box(1.0, 0.04, front - hv, '#cbb994', x, 0.008, z, fy, { b: ub }); }
    for (let q = 0; q < 4; q++) bx(0.6, 0.5, 0.6, pick(['#317033', '#448c3a', '#24552b']), -gSide * (1.8 + q * 0.9), 0, hv + 0.6);
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
    for (const z of [54, -54]) { box(200, 0.03, 7, '#565c6c', 0, 0, z, 0, { b: ub }); for (let x = -98; x < 98; x += 4) box(2.0, 0.035, 0.12, '#e8dcc0', x + 1, 0, z, 0, { b: ub }); }
    for (const x of [-58, 58]) { box(7, 0.03, 200, '#565c6c', x, 0, 0, 0, { b: ub }); for (let z = -98; z < 98; z += 4) box(0.12, 0.035, 2.0, '#e8dcc0', x, 0, z + 1, 0, { b: ub }); }
    for (const x of [-36, 36]) for (const [z0, z1] of [[-90, -33.5], [ROAD_Z + 5.4, 90]]) box(4.5, 0.03, z1 - z0, '#565c6c', x, 0, (z0 + z1) / 2, 0, { b: ub });
    for (let i = 0; i < 40; i++) { const x = rnd(-88, 88), z = rnd(-88, 88); if (Math.abs(x) > 56 || Math.abs(z) > 52) sTree(b, x, z, rnd(0.9, 1.25)); }
  }
  const park = lots.findIndex(l => l[2] === 0 && l[0] < -10 && l[1] > -45);
  lots.forEach((l, i) => {
    if (i !== park) return lot(l[0], l[1], l[2], l[3], l[4], Math.floor(Math.random() * 4));
    // pocket park: playground and raised garden beds
    const [cx, cz] = l, SD = sideBuilders(E, cx, cz);
    box(l[3] - 0.4, 0.03, l[4] - 0.4, '#6f9a48', cx, 0.006, cz, 0, { b: ub }); box(6, 0.04, 5, '#cbb994', cx - 2, 0.01, cz + 2, 0, { b: ub });
    box(1.4, 2.0, 1.4, '#d6403a', cx - 3.5, 0, cz + 2, 0, { b: SD.lb }); box(0.6, 0.08, 2.6, '#dfe03a', cx - 3.5, 0.9, cz + 3.9, 0, { b: SD.lb, rx: -0.6 });
    for (const dx of [-1.2, 1.2]) box(0.1, 2.2, 0.1, '#2f68ab', cx + 0.5 + dx, 0, cz + 1.2, 0, { b: SD.lb }); box(2.6, 0.1, 0.1, '#2f68ab', cx + 0.5, 2.2, cz + 1.2, 0, { b: SD.lb });
    for (const dx of [-0.5, 0.5]) box(0.4, 0.06, 0.25, '#1c1f2a', cx + 0.5 + dx, 0.6, cz + 1.2, 0, { b: SD.lb });
    for (let k = 0; k < 4; k++) { box(1.2, 0.35, 3.0, '#a9733f', cx + 2.5 + (k % 2) * 1.8, 0, cz - 4 + Math.floor(k / 2) * 3.6, 0, { b: SD.lb }); box(1.0, 0.1, 2.8, '#448c3a', cx + 2.5 + (k % 2) * 1.8, 0.35, cz - 4 + Math.floor(k / 2) * 3.6, 0, { b: SD.lb }); }
    sTree(b, cx - 4, cz - 4, 1.1); sTree(b, cx + 4.5, cz + 4, 1.0);
  });
}
// ---------------- rural: rice paddies, betel nut palms, a red-brick farmhouse, power lines, mountains close by
{
  const E = ENV.Rural, b = E.sb, ub = E.ub;
  const skip = (x, z) => (Math.abs(x) < 40 && z > -32 && z < ROAD_Z + 9.4) || (z > ROAD_Z - 3.5 && z < ROAD_Z + 9.4) || Math.abs(Math.abs(x) - 36) < 3 || Math.abs(z + 29) < 3;
  const FARMS = [[-44, 44, 0], [47, -8, Math.PI / 2], [20, 45, 0], [-70, -20, Math.PI / 2], [72, 40, -Math.PI / 2], [-20, -66, 0], [40, -64, 0], [-62, 66, 0]];
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
  box(150, 0.03, 3.2, '#a5a39a', 0, 0, -29, 0, { b: ub });
  // rough grass on the lot behind and beside the hall
  for (const [x0, x1, z0, z1] of [[-33.5, -15.8, -24, 11], [15.8, 33.5, -24, 11], [-15.8, 15.8, -24, -10.8]]) box(x1 - x0, 0.03, z1 - z0, '#7c9c4c', (x0 + x1) / 2, 0.005, (z0 + z1) / 2, 0, { b: ub });
  for (const [x, z, yaw, col] of [[22, -2, 0, '#f2f1ea'], [25, -2, 0.1, '#959bab'], [28.5, -1.5, 0, '#2f68ab'], [24, 5, Math.PI, '#c4c9d4']]) sCar(b, x, z, yaw, col);
  // betel nut palms: thin grey trunks with a tuft of fronds
  const palm = (x, z, h) => {
    const T = sideBuilders(E, x, z).tb; box(0.16, h, 0.16, '#9a9b84', x, 0, z, 0, { b: T });
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; box(1.6, 0.08, 0.3, '#4f8a3a', x + Math.cos(a) * 0.7, h - 0.1, z - Math.sin(a) * 0.7, a, { b: T, rz: -0.35 }); }
    box(0.3, 0.5, 0.3, '#5a7a2a', x, h - 0.75, z, 0, { b: T });
  };
  for (let z = -84; z < 84; z += 3.2) { if (Math.abs(z - ROAD_Z - 3) < 8) continue; if (Math.random() < 0.7) palm(-39.2, z, rnd(6.5, 9)); if (Math.random() < 0.7) palm(39.2, z, rnd(6.5, 9)); }
  for (let i = 0; i < 80; i++) { const x = rnd(-84, 84), z = rnd(-80, 80); if (skip(x, z)) continue; for (let k = 0; k < 5; k++) palm(x + rnd(-3, 3), z + rnd(-3, 3), rnd(6, 9.5)); }
  for (const [x, z] of [[-31, -21], [-28, -21.5], [31, -21], [30.5, 8.5], [-31, 8]]) palm(x, z, rnd(7, 8.5));
  // sanheyuan farmhouses: U-shaped red brick, dark tiled gable roofs, a drying yard
  for (const [fx, fz, fy] of FARMS) {
    const SD = sideBuilders(E, fx, fz), c = Math.cos(fy), s = Math.sin(fy);
    const W = (u, v) => [fx + u * c + v * s, fz - u * s + v * c];
    const part = (u, v, w, d, rot) => { const [x, z] = W(u, v); box(w, 3.0, d, '#a6533a', x, 0, z, fy + rot, { b: SD.lb }); SD.lb.add(place(gableGeo(w + 0.6, 1.5, d + 0.8), x, 3.0, z, fy + rot), L('#6b2e24')); const [dx, dz] = W(u, v + (rot ? 0 : d / 2 + 0.02)); if (!rot) box(1.2, 2.2, 0.06, '#9b2226', dx, 0, dz, fy, { b: SD.lb }); };
    part(0, -4, 15, 5, 0); part(-6, 1.5, 9, 4.5, Math.PI / 2); part(6, 1.5, 9, 4.5, Math.PI / 2);
    const [yx, yz] = W(0, 2); box(7.4, 0.03, 8, '#cbb994', yx, 0.006, yz, fy, { b: ub });
    const [tx, tz] = W(9.5, -7); sTree(b, tx, tz, 1.2, '#24552b');
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
