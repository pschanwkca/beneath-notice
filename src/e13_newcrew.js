// =====================================================================
//  TWO MORE OF THE CREW, met along the way in the single-player story
//  阿蝠 (蝙蝠, 夜更研究員) — found roosting under the garage workbench (chapter 3)
//      Space again in the air = flap (twice); touch a ceiling or a table's underside while holding Space = roost
//      upside down, crawl along it, round its edge onto the top; resting there refills stamina.
//      Left click = echolocation: everyone watching nearby (and loose batteries) shows through walls for a while.
//  阿龜 (烏龜, 園藝研究員) — found hiding in Mr Chan's garden (chapter 4)
//      Left click = pull into the shell: can't be seen (it's just a stone), teammates can stand on it as a step.
// =====================================================================
SP.bat = { name: '阿蝠', role: '夜更研究員', k: .9, r: 1.15, h: 4.6, fur: 0x75625a, belly: 0xcbb29c, len: .14, den: 36, ear: 'bat', paw: 0x3c302c, nose: 0xc98a86, tail: 'none', outfit: 'hoodie', bat: true, spd: 1.02, jmp: 1.02, clb: 1.1, abil: '拍翼＋倒吊＋回聲', desc: '空中再按 Space 拍翼 · 撞到枱底按住 Space 倒吊 · 左鍵回聲定位', col: '#b9a2ff' };
SP.tort = { name: '阿龜', role: '園藝研究員', k: 1.02, r: 1.45, h: 4.7, skin: true, skinCol: 0x8c9b5c, bellyCol: 0xe4d39a, paw: 0x7b8a4f, nose: 0x39432a, tail: 'stub', outfit: 'gardener', tort: true, spd: .84, jmp: .8, clb: .85, abil: '縮殼', desc: '左鍵縮入殼：不會被看見，隊友可以踩上來', col: '#cbd68c' };
IDS.push('bat', 'tort');
const NC = { batHome: V3(1256, 0, -201), tortHome: V3(2150, 0, 128), pingCD: 0, marks: [], ring: null, said: {} };

