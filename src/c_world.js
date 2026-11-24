
// ---------- fur shell material (instanced shells, gl_InstanceID = layer) ----------
let SHELLS = 16; const MAXSHELL = 18; const furMeshes = [];
const FUR_NOISE = `
float h3(vec3 p){p=fract(p*0.3183099+0.1);p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float vn(vec3 x){vec3 i=floor(x);vec3 f=fract(x);f=f*f*(3.0-2.0*f);
 return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}`;
function furMat(o) {
  const P = o.physical ? THREE.MeshPhysicalMaterial : THREE.MeshStandardMaterial;
  const m = new P({ color: o.color, roughness: o.rough ?? 0.92, metalness: 0, map: o.map || null, envMapIntensity: o.env ?? 1.5 });
  const U = {
    uShells: { value: SHELLS }, uLen: { value: o.len }, uDen: { value: o.den }, uDroop: { value: o.droop ?? 0.45 },
    uBelly: { value: new THREE.Color(o.belly ?? o.color) }, uBellyAmt: { value: o.bellyAmt ?? 0 },
    uRim: { value: new THREE.Color(o.rim ?? 0xcfe0ff) }, uRimK: { value: o.rimK ?? 0.06 }, uClump: { value: o.clump ?? 0.3 },
    uRoot: { value: o.root ?? 0.6 }, uStripe: { value: o.stripe ?? 0 }, uStripeF: { value: o.stripeF ?? .3 }
  };
  m.userData.fur = true; m.userData.U = U;
  m.onBeforeCompile = s => {
    Object.assign(s.uniforms, U);
    s.vertexShader = s.vertexShader.replace('#include <common>', `#include <common>
uniform float uShells,uLen,uDroop; varying float vL; varying vec3 vOP; varying vec3 vON;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
#ifdef USE_INSTANCING
 vL = float(gl_InstanceID)/max(uShells-1.0,1.0);
#else
 vL = 0.0;
#endif
 vOP = position; vON = normal;
 transformed += normalize(objectNormal)*uLen*vL;
 transformed.y -= uLen*uDroop*vL*vL;`);
    s.fragmentShader = s.fragmentShader.replace('#include <common>', `#include <common>
uniform float uDen,uBellyAmt,uRimK,uClump,uRoot,uStripe,uStripeF; uniform vec3 uBelly,uRim; varying float vL; varying vec3 vOP; varying vec3 vON;
${FUR_NOISE}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
 float st = vn(vOP*uDen)*0.72 + vn(vOP*uDen*2.31+3.1)*0.28;
 float cl = vn(vOP*uDen*0.17+11.0);
 float sv = st*(1.0-uClump) + cl*uClump;
 if (vL > 0.001 && sv < mix(0.30, 0.86, vL)) discard;
 float bm = smoothstep(0.1, 0.75, normalize(vON).z);
 if (uStripe > 0.0) { float sw = sin(vOP.z*uStripeF + vOP.y*uStripeF*0.4 + vn(vOP*0.15)*4.0)*0.5+0.5; diffuseColor.rgb *= mix(1.0, 0.55, smoothstep(0.55, 0.8, sw)*uStripe*(1.0-bm)); }
 diffuseColor.rgb = mix(diffuseColor.rgb, uBelly, bm*uBellyAmt);
 diffuseColor.rgb *= mix(uRoot, 1.06, pow(vL, 0.65)) * (0.92 + 0.16*cl);`)
      .replace('#include <opaque_fragment>', `
 float ndv = clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
 outgoingLight += uRim * pow(1.0-ndv, 3.0) * uRimK * (0.25+vL);
#include <opaque_fragment>`);
  };
  m.customProgramCacheKey = () => 'fur' + (o.physical ? 'p' : 's');
  return m;
}
function furMesh(g, mat) {
  const m = new THREE.InstancedMesh(g, mat, MAXSHELL);
  for (let i = 0; i < MAXSHELL; i++) m.setMatrixAt(i, I4);
  m.count = SHELLS; m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false;
  furMeshes.push(m); return m;
}
function setShells(n) { SHELLS = n; for (const m of furMeshes) { if (m.userData.toy) continue; m.count = n; m.material.userData.U.uShells.value = n; } }

// ---------- environment (reflections that match the room's light sources) ----------
function buildEnv(kind = 'basement') {
  const pm = new THREE.PMREMGenerator(renderer); const es = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.BoxGeometry(10, 5, 10), new THREE.MeshBasicMaterial({ color: 0x10141c, side: THREE.BackSide })); es.add(room);
  const panel = (c, k, w, h, x, y, z, ry = 0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), side: THREE.DoubleSide })); m.position.set(x, y, z); m.rotation.y = ry; es.add(m); };
  if (kind === 'kitchen') { room.material.color.setHex(DAY ? 0x4a4038 : 0x3a2e24); panel(0xffd2a0, 5, 3, .5, 0, 2.45, 0); panel(0xffc890, 3, 1, 1, -1, 2.2, 2); panel(DAY ? 0xd8e6ff : 0x6a86c8, DAY ? 5 : 2.2, DAY ? 3 : 2, DAY ? 1.6 : 1, -1, 1.6, -4.9); if (DAY) { panel(0xd8e6ff, 4, 3, 1.6, 2, 1.6, 4.9); } panel(0xfff4e6, 2.5, 1, 2, 3, 1, -4.5); panel(0x4a3a2c, 1, 10, 3, 0, -2.4, 0); }
  else if (kind === 'garage') { room.material.color.setHex(0x16191d); panel(0xdfe8ff, 4, 3, .3, 0, 2.45, 0); panel(0xffa860, 2, 4, .2, 0, -.2, 4.9); panel(0x2a2c30, 1, 10, 3, 0, -2.4, 0); }
  else if ((kind === 'yard' || kind === 'road' || kind === 'park') && DAY) {   // daylight outdoors: a blue sky all round, the sun, green-brown ground
    room.material.color.setHex(0x6e90bc); const top = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xa8ccf4).multiplyScalar(1.6), side: THREE.DoubleSide })); top.rotation.x = Math.PI / 2; top.position.y = 2.45; es.add(top);
    const sp = SUN.clone().multiplyScalar(4.2); const sn = new THREE.Mesh(new THREE.CircleGeometry(.7, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff2dc).multiplyScalar(14), side: THREE.DoubleSide })); sn.position.set(sp.x, Math.min(sp.y, 2.3), sp.z); sn.lookAt(0, 0, 0); es.add(sn);
    const gd = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x56603c).multiplyScalar(1.2), side: THREE.DoubleSide })); gd.rotation.x = Math.PI / 2; gd.position.y = -2.45; es.add(gd);
    panel(0xd8e6f4, 1.8, 10, 1.4, 0, .2, -4.95); panel(0xd8e6f4, 1.8, 10, 1.4, 0, .2, 4.95); panel(0xd8e6f4, 1.8, 10, 1.4, 4.95, .2, 0, Math.PI / 2); panel(0xd8e6f4, 1.8, 10, 1.4, -4.95, .2, 0, Math.PI / 2); }
  else if (kind === 'yard') { room.material.color.setHex(0x0a1020); panel(0x3a5a9a, 1.6, 10, 10, 0, 2.48, 0); panel(0xb8c8ff, 3, 1, 1, 3, 2, -4); panel(0xffc890, 2.2, .6, .6, 4.9, .6, 0, Math.PI / 2); panel(0x14200f, 1, 10, 3, 0, -2.4, 0); }
  else if (kind === 'park') { room.material.color.setHex(0x0a101c); panel(0x2c3c64, 1.3, 10, 10, 0, 2.48, 0); panel(0xa8bcff, 1.6, 2.2, 2.2, 3.4, 2.3, -3.4); panel(0xffb466, 2.0, 1, 1, -3.4, 2.2, 2); panel(0x101a0e, 1, 10, 3, 0, -2.4, 0); }
  else if (kind === 'road') { room.material.color.setHex(0x0b111c); panel(0x2a3a60, 1.4, 10, 10, 0, 2.48, 0); panel(0xffb466, 2.6, 1.2, 1.2, 3, 2.2, -3); panel(0xffb466, 2.2, 1.2, 1.2, -3.4, 2.2, 2); panel(0x14180f, 1, 10, 3, 0, -2.4, 0); }
  else if (kind === 'portal') { room.material.color.setHex(0x061419); panel(0x6ff6ee, 4.5, 4, 4, 0, 0, 4.9); panel(0x9fe8ff, 1.6, 10, 2, 0, 2.45, 0); panel(0xffc890, 1.4, 1.2, 1.2, -3, 1.2, -4.9); panel(0x0a1a20, 1, 10, 3, 0, -2.4, 0); }
  else if (kind === 'hub') { room.material.color.setHex(0x1a1410); panel(0xffb066, 4, .6, .6, -1, .2, 0); panel(0xffd0a0, 6, 1, 1, 0, 2.4, 0); panel(0x3a2a22, 1, 10, 3, 0, -2.4, 0); }
  else { panel(0x9db8ff, 3.2, 2, 1, 1, 2, -4.9); panel(0xffc27a, 6, .6, .6, -1, .5, -3); panel(0x5ff4ee, 3, .8, .8, -2, .3, -3.4);
  panel(0xffb066, 1.4, 1.6, 2.2, -4.9, 2, -2, Math.PI / 2); panel(0x2a3346, 1, 10, 3, 0, -2.4, 0); }
  const t = pm.fromScene(es, 0.03).texture; pm.dispose(); return t;
}

