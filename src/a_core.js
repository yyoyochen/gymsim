import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// ================================================================ utils
const V3 = THREE.Vector3;
const UP = new V3(0, 1, 0);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a = 0, b = 1) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const smooth = (t) => t * t * (3 - 2 * t);
const wrap = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
function gauss() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function h3(a, b, c) { const s = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453; return s - Math.floor(s); }
const norm3 = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };

// ================================================================ court constants (metres)
const BASE = 11.885, SGL = 4.115, DBL = 5.485, SVC = 6.40, POST = 6.40;
const FX = 18.3, FZ = 9.15;           // fence half sizes (36.6 x 18.3)
const R = 0.0335;                     // ball radius
const G = 9.81;
function netH(z) { const a = Math.min(1, Math.abs(z) / POST); return 0.914 + (1.07 - 0.914) * a * a; }

// ================================================================ environment state
const env = { raining: false, rainAmt: 0, wet: 0, wind: 0.5, heat: 0 };
function makeRng(seed) { let a = seed >>> 0; const f = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; f.range = (lo, hi) => lo + f() * (hi - lo); f.int = (lo, hi) => Math.floor(lo + f() * (hi - lo + 1)); f.pick = (arr) => arr[Math.floor(f() * arr.length)]; f.gauss = () => { let u = 0, v = 0; while (!u) u = f(); while (!v) v = f(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }; f.chance = (p) => f() < p; return f; }

// ================================================================ renderer
const canvas = document.getElementById('c');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
} catch (e) {
  document.getElementById('fallback').style.display = 'flex';
  throw e;
}
const DPR = Math.min(window.devicePixelRatio || 1, 2);
renderer.setPixelRatio(DPR);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.BasicShadowMap;
renderer.setClearColor(0x000000, 1);

const scene = new THREE.Scene();
// ---------------------------------------------------------------- the board: everything outside a ragged, grid-stepped boundary dissolves away.
// Streets run on past the edge for a while so the city doesn't end abruptly. Implemented by repurposing the fog chunks
// (every built-in material includes them), so it costs one test per pixel and needs no per-object work.
const BOARD = { x: 54, zN: -50, zS: 52 };
scene.fog = new THREE.Fog(0x000000, 50, 2e9); scene.fog.color.setRGB(54, 52, 54);   // board extents, see boardOut()
THREE.ShaderChunk.fog_pars_vertex = '#ifdef USE_FOG\nvarying vec3 vBoardW;\n#endif';
THREE.ShaderChunk.fog_vertex = '#ifdef USE_FOG\n vec4 bwp = vec4(transformed, 1.0);\n #ifdef USE_INSTANCING\n bwp = instanceMatrix * bwp;\n #endif\n vBoardW = (modelMatrix * bwp).xyz;\n#endif';
THREE.ShaderChunk.fog_pars_fragment = `#ifdef USE_FOG
varying vec3 vBoardW; uniform vec3 fogColor; uniform float fogNear; uniform float fogFar;
float bHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float bBayer(vec2 p) { vec2 q = mod(floor(p), 4.0); int i = int(q.x) + int(q.y) * 4;
  float m[16]; m[0]=0.;m[1]=8.;m[2]=2.;m[3]=10.;m[4]=12.;m[5]=4.;m[6]=14.;m[7]=6.;m[8]=3.;m[9]=11.;m[10]=1.;m[11]=9.;m[12]=15.;m[13]=7.;m[14]=13.;m[15]=5.;
  for (int k = 0; k < 16; k++) if (k == i) return (m[k] + 0.5) / 16.0; return 0.5; }
float boardOut(vec2 xz) {
  // extents per side come in through the fog uniforms: fogColor = (east, south, west), fogNear = north (all distances from the centre)
  float bE = fogColor.r, bS = fogColor.g, bW = fogColor.b, bN = fogNear;
  vec2 cell = floor(xz / 4.0);
  float j = bHash(cell) * 7.0;                                                  // ragged, grid-stepped edge
  float d = max(max(xz.x - (bE + j), -xz.x - (bW + j)), max(xz.y - (bS + j), -xz.y - (bN + j)));
  float rowJ = bHash(vec2(floor(xz.y / 3.0), 7.0)) * 12.0, colJ = bHash(vec2(floor(xz.x / 3.0), 3.0)) * 10.0;
  if ((xz.y > 19.8 && xz.y < 36.2) || abs(xz.y + 29.0) < 4.7) d = min(d, max(xz.x - (bE + 14.0 + rowJ), -xz.x - (bW + 14.0 + rowJ)));   // main and back streets lead out
  if (abs(abs(xz.x) - 36.0) < 2.4) d = min(d, max(xz.y - (bS + 12.0 + colJ), -xz.y - (bN + 12.0 + colJ)));                       // side lanes too
  return d;
}
#endif`;
THREE.ShaderChunk.fog_fragment = `#ifdef USE_FOG
{ float bd = boardOut(vBoardW.xz); if (bd > 0.0 && (bd > 5.0 || bBayer(gl_FragCoord.xy) < bd / 5.0)) discard; }
#endif`;
const world = new THREE.Group(); scene.add(world);
const under = new THREE.Group(); world.add(under);   // island underside + clouds (hidden in reflections)

