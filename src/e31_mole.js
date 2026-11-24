// =====================================================================
//  阿鼴（鼴鼠，地質研究員）— found hiding under the park's sandbox (chapter 6)
//  Left click on soft ground (grass, earth, sand) = dig in and travel underground:
//  nobody can see you, the dogs can't smell you. Click again (or Space) to pop out.
//  Hard ground (paths, paving, floors, anything raised) stops you at its edge.
//  Star-nosed, velvet-furred, big pink spade hands; a caving helmet with a lamp.
// =====================================================================
SP.mole = { name: '阿鼴', role: '地質研究員', k: .96, r: 1.3, h: 4.4, fur: 0x4c4542, belly: 0x6e6460, len: .09, den: 52, ear: 'none', paw: 0xf2a8b0, nose: 0xf08ea0, tail: 'stub', outfit: 'caver', mole: true, spd: .94, jmp: .82, clb: .95, abil: '鑽地', desc: '左鍵在草地或沙上鑽地：沒有人看得到你，再按一下出來', col: '#f0a8bc' };
IDS.push('mole');
const MOLE = { home: V3(1955, GY + 10, 3150), said: {}, mound: null, met: false, sceneT: -1 };

// ---------- model ----------
function moleExtras(C, S, head, body, k, plain) {
  const pink = new THREE.MeshPhysicalMaterial({ color: S.nose, roughness: .45, sheen: .6, sheenColor: 0xffd0d8, emissive: 0xff7088, emissiveIntensity: .08 });
  const CM = crewMats();
  if (C.headM) C.headM.scale.set(.94, .9, 1.12);
  // tiny eyes, almost hidden in the fur
  C.eyes.forEach((e, i) => { const s = i ? 1 : -1; e.position.set(s * .44 * k, .22 * k, 1.04 * k); e.scale.set(.42, .46, .4); });
  // a long pink snout ending in the star: a ring of little fleshy rays round the nostrils
  const sn = plain(new THREE.CylinderGeometry(.2 * k, .34 * k, .7 * k, 20), pink, head, 0, -.18 * k, 1.38 * k); sn.rotation.x = Math.PI / 2 - .12;
  const star = new THREE.Group(); star.position.set(0, -.14 * k, 1.76 * k); head.add(star); C.star = star;
  for (let i = 0; i < 11; i++) { const a = i / 11 * Math.PI * 2; const r = plain(new THREE.CapsuleGeometry(.055 * k, .2 * k, 4, 8), pink, star, Math.cos(a) * .2 * k, Math.sin(a) * .2 * k, 0); r.rotation.set(0, 0, a - Math.PI / 2); r.rotateX(.5); }
  plain(new THREE.SphereGeometry(.1 * k, 12, 10), pink, star, 0, 0, .04 * k);
  // big spade hands with claws
  for (const a of C.arms) { const s = a.userData.s; const h = plain(ell(.4 * k, .14 * k, .34 * k, 20, 12), pink, a, s * .06 * k, -.95 * k, .12 * k); h.rotation.set(-.3, 0, s * .4);
    for (let j = 0; j < 5; j++) { const c = plain(new THREE.ConeGeometry(.045 * k, .2 * k, 8), new THREE.MeshStandardMaterial({ color: 0xf4ead8, roughness: .4 }), h, (j - 2) * .14 * k, -.02 * k, .34 * k); c.rotation.x = Math.PI / 2; } }
  // caving helmet with a lamp, a khaki field vest with pockets, a rock hammer
  const hm = new THREE.MeshPhysicalMaterial({ color: 0xe8732e, roughness: .32, clearcoat: .8 });
  const hat = plain(new THREE.SphereGeometry(1.24 * k, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), hm, head, 0, .52 * k, -.06 * k); hat.scale.set(1.04, .78, 1.06);
  plain(new THREE.CylinderGeometry(1.34 * k, 1.34 * k, .06 * k, 40), hm, head, 0, .54 * k, -.02 * k);
  const lampB = plain(new THREE.CylinderGeometry(.22 * k, .26 * k, .22 * k, 20), CM.black, head, 0, .98 * k, 1.04 * k); lampB.rotation.x = Math.PI / 2 - .5;
  C.lampG = plain(new THREE.CircleGeometry(.17 * k, 20), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff2c8).multiplyScalar(2.4) }), head, 0, 1.04 * k, 1.16 * k); C.lampG.rotation.x = -.5; C.lampG.castShadow = false;
  const khaki = new THREE.MeshPhysicalMaterial({ color: 0x8f8456, roughness: .85, sheen: .4, sheenColor: 0xd8cc98 });
  const vest = plain(new THREE.LatheGeometry([[1.1, -.2], [1.12, .2], [1.08, .7], [.98, 1.04], [.72, 1.28]].map(p => new THREE.Vector2(p[0] * k, p[1] * k)), 40), khaki, body, 0, 0, 0); vest.scale.z = .96;
  for (const [x, y] of [[-.42, .42], [.42, .42], [-.4, .86]]) { const p = plain(new THREE.BoxGeometry(.4 * k, .34 * k, .08 * k), khaki, body, x * k, y * k, 1.06 * k); p.rotation.x = -.08; plain(new THREE.BoxGeometry(.42 * k, .08 * k, .1 * k), CM.belt, p, 0, .16 * k, .01 * k); }
  plain(new THREE.TorusGeometry(1.08 * k, .1 * k, 8, 48), CM.belt, body, 0, .0, 0).rotation.x = Math.PI / 2;
  const ham = new THREE.Group(); ham.position.set(1.0 * k, .05 * k, .3 * k); ham.rotation.z = .35; body.add(ham);
  plain(new THREE.CylinderGeometry(.05 * k, .05 * k, .7 * k, 8), new THREE.MeshStandardMaterial({ color: 0x6a4a2a, roughness: .7 }), ham, 0, -.2 * k, 0);
  plain(new THREE.BoxGeometry(.34 * k, .1 * k, .1 * k), MAT.dsteel, ham, 0, .14 * k, 0);
  const bd = plain(new THREE.CircleGeometry(.15 * k, 24), CM.badge, body, -.42 * k, 1.0 * k, 1.04 * k); bd.rotation.y = -.34; bd.castShadow = false;
}