// ---------- post processing ----------
class FnPass extends Pass { constructor(fn) { super(); this.fn = fn; this.needsSwap = false; } render() { this.fn(); } }
const GradeShader = {
  uniforms: { tDiffuse: { value: null }, uT: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) }, uCrys: { value: 0 }, uFlash: { value: 0 }, uVig: { value: 0.55 }, uGrain: { value: 0.035 }, uFade: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uT,uCrys,uFlash,uVig,uGrain,uFade; uniform vec2 uRes; varying vec2 vUv;
vec2 h2(vec2 p){return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);}
void main(){
 vec2 uv=vUv; vec2 c=uv-0.5; float asp=uRes.x/uRes.y; float r=length(c*vec2(asp,1.0));
 float edge=smoothstep(0.95-uCrys*0.75, 1.05, r+0.12);
 vec2 p=uv*vec2(asp,1.0)*8.0; vec2 ip=floor(p), fp=fract(p); float md=8.0, md2=8.0; vec2 mo=vec2(0.0);
 for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){ vec2 g=vec2(float(i),float(j)); vec2 o=h2(ip+g); o=0.5+0.42*sin(uT*0.25+6.2831*o); vec2 rr=g+o-fp; float d=dot(rr,rr); if(d<md){md2=md;md=d;mo=o;}else if(d<md2){md2=d;} }
 float cell=sqrt(md2)-sqrt(md); float crack=1.0-smoothstep(0.0,0.05,cell);
 float m=edge*uCrys;
 vec2 refr=(mo-0.5)*0.035*m;
 float ca=0.0012+0.0035*r*r+0.012*m;
 vec3 col; col.r=texture2D(tDiffuse,uv+c*ca+refr).r; col.g=texture2D(tDiffuse,uv+refr).g; col.b=texture2D(tDiffuse,uv-c*ca+refr).b;
 vec3 ice=vec3(0.66,0.95,1.0);
 col=mix(col, col*0.55+ice*0.32, m*0.85); col+=ice*crack*m*0.85;
 float l=dot(col,vec3(0.299,0.587,0.114)); col=mix(col,vec3(l)*vec3(0.92,1.0,1.04),uCrys*0.45);
 col*=1.0-uVig*smoothstep(0.38,1.1,r);
 float gr=fract(sin(dot(uv*uRes+fract(uT)*61.0,vec2(12.9898,78.233)))*43758.5453);
 col+=(gr-0.5)*uGrain;
 col=mix(col,vec3(0.92,0.99,1.0),uFlash); col*=1.0-uFade;
 gl_FragColor=vec4(col,1.0);
}`
};
const fxGroup = new THREE.Group(); scene.add(fxGroup);
let LV = new THREE.Group(); scene.add(LV); let LVFX = new THREE.Group(); fxGroup.add(LVFX);
const rt = new THREE.WebGLRenderTarget(innerWidth, innerHeight, { type: THREE.HalfFloatType, samples: TOUCH ? 0 : 4 });
const composer = new EffectComposer(renderer, rt);
composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(innerWidth, innerHeight);
const renderPass = new RenderPass(scene, camera);
const gtao = new GTAOPass(scene, camera, innerWidth, innerHeight);
gtao.updateGtaoMaterial({ radius: 5, distanceExponent: 1.4, thickness: 4, scale: 1.15, samples: 16 });
gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });
gtao.blendIntensity = 0.95;
const bokeh = new BokehPass(scene, camera, { focus: 15, aperture: 0.00011, maxblur: 0.0075 });
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.42, 0.5, 0.95);
const outPass = new OutputPass();
const grade = new ShaderPass(GradeShader);
composer.addPass(renderPass);
// the dust and the sky dome (with its clouds) stay out of the depth passes: AO and focus blur would outline the clouds' planes
composer.addPass(new FnPass(() => { fxGroup.visible = false; if (ST.sky) { ST.skyV = ST.sky.visible; ST.sky.visible = false; } }));
composer.addPass(gtao); composer.addPass(bokeh);
composer.addPass(new FnPass(() => { fxGroup.visible = true; if (ST.sky) ST.sky.visible = !!ST.skyV; }));
const sanitize = new ShaderPass({ uniforms: { tDiffuse: { value: null } }, vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv; void main(){ vec4 c=texture2D(tDiffuse,vUv); if(any(isnan(c))||any(isinf(c))) c=vec4(0.0,0.0,0.0,1.0); gl_FragColor=vec4(clamp(c.rgb,0.0,48.0),c.a); }` });
// phones: no MSAA, a cheap FXAA pass instead; bloom can run at lower resolution
const fxaa = new ShaderPass(FXAAShader); fxaa.enabled = TOUCH;
let BLOOM_K = 1; const _bloomSize = bloom.setSize.bind(bloom); bloom.setSize = (w, h) => _bloomSize(Math.max(64, Math.round(w * BLOOM_K)), Math.max(64, Math.round(h * BLOOM_K)));
composer.addPass(sanitize); composer.addPass(bloom); composer.addPass(outPass); composer.addPass(fxaa); composer.addPass(grade);

// ---------- world: colliders ----------
const cols = []; const STATIC = [];
function boxUV(g, sx, sy, sz, s) {
  const uv = g.attributes.uv; const dims = [[sz, sy], [sz, sy], [sx, sz], [sx, sz], [sx, sy], [sx, sy]];
  for (let i = 0; i < uv.count; i++) { const f = Math.floor(i / 4), d = dims[f]; uv.setXY(i, uv.getX(i) * d[0] / s, uv.getY(i) * d[1] / s); }
  uv.needsUpdate = true;
}
function box(x0, x1, y0, y1, z0, z1, mat, o = {}) {
  const sx = x1 - x0, sy = y1 - y0, sz = z1 - z0; const g = new THREE.BoxGeometry(sx, sy, sz);
  if (o.uv) boxUV(g, sx, sy, sz, o.uv);
  const m = new THREE.Mesh(g, mat); m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  m.castShadow = o.cast !== false; m.receiveShadow = true; (o.parent || LV).add(m);
  if (o.col !== false) cols.push({ t: 'b', x0, x1, y0, y1, z0, z1, m, push: !!o.push, small: Math.max(sx, sy, sz) < 4 });
  return m;
}
function cyl(x, z, r, y0, y1, mat, o = {}) {
  const g = new THREE.CylinderGeometry(o.rt ?? r, r, y1 - y0, o.seg || 40, 1, !!o.open);
  if (o.uv) { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 2 * Math.PI * r / o.uv, uv.getY(i) * (y1 - y0) / o.uv); }
  const m = new THREE.Mesh(g, mat); m.position.set(x, (y0 + y1) / 2, z); m.castShadow = o.cast !== false; m.receiveShadow = true; (o.parent || LV).add(m);
  if (o.col !== false) cols.push({ t: 'c', x, z, r: Math.max(r, o.rt ?? r), y0, y1, m, small: Math.max(r * 2, y1 - y0) < 4 });
  return m;
}
function colBounds(c) { return c.t === 'b' ? [c.x0, c.x1, c.y0, c.y1, c.z0, c.z1] : [c.x - c.r, c.x + c.r, c.y0, c.y1, c.z - c.r, c.z + c.r]; }
// XZ overlap of a disc against a collider: returns penetration & push normal
function xzHit(c, px, pz, r, out) {
  if (c.t === 'b') {
    const qx = clamp(px, c.x0, c.x1), qz = clamp(pz, c.z0, c.z1); const dx = px - qx, dz = pz - qz; const d2 = dx * dx + dz * dz;
    if (d2 >= r * r) return false;
    if (d2 > 1e-8) { const d = Math.sqrt(d2); out.nx = dx / d; out.nz = dz / d; out.pen = r - d; return true; }
    const l = px - c.x0, rr = c.x1 - px, b = pz - c.z0, f = c.z1 - pz; const mn = Math.min(l, rr, b, f);
    if (mn === l) { out.nx = -1; out.nz = 0; } else if (mn === rr) { out.nx = 1; out.nz = 0; } else if (mn === b) { out.nx = 0; out.nz = -1; } else { out.nx = 0; out.nz = 1; }
    out.pen = mn + r; return true;
  }
  const dx = px - c.x, dz = pz - c.z, d = Math.hypot(dx, dz); if (d >= c.r + r) return false;
  if (d < 1e-6) { out.nx = 1; out.nz = 0; } else { out.nx = dx / d; out.nz = dz / d; }
  out.pen = c.r + r - d; return true;
}
function rayT(o, d, maxT, c) {
  const b = colBounds(c); let t0 = 0, t1 = maxT;
  for (let a = 0; a < 3; a++) {
    const oo = a === 0 ? o.x : a === 1 ? o.y : o.z, dd = a === 0 ? d.x : a === 1 ? d.y : d.z, mn = b[a * 2], mx = b[a * 2 + 1];
    if (Math.abs(dd) < 1e-9) { if (oo < mn || oo > mx) return Infinity; continue; }
    let ta = (mn - oo) / dd, tb = (mx - oo) / dd; if (ta > tb) { const s = ta; ta = tb; tb = s; }
    if (ta > t0) t0 = ta; if (tb < t1) t1 = tb; if (t1 < t0) return Infinity;
  }
  return t0;
}
function rayBlocked(o, d, maxT, skipSmall = true) {
  for (const c of colsNear(o.x, o.y, o.z)) { if (c.noRay || (skipSmall && c.small)) continue; const t = rayT(o, d, maxT, c); if (t > 0.01 && t < maxT) return true; }
  return false;
}
function rayFirst(o, d, maxT) { let best = maxT; for (const c of colsNear(o.x, o.y, o.z)) { if (c.small || c.noCam) continue; const t = rayT(o, d, maxT, c); if (t > 0.001 && t < best) best = t; } return best; }
function solidAt(x, y, z) { for (const c of colsNear(x, y, z)) { if (y < c.y0 || y > c.y1) continue; if (c.t === 'b') { if (x > c.x0 && x < c.x1 && z > c.z0 && z < c.z1) return c; } else if (Math.hypot(x - c.x, z - c.z) < c.r) return c; } return null; }

