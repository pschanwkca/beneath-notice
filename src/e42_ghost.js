// =====================================================================
//  靈魂出竅 — online, when you're a toy
//  · your soul rises out of the toy: the colours drain, everything goes soft and cool, and you float
//    by it on a silver cord — WASD / the stick, Space up, C down (phone: 上升 / 下降)
//  · the cord is short (3 m: sixty times your height): enough to look round the corner you're stuck
//    in, not enough to scout the way ahead (that would take the fear out of everyone else's game)
//  · F (phone: 我喺度) flares your light and chimes for your teammates only; grown-ups hear nothing
//  · everyone sees a soft light over every teammate who's a toy, with their soul floating beside it,
//    so a toy carried off to a box or a kennel can still be found
//  · Tab / ← → still watches a teammate's screen; once you're rescued the soul drops back into you
// =====================================================================
const GH_TETHER = 300, GH_SPEED = 95, GH_RISE = 1.4;
const GHOST = { on: false, t: 0, p: V3(), v: V3(), cam: null, pingCd: 0, sendT: 0, remote: {}, vis: {}, tex: {}, glowTex: null, k: 0 };

function ghostCamTarget() {
  if (!GHOST.on) return null;
  return GHOST.cam || (GHOST.cam = { id: '_ghost', pos: GHOST.p, h: 4, crouch: false, climbing: false, on: null });
}
// the toy's place, and where a soul hangs by default (just over it)
function ghostHome(C) { return V3(C.pos.x, C.pos.y + C.h * .5, C.pos.z); }