const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 20, 320);
const view = { az: Math.PI / 4, azT: Math.PI / 4, el: Math.atan(0.5), zoom: 1.2, zoomT: 1.2, target: new V3(0, 0, 0.8), baseH: 34, follow: null };
let pix = 3, rtW = 2, rtH = 2, aspect = 1;
let rtMain = null, rtPost = null, rtRefl = null;

// ---------------------------------------------------------------- 64 colour palette (sRGB), matched in OKLab
const PAL_HEX = [
  '#0d0f14', '#1c1f2a', '#2f3340', '#474c5c', '#6b7182', '#959bab', '#c4c9d4', '#f2f1ea',
  '#fff8e6', '#e8dcc0', '#cbb994',
  '#10241a', '#1a3a22', '#24552b', '#317033', '#448c3a', '#63a845', '#8cc456', '#bfe07a',
  '#0f2e26', '#1b4a3b', '#2c6a52',
  '#4a1e14', '#6e2c1a', '#93401f', '#b85628', '#d36f36', '#e08f5a', '#eab38a',
  '#2b1a12', '#45291b', '#643c24', '#87552f', '#a9733f', '#c99a5e',
  '#3b3532', '#5a524c', '#7d746a',
  '#0b1a33', '#13305a', '#1e4a85', '#2f68ab', '#4a8acb', '#74abe0', '#a5cdf0', '#d5ebfb',
  '#5c1418', '#9b2226', '#d6403a',
  '#6b5a10', '#b8a21e', '#dfe03a', '#f6f79a',
  '#5a3825', '#8a5a3c', '#b5805a', '#d9a77e', '#f0caa4',
  '#2a1838', '#4d2a5e', '#8a4f7d', '#d07a8e',
  '#f0a060', '#ffd08a',
  '#7a5a0e', '#c4901a', '#f2c230'   // warm taxi yellows (the lemon yellow above reads green on a car body)
];
const s2l = (c) => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
function hexSrgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
function oklab(r, g, b) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s, 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
}
const palSRGB = [], palLab = [];
for (const h of PAL_HEX) { const c = hexSrgb(h); palSRGB.push(new V3(c[0], c[1], c[2])); const L = oklab(s2l(c[0]), s2l(c[1]), s2l(c[2])); palLab.push(new V3(L[0], L[1], L[2])); }
const linCol = (hex) => { const c = hexSrgb(hex); return new V3(s2l(c[0]), s2l(c[1]), s2l(c[2])); };