// ---------- materials ----------
let MAT = {};
function makeMaterials() {
  const conc = genConcrete(), blk = genBlock();
  const oak = genWood([192, 146, 104], [104, 70, 44], 31, 6), stairW = genWood([150, 104, 66], [84, 54, 34], 33), stoolW = genWood([180, 124, 76], [100, 64, 38], 35), joist = genWood([140, 108, 76], [80, 58, 40], 37);
  for (const k of ['map', 'roughnessMap', 'normalMap']) { conc[k].repeat.set(1, 1); blk[k].repeat.set(1, 1); }
  const metal = genMetal(0x5c6a68), weave = genWeave(), knit = genKnit(), scales = genScales();
  MAT = {
    floor: new THREE.MeshStandardMaterial({ ...conc, normalScale: new THREE.Vector2(.6, .6), envMapIntensity: .8 }),
    wall: new THREE.MeshStandardMaterial({ ...blk, normalScale: new THREE.Vector2(.9, .9), envMapIntensity: .5 }),
    oak: new THREE.MeshStandardMaterial({ ...oak, normalScale: new THREE.Vector2(.4, .4) }),
    stair: new THREE.MeshStandardMaterial({ ...stairW, normalScale: new THREE.Vector2(.5, .5) }),
    stool: new THREE.MeshStandardMaterial({ ...stoolW, normalScale: new THREE.Vector2(.4, .4) }),
    joist: new THREE.MeshStandardMaterial({ ...joist, roughness: .9 }),
    shelf: new THREE.MeshStandardMaterial({ ...metal, metalness: .55 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x9aa3a8, metalness: 1, roughness: .28 }),
    dsteel: new THREE.MeshStandardMaterial({ color: 0x2b3035, metalness: .85, roughness: .4 }),
    copper: new THREE.MeshStandardMaterial({ color: 0xc27a4a, metalness: 1, roughness: .32 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xc9a050, metalness: 1, roughness: .3 }),
    black: new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: .45 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x1b1c1f, roughness: .7 }),
    white: new THREE.MeshPhysicalMaterial({ color: 0xf2efe8, roughness: .25, clearcoat: .6 }),
    ceramic: new THREE.MeshPhysicalMaterial({ color: 0x31475a, roughness: .2, clearcoat: 1, clearcoatRoughness: .1 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 1, thickness: .4, roughness: .04, ior: 1.5, metalness: 0, transparent: false }),
    glassThin: new THREE.MeshPhysicalMaterial({ color: 0xcfe6ee, roughness: .08, metalness: 0, transparent: true, opacity: .16, depthWrite: false }),
    green: new THREE.MeshStandardMaterial({ color: 0x47ff9a, emissive: 0x2bff8a, emissiveIntensity: 1.6, roughness: .2, transparent: true, opacity: .85 }),
    water: new THREE.MeshPhysicalMaterial({ color: 0xa9d8ff, transmission: .9, roughness: .05, thickness: .5 }),
    coffee: new THREE.MeshStandardMaterial({ color: 0x1d0f08, roughness: .08 }),
    cork: new THREE.MeshStandardMaterial({ map: genCork(), roughness: .95 }),
    rugBase: genRug(),
    notebook: new THREE.MeshStandardMaterial({ map: genNotebook(), roughness: .9 }),
    letter: new THREE.MeshStandardMaterial({ map: genLetter(), roughness: .9 }),
    drawing: new THREE.MeshStandardMaterial({ map: genDrawing(), roughness: .95 }),
    photo: new THREE.MeshStandardMaterial({ map: genPhoto(), roughness: .5 }),
    screen: new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: genScreen(), emissiveIntensity: 1.25, roughness: .2 }),
    cardA: new THREE.MeshStandardMaterial({ map: genCard('DNA 樣本', '冷藏 · 勿倒置', 81), roughness: .95 }),
    cardB: new THREE.MeshStandardMaterial({ map: genCard('實驗室雜物', 'LAB SUPPLIES', 82), roughness: .95 }),
    cardC: new THREE.MeshStandardMaterial({ map: genCard('聖誕裝飾', 'XMAS · 2024', 83), roughness: .95 }),
    bookG: new THREE.MeshStandardMaterial({ map: genBook(0x23463a, 'QUANTUM SCALE'), roughness: .85 }),
    bookR: new THREE.MeshStandardMaterial({ map: genBook(0x6b2a26, 'BIOLOGY OF SIZE'), roughness: .85 }),
    bookB: new THREE.MeshStandardMaterial({ map: genBook(0x26324f, 'FIELD NOTES'), roughness: .85 }),
    pages: new THREE.MeshStandardMaterial({ color: 0xe9e0cc, roughness: .95 }),
    night: new THREE.MeshBasicMaterial({ map: genNight(), color: DAY ? new THREE.Color(0xffffff).multiplyScalar(1.15) : 0x9aa8c8 }),
    crack: new THREE.MeshBasicMaterial({ map: genCrack(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
    web: new THREE.MeshBasicMaterial({ map: genWeb(), transparent: true, depthWrite: false, side: THREE.DoubleSide, opacity: .7 }),
    dirt: new THREE.MeshBasicMaterial({ color: 0x000000, alphaMap: genDirt(), transparent: true, opacity: .55, depthWrite: false }),
    scorch: new THREE.MeshBasicMaterial({ map: genRadial('rgba(10,8,6,.85)', 'rgba(10,8,6,0)'), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
    paint: new THREE.MeshStandardMaterial({ color: 0x8b9aa0, metalness: .6, roughness: .45 }),
    paintRed: new THREE.MeshStandardMaterial({ color: 0x8e2f2a, metalness: .3, roughness: .5 }),
    sugar: new THREE.MeshPhysicalMaterial({ color: 0xfbfbf6, roughness: .55, sheen: .5, sheenColor: 0xffffff, emissive: 0x000000 }),
    match: new THREE.MeshStandardMaterial({ map: genBook(0xc23a2a, 'SAFETY MATCHES'), roughness: .8, emissive: 0x000000 }),
    bulbOn: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffd39a, emissiveIntensity: 9 }),
    cyanGlow: new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x6ff6ee, emissiveIntensity: 2.2 }),
    redLed: new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xff2a2a, emissiveIntensity: 6 }),
    cloth: new THREE.MeshPhysicalMaterial({ color: 0xf3f0ea, roughness: .9, sheen: .8, sheenColor: 0xffffff, sheenRoughness: .6, normalMap: weave, normalScale: new THREE.Vector2(.35, .35), side: THREE.DoubleSide }),
    denim: new THREE.MeshPhysicalMaterial({ color: 0x3d5a86, roughness: .85, sheen: .4, sheenColor: 0x9fb8e0, normalMap: weave, normalScale: new THREE.Vector2(.6, .6), side: THREE.DoubleSide }),
    leather: new THREE.MeshStandardMaterial({ color: 0x5a3a24, roughness: .55 }),
    hat: new THREE.MeshPhysicalMaterial({ color: 0xf2b72c, roughness: .38, clearcoat: .5, clearcoatRoughness: .2 }),
    scarf: new THREE.MeshPhysicalMaterial({ color: 0xb8352f, roughness: .85, sheen: .6, sheenColor: 0xff9a80, normalMap: weave }),
    capRed: new THREE.MeshPhysicalMaterial({ color: 0xc8202a, metalness: .6, roughness: .3, clearcoat: .6 }),
    gecko: new THREE.MeshPhysicalMaterial({ color: 0x8aa65a, roughness: .5, sheen: .5, sheenColor: 0xe8ffb0, clearcoat: .25, normalMap: scales, normalScale: new THREE.Vector2(.8, .8) }),
    geckoBelly: new THREE.MeshPhysicalMaterial({ color: 0xe8dca8, roughness: .55, sheen: .4, normalMap: scales, normalScale: new THREE.Vector2(.4, .4) }),
    eye: new THREE.MeshPhysicalMaterial({ color: 0x0c0907, roughness: .05, clearcoat: 1, clearcoatRoughness: .02 }),
    eyeHL: new THREE.MeshBasicMaterial({ color: 0xffffff }),
    glassesLens: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0, transparent: true, opacity: .12, depthWrite: false }),
    lens: new THREE.MeshPhysicalMaterial({ color: 0x3a2a10, roughness: .05, clearcoat: 1, emissive: 0x3a2a10, emissiveIntensity: .4 }),
    knit: new THREE.MeshPhysicalMaterial({ color: 0xcdbca6, roughness: .95, sheen: .9, sheenColor: 0xfff1de, sheenRoughness: .5, normalMap: knit, normalScale: new THREE.Vector2(1, 1) }),
    pants: new THREE.MeshPhysicalMaterial({ color: 0x8a8580, roughness: .95, sheen: .6, sheenColor: 0xc8cad4, normalMap: knit, normalScale: new THREE.Vector2(.5, .5) }),
    skin: new THREE.MeshPhysicalMaterial({ color: 0xd9a48a, roughness: .52, sheen: .35, sheenColor: 0xff9070, clearcoat: .08 }),
    phone: new THREE.MeshPhysicalMaterial({ color: 0x1c1f25, roughness: .2, metalness: .5, clearcoat: 1 })
  };
}

