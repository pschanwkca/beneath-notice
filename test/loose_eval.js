(() => {
  const B = window.__bn, out = {}; B.toyUnfreezeAll(); B.state = 'play'; window.__NODET = true; let L = B.leader;
  L.pos.set(172, .3, -126); L.vel.set(0, 0, 0); B.step(10); B.press('KeyE'); B.step(2); out.held = B.looseHeld(L) && B.looseHeld(L).type;
  const o = B.looseHeld(L); const sus0 = +B.HB.sus.toFixed(2);
  B.cam.yaw = Math.atan2(1, 0); B.cam.pitch = .05; L.yaw = Math.atan2(-1, 0); B.step(2);
  B.primaryDown(0); out.st1 = o.st; for (let i = 0; i < 240; i++) B.step(1);
  out.landed = { st: o.st, p: o.p.toArray().map(v => +v.toFixed(1)) }; out.sus = [sus0, +B.HB.sus.toFixed(2)];
  // the kangaroo: pick up the sugar on the counter → into the pouch; take it out → in paws; eat it
  B.testAll(); B.step(5); B.switchTo(B.chars.rab); L = B.leader; out.roo = L.id;
  if (L.id === 'rab') { L.pos.set(112, 90.5, -172); L.vel.set(0, 0, 0); B.step(10); B.press('KeyE'); B.step(2); out.store = B.POUCH.store.length;
    B.pouchTakeOut('sugar'); B.step(2); out.paws = B.looseHeld(L) && B.looseHeld(L).type; L.stamina = 20; B.primaryDown(0); B.step(2); out.ate = { st: B.LOOSE.find(q => q.type === 'sugar' && q.st === 'gone') ? 'gone' : 'no', stamina: +L.stamina.toFixed(0) }; }
  return out;
})()
