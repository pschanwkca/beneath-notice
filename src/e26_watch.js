// =====================================================================
//  WATCHING A TEAMMATE — online, while you're a toy
//  · stuck in the toy box (or still lying where you froze) you can look through a teammate's camera:
//    tap a portrait in the row at the top (Wild Rift style), or Tab / → next, ← back; the mouse still turns the view
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
  watchSet(L[(i + d + L.length) % L.length]);
}
// look through someone's camera (yourself: back to your soul)
function watchSet(C) {
  if (!NET.on || !leader || !leader.frozen || !C) return;
  if (C !== leader && (C.frozen || !party.includes(C))) return;
  WATCH.id = C === leader ? null : C.id;
  // jump straight there (no long swoop across the house) and let the lights / air of that room take over
  const p = C === leader && typeof GHOST !== 'undefined' && GHOST.on ? GHOST.p : C.pos;
  cam.tgt.set(p.x, p.y + C.h * .8, p.z); cam.curD = cam.dist; LP.snap = true; tone(620, 820, .06, .03, 'triangle');
}
// the row of portraits: you first (as a soul), then everyone else; the one you're looking through glows
const SW_WISP = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 1.2C3.6 1.2 2 3 2 5.2v4.9l1.3-.9 1.4 1 1.3-1 1.3 1 1.4-1 1.3.9V5.2C10 3 8.4 1.2 6 1.2zM4.5 5.6a.8.8 0 1 1 0-1.6.8.8 0 0 1 0 1.6zm3 0a.8.8 0 1 1 0-1.6.8.8 0 0 1 0 1.6z"/></svg>';
function watchTick() {
  const el = $('spec'); if (!el) return;
  const on = NET.on && STATE === 'play' && leader && leader.frozen && !PAUSED;
  if (!on) { WATCH.id = null; if (WATCH.shown) { el.hidden = true; WATCH.shown = false; } return; }
  const me = leader, mates = playerChars().filter(C => C !== me && party.includes(C)), cur = watchTarget();
  const sig = [me.id, cur ? cur.id : '', ...mates.map(C => C.id + (C.frozen ? '*' : ''))].join('|') + (TOUCH ? 't' : '');
  if (!WATCH.shown) { el.hidden = false; WATCH.shown = true; WATCH.sig = ''; }
  if (sig === WATCH.sig) return; WATCH.sig = sig;
  const btn = (C, self) => { const act = self ? !cur : cur === C, off = !self && C.frozen, nm = self ? '' : partyName(C.id);
    return `<button class="sw${act ? ' on' : ''}${off ? ' off' : ''}${self ? ' me' : ''}" data-id="${C.id}" style="--c:${C.S.col}" aria-label="${self ? TR('你的靈魂') : nm}" title="${self ? TR('你的靈魂') : nm}"${off ? ' disabled' : ''}><span class="sw-ph">${PORTRAITS[C.id] ? `<img alt="" src="${PORTRAITS[C.id]}">` : ''}</span>${self ? `<span class="sw-g">${SW_WISP}</span>` : `<em>${nm}</em>`}</button>`; };   // (your own soul needs no name)
  $('specRow').innerHTML = btn(me, true) + mates.map(C => btn(C, false)).join('') + (TOUCH || !mates.length ? '' : '<kbd class="sw-k">Tab</kbd>');
}
addEventListener('keydown', e => {
  if (!NET.on || !leader || !leader.frozen || STATE !== 'play' || PAUSED) return;
  if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
  if (e.code === 'Tab' || e.code === 'ArrowRight') { e.preventDefault(); watchCycle(1); }
  else if (e.code === 'ArrowLeft') { e.preventDefault(); watchCycle(-1); }
});
$('specRow').addEventListener('pointerdown', e => { const b = e.target.closest('.sw'); if (!b || b.disabled) return; e.preventDefault(); e.stopPropagation(); watchSet(chars[b.dataset.id]); });