// ---------------------------------------------------------------- post: outlines + palette at low res, then nearest upscale
const postMat = new THREE.ShaderMaterial({
  uniforms: {
    tColor: { value: null }, tDepth: { value: null }, res: { value: new THREE.Vector2(1, 1) },
    pal: { value: palSRGB }, palLab: { value: palLab }, thr: { value: 0.0013 }, exposure: { value: 1 },
    skyTop: { value: new V3() }, skyBot: { value: new V3() }, night: { value: 0 },
    skyHor: { value: new V3() }, sunCol: { value: new V3() }, sunP: { value: new V3() }, moonP: { value: new V3() }, tSec: { value: 0 }, cover: { value: 0.35 }, rainy: { value: 0 },
    setting: { value: 0 }, shift: { value: new THREE.Vector2() }, landA: { value: new V3() }, landB: { value: new V3() }, horizon: { value: 0.8 },
    glowCol: { value: new V3(1.0, 0.72, 0.4) }, glowAmt: { value: 0.4 }, glowMul: { value: 0.0 }
  },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }',
  fragmentShader: `
    precision highp float;
    uniform sampler2D tColor; uniform sampler2D tDepth; uniform vec2 res;
    uniform vec3 pal[67]; uniform vec3 palLab[67]; uniform float thr; uniform float exposure;
    uniform vec3 skyTop; uniform vec3 skyBot; uniform float night;
    uniform vec3 skyHor; uniform vec3 sunCol; uniform vec3 sunP; uniform vec3 moonP; uniform float tSec; uniform float cover; uniform float rainy;
    uniform float setting; uniform vec2 shift; uniform vec3 landA; uniform vec3 landB; uniform float horizon;
    uniform vec3 glowCol; uniform float glowAmt; uniform float glowMul;
    varying vec2 vUv;
    vec3 toLab(vec3 c){ c=max(c,vec3(0.0));
      float l=0.4122214708*c.r+0.5363325363*c.g+0.0514459929*c.b;
      float m=0.2119034982*c.r+0.6806995451*c.g+0.1073969566*c.b;
      float s=0.0883024619*c.r+0.2817188376*c.g+0.6299787005*c.b;
      l=pow(l,1.0/3.0); m=pow(m,1.0/3.0); s=pow(s,1.0/3.0);
      return vec3(0.2104542553*l+0.7936177850*m-0.0040720468*s, 1.9779984951*l-2.4285922050*m+0.4505937099*s, 0.0259040371*l+0.7827717662*m-0.8086757660*s); }
    vec3 nearestPal(vec3 lin){ vec3 lab=toLab(lin); float best=1e9; vec3 o=pal[0];
      for(int i=0;i<67;i++){ vec3 d=lab-palLab[i]; d.x*=1.15; float dd=dot(d,d); if(dd<best){best=dd;o=pal[i];} } return o; }
    float hash(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
    float n1(float x){ float i=floor(x), f=fract(x); return mix(hash(vec2(i,0.0)), hash(vec2(i+1.0,0.0)), f*f*(3.0-2.0*f)); }
    float n2(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f); return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),u.x), mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),u.x), u.y); }
    float fbm(vec2 p){ float sm=0.0, a=0.5; for(int i=0;i<4;i++){ sm+=a*n2(p); p*=2.03; a*=0.5; } return sm; }
    // the backdrop behind the board: sky with sun and moon on their daily arcs, drifting clouds, a horizon
    // with the setting's own skyline (city blocks, low hills, mountains), and hazy land below it
    vec3 backdrop(vec2 uv){
      float asp = res.x / res.y, H = horizon;
      vec2 q = vec2(uv.x * asp, uv.y); float sx = q.x + shift.x;
      float k = clamp((uv.y - H) / (1.0 - H), 0.0, 1.0);
      vec3 sky = mix(skyHor, skyBot, smoothstep(0.0, 0.35, k)); sky = mix(sky, skyTop, smoothstep(0.25, 1.0, k));
      vec2 sp = vec2(sunP.x * asp, sunP.y); float ds = length(q - sp);
      sky += sunCol * (0.45 * exp(-ds * 5.0)) * sunP.z;
      if (night > 0.5 && uv.y > H + 0.06 && hash(floor(uv * res)) > 0.996) sky = vec3(0.75);
      if (sunP.z > 0.0 && ds < 0.042) sky = mix(sky, sunCol * 1.5 + 0.45, sunP.z);
      vec2 mp = vec2(moonP.x * asp, moonP.y); float dm = length(q - mp);
      if (moonP.z > 0.0 && dm < 0.028 && length(q - mp - vec2(0.012, 0.007)) > 0.026) sky = mix(sky, vec3(0.86, 0.86, 0.78), moonP.z);
      for (int l = 0; l < 2; l++) {
        float fl = float(l);
        vec2 cp = vec2(sx * (2.4 - fl * 0.8) + tSec * (0.012 + 0.008 * fl), (uv.y - H) * (16.0 - fl * 6.0) + fl * 3.1);
        float c = fbm(cp), th = mix(0.74, 0.36, cover) + fl * 0.04;
        float a = smoothstep(th, th + 0.07, c) * smoothstep(H + 0.02, H + 0.07, uv.y);
        vec3 cc = mix(vec3(mix(0.95, 0.5, rainy)), skyHor * 1.15, 0.25 + 0.25 * fl);
        cc = mix(cc, cc * 0.6, smoothstep(th + 0.07, th + 0.3, c) * 0.7);
        cc *= mix(1.0, 0.3, night);
        sky = mix(sky, cc, a * (0.9 - 0.25 * fl));
      }
      if (uv.y < H) {
        // distant land: a smooth hazy gradient with fine texture only (big patterns read as false horizons)
        float g = clamp((H - uv.y) / H, 0.0, 1.0), pr = 0.15 + g;
        vec3 land = mix(landA, landB, pow(g, 0.7));
        vec2 cell = floor(vec2(sx * 90.0 * pr, (H - uv.y) * 260.0));
        if (setting > 1.5) land *= 0.95 + 0.08 * hash(floor(vec2(sx * 40.0 * pr, (H - uv.y) * 120.0)));       // fields
        else if (setting > 0.5) land *= 0.94 + 0.1 * step(0.86, hash(cell));                                    // trees and roofs
        else { land *= 0.95 + 0.07 * hash(cell); if (night > 0.5 && hash(floor(uv * res * 0.5)) > 0.975) land = vec3(1.0, 0.8, 0.45); }   // city
        sky = mix(skyHor * 0.95, land, smoothstep(0.0, 0.5, g));
      }
      float far = H + 0.01 + (setting > 1.5 ? 0.1 : setting > 0.5 ? 0.045 : 0.035) * fbm(vec2(sx * 1.6, 1.7));
      if (uv.y < far && uv.y >= H - 0.002) sky = mix(skyHor, mix(landB, skyTop, 0.45), 0.6 + 0.25 * smoothstep(H, far, uv.y));
      float near;
      if (setting < 0.5) {
        float col = floor(sx * 60.0), h = hash(vec2(col, 3.0)); near = H + 0.006 + h * h * 0.04 + (hash(vec2(floor(sx * 6.0), 9.0)) > 0.85 ? 0.03 : 0.0);
        if (uv.y < near && uv.y >= H - 0.002) { sky = mix(landB, skyHor, 0.3) * 0.8; if (night > 0.5 && hash(floor(uv * res)) > 0.88) sky = vec3(1.0, 0.85, 0.5); }
      } else if (setting < 1.5) {
        near = H + 0.008 + 0.008 * sin(sx * 9.0) + 0.01 * step(0.5, n1(sx * 50.0)) * n1(sx * 140.0);
        if (uv.y < near && uv.y >= H - 0.002) sky = mix(landB, skyHor, 0.2) * 0.85;
      } else {
        near = H + 0.01 + 0.035 * fbm(vec2(sx * 3.5, 7.7));
        if (uv.y < near && uv.y >= H - 0.002) sky = mix(landB, skyHor, 0.15) * 0.8;
      }
      return sky;
    }
    void main(){
      vec2 px=1.0/res;
      float d=texture2D(tDepth,vUv).r;
      if(d>=0.999999){
        gl_FragColor=vec4(nearestPal(backdrop(vUv)),1.0); return;
      }
      vec4 src=texture2D(tColor,vUv); vec3 col=src.rgb; float glow=clamp(1.0-src.a,0.0,1.0);
      col=vec3(1.0)-exp(-col*exposure);
      float dl=texture2D(tDepth,vUv-vec2(px.x,0.0)).r, dr=texture2D(tDepth,vUv+vec2(px.x,0.0)).r;
      float du=texture2D(tDepth,vUv+vec2(0.0,px.y)).r, dn=texture2D(tDepth,vUv-vec2(0.0,px.y)).r;
      float e=max(dl+dr-2.0*d, du+dn-2.0*d);
      if(e>thr) col*=0.36;
      vec3 o=nearestPal(col);
      // lamp light goes on after the palette so it fades smoothly: a lift of the surface's own colour plus a warm wash
      o = o * (1.0 + glowCol * glow * glowMul) + glowCol * glow * glowAmt;
      gl_FragColor=vec4(min(o, vec3(1.0)),1.0);
    }`,
  depthTest: false, depthWrite: false
});
const blitMat = new THREE.ShaderMaterial({
  uniforms: { t: { value: null } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }',
  fragmentShader: 'uniform sampler2D t; varying vec2 vUv; void main(){ gl_FragColor=vec4(texture2D(t,vUv).rgb,1.0); }',
  depthTest: false, depthWrite: false
});
const postScene = new THREE.Scene(); postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat));
const blitScene = new THREE.Scene(); blitScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), blitMat));
const postCam = new THREE.Camera();

