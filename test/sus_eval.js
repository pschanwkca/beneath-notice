(() => {
  const B = window.__bn, L = B.leader, out = {}; B.toyUnfreezeAll(); B.state = 'play';
  const row = () => { const r = document.getElementById('susRow'); return { hidden: r.hidden, cls: r.className, lbl: document.getElementById('susLbl').textContent, w: [...r.querySelectorAll('b')].map(b => b.style.width) }; };
  B.step(5); out.r0 = row();
  B.hxSet(B.HX.id.klight, false, 'dad'); B.step(3); out.r1 = row(); out.sus1 = +B.HB.sus.toFixed(2);
  B.hxSet(B.HX.id.tap, true, 'dad'); B.step(3); B.hxSet(B.HX.id.flush, true, 'dad'); B.step(3); out.r2 = row(); out.sus2 = +B.HB.sus.toFixed(2);
  B.step(200); out.r3 = row();
  return out;
})()
