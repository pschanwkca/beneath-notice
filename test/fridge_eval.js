(() => {
  const B = window.__bn, out = {}; B.toyUnfreezeAll(); B.state = 'play'; window.__NODET = true; B.TEST.on = true; B.TEST.nodet = true;
  const HX = B.HX, KS = B.KS;
  // the bear at the fridge door
  B.switchTo(B.chars.bear); let L = B.leader; out.leader = L.id;
  L.pos.set(150, 0.3, -138); L.vel.set(0, 0, 0); B.step(10); const n = B.hxNear(L); out.bearNear = n && n.id;
  if (n) B.hxSet(n, true, L.id); B.step(120); out.doorA = +KS.doorA.toFixed(2);
  // dad goes in and stays
  B.switchTo(B.chars.dad); L = B.leader; out.leader2 = L.id; out.dadNear = (B.hxNear(L) || {}).id || null;
  L.pos.set(190, 49, -180); L.vel.set(0, 0, 0); B.step(5); out.inFridgeY = +L.pos.y.toFixed(1);
  let t = 0; for (; t < 60 * 40 && !L.frozen; t++) B.step(1); out.frozeAfter = +(t / 60).toFixed(1); out.frozen = L.frozen; out.frostEl = document.getElementById('frost').style.opacity;
  // does Mom come and tidy it away?
  const toy = L; let u = 0; const modes = []; for (; u < 60 * 120 && toy.toyAt !== 'box'; u++) { B.step(1); if (u % 600 === 0) modes.push([toy.toyAt, +KS.doorA.toFixed(1), HX.id.fridge.on]); }
  out.tidied = { secs: +(u / 60).toFixed(1), toyAt: toy.toyAt, modes, fridgeOn: HX.id.fridge.on };
  return out;
})()