// ---------- room & props ----------
const resizables = []; const batteries = []; let crackBox = null, door = null, doorGlow = null, machine = {}, upLight = null, lampLight = null, moonLight = null;
function addDecal(mat, w, h, x, y, z, rx, ry, parent = LV) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, z); m.rotation.set(rx, ry, 0); m.receiveShadow = true; parent.add(m); return m; }
function buildRoom() {
  const M = MAT;
  // floor & walls
  box(-310, 310, -10, 0, -260, 260, M.floor, { uv: 100, cast: false });
  box(-310, 40, 0, 260, -262, -250, M.wall, { uv: 120 }); box(140, 310, 0, 260, -262, -250, M.wall, { uv: 120 });
  box(40, 140, 0, 198, -262, -250, M.wall, { uv: 120 }); box(40, 140, 245, 260, -262, -250, M.wall, { uv: 120 });
  box(-310, -300, 0, 470, -262, 146, M.wall, { uv: 120 }); box(-310, -300, 0, 470, 154, 262, M.wall, { uv: 120 }); box(-310, -300, 9, 470, 146, 154, M.wall, { uv: 120 });
  box(-340, -310, -10, 0, 132, 168, M.floor, { uv: 100, cast: false }); box(-340, -310, 0, 19, 132, 142, M.wall, { uv: 120 }); box(-340, -310, 0, 19, 158, 168, M.wall, { uv: 120 }); box(-340, -310, 16, 19, 142, 158, M.wall, { uv: 120 });
  const den = new THREE.PointLight(0xffb36b, 60, 0, 2); den.position.set(-322, 5, 150); LV.add(den);
  box(300, 310, 0, 260, -262, 262, M.wall, { uv: 120 });
  box(-310, 310, 0, 260, 250, 262, M.wall, { uv: 120 });
  // ceiling with stair hole
  const ceil = new THREE.MeshStandardMaterial({ color: 0x2b2722, roughness: .95 });
  box(-205, 310, 260, 270, -262, 262, ceil, { cast: true }); box(-310, -205, 260, 270, -20, 262, ceil);
  for (let x = -180; x < 300; x += 40) box(x - 2.5, x + 2.5, 238, 260, -250, 250, M.joist, { uv: 60, col: false });
  for (let x = -300; x < -205; x += 40) box(x - 2.5, x + 2.5, 238, 260, -20, 250, M.joist, { uv: 60, col: false });
  // stairwell
  box(-205, -195, 260, 470, -262, -20, M.wall, { uv: 120 }); box(-310, -195, 260, 470, -30, -20, M.wall, { uv: 120 }); box(-310, -195, 466, 476, -262, -20, ceil);
  box(-310, -290, 260, 470, -262, -250, M.wall, { uv: 120 }); box(-215, -195, 260, 470, -262, -250, M.wall, { uv: 120 }); box(-290, -215, 455, 470, -262, -250, M.wall, { uv: 120 });
  // upstairs hallway beyond door (warm)
  const hall = new THREE.Mesh(new THREE.BoxGeometry(110, 220, 120), new THREE.MeshStandardMaterial({ color: 0xffd7a8, emissive: 0xffb36b, emissiveIntensity: .35, side: THREE.BackSide, roughness: 1 }));
  hall.position.set(-252, 365, -322); LV.add(hall);
  door = new THREE.Group(); door.position.set(-290, 260, -251); LV.add(door);
  const dp = new THREE.Mesh(new THREE.BoxGeometry(75, 194, 3), new THREE.MeshStandardMaterial({ color: 0x8a7a66, roughness: .7 })); dp.position.set(37.5, 97, 0); dp.castShadow = true; door.add(dp);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(2.6, 16, 12), M.brass); knob.position.set(68, 92, 3); door.add(knob);
  doorGlow = new THREE.Mesh(new THREE.PlaneGeometry(74, 1.4), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffc27a).multiplyScalar(4) })); doorGlow.position.set(-252.5, 260.6, -249.4); LV.add(doorGlow);
  // stairs (closed risers so they can be climbed)
  for (let i = 0; i < 13; i++) {
    const zf = 60 - i * 22, zb = 60 - (i + 1) * 22, top = 20 * (i + 1);
    box(-296, -206, top - 3, top, zb, zf + 1.5, M.stair, { uv: 60 });
    box(-296, -206, top - 20, top - 3, zf - 1.5, zf, M.stair, { uv: 60 });
  }
  box(-296, -206, 257, 260, -250, -226, M.stair, { uv: 60 });
  const strL = Math.hypot(286, 260), ang = Math.atan2(260, 286);
  for (const sx of [-208, -294]) { const s = new THREE.Mesh(new THREE.BoxGeometry(4, 26, strL), M.stair); s.position.set(sx, 130 - 4, -83); s.rotation.x = ang; s.castShadow = true; s.receiveShadow = true; LV.add(s); }
  for (let i = 0; i < 13; i += 3) { const zf = 60 - i * 22 - 11; cyl(-203, zf, 1.6, 20 * (i + 1), 20 * (i + 1) + 85, M.stair, { col: false }); }
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, strL, 12), M.stair); rail.rotation.x = Math.PI / 2 - ang; rail.position.set(-203, 130 + 80, -83); rail.rotation.order = 'YXZ'; rail.rotation.set(-(Math.PI / 2 - ang), 0, 0); rail.castShadow = true; LV.add(rail);
  // under-stairs storage
  box(-296, -258, 0, 26, -92, -58, M.cardC, { uv: 0 });
  cyl(-236, -40, 9, 0, 12.5, M.paint, { seg: 32 }); cyl(-236, -40, 9.2, 12.5, 13.2, M.dsteel, { seg: 32 });
  cyl(-268, -20, 9, 0, 12.5, M.paintRed, { seg: 32 });
  addDecal(M.web, 60, 60, -230, 70, -100, 0, -Math.PI / 2);
  // mousetrap (old, hazard)
  const trap = box(-246, -236, 0, 1.2, -6, 16, M.stool, { col: false }); const bar = new THREE.Mesh(new THREE.TorusGeometry(4, .25, 6, 20, Math.PI), M.steel); bar.position.set(-241, 1.3, 8); bar.rotation.x = -Math.PI / 2; LV.add(bar);
  STATIC.trap = { x: -241, z: 5, armed: true, bar };
  // workbench
  box(-100, 100, 88, 92, -248, -168, M.oak, { uv: 80 });
  box(-98, 98, 82, 88, -246, -244, M.oak, { uv: 80, col: false }); box(-98, 98, 82, 88, -172, -170, M.oak, { uv: 80, col: false });
  for (const [x, z] of [[-96, -244], [96, -244], [-96, -172], [96, -172]]) box(x - 3, x + 3, 0, 88, z - 3, z + 3, M.oak, { uv: 60 });
  box(-100, 100, 18, 21, -246, -170, M.oak, { uv: 80 });
  // lower shelf clutter
  box(-80, -40, 21, 41, -240, -205, M.cardB, { uv: 0 }); cyl(40, -220, 7, 21, 33, M.copper, { open: false });
  // machine
  const mx = -55, mz = -212, my = 92; machine = { x: mx, y: my + 22, z: mz };
  cyl(mx, mz, 16, my, my + 4, M.dsteel, { seg: 48 }); cyl(mx, mz, 13, my + 4, my + 5.5, M.steel, { seg: 48 });
  box(mx - 19, mx - 15, my + 4, my + 12, mz - 2, mz + 2, M.dsteel); box(mx + 15, mx + 19, my + 4, my + 12, mz - 2, mz + 2, M.dsteel);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(17, 1.7, 24, 96), M.dsteel); ring.position.set(mx, my + 22, mz); ring.castShadow = true; LV.add(ring);
  for (let a = 0; a < 16; a++) { const t = new THREE.Mesh(new THREE.TorusGeometry(2.1, .55, 10, 24), M.copper); const an = a / 16 * Math.PI * 2; t.position.set(mx + Math.cos(an) * 17, my + 22 + Math.sin(an) * 17, mz); t.rotation.y = Math.PI / 2; t.rotation.x = an; t.castShadow = true; LV.add(t); }
  const field = new THREE.Mesh(new THREE.CircleGeometry(15.2, 64), new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uK: { value: 1 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `uniform float uT,uK; varying vec2 vUv; void main(){ vec2 p=vUv-0.5; float r=length(p)*2.0; float a=atan(p.y,p.x);
      float sw=sin(a*5.0+r*14.0-uT*4.0)*0.5+0.5; float s2=sin(a*3.0-r*9.0+uT*2.3)*0.5+0.5; float ir=clamp(1.0-r,0.0,1.0); float v=pow(clamp(sw*s2,0.0,1.0),2.0)*ir+pow(ir,6.0)*0.6+smoothstep(0.82,1.0,r)*0.8;
      gl_FragColor=vec4(max(vec3(0.22,0.95,0.9)*v*1.25*uK, vec3(0.0)), 1.0); }`
  }));
  field.position.set(mx, my + 22, mz); LVFX.add(field); machine.field = field;
  const slot = new THREE.Mesh(new THREE.TorusGeometry(1.5, .35, 10, 32), new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x6ff6ee, emissiveIntensity: 1.3 })); slot.position.set(mx, my + 3, mz + 16.1); LV.add(slot);
  const sock = new THREE.Mesh(new THREE.CircleGeometry(1.4, 24), M.black); sock.position.set(mx, my + 3, mz + 16.05); LV.add(sock);
  machine.light = new THREE.PointLight(0x6ff6ee, 900, 0, 2); machine.light.position.set(mx, my + 22, mz + 4); LV.add(machine.light);
  addDecal(M.scorch, 60, 60, mx + 6, my + .05, mz + 10, -Math.PI / 2, 0);
  // cables
  const tube = (pts, r, mat) => { const c = new THREE.CatmullRomCurve3(pts.map(p => V3(...p))); const m = new THREE.Mesh(new THREE.TubeGeometry(c, 80, r, 8), mat); m.castShadow = true; m.receiveShadow = true; LV.add(m); return m; };
  tube([[mx + 8, my + 1, mz - 14], [mx + 30, my + .8, -238], [mx + 40, my + .8, -246], [mx + 44, 70, -249], [mx + 30, 3, -246], [mx + 10, .8, -236], [-20, .8, -232]], .7, M.rubber);
  tube([[mx - 10, my + 1, mz - 14], [mx - 30, my + 1, -240], [-95, my + 1, -246], [-101, 60, -249], [-98, 2, -247], [-80, .8, -230]], .55, M.copper);
  tube([[62, my + 1, -214], [40, my + .8, -190], [22, my + .8, -172], [18, 80, -166.5], [26, 30, -160], [40, .8, -150], [70, .8, -140]], .5, M.rubber);
  box(-30, -10, 0, 3, -240, -232, M.white, { col: false }); const led = new THREE.Mesh(new THREE.BoxGeometry(1, .6, .6), M.redLed); led.position.set(-12, 3, -236); LV.add(led);
  // lamp
  cyl(-86, -194, 7, 92, 94, M.dsteel); const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, 30, 10), M.steel); arm1.position.set(-82, 107, -196); arm1.rotation.z = -.35; arm1.castShadow = true; LV.add(arm1);
  const arm2 = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, 22, 10), M.steel); arm2.position.set(-71, 126, -196); arm2.rotation.z = 1.05; arm2.castShadow = true; LV.add(arm2);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(7, 9, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0x1f3b36, metalness: .6, roughness: .35, side: THREE.DoubleSide })); shade.position.set(-60, 130, -196); shade.rotation.z = .55; shade.castShadow = true; LV.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(2.2, 16, 12), M.bulbOn); bulb.position.set(-58.6, 127.2, -196); LV.add(bulb);
  lampLight = new THREE.SpotLight(0xffc98a, 15000, 0, .78, .65, 2); lampLight.position.set(-58, 126.5, -196); lampLight.target.position.set(-30, 92, -192); LV.add(lampLight, lampLight.target);
  lampLight.castShadow = true; lampLight.shadow.mapSize.setScalar(TOUCH ? 1024 : 2048); lampLight.shadow.camera.near = 1; lampLight.shadow.camera.far = 400; lampLight.shadow.bias = -0.0004; lampLight.shadow.normalBias = 0.03;
  // books stack
  box(-96, -70, 92, 96, -240, -222, M.bookG, { uv: 0 }); box(-94, -72, 96, 99.5, -238, -224, M.bookR, { uv: 0 }); box(-95, -74, 99.5, 104, -239, -223, M.bookB, { uv: 0 });
  // notebook, letter, mug, sugar
  box(-2, 28, 92, 93, -198, -176, M.pages, { uv: 0 }); addDecal(M.notebook, 30, 21, 13, 93.05, -187, -Math.PI / 2, 0);
  addDecal(M.letter, 17, 23, 40, 92.08, -190, -Math.PI / 2, .25);
  const mug = new THREE.Mesh(new THREE.LatheGeometry([V3(0, 0, 0), V3(4.1, 0, 0), V3(4.3, .4, 0), V3(4.3, 9.4, 0), V3(3.9, 9.5, 0), V3(3.8, .8, 0), V3(0, .8, 0)], 48), M.ceramic);
  mug.position.set(32, 92.1, -182); mug.castShadow = true; mug.receiveShadow = true; LV.add(mug); cols.push({ t: 'c', x: 32, z: -182, r: 4.3, y0: 92, y1: 101.5, m: mug });
  const hdl = new THREE.Mesh(new THREE.TorusGeometry(2.4, .55, 12, 24, Math.PI * 1.2), M.ceramic); hdl.position.set(36.3, 97, -182); hdl.rotation.z = -Math.PI * .6; LV.add(hdl);
  const cof = new THREE.Mesh(new THREE.CircleGeometry(3.8, 32), M.coffee); cof.rotation.x = -Math.PI / 2; cof.position.set(32, 99.6, -182); LV.add(cof);
  // flask & beaker & tubes
  const flask = new THREE.Mesh(new THREE.LatheGeometry([V3(0, 0, 0), V3(5.4, 0, 0), V3(5.6, .6, 0), V3(1.6, 9, 0), V3(1.5, 14, 0), V3(1.8, 14.3, 0)], 40), M.glass); flask.position.set(78, 92, -194); LV.add(flask); for (const [r, y0, y1] of [[5.3, 92, 96], [3.6, 96, 100], [1.8, 100, 106.3]]) cols.push({ t: 'c', x: 78, z: -194, r, y0, y1, m: flask });
  const liq = new THREE.Mesh(new THREE.LatheGeometry([V3(0, .3, 0), V3(5.1, .3, 0), V3(3.6, 4, 0), V3(0, 4, 0)], 32), M.green); liq.position.set(78, 92, -194); LV.add(liq);
  const gl = new THREE.PointLight(0x40ff90, 120, 0, 2); gl.position.set(78, 96, -194); LV.add(gl);
  const beaker = cyl(90, -178, 3.8, 92, 102, M.glass, { open: true, seg: 32 }); cyl(90, -178, 3.5, 92.2, 98, M.water, { col: false, seg: 32 });
  for (let i = 0; i < 4; i++) { cyl(8 + i * 4, -238, .9, 94, 106, M.glass, { col: false, open: true, seg: 16 }); }
  box(4, 22, 92, 94, -240, -236, M.stool, { uv: 0 });
  // laptop
  box(45, 77, 92, 93.6, -228, -206, M.dsteel); const scr = new THREE.Group(); scr.position.set(61, 93.6, -228); scr.rotation.x = -.28; LV.add(scr);
  const sb = new THREE.Mesh(new THREE.BoxGeometry(32, 21, .6), M.dsteel); sb.position.set(0, 10.5, 0); sb.castShadow = true; scr.add(sb);
  const sf = new THREE.Mesh(new THREE.PlaneGeometry(29, 18.5), M.screen); sf.position.set(0, 10.8, .32); scr.add(sf);
  cols.push({ t: 'b', x0: 45, x1: 77, y0: 93, y1: 103, z0: -231, z1: -227.4, m: sb }, { t: 'b', x0: 45, x1: 77, y0: 103, y1: 113, z0: -234.4, z1: -230.2, m: sb });   // the screen leans back
  const sl = new THREE.PointLight(0xbfeee8, 160, 0, 2); sl.position.set(61, 104, -218); LV.add(sl);
  // microscope
  box(80, 94, 92, 94.5, -240, -226, M.white); box(85, 89, 94.5, 116, -238, -234, M.white);
  const tubeM = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 12, 20), M.black); tubeM.position.set(87, 114, -232); tubeM.rotation.x = .4; tubeM.castShadow = true; LV.add(tubeM);
  cyl(87, -230, 3, 101, 102, M.steel, { col: false });
  // screws / screwdriver
  const sd = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 9, 12), new THREE.MeshPhysicalMaterial({ color: 0xd7262e, roughness: .3, clearcoat: 1 })); sd.rotation.z = Math.PI / 2; sd.position.set(-22, 93.1, -232); sd.castShadow = true; LV.add(sd);
  const sh = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, 10, 8), M.steel); sh.rotation.z = Math.PI / 2; sh.position.set(-12.5, 93.1, -232); LV.add(sh);
  for (let i = 0; i < 9; i++) { const s = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, 1.6, 8), M.steel); s.position.set(R(-40, 0), 92.25, R(-225, -200)); s.rotation.set(Math.PI / 2, 0, R(0, 6)); s.castShadow = true; LV.add(s); }
  // sugar cubes (resizable)
  addResizable(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), M.sugar.clone()), 8, -173, 92, 1.6, 1.6, 1.6, .5, 12, '方糖');
  const sc2 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 1.6), M.sugar); sc2.position.set(11.5, 92.8, -174); sc2.rotation.y = .4; sc2.castShadow = true; LV.add(sc2);
  // cork board + drawing + photo under the window
  box(30, 150, 118, 170, -250, -247, M.cork, { uv: 60 }); box(28, 152, 116, 118, -250, -246.5, M.oak); box(28, 152, 170, 172, -250, -246.5, M.oak);
  addDecal(M.drawing, 36, 27, 58, 146, -246.9, 0, 0).rotation.z = .04; addDecal(M.photo, 13, 15.6, 98, 150, -246.9, 0, 0).rotation.z = -.08;
  addDecal(M.letter, 14, 19, 124, 142, -246.9, 0, 0).rotation.z = .06;
  for (const [x, y] of [[44, 157], [74, 158], [98, 157], [124, 151]]) { const p = new THREE.Mesh(new THREE.SphereGeometry(.8, 10, 8), M.paintRed); p.position.set(x, y, -246.3); LV.add(p); }
  // window
  box(40, 140, 196, 200, -262, -243, M.wall, { uv: 120 });
  box(40, 44, 200, 245, -258, -254, M.white, { cast: true }); box(136, 140, 200, 245, -258, -254, M.white); box(40, 140, 241, 245, -258, -254, M.white); box(88, 92, 200, 245, -258, -254, M.white);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(96, 41), M.glassThin); glass.position.set(90, 222.5, -256); LV.add(glass);
  const nightP = new THREE.Mesh(new THREE.PlaneGeometry(180, 90), M.night); nightP.position.set(90, 225, -300); LV.add(nightP);
  for (const [x0, x1] of [[20, 40], [140, 160]]) box(x0, x1, 190, 260, -320, -262, M.wall, { uv: 120, col: false });
  box(20, 160, 190, 198, -320, -262, M.floor, { uv: 100, col: false });
  // wall dirt bands
  const band = (w, x, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 40), MAT.dirt); m.position.set(x, 20, z); m.rotation.y = ry; LV.add(m); };
  band(600, 0, -249.8, 0); band(600, 0, 249.8, Math.PI); band(500, -299.8, 0, Math.PI / 2); band(500, 299.8, 0, -Math.PI / 2);
  // stool
  cyl(125, -150, 17, 60, 64, M.stool, { uv: 50, seg: 48 });
  for (let a = 0; a < 4; a++) { const an = a * Math.PI / 2 + Math.PI / 4; const lx = 125 + Math.cos(an) * 12.5, lz = -150 + Math.sin(an) * 12.5; cyl(lx, lz, 1.5, 0, 60, M.stool, { seg: 12 }); }
  const rungs = new THREE.Mesh(new THREE.TorusGeometry(12.5, .9, 8, 40), M.stool); rungs.rotation.x = Math.PI / 2; rungs.position.set(125, 24, -150); rungs.castShadow = true; LV.add(rungs);
  // metal shelving
  for (const [x, z] of [[253.5, -58.5], [296.5, -58.5], [253.5, 58.5], [296.5, 58.5]]) box(x - 1.5, x + 1.5, 0, 205, z - 1.5, z + 1.5, M.shelf, { uv: 40 });
  for (const y of [12, 62, 112, 162, 205]) box(252, 298, y - 2, y, -60, 60, M.shelf, { uv: 40 });
  cyl(266, -40, 9, 12, 24.5, M.paint, { seg: 32 }); cyl(266, -40, 9.2, 24.5, 25.3, M.dsteel); cyl(284, -12, 8, 12, 23, M.paintRed, { seg: 32 }); box(258, 294, 12, 34, 14, 52, M.cardB, { uv: 0 });
  // animal tank on shelf 62
  const tg = new THREE.Mesh(new THREE.BoxGeometry(36, 24, 46), M.glassThin); tg.position.set(275, 74, -30); LV.add(tg);
  cols.push({ t: 'b', x0: 257, x1: 293, y0: 62, y1: 86, z0: -53, z1: -7, m: tg });
  box(257, 293, 62, 65, -53, -7, new THREE.MeshStandardMaterial({ color: 0xd8b07a, roughness: 1 }), { col: false });
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(8, .4, 8, 40), M.steel); wheel.position.set(275, 74, -20); wheel.castShadow = true; LV.add(wheel);
  for (let i = 0; i < 8; i++) { const sp = new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, 16, 6), M.steel); sp.position.copy(wheel.position); sp.rotation.z = i * Math.PI / 8; LV.add(sp); }
  const tl = new THREE.Mesh(new THREE.PlaneGeometry(10, 3), new THREE.MeshStandardMaterial({ map: genBook(0xeeeeee, '樣本 A–D'), roughness: .8 })); tl.position.set(256.8, 80, -30); tl.rotation.y = -Math.PI / 2; LV.add(tl);
  box(258, 294, 112, 140, -55, -10, M.cardA, { uv: 0 }); box(262, 290, 112, 128, 4, 40, M.cardB, { uv: 0 });
  box(258, 292, 162, 172, -50, -20, M.bookR, { uv: 0 }); box(260, 288, 162, 176, 10, 46, M.dsteel);
  // floor clutter: boxes, rug, matchbox, sugar
  box(150, 210, 0, 40, 110, 170, M.cardA, { uv: 0 }); box(160, 200, 40, 70, 120, 160, M.cardC, { uv: 0 }); box(210, 262, 0, 30, 150, 210, M.cardB, { uv: 0 });
  const rugM = furMat({ color: 0xffffff, map: MAT.rugBase, len: .32, den: 3.1, droop: 0, clump: .45, root: .55, rimK: .02, rough: 1 });
  const rugG = new THREE.PlaneGeometry(240, 190, 1, 1); rugG.rotateX(-Math.PI / 2);
  const rug = furMesh(rugG, rugM); rug.position.set(10, .3, 55); rug.castShadow = false; LV.add(rug); STATIC.rug = rug;
  cols.push({ t: 'b', x0: -110, x1: 130, y0: 0, y1: .3, z0: -40, z1: 150, m: rug, small: true });
  addResizable(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), M.match.clone()), 40, -125, 0, 5.3, 1.6, 3.6, .3, 8, '火柴盒');
  addResizable(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), M.sugar.clone()), 238, -76, 0, 1.6, 1.6, 1.6, .5, 12, '方糖');
  // the crack (goal) and the cardboard box blocking it
  addDecal(MAT.crack, 22, 22, -299.8, 8, 150, 0, Math.PI / 2);
  crackBox = addResizable(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), MAT.cardC.clone()), -289, 150, 0, 20, 22, 32, .25, 1, '紙箱');
  crackBox.c.push = true;
  // batteries (rewards at the high and dark places)
  for (const [x, y, z] of [[275, 205, 0], [120, 200, -253], [-286, 0, -100]]) addBattery(x, y, z);
  cols.push({ t: 'b', x0: -290, x1: -215, y0: 260, y1: 455, z0: -262, z1: -250, noRay: true }, { t: 'b', x0: 40, x1: 140, y0: 200, y1: 245, z0: -256.5, z1: -255.5, noRay: true });
  // hanging bulb (off)
  cyl(0, 0, .3, 228, 260, M.black, { col: false }); const hb = new THREE.Mesh(new THREE.SphereGeometry(4, 20, 16), M.glassThin); hb.position.set(0, 224, 0); LV.add(hb);
  // pipes along ceiling
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 600, 16), M.copper); pipe.rotation.z = Math.PI / 2; pipe.position.set(0, 232, -228); pipe.castShadow = true; LV.add(pipe);
  const duct = new THREE.Mesh(new THREE.BoxGeometry(30, 18, 500), new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: .8, roughness: .45 })); duct.position.set(180, 229, 0); duct.castShadow = true; LV.add(duct);
}
function addResizable(mesh, cx, cz, y0, sx, sy, sz, mn, mx, name) {
  mesh.castShadow = true; mesh.receiveShadow = true; LV.add(mesh);
  const c = { t: 'b', x0: 0, x1: 0, y0, y1: 0, z0: 0, z1: 0, m: mesh, small: false, push: true };
  const r = { mesh, c, cx, cz, y0, sx, sy, sz, s: 1, target: 1, min: mn, max: mx, name, pulse: 0 };
  cols.push(c); resizables.push(r); applyResize(r); mesh.userData.res = r; return r;
}
// round things (a kettle, a ball, a pot…) get a box pulled in a little, so its corners don't stick out into the air
const ROUND_FILL = { '生果碗': .74, '毛公仔': .76, '電熱水壺': .82, '馬克杯': .84, '香草盆栽': .82, '貓墊': .84, '油漆罐': .84, '波波': .8, '洗潔精': .86, '鋼杯': .84, '花灑': .62, '皮球': .8, '網球': .8, '監視鏡頭': .84 };
function applyResize(r) {
  const s = r.s; r.mesh.scale.set(r.sx * s, r.sy * s, r.sz * s); r.mesh.position.set(r.cx, r.y0 + r.sy * s / 2, r.cz);
  const c = r.c, k = ROUND_FILL[r.name] || 1; c.x0 = r.cx - r.sx * s / 2 * k; c.x1 = r.cx + r.sx * s / 2 * k; c.z0 = r.cz - r.sz * s / 2 * k; c.z1 = r.cz + r.sz * s / 2 * k; c.y1 = r.y0 + r.sy * s;
  c.small = Math.max(r.sx, r.sy, r.sz) * s < 4;
}
function addBattery(x, y, z) {
  const g = new THREE.Group(); g.position.set(x, y, z); LV.add(g);
  const b = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, .5, 32), M_batt()); b.position.y = 1.2; b.rotation.x = .5; b.castShadow = true; g.add(b);
  const halo = new THREE.Mesh(new THREE.RingGeometry(1.6, 2.1, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x82ece6).multiplyScalar(2.2), transparent: true, opacity: .55, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
  halo.position.y = 1.2; LVFX.add(halo); halo.position.add(g.position);
  batteries.push({ g, b, halo, x, y, z, got: false });
}
let _bm = null; function M_batt() { return _bm || (_bm = new THREE.MeshStandardMaterial({ color: 0xdfe3e6, metalness: 1, roughness: .18, emissive: 0x153c3a, emissiveIntensity: .6 })); }