// ---------- models ----------
function batEar(g, s, k, part, plain, fm) {
  g.position.set(s * .7 * k, 1.02 * k, -.05 * k); g.rotation.set(-.08, s * -.32, s * -.3);
  part(new THREE.ConeGeometry(.5 * k, 1.35 * k, 28, 1), fm(0), g, 0, .62 * k, 0).scale.z = .32;
  const inner = plain(new THREE.ConeGeometry(.36 * k, 1.05 * k, 24, 1), new THREE.MeshPhysicalMaterial({ color: 0x9a6a68, roughness: .55, sheen: .6, sheenColor: 0xffc0b8 }), g, 0, .56 * k, .1 * k); inner.scale.z = .12;
}
let _ncM = null;
function ncMats() {
  if (_ncM) return _ncM;
  // tortoise shell: amber scutes with dark seams (also used as a bump map so the seams sink in)
  const [c, x] = cnv(512, 256); x.fillStyle = '#4a321c'; x.fillRect(0, 0, 512, 256);
  const cell = (cx, cy, r, i) => { const g = x.createRadialGradient(cx, cy - r * .2, r * .1, cx, cy, r); g.addColorStop(0, i % 2 ? '#b98a4c' : '#c79a58'); g.addColorStop(.7, '#8c6232'); g.addColorStop(1, '#6a4724'); x.fillStyle = g; x.beginPath(); for (let a = 0; a < 6; a++) { const t = a / 6 * Math.PI * 2 + Math.PI / 6; x.lineTo(cx + Math.cos(t) * r, cy + Math.sin(t) * r * .9); } x.closePath(); x.fill(); x.strokeStyle = 'rgba(255,230,180,.18)'; x.lineWidth = 2; for (let q = .45; q < 1; q += .22) { x.beginPath(); for (let a = 0; a <= 6; a++) { const t = a / 6 * Math.PI * 2 + Math.PI / 6; x.lineTo(cx + Math.cos(t) * r * q, cy + Math.sin(t) * r * q * .9); } x.stroke(); } };
  let i = 0; for (let row = 0; row < 4; row++) for (let col = 0; col < 7; col++) cell(col * 74 + (row % 2) * 37 + 18, row * 66 + 34, 34, i++);
  const [cb, xb] = cnv(512, 256); xb.drawImage(c, 0, 0); const id = xb.getImageData(0, 0, 512, 256); for (let p = 0; p < id.data.length; p += 4) { const v = (id.data[p] + id.data[p + 1] + id.data[p + 2]) / 3; id.data[p] = id.data[p + 1] = id.data[p + 2] = v > 70 ? 200 : 40; } xb.putImageData(id, 0, 0);
  const st = cnv(128, 128); st[1].fillStyle = '#d9b874'; st[1].fillRect(0, 0, 128, 128); for (let y = 0; y < 128; y += 6) for (let xx = 0; xx < 128; xx += 6) { st[1].fillStyle = ((xx + y) / 6) % 2 ? 'rgba(120,80,30,.28)' : 'rgba(255,240,200,.25)'; st[1].fillRect(xx, y, 6, 3); }
  _ncM = {
    shell: new THREE.MeshPhysicalMaterial({ map: tex(c), bumpMap: tex(cb, { srgb: false }), bumpScale: 2.2, roughness: .48, clearcoat: .5, clearcoatRoughness: .4 }),
    rim: new THREE.MeshPhysicalMaterial({ color: 0x5a3c20, roughness: .55, clearcoat: .3 }),
    straw: new THREE.MeshPhysicalMaterial({ map: tex(st[0], { rep: [6, 2] }), roughness: .85, sheen: .3, sheenColor: 0xffe8b0 }),
    band: new THREE.MeshPhysicalMaterial({ color: 0x4e7a3c, roughness: .7, sheen: .5 }),
    apron: new THREE.MeshPhysicalMaterial({ color: 0x5f8a4a, roughness: .85, sheen: .5, sheenColor: 0xb8e0a0, side: THREE.DoubleSide }),
    trowel: new THREE.MeshStandardMaterial({ color: 0xb8bcc0, metalness: .9, roughness: .3 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x9a6a3a, roughness: .6 }),
    hood: new THREE.MeshPhysicalMaterial({ color: 0x4a3c6c, roughness: .85, sheen: .7, sheenColor: 0x9a88d0 }),
    wing: new THREE.MeshPhysicalMaterial({ color: 0x3e3030, roughness: .62, sheen: .8, sheenColor: 0xb08880, side: THREE.DoubleSide, transmission: 0, thickness: .2 }),
    bone: new THREE.MeshStandardMaterial({ color: 0x2e2422, roughness: .6 }),
    fang: new THREE.MeshStandardMaterial({ color: 0xfaf6ee, roughness: .3 }),
    lamp: new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff0c8).multiplyScalar(3) })
  };
  return _ncM;
}
function batExtras(C, S, head, body, k, plain) {
  const M = ncMats(), CM = crewMats();
  // little fangs under a pug nose
  for (const s of [-1, 1]) { const f = plain(new THREE.ConeGeometry(.06 * k, .2 * k, 8), M.fang, head, s * .14 * k, -.5 * k, 1.12 * k); f.rotation.x = Math.PI; }
  // wings: a membrane hanging off each arm; folded on the ground, spread when flapping
  C.bwing = [];
  for (const a of C.arms) {
    const s = a.userData.s, sh = new THREE.Shape();
    sh.moveTo(0, .05 * k); sh.lineTo(0, -.95 * k); sh.quadraticCurveTo(.25 * k, -1.25 * k, .5 * k, -1.62 * k); sh.quadraticCurveTo(.66 * k, -1.2 * k, .98 * k, -1.18 * k); sh.quadraticCurveTo(1.1 * k, -.72 * k, 1.38 * k, -.52 * k); sh.quadraticCurveTo(1.0 * k, -.05 * k, .3 * k, .12 * k); sh.lineTo(0, .05 * k);
    const pivot = new THREE.Group(); pivot.position.set(0, -.04 * k, -.06 * k); a.add(pivot);
    const w = new THREE.Mesh(new THREE.ShapeGeometry(sh, 14), M.wing); w.scale.x = s; w.castShadow = true; pivot.add(w);
    for (const [ex, ey] of [[.5, -1.62], [.98, -1.18], [1.38, -.52]]) { const vx = s * ex * k, vy = (ey + .92) * k, L = Math.hypot(vx, vy); const b = new THREE.Mesh(new THREE.CylinderGeometry(.025 * k, .04 * k, L, 6), M.bone); b.position.set(vx / 2, -.92 * k + vy / 2, .01 * k); b.rotation.z = Math.atan2(vy, vx) - Math.PI / 2; pivot.add(b); }
    C.bwing.push(pivot);
  }
  C.wingK = .2; C.flapT = 0;
  // hoodie, hood bunched round the neck, OD badge, and a little head torch
  const lathe = (pts, mat) => { const m = plain(new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0] * k, p[1] * k)), 48), mat, body, 0, 0, 0); m.scale.z = .95; return m; };
  lathe([[1.22, -.32], [1.25, .05], [1.22, .55], [1.12, .95], [.84, 1.26]], M.hood);
  const hood = plain(new THREE.TorusGeometry(.86 * k, .24 * k, 10, 36), M.hood, body, 0, 1.36 * k, -.14 * k); hood.rotation.x = Math.PI / 2 - .3; hood.scale.set(1, 1.15, 1);
  for (const s of [-1, 1]) plain(new THREE.CylinderGeometry(.03 * k, .03 * k, .38 * k, 6), CM.white, body, s * .22 * k, 1.08 * k, 1.1 * k).rotation.x = -.25;
  plain(new THREE.BoxGeometry(1.0 * k, .36 * k, .1 * k), M.hood, body, 0, .3 * k, 1.17 * k).rotation.x = -.06;
  const b = plain(new THREE.CircleGeometry(.16 * k, 24), CM.badge, body, -.48 * k, 1.0 * k, 1.12 * k); b.rotation.y = -.4; b.castShadow = false;
  const strap = plain(new THREE.TorusGeometry(1.24 * k, .05 * k, 6, 40), CM.black, head, 0, .42 * k, 0); strap.rotation.x = Math.PI / 2 - .2; strap.scale.z = .98;
  const lampB = plain(new THREE.CylinderGeometry(.2 * k, .22 * k, .22 * k, 16), CM.black, head, 0, .7 * k, 1.12 * k); lampB.rotation.x = Math.PI / 2 - .35;
  const lens = plain(new THREE.CircleGeometry(.15 * k, 16), M.lamp, head, 0, .74 * k, 1.235 * k); lens.rotation.x = -.35; lens.castShadow = false;
}
function tortExtras(C, S, head, body, k, plain) {
  const M = ncMats(), CM = crewMats();
  if (C.headM) C.headM.scale.set(.9, .84, 1.1);
  C.eyes.forEach((e, i) => { const s = i ? 1 : -1; e.position.set(s * .5 * k, .26 * k, .96 * k); e.scale.set(.82, .9, .7); });
  // a hard beak line
  const beak = plain(new THREE.TorusGeometry(.5 * k, .035 * k, 6, 24, Math.PI * .7), CM.lip, head, 0, -.36 * k, 1.02 * k); beak.rotation.set(-.2, 0, Math.PI + Math.PI * .15);
  // the shell: a dome on the back with a rim, plus a plate down the front (the belly)
  const g = new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2); g.rotateX(-Math.PI / 2); g.scale(1.34 * k, 1.3 * k, 1.12 * k);
  C.shellM = plain(g, M.shell, body, 0, .74 * k, -.36 * k);
  const rim = plain(new THREE.TorusGeometry(1.0, .13 * k, 10, 48), M.rim, body, 0, .74 * k, -.38 * k); rim.scale.set(1.34 * k, 1.3 * k, 1);
  // gardener: straw hat with a green band, apron with a pocket and a trowel
  const hat = new THREE.Group(); hat.position.set(0, .9 * k, -.05 * k); hat.rotation.x = -.12; head.add(hat);
  plain(new THREE.CylinderGeometry(1.8 * k, 1.86 * k, .07 * k, 48), M.straw, hat, 0, 0, 0).scale.z = 1.05;
  plain(new THREE.CylinderGeometry(.96 * k, 1.06 * k, .62 * k, 40), M.straw, hat, 0, .32 * k, 0);
  plain(new THREE.CylinderGeometry(1.075 * k, 1.075 * k, .16 * k, 40), M.band, hat, 0, .1 * k, 0);
  const apron = plain(new THREE.LatheGeometry([[1.12, -.25], [1.14, .2], [1.1, .7], [.98, 1.08]].map(p => new THREE.Vector2(p[0] * k, p[1] * k)), 32, -Math.PI * .34, Math.PI * .68), M.apron, body, 0, 0, 0); apron.rotation.y = 0; apron.scale.z = .98;
  for (const s of [-1, 1]) plain(new THREE.CylinderGeometry(.04 * k, .04 * k, .9 * k, 6), M.apron, body, s * .42 * k, 1.28 * k, .74 * k).rotation.set(-.5, 0, s * -.25);
  plain(new THREE.BoxGeometry(.62 * k, .36 * k, .06 * k), M.band, body, .12 * k, .32 * k, 1.1 * k).rotation.x = -.06;
  const tw = new THREE.Group(); tw.position.set(.3 * k, .5 * k, 1.13 * k); tw.rotation.z = -.25; body.add(tw);
  plain(new THREE.CylinderGeometry(.06 * k, .06 * k, .38 * k, 8), M.wood, tw, 0, .2 * k, 0);
  plain(new THREE.BoxGeometry(.18 * k, .3 * k, .03 * k), M.trowel, tw, 0, -.08 * k, 0);
  const bd = plain(new THREE.CircleGeometry(.15 * k, 24), CM.badge, body, -.42 * k, .78 * k, 1.1 * k); bd.rotation.y = -.3; bd.castShadow = false;
  C.shellK = 0;
}

