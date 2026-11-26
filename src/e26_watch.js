// =====================================================================
//  WATCHING A TEAMMATE — online, while you're a toy
//  · stuck in the toy box (or still lying where you froze) you can look through a teammate's camera:
//    Tab / → next, ← back (touch: the ‹ › buttons); the mouse still turns the view
//  · it jumps back to you by itself the moment you're rescued
// =====================================================================
const WATCH = { id: null, shown: false, sig: '' };
function watchList() { const me = leader; return [me, ...playerChars().filter(C => C !== me && !C.frozen)]; }
function watchTarget() {
  if (!WATCH.id) return null; const C = chars[WATCH.id];
  if (!NET.on || !leader || !leader.frozen || !C || C.frozen || !party.includes(C)) { WATCH.id = null; return null; }
  return C;
}
function watchCycle(d) {
  if (!NET.on || !leader || !leader.frozen) return;
  const L = watchList(); if (L.length < 2) { toast('暫時沒有隊友可以看', 1.6); return; }
  const cur = watchTarget() || leader; let i = L.indexOf(cur); if (i < 0) i = 0;
  const C = L[(i + d + L.length) % L.length]; WATCH.id = C === leader ? null : C.id;
  // jump straight there (no long swoop across the house) and let the lights / air of that room take over
  cam.tgt.set(C.pos.x, C.pos.y + C.h * .8, C.pos.z); cam.curD = cam.dist; LP.snap = true; tone(620, 820, .06, .03, 'triangle');
}
function watchTick() {
  const el = $('spec'); if (!el) return;
  const on = NET.on && STATE === 'play' && leader && leader.frozen && !PAUSED;
  if (!on) { WATCH.id = null; if (WATCH.shown) { el.hidden = true; WATCH.shown = false; } return; }
  const T0 = watchTarget(), n = watchList().length - 1;
  const sig = (T0 ? T0.id : '') + '|' + n;
  if (!WATCH.shown) { el.hidden = false; WATCH.shown = true; WATCH.sig = ''; }
  if (sig === WATCH.sig) return; WATCH.sig = sig;
  const key = TOUCH ? '' : '<kbd>Tab</kbd> ';
  $('specT').innerHTML = T0 ? `<small>正在看</small><b>${T0.S.name}</b><i>${playerLabel(T0.id)}</i>`
    : TOUCH ? `<small>靈魂出竅</small><b>「我喺度」叫隊友${n ? ' · ‹ › 看隊友' : ''}</b>`
    : `<small>靈魂出竅 · 等隊友搖醒你</small><b><kbd>WASD</kbd> 飄 · <kbd>F</kbd> 叫隊友${n ? ` · ${key}看隊友` : ''}</b>`;
  $('specL').hidden = $('specR').hidden = !n;
}
addEventListener('keydown', e => {
  if (!NET.on || !leader || !leader.frozen || STATE !== 'play' || PAUSED) return;
  if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
  if (e.code === 'Tab' || e.code === 'ArrowRight') { e.preventDefault(); watchCycle(1); }
  else if (e.code === 'ArrowLeft') { e.preventDefault(); watchCycle(-1); }
});
$('specL').addEventListener('click', e => { e.stopPropagation(); watchCycle(-1); });
$('specR').addEventListener('click', e => { e.stopPropagation(); watchCycle(1); });