// ---------- lights, volumetric beams, dust ----------
let beams = []; let doorBeamRec = null, flashBeamRec = null; let flashLight = null, flashBeam = null, doorBeam = null;
function beamMesh(color, len, angle, k) {
  const rad = Math.tan(angle) * len; const g = new THREE.ConeGeometry(rad, len, 48, 1, true); g.translate(0, -len / 2, 0);
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({
    uniforms: { uC: { value: new THREE.Color(color) }, uK: { value: k }, uL: { value: len } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: `varying vec3 vN; varying vec3 vV; varying float vA; uniform float uL; void main(){ vA=clamp(-position.y/uL,0.0,1.0); vec4 mv=modelViewMatrix*vec4(position,1.0); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 uC; uniform float uK; varying vec3 vN; varying vec3 vV; varying float vA; void main(){ float f=pow(clamp(abs(dot(normalize(vN),normalize(vV))),0.0,1.0),2.2); float a=f*smoothstep(0.0,0.06,vA)*pow(clamp(1.0-vA,0.0,1.0),1.3)*uK; gl_FragColor=vec4(uC*a,1.0); }`
  }));
  m.frustumCulled = false; LVFX.add(m); return m;
}
function aimBeam(m, from, to) { const d = V3().subVectors(to, from).normalize(); m.position.copy(from); m.quaternion.setFromUnitVectors(V3(0, -1, 0), d); }
// daylight through a window (DAY only): a soft cool fill just inside, and — when the window faces the sun —
// a shaft of sunlight (a real light plus a dusty beam) and a bright patch where it lands.
// c: the window's centre, w×h its size, n: which way the room is (unit), floorY: the floor below it.
let _sunPatchT = null;
function sunWindow(c, w, h, n, floorY, o = {}) {
  if (!DAY) return {};
  const fill = pointL(0xe4ecff, o.fill || 9000, c.x + n.x * 60, c.y - 20, c.z + n.z * 60);
  const d = SUN.clone().negate(); if (d.dot(n) < .15) return { fill };   // the sun is on the other side of the house
  const t = (c.y - floorY) / -d.y, hit = c.clone().addScaledVector(d, t), len = t;
  const ang = Math.atan(Math.max(w, h) * .55 / len);
  const l = spotL(0xfff0d8, o.sun || 160000, c.clone().addScaledVector(d, -60), hit, Math.min(.9, ang * 1.6), .7, 0); l.userData.win = 1;
  const b = beamMesh(0xfff0d8, len, ang, o.beamK || .11); aimBeam(b, c, hit); LV.add(b);
  if (beams.length < 4) beams.push({ m: b, o: c.clone(), d: d.clone(), ca: Math.cos(ang), len, c: new THREE.Color(0xfff0d8), k: .9 });
  if (!_sunPatchT) { const [cv, x] = cnv(128, 128); const g = x.createRadialGradient(64, 64, 10, 64, 64, 64); g.addColorStop(0, 'rgba(255,240,210,1)'); g.addColorStop(.6, 'rgba(255,236,200,.55)'); g.addColorStop(1, 'rgba(255,230,190,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); _sunPatchT = tex(cv); }
  const pm = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.3, h * 1.3 / Math.max(.4, -d.y)), new THREE.MeshBasicMaterial({ map: _sunPatchT, color: new THREE.Color(0xfff0d8).multiplyScalar(.35), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  pm.rotation.x = -Math.PI / 2; pm.rotation.z = Math.atan2(d.x, d.z); pm.position.set(hit.x, floorY + .3, hit.z); pm.renderOrder = 2; LV.add(pm);
  return { fill, sun: l, beam: b, patch: pm };
}
function buildLights() {
  LV.add(new THREE.HemisphereLight(0x5d6d90, 0x2c241b, 1.05));
  const f1 = new THREE.PointLight(0xffb27a, 7000, 0, 2); f1.position.set(-20, 70, -120); LV.add(f1);
  const f2 = new THREE.PointLight(DAY ? 0xdfe6ff : 0x8ea6ff, DAY ? 20000 : 16000, 0, 2); f2.position.set(70, 150, 70); LV.add(f2);
  const f3 = new THREE.PointLight(0xa8b8ff, 2600, 0, 2); f3.position.set(84, 18, 70); LV.add(f3);
  if (DAY) { const f4 = new THREE.PointLight(0xd8e0f0, 11000, 0, 2); f4.position.set(-190, 120, 150); LV.add(f4); }   // daylight bounce over the mouse-hole corner
  moonLight = new THREE.SpotLight(DAY ? 0xfff0d6 : 0xa9c1ff, DAY ? 3400000 : 1600000, 0, .2, .45, 2);   // (DAY: sunlight through the little window) moonLight.position.set(95, 420, -560); moonLight.target.position.set(84, 0, 85); LV.add(moonLight, moonLight.target);
  moonLight.castShadow = true; moonLight.shadow.mapSize.setScalar(TOUCH ? 1024 : 2048); moonLight.shadow.camera.near = 250; moonLight.shadow.camera.far = 1200; moonLight.shadow.bias = -0.0003; moonLight.shadow.normalBias = 0.05;
  const bc = DAY ? 0xffeccc : 0x9fb6ff; const mb = beamMesh(bc, 420, .12, DAY ? .17 : .13); aimBeam(mb, V3(90, 222, -256), V3(84, 0, 85)); beams.push({ m: mb, o: V3(90, 222, -256), d: V3(84, 0, 85).sub(V3(90, 222, -256)).normalize(), ca: Math.cos(.15), len: 420, c: new THREE.Color(bc), k: 1 });
  const lb = beamMesh(0xffc98a, 50, .62, .05); aimBeam(lb, V3(-58, 126, -196), V3(-30, 92, -192)); beams.push({ m: lb, o: V3(-58, 126, -196), d: V3(-30, 92, -192).sub(V3(-58, 126, -196)).normalize(), ca: Math.cos(.7), len: 50, c: new THREE.Color(0xffc98a), k: .8 });
  upLight = new THREE.SpotLight(0xffbf7a, 0, 0, .55, .6, 2); upLight.position.set(-252, 430, -330); upLight.target.position.set(-252, 0, 80); LV.add(upLight, upLight.target);
  upLight.castShadow = true; upLight.shadow.mapSize.setScalar(TOUCH ? 512 : 1024); upLight.shadow.camera.near = 30; upLight.shadow.camera.far = 900; upLight.shadow.bias = -0.0004; upLight.shadow.normalBias = .05;
  doorBeam = beamMesh(0xffbf7a, 520, .17, 0); aimBeam(doorBeam, V3(-252, 420, -300), V3(-252, 0, 80)); beams.push({ m: doorBeam, o: V3(-252, 420, -300), d: V3(-252, 0, 80).sub(V3(-252, 420, -300)).normalize(), ca: Math.cos(.2), len: 520, c: new THREE.Color(0xffbf7a), k: 0 }); doorBeamRec = beams[beams.length - 1];
  flashLight = new THREE.SpotLight(0xfff0dc, 0, 0, .4, .45, 2); flashLight.castShadow = true; flashLight.shadow.mapSize.setScalar(TOUCH ? 512 : 1024); flashLight.shadow.camera.near = 3; flashLight.shadow.camera.far = 800; flashLight.shadow.bias = -0.0005; flashLight.shadow.normalBias = .04;
  LV.add(flashLight, flashLight.target);
  flashBeam = beamMesh(0xfff0dc, 420, .4, 0); beams.push({ m: flashBeam, o: V3(), d: V3(0, -1, 0), ca: Math.cos(.42), len: 420, c: new THREE.Color(0xfff0dc), k: 0 }); flashBeamRec = beams[beams.length - 1];
}
let dust = null;
function buildDust(o = {}) {
  const N = Math.round((o.N ?? 4200) * (TOUCH ? .5 : 1)), pos = new Float32Array(N * 3), sd = new Float32Array(N); const bx = o.box ?? [-300, 300, 0, 250, -250, 250]; const bf = o.beamFrac ?? .55; const door = o.door ?? true;
  for (let i = 0; i < N; i++) {
    let p;
    if (i < N * bf && beams[0].len > 1) { const b = beams[(i % 3 === 0 && beams[1].len > 1) ? 1 : 0]; const t = rnd() * b.len * .95; const rr = Math.tan(Math.acos(b.ca)) * t * Math.sqrt(rnd()); const a = rnd() * 6.28; const ax = V3().copy(b.d); const u = V3(1, 0, 0).cross(ax).normalize(), v = V3().crossVectors(ax, u); p = V3().copy(b.o).addScaledVector(ax, t).addScaledVector(u, Math.cos(a) * rr).addScaledVector(v, Math.sin(a) * rr); }
    else if (door && i < N * .75) { const t = rnd() * 480; p = V3(-252 + R(-40, 40), 420 - t * .8, -300 + t * .78); }
    else p = V3(R(bx[0], bx[1]), R(bx[2], bx[3]), R(bx[4], bx[5]));
    pos.set([p.x, p.y, p.z], i * 3); sd[i] = rnd();
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('sd', new THREE.BufferAttribute(sd, 1));
  const U = { uT: { value: 0 }, uScale: { value: 800 }, uBO: { value: beams.map(b => b.o) }, uBD: { value: beams.map(b => b.d) }, uBC: { value: beams.map(b => b.c) }, uBA: { value: beams.map(b => b.ca) }, uBL: { value: beams.map(b => b.len) }, uBK: { value: beams.map(b => b.k) } };
  const m = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `uniform float uT,uScale; uniform vec3 uBO[4]; uniform vec3 uBD[4]; uniform vec3 uBC[4]; uniform float uBA[4]; uniform float uBL[4]; uniform float uBK[4]; attribute float sd; varying vec3 vC; varying float vA;
    void main(){ vec3 p=position+vec3(sin(uT*.21+sd*40.0)*3.0, sin(uT*.13+sd*17.0)*2.0+mod(uT*.4+sd*20.0,1.0)*0.0, cos(uT*.17+sd*29.0)*3.0);
      vec3 l=vec3(0.012);
      for(int i=0;i<4;i++){ vec3 d=p-uBO[i]; float t=dot(d,uBD[i]); if(t>0.0 && t<uBL[i]){ float c=dot(normalize(d+vec3(1e-4)),uBD[i]); l+=uBC[i]*uBK[i]*smoothstep(uBA[i],uBA[i]+0.015,c)*(1.0-t/uBL[i])*1.6; } }
      vC=l; vec4 mv=modelViewMatrix*vec4(p,1.0); float sz=(0.05+sd*sd*0.16); gl_PointSize=clamp(sz*uScale/-mv.z,1.0,26.0); vA=clamp(1.0-(-mv.z-3.0)*0.002,0.2,1.0)*smoothstep(1.0,4.0,-mv.z); gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `varying vec3 vC; varying float vA; void main(){ vec2 q=gl_PointCoord-0.5; float a=smoothstep(0.5,0.0,length(q)); gl_FragColor=vec4(vC*a*vA*1.4,1.0); }`
  });
  dust = new THREE.Points(g, m); dust.frustumCulled = false; LVFX.add(dust); if (TOUCH) g.setDrawRange(0, 2200);
}
// sparks / puffs particle pool
const PN = 260; let parts = null; const pdat = [];
function buildParticles() {
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(PN * 3), 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(PN * 3), 3)); g.setAttribute('size', new THREE.BufferAttribute(new Float32Array(PN), 1));
  const m = new THREE.ShaderMaterial({ uniforms: { uScale: { value: 800 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true,
    vertexShader: `uniform float uScale; attribute float size; varying vec3 vC; void main(){ vC=color; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=clamp(size*uScale/-mv.z,0.0,40.0); gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `varying vec3 vC; void main(){ float a=smoothstep(0.5,0.0,length(gl_PointCoord-0.5)); gl_FragColor=vec4(vC*a,1.0); }` });
  parts = new THREE.Points(g, m); parts.frustumCulled = false; fxGroup.add(parts);
  for (let i = 0; i < PN; i++) pdat.push({ life: 0, p: V3(), v: V3(), c: new THREE.Color(), s: 0, g: 0, drag: 0 });
}
let pIdx = 0;
function emit(p, v, c, s, life, g = 300, drag = 0) { const d = pdat[pIdx = (pIdx + 1) % PN]; d.fl = zoneFloor(p) + .2; d.p.copy(p); d.v.copy(v); d.c.copy(c); d.s = s; d.life = d.max = life; d.g = g; d.drag = drag; }
function updParticles(dt) {
  const P = parts.geometry.attributes.position.array, C = parts.geometry.attributes.color.array, S = parts.geometry.attributes.size.array;
  for (let i = 0; i < PN; i++) {
    const d = pdat[i];
    if (d.life > 0) { d.life -= dt; d.v.y -= d.g * dt; d.v.multiplyScalar(1 - d.drag * dt); d.p.addScaledVector(d.v, dt); if (d.p.y < d.fl && d.g > 0) { d.p.y = d.fl; d.v.y *= -.3; d.v.x *= .5; d.v.z *= .5; } }
    const k = Math.max(0, d.life / (d.max || 1));
    P[i * 3] = d.p.x; P[i * 3 + 1] = d.p.y; P[i * 3 + 2] = d.p.z; C[i * 3] = d.c.r * k; C[i * 3 + 1] = d.c.g * k; C[i * 3 + 2] = d.c.b * k; S[i] = d.life > 0 ? d.s * (0.4 + k * .6) : 0;
  }
  parts.geometry.attributes.position.needsUpdate = parts.geometry.attributes.color.needsUpdate = parts.geometry.attributes.size.needsUpdate = true;
}