// ---------- per frame ----------
function ghostTick(dt) {
  const want = NET.on && leader && leader.frozen && (STATE === 'play' || STATE === 'fail') && WORLD;
  if (want && !GHOST.on) ghostStart();
  else if (!want && GHOST.on) ghostEnd();
  GHOST.k = damp(GHOST.k, GHOST.on ? 1 : 0, GHOST.on ? 1.6 : 4, dt);
  grade.uniforms.uGhost.value = GHOST.k;
  if (GHOST.on) ghostMove(dt);
  GHOST.pingCd = Math.max(0, GHOST.pingCd - dt);
  ghostDraw(dt);
}
function ghostStart() {
  GHOST.on = true; GHOST.t = 0; GHOST.p.copy(ghostHome(leader)); GHOST.v.set(0, 0, 0);
  $('touch').classList.add('ghost'); document.documentElement.classList.add('soul'); tbLabel('tbJump', '上升'); tbLabel('tbCrouch', '下降');
  // a soft rising chord as it leaves
  tone(392, 784, 1.2, .035, 'sine'); setTimeout(() => tone(587, 1175, 1.1, .03, 'sine'), 160); nz(.9, 5200, 1, .02, 'highpass');
}
function ghostEnd() {
  GHOST.on = false; WATCH.id = null;
  $('touch').classList.remove('ghost'); document.documentElement.classList.remove('soul'); tbLabel('tbJump', '跳'); tbLabel('tbCrouch', '潛行');
  if (leader) { cam.tgt.set(leader.pos.x, leader.pos.y + leader.h * .8, leader.pos.z); }
  tone(1175, 587, .5, .03, 'sine');
}
// floating: the stick or WASD across, Space / C up and down; walls stop you, the cord holds you
function ghostMove(dt) {
  GHOST.t += dt; const C = leader, home = ghostHome(C), P = GHOST.p;
  if (GHOST.t < GH_RISE) {   // rising out of the toy
    const k = easeIO(clamp(GHOST.t / GH_RISE, 0, 1)); P.set(home.x, home.y + k * 30, home.z); GHOST.v.set(0, 0, 0);
    if (rnd() < dt * 18) emit(V3(home.x + R(-2, 2), home.y + R(0, 4), home.z + R(-2, 2)), V3(R(-3, 3), R(8, 18), R(-3, 3)), new THREE.Color(.75, 1.6, 1.7), R(.15, .35), R(.6, 1.2), -6, 1);
    return;
  }
  if (watchTarget()) return;   // watching a teammate: the soul waits where it is
  const typing = document.activeElement && document.activeElement.tagName === 'INPUT';
  let ix = 0, iz = 0, iy = 0;
  if (!typing && !PAUSED) {
    if (keys.KeyW || keys.ArrowUp) iz += 1; if (keys.KeyS || keys.ArrowDown) iz -= 1; if (keys.KeyA) ix -= 1; if (keys.KeyD) ix += 1;
    if (joy.on) { ix += joy.x; iz += joy.y; }
    if (keys.Space) iy += 1; if (keys.KeyC || keys.ShiftLeft || keys.GDown) iy -= 1;
  }
  const m = Math.hypot(ix, iz); if (m > 1) { ix /= m; iz /= m; }
  const fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw), rx = -fz, rz = fx;   // forward and right on the ground
  const tv = V3((fx * iz + rx * ix) * GH_SPEED, iy * GH_SPEED * .7, (fz * iz + rz * ix) * GH_SPEED);
  GHOST.v.x = damp(GHOST.v.x, tv.x, 6, dt); GHOST.v.y = damp(GHOST.v.y, tv.y, 6, dt); GHOST.v.z = damp(GHOST.v.z, tv.z, 6, dt);
  // one axis at a time, so it slides along a wall instead of sticking to it
  let bump = false;
  for (const ax of ['x', 'z', 'y']) {
    const n = P[ax] + GHOST.v[ax] * dt; const q = P.clone(); q[ax] = n;
    if (!ghostBlocked(q)) P[ax] = n; else { if (ax !== 'y' && Math.abs(tv[ax]) > 1) bump = true; GHOST.v[ax] = 0; }
  }
  // pushing into furniture: drift up and over it
  if (bump && iy <= 0) { const q = P.clone(); q.y += 60 * dt; if (!ghostBlocked(q)) P.y = q.y; }
  // the cord
  const d = P.distanceTo(home); if (d > GH_TETHER) { P.sub(home).multiplyScalar(GH_TETHER / d).add(home); }
  const [fl] = supportAt(P.x, P.z, 1, P.y + 1); if (P.y < fl + 3) P.y = fl + 3;
  if (P.y > home.y + 220) P.y = home.y + 220;
  // calling the team
  if (pressed.KeyF || pressed.GPing) ghostPing();
  // tell the others where the soul is (a few times a second is plenty)
  GHOST.sendT -= dt; if (GHOST.sendT <= 0) { GHOST.sendT = .2; nsend({ t: 'gh', id: C.id, p: [+P.x.toFixed(1), +P.y.toFixed(1), +P.z.toFixed(1)] }); }
}
function ghostBlocked(p) {
  for (const c of colsNear(p.x, p.y, p.z)) { if (c.t !== 'b' || c.y1 - c.y0 < .5) continue; if (p.x > c.x0 - 1.5 && p.x < c.x1 + 1.5 && p.y > c.y0 - 1.5 && p.y < c.y1 + 1.5 && p.z > c.z0 - 1.5 && p.z < c.z1 + 1.5) return true; }
  return false;
}
function ghostPing() {
  if (GHOST.pingCd > 0 || !leader) return; GHOST.pingCd = 3;
  ghostPingFx(leader.id, true); nsend({ t: 'gp', id: leader.id });
}
// 我喺度！ — the toy's light flares, a little chime; only the team can hear it
function ghostPingFx(id, own) {
  const C = chars[id]; if (!C) return; const V = GHOST.vis[id]; if (V) V.flare = 1;
  const d = camera.position.distanceTo(C.pos), v = own ? 1 : clamp(1 - d / 1600, .25, 1);
  tone(1320, 1760, .18, .045 * v, 'sine'); setTimeout(() => tone(1760, 2349, .22, .04 * v, 'sine'), 120); setTimeout(() => tone(2349, 2349, .35, .03 * v, 'triangle'), 240);
  if (!own) toast(`${C.S.name}：我喺度！`, 2.2);
  for (let i = 0; i < 22; i++) emit(V3(C.pos.x, C.pos.y + C.h * .6, C.pos.z), V3(R(-14, 14), R(10, 36), R(-14, 14)), new THREE.Color(.9, 1.9, 2), R(.2, .45), R(.5, 1.1), -10, 1);
}
function ghostRecv(d) { const C = chars[d.id]; if (!C || !d.p) return; GHOST.remote[d.id] = { p: V3(...d.p), t: performance.now() }; }

