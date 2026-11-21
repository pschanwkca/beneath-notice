import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { Pass } from 'three/addons/postprocessing/Pass.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';

// ---------- utils ----------
const $ = id => document.getElementById(id);
const TOUCH = matchMedia('(pointer: coarse)').matches || (navigator.maxTouchPoints > 0 && !matchMedia('(pointer: fine)').matches);
if (TOUCH) document.documentElement.classList.add('touch');
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const damp = (a, b, l, dt) => lerp(a, b, 1 - Math.exp(-l * dt));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
function angDamp(a, b, l, dt) { let d = b - a; d = Math.atan2(Math.sin(d), Math.cos(d)); return a + d * (1 - Math.exp(-l * dt)); }
let SEED = 20261119;
const rnd = () => { SEED = (SEED * 16807) % 2147483647; return (SEED - 1) / 2147483646; };
const R = (a, b) => a + (b - a) * rnd();
function hashI(n) { n = Math.imul(n ^ 61 ^ (n >>> 16), 9); n ^= n >>> 4; n = Math.imul(n, 0x27d4eb2d); n ^= n >>> 15; return (n >>> 0) / 4294967295; }
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const UP = V3(0, 1, 0);
const I4 = new THREE.Matrix4();

function setLoad(p, t) { $('lbar').style.width = (p * 100) + '%'; if (t) $('ltxt').textContent = t; }
const tick = () => new Promise(r => setTimeout(r, 0));

// ---------- renderer ----------
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, TOUCH ? 1.25 : 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = TOUCH ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;
const MAXANI = Math.min(8, renderer.capabilities.getMaxAnisotropy());

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x06080b);
scene.fog = new THREE.FogExp2(0x0a0d12, 0.00135);
const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.3, 2400);
camera.position.set(-10, 110, -140);