// ---------- animation hooks (called at the end of animChar) ----------
function ncAnim(C, dt, st) {
  if (C.id === 'bat') {
    C.flapT = Math.max(0, (C.flapT || 0) - dt);
    const roost = st === 'roost', air = st === 'air' || st === 'tumble';
    C.wingK = damp(C.wingK, C.flapT > 0 ? 1 : roost ? .55 : air ? .7 : .18, 12, dt);
    const flap = C.flapT > 0 ? Math.sin(C.t * 32) : 0;
    for (const p of C.bwing) { p.scale.set(Math.max(.12, C.wingK), 1, 1); p.rotation.y = (roost ? .9 : .25) * -p.parent.userData.s; }
    if (C.flapT > 0) for (const a of C.arms) { const s = a.userData.s; a.rotation.set(-.2, 0, s * (1.4 + flap * .9)); }
    if (roost) {
      // hang upside down by the feet, wings wrapped round
      C.root.rotation.set(0, C.yaw, Math.PI); C.root.position.y += C.h;
      for (const a of C.arms) { const s = a.userData.s; a.rotation.set(-.35, 0, s * .1); }
      C.legs[0].rotation.set(0, 0, -.12); C.legs[1].rotation.set(0, 0, .12); C.body.rotation.x = Math.sin(C.t * 1.7) * .05;
    }
  } else if (C.id === 'tort') {
    C.shellK = damp(C.shellK || 0, st === 'shell' ? 1 : 0, 10, dt); const s = C.shellK;
    if (s > .002) {
      C.body.rotation.x = lerp(C.body.rotation.x, 1.42, s); C.body.position.y = lerp(C.body.position.y, .46 * C.k, s);
      const v = Math.max(.02, 1 - s * 1.05); C.head.scale.setScalar(v); for (const a of C.arms) a.scale.setScalar(v); for (const l of C.legs) l.scale.setScalar(v); for (const t of C.tail) t.scale.setScalar(v);
    } else if (C.head.scale.x !== 1) { C.head.scale.setScalar(1); for (const a of C.arms) a.scale.setScalar(1); for (const l of C.legs) l.scale.setScalar(1); for (const t of C.tail) t.scale.setScalar(1); }
  } else if (st === 'roost') {
    // a teammate following the bat under a table: hang there by the hands
    for (const a of C.arms) { const s = a.userData.s; a.rotation.set(-2.95, 0, s * .22); } C.legs[0].rotation.set(-.12 + Math.sin(C.t * 11) * .3, 0, 0); C.legs[1].rotation.set(-.12 - Math.sin(C.t * 11) * .3, 0, 0);
  }
}

