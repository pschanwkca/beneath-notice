(() => {
  const b = window.__bn;
  window.__S = {
    hud(on) { for (const e of document.body.querySelectorAll('body > *')) if (e.tagName !== 'CANVAS' && e.tagName !== 'SCRIPT') e.style.visibility = on ? '' : 'hidden'; document.querySelectorAll('canvas').forEach(c => { c.style.visibility = 'visible'; let p = c.parentElement; while (p && p !== document.body) { p.style.visibility = 'visible'; p = p.parentElement; } }); },
    warp(name, n = 90) { delete window.__CAMO; const w = b.WARPS.find(w => w[1] === name); if (!w) return 'no warp ' + name; b.testWarp(w); b.step(n); const p = b.leader.pos; return [name, Math.round(p.x), Math.round(p.y), Math.round(p.z)]; },
    rel(dx, dy, dz, tx, ty, tz) { const p = b.leader.pos; window.__CAMO = { p: [p.x + dx, p.y + dy, p.z + dz], t: [p.x + tx, p.y + ty, p.z + tz] }; return window.__CAMO; },
    abs(p, t) { window.__CAMO = { p, t }; return 1; },
    game() { delete window.__CAMO; return 1; }
  };
  window.__NODET = true;
  return 'ok';
})()