// ---------- canvas texture helpers ----------
function cnv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function tex(c, o = {}) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (o.rep) t.repeat.set(o.rep[0], o.rep[1]);
  if (o.srgb !== false) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = MAXANI;
  return t;
}
function noiseField(w, h, oct, f0, sd) {
  const out = new Float32Array(w * h); let amp = 1, tot = 0;
  for (let o = 0; o < oct; o++) {
    const f = f0 << o; const g = new Float32Array(f * f);
    for (let i = 0; i < f * f; i++) g[i] = hashI(i * 7 + sd * 131 + o * 977);
    for (let y = 0; y < h; y++) {
      const fy = y / h * f, y0 = fy | 0, ty = fy - y0, sy = ty * ty * (3 - 2 * ty), y1 = (y0 + 1) % f, r0 = y0 * f, r1 = y1 * f;
      for (let x = 0; x < w; x++) {
        const fx = x / w * f, x0 = fx | 0, tx = fx - x0, sx = tx * tx * (3 - 2 * tx), x1 = (x0 + 1) % f;
        const a = g[r0 + x0], b = g[r0 + x1], c = g[r1 + x0], d = g[r1 + x1];
        out[y * w + x] += amp * ((a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy);
      }
    }
    tot += amp; amp *= 0.5;
  }
  for (let i = 0; i < w * h; i++) out[i] /= tot;
  return out;
}
function fromFn(w, h, fn) {
  const [c, x] = cnv(w, h); const id = x.createImageData(w, h); const d = id.data; const o = [0, 0, 0];
  for (let y = 0; y < h; y++) for (let i = 0; i < w; i++) {
    const idx = y * w + i; fn(i, y, idx, o); const k = idx * 4;
    d[k] = o[0]; d[k + 1] = o[1]; d[k + 2] = o[2]; d[k + 3] = 255;
  }
  x.putImageData(id, 0, 0); return c;
}
function grayTex(arr, w, h, rep) { const c = fromFn(w, h, (x, y, i, o) => { o[0] = o[1] = o[2] = clamp(arr[i], 0, 1) * 255; }); return tex(c, { srgb: false, rep }); }
function normalTex(hgt, w, h, s, rep) {
  const c = fromFn(w, h, (x, y, i, o) => {
    const l = hgt[y * w + (x - 1 + w) % w], r = hgt[y * w + (x + 1) % w], u = hgt[((y - 1 + h) % h) * w + x], d = hgt[((y + 1) % h) * w + x];
    let nx = (l - r) * s, ny = (d - u) * s; const len = Math.hypot(nx, ny, 1);
    o[0] = (nx / len * .5 + .5) * 255; o[1] = (ny / len * .5 + .5) * 255; o[2] = (1 / len * .5 + .5) * 255;
  });
  return tex(c, { srgb: false, rep });
}
function hex(c) { return [(c >> 16) & 255, (c >> 8) & 255, c & 255]; }

// ---------- material textures ----------
function genConcrete() {
  const W = 1024, n = noiseField(W, W, 6, 4, 1), n2 = noiseField(W, W, 3, 32, 2), st = noiseField(W, W, 3, 2, 3);
  const hgt = new Float32Array(W * W), ro = new Float32Array(W * W);
  const c = fromFn(W, W, (x, y, i, o) => {
    const sp = hashI(i * 3 + 5); let v = 0.40 + n[i] * 0.24 + (n2[i] - 0.5) * 0.09;
    if (sp > 0.986) v -= 0.13; else if (sp < 0.008) v += 0.09;
    const stain = Math.max(0, st[i] - 0.56) * 1.6; v -= stain * 0.16;
    o[0] = v * 255 * 1.03; o[1] = v * 255; o[2] = v * 255 * 0.95;
    hgt[i] = n2[i] * 0.6 + n[i] * 0.4 - (sp > 0.986 ? 0.35 : 0);
    ro[i] = clamp(0.84 + (n2[i] - 0.5) * 0.22 - stain * 0.55, 0.3, 1);
  });
  const x = c.getContext('2d'); x.lineCap = 'round';
  for (let k = 0; k < 9; k++) {
    let px = R(0, W), py = R(0, W), a = R(0, 6.28); x.strokeStyle = `rgba(28,26,24,${R(.3, .6)})`; x.lineWidth = R(.8, 1.6);
    x.beginPath(); x.moveTo(px, py); for (let s = 0; s < 70; s++) { a += R(-.5, .5); px += Math.cos(a) * 5; py += Math.sin(a) * 5; x.lineTo(px, py); } x.stroke();
  }
  return { map: tex(c), roughnessMap: grayTex(ro, W, W), normalMap: normalTex(hgt, W, W, 2.4) };
}
function genBlock() {
  const W = 1024, n = noiseField(W, W, 5, 8, 11), n2 = noiseField(W, W, 3, 64, 12), dirt = noiseField(W, W, 3, 2, 13);
  const hgt = new Float32Array(W * W), ro = new Float32Array(W * W); const bw = W / 3, bh = W / 6, m = 6;
  const c = fromFn(W, W, (x, y, i, o) => {
    const row = Math.floor(y / bh), xo = (x + (row % 2) * bw / 2) % W, lx = xo % bw, ly = y % bh;
    const e = Math.min(lx, ly, bw - lx, bh - ly); const bev = sstep(m * .5, m + 5, e);
    const pore = n2[i] > 0.8 ? 1 : 0; let v = lerp(0.5, 0.76 + (n[i] - .5) * .09 - pore * .07, bev);
    v -= Math.max(0, dirt[i] - 0.58) * 0.28;
    o[0] = v * 228; o[1] = v * 225; o[2] = v * 212;
    hgt[i] = bev * 0.85 - pore * 0.12 + n[i] * 0.12; ro[i] = bev < .5 ? .97 : .84;
  });
  return { map: tex(c), roughnessMap: grayTex(ro, W, W), normalMap: normalTex(hgt, W, W, 3.2) };
}
function genWood(base, dark, sd, planks = 0) {
  const W = 1024, H = 512, n = noiseField(512, 512, 5, 4, sd), f = noiseField(512, 512, 3, 32, sd + 1);
  const hgt = new Float32Array(W * H), ro = new Float32Array(W * H);
  const c = fromFn(W, H, (x, y, i, o) => {
    const pl = planks ? Math.floor(y / (H / planks)) : 0;
    const ny = (y + pl * 97) % 512, nn = n[ny * 512 + ((x >> 2) + pl * 131) % 512];
    const ring = 0.5 + 0.5 * Math.sin((y / H * 16 + nn * 5 + pl * 3.7) * Math.PI * 2);
    const fib = f[ny * 512 + ((x >> 3) + pl * 53) % 512];
    let t = clamp(Math.pow(ring, 0.7) * 0.58 + fib * 0.42, 0, 1);
    if (planks) { const ly = y % (H / planks); if (ly < 2) t *= 0.35; }
    o[0] = lerp(dark[0], base[0], t); o[1] = lerp(dark[1], base[1], t); o[2] = lerp(dark[2], base[2], t);
    hgt[i] = t * 0.7 + fib * 0.3 - (planks && (y % (H / planks)) < 2 ? 0.6 : 0); ro[i] = 0.42 + (1 - t) * 0.16;
  });
  const x = c.getContext('2d');
  for (let k = 0; k < 60; k++) { x.strokeStyle = `rgba(255,235,210,${R(.04, .12)})`; x.lineWidth = R(.5, 1.2); x.beginPath(); const px = R(0, W), py = R(0, H), a = R(-.4, .4), l = R(20, 140); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); }
  return { map: tex(c), roughnessMap: grayTex(ro, W, H), normalMap: normalTex(hgt, W, H, 1.6) };
}
function genMetal(col) {
  const W = 512, n = noiseField(W, W, 4, 8, 21), n2 = noiseField(W, W, 2, 64, 22); const ro = new Float32Array(W * W); const b = hex(col);
  const c = fromFn(W, W, (x, y, i, o) => { const v = 0.85 + (n[i] - .5) * .25 + (n2[i] - .5) * .08; o[0] = b[0] * v; o[1] = b[1] * v; o[2] = b[2] * v; ro[i] = .45 + n[i] * .25; });
  const x = c.getContext('2d');
  for (let k = 0; k < 120; k++) { x.strokeStyle = `rgba(210,210,200,${R(.05, .25)})`; x.lineWidth = R(.4, 1); x.beginPath(); const px = R(0, W), py = R(0, W), a = R(0, 6.3), l = R(4, 30); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); }
  for (let k = 0; k < 30; k++) { x.fillStyle = `rgba(60,45,35,${R(.15, .4)})`; x.beginPath(); x.arc(R(0, W), R(0, W), R(1, 5), 0, 7); x.fill(); }
  return { map: tex(c), roughnessMap: grayTex(ro, W, W) };
}
function genCard(label, sub, sd) {
  const W = 512, n = noiseField(W, W, 4, 8, sd); const c = fromFn(W, W, (x, y, i, o) => { const st = 0.5 + 0.5 * Math.sin(x * 0.55); const v = 0.86 + (n[i] - .5) * .2 + st * .03; o[0] = 186 * v; o[1] = 143 * v; o[2] = 96 * v; });
  const x = c.getContext('2d');
  x.fillStyle = 'rgba(205,190,150,.9)'; x.fillRect(0, 230, W, 52);
  x.fillStyle = 'rgba(120,85,50,.25)'; for (let k = 0; k < 5; k++) x.fillRect(R(0, W), R(0, W), R(40, 160), 2);
  x.fillStyle = 'rgba(30,26,22,.82)'; x.font = '700 54px "Noto Sans TC",sans-serif'; x.textAlign = 'center'; x.fillText(label, W / 2, 140);
  x.font = '500 28px "Noto Sans TC",sans-serif'; x.fillText(sub, W / 2, 190);
  x.strokeStyle = 'rgba(30,26,22,.7)'; x.lineWidth = 4; x.strokeRect(W / 2 - 150, 330, 300, 90); x.font = '600 34px Fredoka,sans-serif'; x.fillText('THIS SIDE UP ↑', W / 2, 388);
  return tex(c);
}
function genCork() {
  const W = 512; const n = noiseField(W, W, 3, 16, 41);
  const c = fromFn(W, W, (x, y, i, o) => { const sp = hashI(i * 13); const v = 0.75 + (n[i] - .5) * .3 + (sp > .7 ? -.18 : sp < .2 ? .1 : 0); o[0] = 176 * v; o[1] = 128 * v; o[2] = 82 * v; });
  return tex(c);
}
function genRug() {
  const W = 1024, n = noiseField(W, W, 4, 8, 51), wear = noiseField(W, W, 3, 3, 52);
  const pal = [[118, 46, 40], [196, 162, 112], [44, 58, 84], [150, 92, 54], [72, 38, 34]];
  const c = fromFn(W, W, (x, y, i, o) => {
    const u = x / W, v = y / W; const bx = Math.min(u, 1 - u), by = Math.min(v, 1 - v), b = Math.min(bx, by);
    let p;
    if (b < 0.04) p = 4; else if (b < 0.06) p = 1; else if (b < 0.12) p = ((Math.floor((u + v) * 40) % 2) ? 2 : 0); else if (b < 0.135) p = 1;
    else { const cx = Math.abs(u - .5) * 2, cy = Math.abs(v - .5) * 2; const d = cx + cy; p = d < 0.35 ? 2 : d < 0.42 ? 1 : (Math.floor(d * 9) % 3 === 0 ? 3 : 0); }
    const col = pal[p]; const w = 0.78 + n[i] * 0.3 - Math.max(0, wear[i] - .6) * .5; const fib = (hashI(i * 5) - .5) * .12;
    o[0] = col[0] * (w + fib); o[1] = col[1] * (w + fib); o[2] = col[2] * (w + fib);
  });
  return tex(c);
}
function genWeave(W = 256) {
  const h = new Float32Array(W * W);
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const a = Math.sin(x / W * Math.PI * 64), b = Math.sin(y / W * Math.PI * 64); h[y * W + x] = ((Math.floor(x / W * 32) + Math.floor(y / W * 32)) % 2 ? a : b) * .5 + .5; }
  return normalTex(h, W, W, 1.2);
}
function genKnit() {
  const W = 256, h = new Float32Array(W * W);
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const cx = (x % 16) - 8, cy = (y % 20); const v = Math.abs(cx) * 0.9 + cy * 0.6; const s = Math.sin(v * 0.5); h[y * W + x] = s * (1 - Math.abs(cx) / 9) * .5 + .5; }
  return normalTex(h, W, W, 2.5);
}
function genScales() {
  const W = 256, h = new Float32Array(W * W);
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    let md = 9; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const gx = Math.floor(x / 16) + i, gy = Math.floor(y / 16) + j; const ox = (gx + hashI(gx * 31 + gy * 7) * .8) * 16, oy = (gy + hashI(gx * 13 + gy * 17) * .8) * 16; const d = Math.hypot(x - ox, y - oy) / 16; if (d < md) md = d; }
    h[y * W + x] = 1 - md;
  }
  return normalTex(h, W, W, 3);
}