// ---------- bat: flap, roost, echolocation ----------
function batFlap(C) {
  if ((C.flaps || 0) >= 3) return false; if (C.stamina < 8) { toast('體力不夠，拍唔起'); return true; }
  C.flaps = (C.flaps || 0) + 1; C.stamina -= 8; C.vel.y = Math.max(C.vel.y, 0) * .3 + 62 * C.S.jmp; C.flapT = .42; C.squash = -.3; SND.swish(); tone(300, 180, .08, .03, 'triangle');
  return true;
}
// the underside right above (x, top, z): a ceiling, a table top, a shelf
function undersideAt(x, top, z) {
  let best = null, bd = 1.4;
  for (const c of colsNear(x, top - 1, z)) { if (c.y0 < -900 || c.slick || c.cat || c.small) continue; const d = Math.abs(c.y0 - top); if (d < bd && xzIn(c, x, z)) { bd = d; best = c; } }
  return best;
}
function roostOn(C, c) {
  if (!c || c.slick || c.y0 < -900) return false;
  C.roost = { c }; C.climbing = false; C.mantle = null; C.vel.set(0, 0, 0); C.grounded = false; C.flaps = 0; C.pos.y = c.y0 - C.h; C.state = 'roost'; SND.step(.6);
  if (!NC.said.roost && C === leader) { NC.said.roost = 1; toast('倒吊中：慢慢休息回體力 · 移動就沿着底面爬，爬到邊會翻上面 · Space 放手', 4.2); }
  return true;
}
function updRoost(C, dt, wx, wz, wl, ctl) {
  const Rr = C.roost; C.spd = 0; C.state = 'roost';
  if (Rr.c.y0 < -900) { C.roost = null; return; }
  C.stamina = Math.min(C.stamMax || 100, C.stamina + 22 * dt);
  if (ctl && pressed.Space) { C.roost = null; C.vel.set(0, -4, 0); C.flaps = 1; C.state = 'air'; return; }
  if (wl <= 0) return;
  const sp = 10 * C.S.spd, nx = C.pos.x + wx * sp * dt, nz = C.pos.z + wz * sp * dt, top = C.pos.y + C.h;
  const c2 = undersideAt(nx, top, nz);
  C.yaw = angDamp(C.yaw, Math.atan2(wx, wz), 10, dt);
  if (c2) {
    const ox = C.pos.x, oz = C.pos.z; C.pos.x = nx; C.pos.z = nz; C.pos.y = c2.y0 - C.h; Rr.c = c2; resolveH(C, false);
    C.spd = Math.hypot(C.pos.x - ox, C.pos.z - oz) / Math.max(dt, 1e-4); return;
  }
  // past the edge: crawl round it and up onto the top, if it's thin and there's room up there
  const c = Rr.c; if (c.y1 - c.y0 > 30) return;
  const px = C.pos.x - wx * C.r * .3, pz = C.pos.z - wz * C.r * .3;
  if (!xzIn(c, px, pz) || solidAt(px, c.y1 + .3, pz) || solidAt(px, c.y1 + C.h * .5, pz)) return;
  let ox = 0; while (ox < 12 && xzIn(c, C.pos.x + wx * ox, C.pos.z + wz * ox)) ox += .5;
  C.roost = null; C.mantle = { from: C.pos.clone(), to: V3(px, c.y1, pz), t: 0, out: V3(wx * (ox + C.r), 0, wz * (ox + C.r)), dur: .75 }; C.yaw = Math.atan2(wx, wz);
}
function watchTargets() {
  const out = []; const add = (root, y, name) => { if (!root || !root.visible) return; const p = root.getWorldPosition(V3()); p.y += y; out.push({ p, name, root, y }); };
  if (mom.root) add(mom.root, 150, '太太'); add(KID.root, 95, '女兒'); add(CAT.root, 24, '貓');
  if (GS.agent) add(GS.agent.root, 165, '職員'); if (GS.cam && !GS.camBroken) out.push({ p: V3(GS.cam.cx, GS.cam.y0 + 12, GS.cam.cz), name: '監視鏡頭' });
  if (YS.dog) add(YS.dog.root, 26, '狗'); if (YS.old && YS.old.H) add(YS.old.H.root, 110, '陳伯');
  if (ST.walker) add(ST.walker.H.root, 165, '行人'); if (ST.wdog) add(ST.wdog.root, 16, '小狗');
  return out;
}
let _pingTex = null;
function pingTex(kind) {
  _pingTex = _pingTex || {}; if (_pingTex[kind]) return _pingTex[kind];
  const [c, x] = cnv(128, 128); const g = x.createRadialGradient(64, 64, 8, 64, 64, 62); const col = kind === 'eye' ? '200,170,255' : '255,214,120';
  g.addColorStop(0, `rgba(${col},.55)`); g.addColorStop(.55, `rgba(${col},.18)`); g.addColorStop(1, `rgba(${col},0)`); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  x.strokeStyle = `rgba(${col},.95)`; x.lineWidth = 5; x.beginPath(); x.arc(64, 64, 34, 0, 7); x.stroke();
  x.fillStyle = `rgba(${col},1)`;
  if (kind === 'eye') { x.beginPath(); x.ellipse(64, 64, 20, 11, 0, 0, 7); x.fill(); x.fillStyle = '#1a1030'; x.beginPath(); x.arc(64, 64, 6, 0, 7); x.fill(); }
  else { x.fillRect(52, 50, 24, 28); x.fillRect(58, 45, 12, 6); }
  return (_pingTex[kind] = tex(c));
}
function batPing() {
  const C = leader; if (!C || C.id !== 'bat' || STATE !== 'play' || C.frozen) return;
  if (NC.pingCD > T) { toast(`回聲定位冷卻中（${Math.ceil(NC.pingCD - T)} 秒）`); return; } NC.pingCD = T + 8;
  for (const m of NC.marks) fxGroup.remove(m.s); NC.marks.length = 0;
  const R0 = 340, here = C.pos;
  const ws = watchTargets().filter(w => w.p.distanceTo(here) < R0 * 1.4);
  const bs = batteries.filter(b => !b.got && Math.hypot(b.x - here.x, b.y - here.y, b.z - here.z) < R0);
  const mk = (p, kind, sz, follow) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: pingTex(kind), depthTest: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending })); s.renderOrder = 999; s.position.copy(p); s.scale.setScalar(sz); fxGroup.add(s); NC.marks.push({ s, t: 0, d: here.distanceTo(p), follow, sz }); };
  for (const w of ws) mk(w.p, 'eye', w.y > 60 ? 34 : 16, w.root ? () => w.root.getWorldPosition(V3()).add(V3(0, w.y, 0)) : null);
  for (const b of bs) mk(V3(b.x, b.y + 3, b.z), 'bat', 9, null);
  // the pulse itself: a ring that sweeps outwards
  if (!NC.ring) { NC.ring = new THREE.Mesh(new THREE.RingGeometry(.94, 1, 96), new THREE.MeshBasicMaterial({ color: 0xc8b4ff, transparent: true, opacity: .5, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })); NC.ring.rotation.x = -Math.PI / 2; fxGroup.add(NC.ring); }
  NC.ring.position.set(here.x, here.y + 1, here.z); NC.ring.visible = true; NC.ringT = 0;
  for (let i = 0; i < 3; i++) tone(2400 - i * 300, 1500 - i * 200, .09, .035, 'sine', i * .11);
  C.arms[1].rotation.z = 1.2;
  toast(ws.length || bs.length ? `回聲定位：附近有 ${ws.length} 個在看守的${bs.length ? `、${bs.length} 粒電池` : ''}（隔牆都看得到）` : '回聲定位：附近沒有人', 3.2);
}
function updPing(dt) {
  if (NC.ring && NC.ring.visible) { NC.ringT += dt; const k = NC.ringT / 1.2; NC.ring.scale.setScalar(4 + k * 340); NC.ring.material.opacity = .5 * (1 - k); if (k >= 1) NC.ring.visible = false; }
  for (let i = NC.marks.length - 1; i >= 0; i--) {
    const m = NC.marks[i]; m.t += dt; const appear = clamp((m.t - m.d / 300) / .25, 0, 1), fade = clamp((7 - m.t) / 1.5, 0, 1);
    if (m.follow) m.s.position.copy(m.follow()); m.s.material.opacity = appear * fade * (.75 + .25 * Math.sin(m.t * 6)); m.s.scale.setScalar(m.sz * (1 + (1 - appear) * .8));
    if (m.t > 7) { fxGroup.remove(m.s); m.s.material.dispose(); NC.marks.splice(i, 1); }
  }
}

