
// ---------- characters (Party Animals proportions, realistic fur & materials) ----------
const SP = {
  dad: { name: '爸爸', role: '科學家', k: 1, r: 1.25, h: 5.2, fur: 0xf2ede6, belly: 0xfff4ef, len: .13, den: 40, ear: 'round', paw: 0xf2aeb0, nose: 0xeb7f92, tail: 'thin', outfit: 'coat', spd: 1, jmp: 1, clb: 1, abil: '尺寸槍', desc: '左鍵放大 · 右鍵縮小', col: '#f5f0e6' },
  sq: { name: '助手', role: '研究生', k: .93, r: 1.15, h: 4.9, fur: 0xa07a5a, belly: 0xf5e6cf, len: .17, den: 33, ear: 'tuft', paw: 0x5b4438, nose: 0x2b1d18, tail: 'bushy', outfit: 'goggles', spd: 1.12, jmp: 1.2, clb: 1.25, abil: '滑翔', desc: '空中按住 Space', col: '#e8c9a8' },
  bear: { name: '老友', role: '水電師傅', k: 1.18, r: 1.6, h: 6.2, fur: 0x6f4b31, belly: 0xb79170, len: .21, den: 27, ear: 'small', paw: 0x3a2a20, nose: 0x1a1310, tail: 'stub', outfit: 'overalls', spd: .92, jmp: .92, clb: .85, abil: '大力', desc: '左鍵推一下 · 按住左鍵推着走', col: '#d9a675' },
  gecko: { name: '前拍檔', role: '牆內倖存者', k: 1, r: 1.2, h: 4.8, skin: true, paw: 0x7c9a50, nose: 0x3b4a24, tail: 'thick', outfit: 'scarf', spd: 1.05, jmp: 1.05, clb: 1.45, abil: '爬牆', desc: '爬牆不用體力', col: '#b7d38a' }
};
function ell(rx, ry, rz, ws = 40, hs = 28) { const g = new THREE.SphereGeometry(1, ws, hs); g.scale(rx, ry, rz); return g; }
function capG(r, l) { return new THREE.CapsuleGeometry(r, l, 8, 20); }
const chars = {}; const party = [];
function makeChar(id) {
  const S = SP[id], k = S.k;
  const C = { id, S, k, r: S.r, h: S.h, pos: V3(), vel: V3(), yaw: 0, grounded: true, stamina: 100, stamMax: 100, state: 'idle', phase: 0, squash: 0, t: R(0, 9), queue: [], gap: 0, blink: R(1, 4), lean: 0, roll: 0, climbN: V3(0, 0, 1), spin: 0, getup: 0, look: 0, moved: 0, glideK: 0, crouch: false };
  C.skinM = S.skin ? (S.cham ? MAT.gecko.clone() : MAT.gecko) : null; C.bellyM = S.skin ? (S.cham ? MAT.geckoBelly.clone() : MAT.geckoBelly) : null; if (S.cham) C.skinM.color.setHex(S.skinCol);
  const root = new THREE.Group(); scene.add(root); C.root = root;
  const body = new THREE.Group(); body.position.y = .92 * k; root.add(body); C.body = body;
  const fm = (bel, len = S.len, den = S.den, col = S.fur) => S.skin ? null : furMat({ color: col, belly: S.belly, bellyAmt: bel, len, den, rimK: .07 });
  const part = (g, mat, parent, x, y, z) => { const m = mat ? furMesh(g, mat) : new THREE.Mesh(g, C.skinM); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };
  const plain = (g, mat, parent, x, y, z) => { const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };
  const pawM = new THREE.MeshPhysicalMaterial({ color: S.paw, roughness: .55, sheen: .5, sheenColor: 0xffd0d0 });
  // torso
  C.torso = part(ell(1.02 * k, 1.08 * k, .95 * k), fm(1), body, 0, .72 * k, 0);
  if (S.skin) plain(ell(.72 * k, .86 * k, .5 * k), C.bellyM, body, 0, .6 * k, .52 * k);
  const neck = new THREE.Group(); neck.position.y = 1.62 * k; body.add(neck); C.neck = neck;
  const head = new THREE.Group(); head.position.y = 1.0 * k; neck.add(head); C.head = head;
  part(ell(1.3 * k, 1.17 * k, 1.2 * k, 48, 32), fm(.5), head, 0, 0, 0);
  part(ell(.6 * k, .46 * k, .52 * k), fm(1, S.len * .7), head, 0, -.3 * k, .96 * k);
  const nose = plain(new THREE.SphereGeometry(.16 * k, 20, 14), new THREE.MeshPhysicalMaterial({ color: S.nose, roughness: .25, clearcoat: 1 }), head, 0, -.12 * k, 1.45 * k); nose.scale.set(1.3, .9, 1);
  C.eyes = [];
  const eyeR = S.skin ? .3 : .25;
  for (const s of [-1, 1]) {
    const e = plain(new THREE.SphereGeometry(eyeR * k, 28, 20), MAT.eye, head, s * .5 * k, .16 * k, 1.0 * k); e.scale.set(1, 1.12, .7); e.castShadow = false;
    const hl = plain(new THREE.SphereGeometry(.05 * k, 10, 8), MAT.eyeHL, e, .075 * k, .1 * k, eyeR * k * .93); hl.scale.set(1, 1 / 1.12, 1 / .7); hl.castShadow = false; hl.receiveShadow = false;
    C.eyes.push(e);
  }
  // ears
  C.ears = [];
  for (const s of [-1, 1]) {
    const g = new THREE.Group(); head.add(g);
    if (S.ear === 'round') {
      g.position.set(s * .9 * k, .95 * k, -.12 * k); g.rotation.set(0, s * -.35, s * -.28);
      plain(ell(.74 * k, .74 * k, .15 * k, 32, 20), new THREE.MeshPhysicalMaterial({ color: S.fur, roughness: .7, sheen: 1, sheenColor: 0xffffff }), g, 0, 0, 0);
      plain(ell(.58 * k, .58 * k, .08 * k, 32, 16), new THREE.MeshPhysicalMaterial({ color: 0xf3a4ad, roughness: .5, emissive: 0xff6f84, emissiveIntensity: .22, sheen: .6, sheenColor: 0xffc0c8 }), g, 0, -.02 * k, .09 * k);
    } else if (S.ear === 'tuft') {
      g.position.set(s * .72 * k, 1.0 * k, -.05 * k); g.rotation.set(0, s * -.3, s * -.18);
      part(ell(.34 * k, .6 * k, .16 * k, 24, 16), fm(0), g, 0, .1 * k, 0);
      part(new THREE.ConeGeometry(.16 * k, .55 * k, 16), fm(0, S.len * 2.2, S.den * .7, 0x6a5444), g, 0, .78 * k, 0);
    } else if (S.ear === 'small') {
      g.position.set(s * 1.12 * k, .5 * k, -.05 * k); g.rotation.set(0, s * -.45, s * -.75);
      part(ell(.42 * k, .4 * k, .22 * k, 24, 16), fm(0), g, 0, 0, 0);
      plain(ell(.26 * k, .24 * k, .08 * k, 20, 12), new THREE.MeshStandardMaterial({ color: 0x3a2618, roughness: .8 }), g, 0, -.02 * k, .17 * k);
    }
    C.ears.push(g);
  }
  // arms
  C.arms = [];
  for (const s of [-1, 1]) {
    const g = new THREE.Group(); g.position.set(s * .96 * k, 1.12 * k, 0); body.add(g);
    part(capG(.27 * k, .5 * k), fm(0), g, 0, -.44 * k, 0);
    plain(new THREE.SphereGeometry(.26 * k, 18, 14), S.skin ? C.skinM : pawM, g, 0, -.92 * k, 0);
    g.userData.s = s; C.arms.push(g);
  }
  // legs
  C.legs = [];
  for (const s of [-1, 1]) {
    const g = new THREE.Group(); g.position.set(s * .48 * k, .05 * k, 0); body.add(g);
    part(capG(.31 * k, .3 * k), fm(0), g, 0, -.48 * k, 0);
    plain(ell(.31 * k, .17 * k, .47 * k, 18, 12), S.skin ? C.skinM : pawM, g, 0, -.86 * k, .16 * k);
    C.legs.push(g);
  }
  // tail
  C.tail = [];
  const tailRoot = new THREE.Group(); tailRoot.position.set(0, .18 * k, -.82 * k); body.add(tailRoot);
  if (S.tail === 'thin' || S.tail === 'thick') {
    let parent = tailRoot; const n = S.tail === 'thin' ? 9 : 6; const tm = S.tail === 'thin' ? new THREE.MeshPhysicalMaterial({ color: 0xeeb1b4, roughness: .5, sheen: .5, sheenColor: 0xffd6d6 }) : C.skinM;
    for (let i = 0; i < n; i++) {
      const g = new THREE.Group(); g.position.z = i ? -(S.tail === 'thin' ? .5 : .55) * k : 0; parent.add(g);
      const r0 = S.tail === 'thin' ? lerp(.13, .04, i / n) : lerp(.32, .07, i / n), r1 = S.tail === 'thin' ? lerp(.13, .04, (i + 1) / n) : lerp(.32, .07, (i + 1) / n), L = (S.tail === 'thin' ? .52 : .58) * k;
      const sg = new THREE.CylinderGeometry(r1 * k, r0 * k, L, 12); sg.rotateX(Math.PI / 2); sg.translate(0, 0, -L / 2);
      plain(sg, tm, g, 0, 0, 0); g.rotation.x = i === 0 ? .55 : -.08; C.tail.push(g); parent = g;
    }
  } else if (S.tail === 'curl') { chamTail(C, tailRoot, plain);
  } else if (S.tail === 'bushy') {
    let parent = tailRoot; const sz = [.5, .62, .66, .55];
    for (let i = 0; i < 4; i++) {
      const g = new THREE.Group(); g.position.set(0, i ? .62 * k : 0, i ? -.15 * k : 0); parent.add(g);
      part(ell(sz[i] * k, .55 * k, sz[i] * .85 * k), fm(0, .42, 15, i === 3 ? 0xa48b77 : S.fur), g, 0, .32 * k, 0);
      g.rotation.x = i === 0 ? -.9 : -.42; C.tail.push(g); parent = g;
    }
  } else {
    part(new THREE.SphereGeometry(.34 * k, 18, 14), fm(0, S.len * 1.3), tailRoot, 0, 0, 0);
  }
  // outfits
  if (S.outfit === 'coat') {
    const pts = [[1.14, -.36], [1.13, -.1], [1.1, .4], [1.06, .82], [.92, 1.18], [.62, 1.42]].map(p => new THREE.Vector2(p[0] * k, p[1] * k));
    const coat = plain(new THREE.LatheGeometry(pts, 48, .32, Math.PI * 2 - .64), MAT.cloth, body, 0, 0, 0); coat.scale.z = .96;
    const col = plain(new THREE.TorusGeometry(.7 * k, .12 * k, 10, 32, Math.PI * 1.5), MAT.cloth, body, 0, 1.4 * k, -.05 * k); col.rotation.set(Math.PI / 2, 0, Math.PI * .25 + Math.PI);
    plain(new THREE.BoxGeometry(.38 * k, .32 * k, .06 * k), MAT.cloth, body, -.52 * k, .82 * k, .98 * k).rotation.y = -.45;
    plain(new THREE.CylinderGeometry(.04 * k, .04 * k, .45 * k, 8), new THREE.MeshStandardMaterial({ color: 0x2a4fb0, roughness: .3 }), body, -.45 * k, 1.0 * k, .98 * k);
    for (const s of [-1, 1]) { const rim = plain(new THREE.TorusGeometry(.29 * k, .035 * k, 8, 28), MAT.brass, head, s * .5 * k, .14 * k, 1.27 * k); plain(new THREE.CircleGeometry(.28 * k, 24), MAT.glassesLens, head, s * .5 * k, .14 * k, 1.27 * k); }
    plain(new THREE.CylinderGeometry(.025 * k, .025 * k, .42 * k, 6), MAT.brass, head, 0, .18 * k, 1.36 * k).rotation.z = Math.PI / 2;
    // size gun on right wrist
    const gun = new THREE.Group(); gun.position.set(0, -.78 * k, .12 * k); C.arms[0].add(gun); C.gun = gun;
    plain(new THREE.TorusGeometry(.3 * k, .09 * k, 10, 24), MAT.copper, gun, 0, 0, 0).rotation.x = Math.PI / 2;
    const br = plain(new THREE.CylinderGeometry(.09 * k, .13 * k, .62 * k, 12), MAT.dsteel, gun, 0, -.05 * k, .3 * k); br.rotation.x = Math.PI / 2;
    C.gunTip = plain(new THREE.SphereGeometry(.1 * k, 12, 10), MAT.cyanGlow, gun, 0, -.05 * k, .64 * k);
  } else if (S.outfit === 'goggles') {
    const strap = plain(new THREE.TorusGeometry(1.0, .07, 8, 48), MAT.leather, head, 0, .52 * k, 0); strap.scale.set(1.3 * k, 1.21 * k, 1); strap.rotation.x = Math.PI / 2 - .25;
    for (const s of [-1, 1]) { const l = plain(new THREE.CylinderGeometry(.27 * k, .3 * k, .2 * k, 24), MAT.dsteel, head, s * .38 * k, .74 * k, .98 * k); l.rotation.x = Math.PI / 2 - .55; const ln = plain(new THREE.CircleGeometry(.23 * k, 24), MAT.lens, l, 0, .105 * k, 0); ln.rotation.x = -Math.PI / 2; }
    plain(new THREE.TorusGeometry(1.0 * k, .09 * k, 8, 40), MAT.leather, body, 0, .05 * k, 0).rotation.x = Math.PI / 2;
    for (const a of [.6, -.6, 2.2]) plain(new THREE.BoxGeometry(.32 * k, .36 * k, .2 * k), MAT.leather, body, Math.sin(a) * 1.0 * k, -.02 * k, Math.cos(a) * 1.0 * k).rotation.y = a;
    // patagium (glide membrane)
    C.wing = [];
    for (const s of [-1, 1]) {
      const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.quadraticCurveTo(1.2 * k, .1 * k, 1.9 * k, -.05 * k); sh.quadraticCurveTo(1.5 * k, -.7 * k, 1.1 * k, -1.25 * k); sh.quadraticCurveTo(.6 * k, -1.0 * k, .1 * k, -1.05 * k); sh.lineTo(0, 0);
      const wg = new THREE.ShapeGeometry(sh, 16); const w = new THREE.Mesh(wg, new THREE.MeshPhysicalMaterial({ color: 0x7d6656, roughness: .8, sheen: 1, sheenColor: 0xd6c0a8, side: THREE.DoubleSide }));
      w.position.set(s * .7 * k, 1.1 * k, -.1 * k); w.scale.set(s, 1, 1); w.castShadow = true; body.add(w); w.visible = false; C.wing.push(w);
    }
  } else if (S.outfit === 'overalls') {
    const pts = [[1.12, -.36], [1.12, -.1], [1.09, .35], [1.05, .72], [1.0, .9]].map(p => new THREE.Vector2(p[0] * k, p[1] * k));
    const ov = plain(new THREE.LatheGeometry(pts, 48), MAT.denim, body, 0, 0, 0); ov.scale.z = .95;
    plain(new THREE.BoxGeometry(1.0 * k, .7 * k, .12 * k), MAT.denim, body, 0, 1.12 * k, .9 * k).rotation.x = -.12;
    for (const s of [-1, 1]) { const st = plain(new THREE.BoxGeometry(.18 * k, 1.5 * k, .08 * k), MAT.denim, body, s * .42 * k, 1.35 * k, 0); st.rotation.set(0, 0, s * -.08); st.scale.z = 1; const st2 = plain(new THREE.TorusGeometry(.95 * k, .07 * k, 6, 20, Math.PI), MAT.denim, body, s * .42 * k, 1.05 * k, 0); st2.rotation.y = Math.PI / 2; st2.scale.set(1, 1, .9); plain(new THREE.CylinderGeometry(.08 * k, .08 * k, .05 * k, 12), MAT.brass, body, s * .42 * k, 1.42 * k, .97 * k).rotation.x = Math.PI / 2; }
    const hat = plain(new THREE.SphereGeometry(1.62 * k, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), MAT.hat, head, 0, .16 * k, -.02 * k); hat.scale.y = .9;
    const brim = plain(new THREE.CylinderGeometry(1.82 * k, 1.82 * k, .08 * k, 48), MAT.hat, head, 0, .18 * k, .1 * k); brim.scale.z = 1.08;
    plain(new THREE.BoxGeometry(.2 * k, .2 * k, 3.0 * k), MAT.hat, head, 0, 1.6 * k, -.02 * k).castShadow = false;
    const wr = plain(new THREE.BoxGeometry(.16 * k, 1.1 * k, .1 * k), MAT.steel, body, .7 * k, .7 * k, -.95 * k); wr.rotation.z = .5;
  } else if (S.outfit === 'lanyard') { chamExtras(C, head, body, plain);
  } else if (S.outfit === 'scarf') {
    plain(new THREE.TorusGeometry(.82 * k, .22 * k, 12, 32), MAT.scarf, body, 0, 1.56 * k, 0).rotation.x = Math.PI / 2;
    const tailS = plain(new THREE.BoxGeometry(.4 * k, 1.0 * k, .1 * k), MAT.scarf, body, .45 * k, 1.1 * k, .75 * k); tailS.rotation.set(.3, 0, .25);
    const cap = new THREE.Group(); cap.position.set(0, .95 * k, -1.02 * k); body.add(cap);
    const cp = plain(new THREE.CylinderGeometry(.82 * k, .82 * k, .4 * k, 21), MAT.capRed, cap, 0, 0, 0); cp.rotation.x = Math.PI / 2;
    plain(new THREE.CircleGeometry(.72 * k, 32), new THREE.MeshStandardMaterial({ color: 0xf1ede4, roughness: .4, metalness: .3 }), cap, 0, 0, -.205 * k).rotation.y = Math.PI;
    for (const s of [-1, 1]) plain(new THREE.TorusGeometry(.5 * k, .05 * k, 6, 16, Math.PI), MAT.leather, body, s * .55 * k, 1.1 * k, -.2 * k).rotation.y = Math.PI / 2;
  }
  return C;
}