// ---------- drawing: a light over every teammate who's a toy, and their soul ----------
function ghostGlowTex() {
  if (GHOST.glowTex) return GHOST.glowTex;
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(200,250,255,.55)'); g.addColorStop(.6, 'rgba(120,230,240,.14)'); g.addColorStop(1, 'rgba(120,230,240,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128); GHOST.glowTex = new THREE.CanvasTexture(c); GHOST.glowTex.colorSpace = THREE.SRGBColorSpace; return GHOST.glowTex;
}
function ghostFaceTex(id) {
  if (GHOST.tex[id]) return GHOST.tex[id]; const src = PORTRAITS[id]; if (!src) return null;
  const t = new THREE.TextureLoader().load(src); t.colorSpace = THREE.SRGBColorSpace; GHOST.tex[id] = t; return t;
}
function ghostVis(id) {
  let V = GHOST.vis[id]; if (V) return V;
  const g = new THREE.Group(); g.renderOrder = 5;
  // the light over the toy: a tall soft beam and a bright point
  const beamM = new THREE.ShaderMaterial({ uniforms: { uK: { value: 1 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'uniform float uK; varying vec2 vUv; void main(){ float a=(1.0-vUv.y)*(1.0-vUv.y)*smoothstep(0.0,0.08,vUv.y); float s=1.0-abs(vUv.x-0.5)*2.0; a*=s*s; gl_FragColor=vec4(vec3(0.62,0.97,1.0)*a*0.55*uK,1.0); }' });
  const beam = new THREE.Mesh(new THREE.PlaneGeometry(7, 70).translate(0, 35, 0), beamM); g.add(beam);
  const dot = new THREE.Sprite(new THREE.SpriteMaterial({ map: ghostGlowTex(), color: 0xc8fbff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); dot.scale.setScalar(9); g.add(dot);
  // the soul: their own face, pale and see-through, with a halo
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: ghostGlowTex(), color: 0x9feef4, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .7 }));
  const face = new THREE.Sprite(new THREE.SpriteMaterial({ map: ghostFaceTex(id), color: new THREE.Color(.82, 1, 1.08), transparent: true, depthWrite: false, opacity: .62 }));
  // the cord from the toy to the soul
  const N = 24, cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  const cord = new THREE.Line(cg, new THREE.LineBasicMaterial({ color: 0xbff6fa, transparent: true, opacity: .55, depthWrite: false, blending: THREE.AdditiveBlending }));
  cord.frustumCulled = false;
  const soul = new THREE.Group(); soul.add(halo, face); scene.add(g, soul, cord);
  V = GHOST.vis[id] = { g, beam, dot, soul, halo, face, cord, N, flare: 0, a: 0, sp: V3() }; return V;
}
function ghostDraw(dt) {
  const show = NET.on && WORLD && STATE !== 'title' && STATE !== 'loading';
  const now = performance.now();
  for (const id of IDS) {
    const C = chars[id], frozen = show && C.frozen && isPlayerChar(C) && party.includes(C);
    let V = GHOST.vis[id]; if (!frozen && !V) continue; V = V || ghostVis(id);
    V.a = damp(V.a, frozen ? 1 : 0, frozen ? 3 : 6, dt); V.flare = Math.max(0, V.flare - dt * 1.4);
    const on = V.a > .01; V.g.visible = V.soul.visible = V.cord.visible = on; if (!on) continue;
    // the light over the toy
    const base = V3(C.pos.x, C.pos.y + C.h * .35, C.pos.z), pulse = .75 + Math.sin(now / 420 + id.length) * .15 + V.flare * 1.6;
    V.g.position.copy(base); V.beam.material.uniforms.uK.value = V.a * pulse; V.beam.lookAt(camera.position.x, base.y, camera.position.z);
    V.dot.position.set(0, C.h * .9, 0); V.dot.scale.setScalar((7 + V.flare * 10) * (.9 + Math.sin(now / 300) * .1)); V.dot.material.opacity = V.a;
    // where the soul is: mine as I fly it, a teammate's as they last said (or by their toy)
    const mine = C === leader && GHOST.on;
    let sp = mine ? GHOST.p : null;
    if (!sp) { const r = GHOST.remote[id]; sp = r && now - r.t < 3000 ? r.p : ghostHome(C).add(V3(0, 30 * Math.min(1, V.a), 0)); }
    V.sp.lerp(sp, mine ? 1 : 1 - Math.exp(-8 * dt)); if (V.sp.lengthSq() < 1) V.sp.copy(sp);
    const bob = Math.sin(now / 520 + id.length) * 1.4, rise = mine ? clamp(GHOST.t / GH_RISE, 0, 1) : 1;
    V.soul.position.set(V.sp.x, V.sp.y + bob, V.sp.z);
    // (your own soul is what the camera follows: smaller and fainter, so it doesn't block the view)
    const s = C.h * (mine ? .85 : 1.3) * (.6 + .4 * rise); V.face.scale.set(s, s, 1); V.halo.scale.setScalar(s * 2.1 + V.flare * 8);
    V.face.material.opacity = (mine ? .38 : .62) * V.a * (.85 + Math.sin(now / 380) * .15); V.halo.material.opacity = (mine ? .32 : .55) * V.a;
    // the cord sags a little between the toy and the soul
    const a = V3(C.pos.x, C.pos.y + C.h * .5, C.pos.z), b = V.soul.position, P = V.cord.geometry.attributes.position, L = a.distanceTo(b);
    for (let i = 0; i < V.N; i++) { const t = i / (V.N - 1); const x = lerp(a.x, b.x, t), z = lerp(a.z, b.z, t), y = lerp(a.y, b.y, t) - Math.sin(t * Math.PI) * Math.min(14, L * .12) + Math.sin(t * 9 + now / 300) * .25; P.setXYZ(i, x, y, z); }
    P.needsUpdate = true; V.cord.material.opacity = .5 * V.a;
    if (frozen && rnd() < dt * 3) emit(V3(V.sp.x + R(-2, 2), V.sp.y + R(-2, 2), V.sp.z + R(-2, 2)), V3(R(-2, 2), R(3, 8), R(-2, 2)), new THREE.Color(.7, 1.5, 1.6), R(.1, .25), R(.6, 1.2), -4, 1);
  }
}