// ---------- tortoise: the shell ----------
// one collider per tortoise, switched on while it's tucked in so teammates can climb on top
function shellCol(C) {
  if (!C.shellC) { C.shellC = { t: 'c', x: 0, z: 0, r: 1.8 * C.k, y0: -999, y1: -998, shell: true }; cols.push(C.shellC); }
  return C.shellC;
}
function refileCol(c) { if (!WORLD) return; for (const Z of ZL) { const i = Z.cols.indexOf(c); if (i >= 0) Z.cols.splice(i, 1); } for (const Z of colZonesFor(c)) Z.cols.push(c); }
function tortShell() {
  const C = leader; if (!C || C.id !== 'tort' || STATE !== 'play' || C.frozen) return;
  if (C.shell) { C.shell = false; C.state = 'idle'; SND.push(); return; }
  if (!C.grounded || C.climbing || C.on || isBase(C) || C.mantle) { toast('要企穩先縮得入殼'); return; }
  C.shell = true; C.vel.set(0, 0, 0); C.crouch = false; C.state = 'shell'; SND.thud(.25);
  if (!NC.said.shell) { NC.said.shell = 1; toast('縮入殼了：看起來只是一塊石頭，誰都不會留意 · 隊友可以踩上來當踏腳 · 再按一下出來', 4.4); }
}
function shellTick() {
  for (const id of ['tort']) {
    const C = chars[id]; if (!C) continue; const on = C.state === 'shell' && C.root.visible && !C.frozen; const c = shellCol(C);
    if (on) { const y0 = C.pos.y, y1 = C.pos.y + 3.3 * C.k; if (c.y0 !== y0 || Math.abs(c.x - C.pos.x) > .01 || Math.abs(c.z - C.pos.z) > .01) { c.x = C.pos.x; c.z = C.pos.z; c.y0 = y0; c.y1 = y1; refileCol(c); } }
    else if (c.y0 > -900) { c.y0 = -999; c.y1 = -998; }
  }
}
// how much less a watcher notices someone (chameleon colour, tortoise shell)
function hideK(L) {
  if (L.state === 'shell') return .04;
  return L.id === 'cham' ? 1 - .82 * L.camo : 1;
}