// ---------- Mom (realistic giant, seen mostly as slippers and legs) ----------
const mom = { active: false, pos: V3(-252, 260, -244), yaw: 0, phase: 0, node: 0, wait: 0, mode: 'off', timer: 60, visits: 0, lightPos: V3(), lightDir: V3(0, -1, 0), aim: V3(), aimT: V3(), trackT: 0, said: {}, stepSide: 0, lastStep: 0 };
function buildMom() {
  const M = MAT; const g = new THREE.Group(); scene.add(g); mom.root = g; g.visible = false;
  const pelvis = new THREE.Group(); pelvis.position.y = 88; g.add(pelvis); mom.pelvis = pelvis;
  const mk = (geo, mat, parent, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };
  mk(ell(17, 12, 12, 32, 20), M.pants, pelvis, 0, 0, 0);
  mom.legs = [];
  const slipM = furMat({ color: 0xe6cbc4, len: .9, den: 3.4, droop: .2, clump: .5, rimK: .05, root: .6 });
  for (const s of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(s * 9, -2, 0); pelvis.add(hip);
    mk(capG(7.6, 30), M.pants, hip, 0, -22, 0);
    const knee = new THREE.Group(); knee.position.y = -43; hip.add(knee);
    mk(capG(5.6, 31), M.pants, knee, 0, -20, 0);
    mk(capG(3.6, 4), M.skin, knee, 0, -38, -.5);
    const ankle = new THREE.Group(); ankle.position.y = -38; knee.add(ankle);
    const sl = furMesh(ell(5.6, 3.8, 13, 32, 20), slipM); sl.position.set(0, -1.2, 4.5); ankle.add(sl);
    mk(ell(5.8, 1.2, 13.4, 24, 8), new THREE.MeshStandardMaterial({ color: 0x8a6e66, roughness: .9 }), ankle, 0, -3.8, 4.5);
    mom.legs.push({ hip, knee, ankle, s });
  }
  const chest = new THREE.Group(); chest.position.y = 4; pelvis.add(chest); mom.chest = chest;
  const tp = [[15, 0], [16.5, 8], [16.8, 22], [17.6, 38], [16, 48], [8, 54]].map(p => new THREE.Vector2(p[0], p[1]));
  const torso = mk(new THREE.LatheGeometry(tp, 40), M.knit, chest, 0, 0, 0); torso.scale.z = .66;
  mk(new THREE.CylinderGeometry(4.6, 5, 9, 20), M.skin, chest, 0, 57, 0);
  const headG = new THREE.Group(); headG.position.y = 68; chest.add(headG); mom.head = headG;
  mk(ell(8.6, 11.2, 10, 40, 28), M.skin, headG, 0, 0, 1);
  const hairM = furMat({ color: 0x2a1c16, len: 1.3, den: 1.6, droop: .9, clump: .55, rimK: .08, root: .5, rough: .6 });
  const hair = furMesh(ell(9.3, 11.4, 10.6, 40, 28), hairM); hair.position.set(0, 1.6, -1.2); headG.add(hair);
  const bun = furMesh(new THREE.SphereGeometry(5, 24, 16), hairM); bun.position.set(0, 9, -9); headG.add(bun);
  mom.arms = [];
  for (const s of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(s * 18.5, 45, 0); chest.add(sh);
    mk(capG(4.6, 20), M.knit, sh, 0, -13, 0);
    const el = new THREE.Group(); el.position.y = -27; sh.add(el);
    mk(capG(3.9, 18), M.knit, el, 0, -11, 0);
    const hand = mk(ell(3.2, 4.6, 2, 16, 12), M.skin, el, 0, -25, 0);
    mom.arms.push({ sh, el, hand, s });
  }
  const phone = mk(new THREE.BoxGeometry(7.2, .9, 15), M.phone, mom.arms[1].el, 0, -27, 5); mom.phone = phone;
  const lens = new THREE.Mesh(new THREE.SphereGeometry(.7, 12, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff2e0).multiplyScalar(14) })); lens.position.set(2, -.5, 6.5); phone.add(lens); mom.lens = lens;
}