function makeRTs() {
  [rtMain, rtPost, rtRefl].forEach(r => r && r.dispose());
  rtMain = new THREE.WebGLRenderTarget(rtW, rtH, { type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
  rtMain.depthTexture = new THREE.DepthTexture(rtW, rtH);
  rtMain.depthTexture.type = THREE.UnsignedIntType;
  rtPost = new THREE.WebGLRenderTarget(rtW, rtH, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false });
  rtRefl = new THREE.WebGLRenderTarget(rtW, rtH, { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
  postMat.uniforms.tColor.value = rtMain.texture;
  postMat.uniforms.tDepth.value = rtMain.depthTexture;
  postMat.uniforms.res.value.set(rtW, rtH);
  blitMat.uniforms.t.value = rtPost.texture;
}
let panelW = 0, plotH = 0;
function onResize() {
  const wide = window.innerWidth >= 860;
  panelW = wide ? Math.min(340, Math.round(window.innerWidth * 0.3)) : 0;
  plotH = wide ? clamp(Math.round(window.innerHeight * 0.19), 130, 180) : 0;
  const w = window.innerWidth - panelW, h = window.innerHeight - plotH;
  pix = w < 760 ? 2 : 3;
  renderer.setSize(w, h, false);
  canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  rtW = Math.max(2, Math.ceil(w / pix)); rtH = Math.max(2, Math.ceil(h / pix));
  aspect = w / h;
  view.baseH = Math.max(36, 50 / aspect);
  if (aspect < 0.8) view.baseH = Math.max(36, 40 / aspect) / 1.15;
  makeRTs();
  if (typeof puddleMat !== 'undefined') puddleMat.uniforms.res.value.set(rtW, rtH);
}
const _cr = new V3(), _cu = new V3(), _cf = new V3(), _ct = new V3();
function updateCamera(dt) {
  view.az += (view.azT - view.az) * Math.min(1, dt * 7);
  if (Math.abs(view.azT - view.az) < 0.0005) view.az = view.azT;
  view.zoom += (view.zoomT - view.zoom) * Math.min(1, dt * 8);
  const H = view.baseH / view.zoom, W = H * aspect;
  view.yOff = (view.yOff || 0) + ((view.yOffT || 0) - (view.yOff || 0)) * Math.min(1, dt * 6);
  cam.left = -W / 2; cam.right = W / 2; cam.top = H / 2 - view.yOff * H; cam.bottom = -H / 2 - view.yOff * H; cam.updateProjectionMatrix();
  const ce = Math.cos(view.el), se = Math.sin(view.el);
  _cf.set(-ce * Math.sin(view.az), -se, -ce * Math.cos(view.az));
  _cr.crossVectors(_cf, UP).normalize(); _cu.crossVectors(_cr, _cf).normalize();
  const wpp = H / rtH;
  _ct.copy(view.target);
  const tr = _ct.dot(_cr), tu = _ct.dot(_cu);
  _ct.addScaledVector(_cr, Math.round(tr / wpp) * wpp - tr).addScaledVector(_cu, Math.round(tu / wpp) * wpp - tu);
  cam.position.copy(_ct).addScaledVector(_cf, -160);
  cam.up.copy(UP); cam.lookAt(_ct);
  cam.updateMatrixWorld();
  return wpp;
}

// ================================================================ materials & static geometry builder
const matCache = new Map();
function L(c) { if (!matCache.has(c)) matCache.set(c, new THREE.MeshLambertMaterial({ color: c })); return matCache.get(c); }
class Builder {
  constructor() { this.b = new Map(); }
  add(geo, m) {
    let g = geo.index ? geo.toNonIndexed() : geo;
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (!g.attributes.normal) g.computeVertexNormals();
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    g.clearGroups();
    if (!this.b.has(m)) this.b.set(m, []);
    this.b.get(m).push(g);
  }
  flush(parent, cast = true) {
    for (const [m, gs] of this.b) {
      const mesh = new THREE.Mesh(mergeGeometries(gs, false), m);
      mesh.castShadow = cast; mesh.receiveShadow = true; mesh.matrixAutoUpdate = false; mesh.updateMatrix();
      parent.add(mesh);
    }
    this.b.clear();
  }
}
let SB = new Builder();
const _mx = new THREE.Matrix4(), _qq = new THREE.Quaternion(), _eu = new THREE.Euler(), _pp = new V3(), _ss = new V3(1, 1, 1);
function place(g, x, y, z, ry = 0, rx = 0, rz = 0) { _eu.set(rx, ry, rz, 'YXZ'); _qq.setFromEuler(_eu); _mx.compose(_pp.set(x, y, z), _qq, _ss); g.applyMatrix4(_mx); return g; }
const mOf = (c) => typeof c === 'string' ? L(c) : c;
// box with base at y
function box(w, h, d, c, x, y, z, ry = 0, o = {}) { (o.b || SB).add(place(new THREE.BoxGeometry(w, h, d), x, y + h / 2, z, ry, o.rx || 0, o.rz || 0), mOf(c)); }
function cyl(rt, rb, h, seg, c, x, y, z, o = {}) { (o.b || SB).add(place(new THREE.CylinderGeometry(rt, rb, h, seg), x, y + h / 2, z, o.ry || 0, o.rx || 0, o.rz || 0), mOf(c)); }
function cone(r, h, seg, c, x, y, z, o = {}) { (o.b || SB).add(place(new THREE.ConeGeometry(r, h, seg), x, y + h / 2, z, o.ry || 0), mOf(c)); }