// ---------- meeting them in the story ----------
function crewJoin(id, quiet) {
  const K = chars[id]; if (party.includes(K)) return;
  const [sup] = supportAt(K.pos.x, K.pos.z, K.r * .55, K.pos.y + .05); if (K.state === 'roost' || K.state === 'shell') { K.pos.y = Math.max(sup, K.pos.y > sup + 20 ? sup : K.pos.y); }
  K.state = 'idle'; K.shell = false; K.roost = null; K.root.visible = true; K.root.rotation.set(0, K.yaw, 0);
  party.push(K); K.lastTrail = K.pos.clone(); K.disp = K.pos.clone(); K.queue = []; K.stamina = 100; K.stamMax = 100; K.vel.set(0, 0, 0);
  assignGaps(); buildPartyHUD(); refreshPartyHUD();
  unlockKey(id);
  if (!quiet) SND.pick();
}
// before they've joined, they wait where you find them (single player only)
function ncPlace() {
  if (NET.on) return;
  const B = chars.bat, Tt = chars.tort;
  if (!party.includes(B)) { const top = (GS.benchY || 70) - 8; B.pos.set(NC.batHome.x, top - B.h, NC.batHome.z); B.yaw = .4; B.state = 'roost'; B.roost = null; B.root.visible = true; }
  if (!party.includes(Tt)) { Tt.pos.set(NC.tortHome.x, GY, NC.tortHome.z); Tt.yaw = -1.2; Tt.state = 'shell'; Tt.root.visible = true; }
}
const BAT_LINES = [[0, '阿蝠', '（倒吊在工作枱底）……噓！你們也縮小了？'], [2.7, '爸爸', '阿蝠？夜更的阿蝠！那晚試機你也在實驗室？'], [5.6, '阿蝠', '一醒來就吊在這裡了。拿電筒那個是公司派來找你的——我在黑暗裡也「看」得到他，帶上我。']];
const TORT_LINES = [[0, '阿龜', '（從「石頭」裡伸出頭來）……慢慢來，別吵醒那隻狗。'], [2.9, '爸爸', '阿龜！第一次試機就失蹤的是你！'], [5.6, '阿龜', '三個月了，我一直住在陳伯的花槽。晶片在陽光房的書枱上——跟我走長草那邊，被看見就縮入殼。']];
function lineCol(n) { return n === '爸爸' ? '#f5f0e6' : n === '阿蝠' ? SP.bat.col : SP.tort.col; }
function beat(tPrev, t, lines) { for (const [at, n, x] of lines) if (tPrev < at && t >= at || (at === 0 && tPrev < 0)) say(n, x, lineCol(n), x.length > 24 ? 4.2 : 2.7); }
function ncStory(dt) {
  if (NET.on || STATE !== 'play' || !leader) return;
  const B = chars.bat, Tt = chars.tort, L = leader;
  if (!party.includes(B)) {
    B.root.visible = !!(ZONES.garage && ZONES.garage.near);
    if (NC.batT == null && B.root.visible && ((Math.hypot(L.pos.x - B.pos.x, L.pos.z - B.pos.z) < 40 && Math.abs(L.pos.y - B.pos.y) < 95) || (LEVEL === 'garage' && quest >= 1))) NC.batT = -1e-6;
    if (NC.batT != null) {
      const t0 = NC.batT; NC.batT += dt; beat(t0, NC.batT, BAT_LINES);
      if (t0 < 2.2 && NC.batT >= 2.2) { NC.batDrop = { v: 0 }; B.state = 'air'; B.flapT = .6; SND.swish(); }
      if (NC.batDrop) {
        // let go of the bench and flutter down to the floor in front of everyone
        const D = NC.batDrop; const dx = L.pos.x - B.pos.x, dz = L.pos.z - B.pos.z, dd = Math.hypot(dx, dz);
        if (dd > 9) { B.pos.x += dx / dd * 11 * dt; B.pos.z += dz / dd * 11 * dt; }
        const [sup] = supportAt(B.pos.x, B.pos.z, B.r * .55, B.pos.y + .05); D.v = Math.min(D.v + 40 * dt, 20); B.pos.y = Math.max(sup, B.pos.y - D.v * dt); B.flapT = Math.max(B.flapT, .2);
        B.yaw = angDamp(B.yaw, Math.atan2(dx, dz), 4, dt);
        if (B.pos.y <= sup + .01) { B.state = 'idle'; B.flapT = 0; NC.batDrop = null; SND.land(.4); }
      }
      if (NC.batT >= 9.8 && !NC.batDrop) { crewJoin('bat'); toast('阿蝠加入！左鍵回聲定位 · 空中再按 Space 拍翼 · 撞到枱底按住 Space 倒吊', 4.6); }
    }
  }
  if (!party.includes(Tt)) {
    Tt.root.visible = !!(ZONES.yard && ZONES.yard.near);
    if (NC.tortT == null && Tt.root.visible && ((Math.hypot(L.pos.x - Tt.pos.x, L.pos.z - Tt.pos.z) < 36 && Math.abs(L.pos.y - Tt.pos.y) < 20) || (LEVEL === 'yard' && quest >= 1))) { NC.tortT = -1e-6; Tt.state = 'idle'; Tt.yaw = Math.atan2(L.pos.x - Tt.pos.x, L.pos.z - Tt.pos.z); }
    if (NC.tortT != null) {
      const t0 = NC.tortT; NC.tortT += dt; beat(t0, NC.tortT, TORT_LINES);
      if (NC.tortT >= 10) { crewJoin('tort'); toast('阿龜加入！左鍵縮入殼：不會被看見，隊友可以踩上來', 4.4); }
    }
  }
}
function ncTick(dt) { updPing(dt); shellTick(); ncStory(dt); }
// hints for the two of them
function ncHint(L) {
  if (L.id === 'bat') { if (L.roost) return '倒吊中（休息回體力）· 移動沿底面爬 · <kbd>Space</kbd> 放手'; if (!L.grounded && !L.climbing) return `空中再按 ${TOUCH ? '「跳」' : '<kbd>Space</kbd>'} 拍翼（${3 - (L.flaps || 0)}）· 按住慢慢飄落 · 撞到天花或枱底按住就倒吊`; }
  if (L.id === 'tort' && L.shell) return `縮在殼裡：不會被看見，隊友可以踩上來 · ${TOUCH ? '再按「殼」' : '再按左鍵'}出來`;
  return '';
}
