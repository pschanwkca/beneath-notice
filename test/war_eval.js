(() => {
  const B = window.__bn, out = {}; B.toyUnfreezeAll(); B.state = 'play'; window.__NODET = true; B.TEST.on = true; B.TEST.nodet = true;
  const HX = B.HX, HB = B.HB; let L = B.leader;
  // a few incidents → stage 2 → Mom goes to put glue down
  B.hxSet(HX.id.klight, false, 'dad'); B.step(2); B.hxSet(HX.id.tap, true, 'dad'); B.step(2); B.hxSet(HX.id.flush, true, 'dad'); B.step(2); B.hxSet(HX.id.tv, true, 'dad'); B.step(2);
  out.stage = HB.stage; out.sus = +HB.sus.toFixed(2);
  let t = 0; const g = () => Array.from({ length: 8 }, (_, i) => HX.id['glue' + i].on ? 1 : 0).join('');
  for (; t < 60 * 120 && !/1.*1/.test(g()); t++) B.step(1); out.glue = g(); out.glueSecs = +(t / 60).toFixed(1);
  // step onto a placed board
  const i = g().indexOf('1'); const G = HX.glue[i]; L.pos.set(G.x, 1, G.z); L.vel.set(0, 0, 0); B.step(10); out.glued = !!L.glued;
  for (let k = 0; k < 6 && L.glued; k++) { B.press('Space'); B.step(8); } out.freeAfterJumps = !L.glued;
  // a seal after a search
  B.HB.holeUse = { seal_lh: 3 }; B.HB.search = 0.05; let u = 0; for (; u < 60 * 90 && !HX.id.seal_lh.on; u++) B.step(1); out.sealed = HX.id.seal_lh.on; out.sealSecs = +(u / 60).toFixed(1);
  // the bear barges through it
  B.switchTo(B.chars.bear); L = B.leader; L.pos.set(335, 0.3, -252); L.vel.set(0, 0, 0); B.step(10); const n = B.hxNear(L); out.bearNear = n && n.id; if (n) B.hxSet(n, false, L.id); out.sealAfter = HX.id.seal_lh.on;
  return out;
})()