// ---------- soft ground ----------
function softAt(p) {
  if (!WORLD) return false; const Z = zoneAt(p, 2); if (!Z) return false;
  if (Z.id === 'park') return parkSoft(p);
  if (Z.id === 'yard') return p.y <= GY + 2 && p.x > 1470 && p.x < 2550 && p.z > -430 && p.z < 630;   // 陳伯's lawn (not the sunroom deck)
  if (Z.id === 'road') return p.y <= GY + 2 && p.x > -320 && p.x < 900 && p.z > 266 && p.z < 626;      // our front lawn
  return false;
}
// ---------- dig in / pop out ----------
function moleDig() {
  const C = leader; if (!C || C.id !== 'mole' || STATE !== 'play' || C.frozen) return;
  if (C.dig) { molePop(C); return; }
  if (!C.grounded || C.climbing || C.on || isBase(C) || C.mantle || C.carry) { toast('要企穩先鑽得落去'); return; }
  if (!softAt(C.pos)) { toast('這裡太硬了——要在草地、泥土或沙上才鑽得落去'); return; }
  C.dig = true; C.vel.set(0, 0, 0); C.crouch = false; C.state = 'dig'; C.digK = 0; nz(.35, 380, .8, .14); SND.thud(.2); moleDirt(C, 18);
  if (!MOLE.said.dig) { MOLE.said.dig = 1; toast('鑽入地底了：沒有人看得到你，狗也聞不到 · 只可以在草地、泥土或沙裡面走 · 再按一下鑽出來', 4.6); }
}
function molePop(C, quiet) {
  if (!C.dig) return; C.dig = false; C.state = 'idle'; C.vel.set(0, 26, 0); C.grounded = false; moleDirt(C, 22); if (!quiet) { nz(.25, 520, 1, .1); SND.jump(); }
}
function moleDirt(C, n) {
  const sandy = Z => Z && Z.id === 'park' && C.pos.x > PK.sand.x0 && C.pos.x < PK.sand.x1 && C.pos.z > PK.sand.z0 && C.pos.z < PK.sand.z1;
  const col = sandy(zoneAt(C.pos)) ? new THREE.Color(.62, .55, .42) : new THREE.Color(.24, .18, .12);
  for (let i = 0; i < n; i++) emit(V3(C.pos.x + R(-1.5, 1.5), C.pos.y + .4, C.pos.z + R(-1.5, 1.5)), V3(R(-14, 14), R(14, 34), R(-14, 14)), col, R(.25, .5), R(.4, .8), 220, 0);
}
// underground movement (called from updLeader instead of the normal walk)
function moleDigUpd(C, dt, wx, wz, ctl) {
  C.state = 'dig'; C.grounded = true; C.vel.y = 0; C.climbing = false; C.crouch = false;
  if (ctl && pressed.Space) { molePop(C); return; }
  const sp = 13.5 * .72 * C.S.spd, tx = wx * sp, tz = wz * sp, k = 1 - Math.exp(-10 * dt);
  C.vel.x += (tx - C.vel.x) * k; C.vel.z += (tz - C.vel.z) * k;
  const ox = C.pos.x, oz = C.pos.z; C.pos.x += C.vel.x * dt; C.pos.z += C.vel.z * dt; resolveH(C, false);
  if (!softAt(C.pos)) { C.pos.x = ox; C.pos.z = oz; C.vel.x = C.vel.z = 0; if (C === leader && (!MOLE.hardT || T - MOLE.hardT > 2.5)) { MOLE.hardT = T; toast('前面太硬了，鑽不過去——再按一下鑽出來'); } }
  const [sup] = supportAt(C.pos.x, C.pos.z, C.r * .5, C.pos.y + 2); if (sup > -1e8) C.pos.y = sup;
  const hs = Math.hypot(C.vel.x, C.vel.z); C.spd = hs; if (Math.hypot(wx, wz) > 0) C.yaw = angDamp(C.yaw, Math.atan2(wx, wz), 10, dt);
  C.stamina = Math.min(C.stamMax || 100, C.stamina + 20 * dt);
  if (hs > 2 && rnd() < dt * 18) moleDirt(C, 1);
}
// ---------- what everyone sees: the body sinks, a ridge of earth moves along ----------
function moleMoundMesh() {
  if (MOLE.mound) return MOLE.mound;
  const g = new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2); const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: genSoil(), color: 0x8a7a6a, roughness: 1 }));
  m.castShadow = true; m.receiveShadow = true; m.visible = false; scene.add(m); MOLE.mound = m; return m;
}
function moleTick(dt) {
  const C = chars.mole; if (!C) return; const on = C.state === 'dig' && C.root.visible && !C.frozen; const M = moleMoundMesh();
  C.digK = damp(C.digK || 0, on ? 1 : 0, 9, dt);
  if (C.body) { C.body.visible = C.digK < .6; C.body.position.y = .92 * C.k - C.digK * 4.4 * C.k; }
  M.visible = C.digK > .05;
  if (M.visible) { const wob = C.spd > 2 ? Math.sin(T * 14) * .08 : 0; M.position.set(C.pos.x, C.pos.y - .2, C.pos.z); M.scale.set(1.9 * C.k * (1 + wob), 1.1 * C.k * C.digK, 2.4 * C.k); M.rotation.y = C.yaw;
    const sandy = C.pos.x > PK.sand.x0 && C.pos.x < PK.sand.x1 && C.pos.z > PK.sand.z0 && C.pos.z < PK.sand.z1; M.material.color.setHex(sandy ? 0xd8c8a0 : 0x8a7a6a); }
  if (C.star) C.star.rotation.z += dt * (C.spd > 1 ? 4 : .8);
  // the sandbox mound in the park, before he's met
  if (PK.mound && !MOLE.met) PK.mound.scale.y = .01 + (Math.sin(T * 2.2) * .5 + .5) * .08;
}

// ---------- meeting him (single player, chapter 6) ----------
const MOLE_LINES = [[0, '阿鼴', '（從沙裡探出頭來）……地面上的人走了沒有？'], [2.8, '爸爸', '阿鼴？地質組的阿鼴！你怎麼會在這裡？'], [5.6, '阿鼴', '試機那晚我一縮小就鑽進泥土裡，一直沿着地底挖到這個沙池……三天了。'],
  [9.2, '爸爸', '跟我們走。晶片要在月光底下充電——滑梯塔頂最開揚。'], [12.4, '阿鼴', '好！在草地和沙裡我可以鑽地走，沒有人看得到，狗也聞不到。']];
function moleMeet() {
  const C = chars.mole; if (!C || MOLE.met) return; MOLE.met = true;
  if (party.includes(C)) { setQuest(2); return; }   // already with us (test mode)
  MOLE.sceneT = 0;
  const p = MOLE.home; C.pos.set(p.x, p.y, p.z); C.yaw = Math.atan2(leader.pos.x - p.x, leader.pos.z - p.z); C.root.visible = true; C.state = 'dig'; C.digK = 1;
  if (PK.mound) PK.mound.scale.y = .3; for (let i = 0; i < 30; i++) emit(V3(p.x + R(-3, 3), p.y + .5, p.z + R(-3, 3)), V3(R(-20, 20), R(20, 50), R(-20, 20)), new THREE.Color(.66, .58, .44), R(.3, .6), R(.5, 1), 220, 0);
  nz(.6, 400, .8, .16); setTimeout(() => { C.state = 'idle'; C.vel.set(0, 30, 0); }, 900);
  setQuest(1); $('qt').textContent = '沙池裡有人！'; $('qs').textContent = '聽聽他怎麼說';
}
function moleStory(dt) {
  if (MOLE.sceneT < 0) return; const t0 = MOLE.sceneT; MOLE.sceneT += dt; const t = MOLE.sceneT;
  for (const [at, n, x] of MOLE_LINES) if (t0 < at + .9 && t >= at + .9) say(n, x, n === '爸爸' ? '#f5f0e6' : SP.mole.col, x.length > 22 ? 4 : 3);
  if (t0 < 1 && t >= 1) { const C = chars.mole; C.yaw = Math.atan2(leader.pos.x - C.pos.x, leader.pos.z - C.pos.z); }
  if (t0 < 15.5 && t >= 15.5) { MOLE.sceneT = -1; crewJoin('mole'); if (PK.mound) PK.mound.visible = false; setQuest(2); toast('阿鼴加入了！按數字鍵或點頭像切換 · 左鍵鑽地', 3.6); }
}
// before he's met he waits under the sand (single player)
function molePlace() {
  const C = chars.mole; if (!C || NET.on || party.includes(C)) return;
  if (!MOLE.met) { C.pos.copy(MOLE.home); C.state = 'dig'; C.root.visible = false; }
}
